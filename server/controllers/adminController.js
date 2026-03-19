import mongoose from "mongoose";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import { processRefund } from "../services/refundService.js";

export const resetSystemData = asyncHandler(async (req, res) => {
  const { clearUsers = false, secretKey } = req.body;

  if (secretKey !== process.env.ADMIN_RESET_KEY) {
    return res.status(403).json({ success: false, message: "Unauthorized reset attempt." });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Order.deleteMany({}).session(session);
      await Transaction.deleteMany({}).session(session);
      await Notification.deleteMany({}).session(session);
      await Product.updateMany({}, { $set: { "items.returnStatus": "NONE" } }).session(session);

      if (clearUsers) {
        await User.deleteMany({ email: { $ne: process.env.SELLER_EMAIL } }).session(session);
      }
    });
    return res.status(200).json({ success: true, message: "System environment reset." });
  } finally {
    await session.endSession();
  }
});

// Safe targeted cleanup: only orders/transactions/notifications
export const clearOrdersAndNotificationsSafe = asyncHandler(async (req, res) => {
  const { secretKey, dryRun = true } = req.body || {};

  if (secretKey !== process.env.ADMIN_RESET_KEY) {
    return res.status(403).json({ success: false, message: "Unauthorized clear attempt." });
  }

  const [ordersCount, transactionsCount, notificationsCount] = await Promise.all([
    Order.countDocuments({}),
    Transaction.countDocuments({}),
    Notification.countDocuments({}),
  ]);

  if (dryRun) {
    return res.status(200).json({
      success: true,
      dryRun: true,
      message: "Dry run completed. Pass dryRun=false to execute deletion.",
      summary: {
        orders: ordersCount,
        transactions: transactionsCount,
        notifications: notificationsCount,
      },
    });
  }

  const session = await mongoose.startSession();
  try {
    let deleted = {
      orders: 0,
      transactions: 0,
      notifications: 0,
    };

    await session.withTransaction(async () => {
      const [ordersResult, transactionsResult, notificationsResult] = await Promise.all([
        Order.deleteMany({}).session(session),
        Transaction.deleteMany({}).session(session),
        Notification.deleteMany({}).session(session),
      ]);

      deleted = {
        orders: ordersResult.deletedCount || 0,
        transactions: transactionsResult.deletedCount || 0,
        notifications: notificationsResult.deletedCount || 0,
      };
    });

    return res.status(200).json({
      success: true,
      dryRun: false,
      message: "Orders, transactions, and notifications cleared safely.",
      deleted,
    });
  } finally {
    await session.endSession();
  }
});

export const updatePaymentStatusManual = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isPaid, reason } = req.body;
  const sellerEmail = req.seller?.email || "Seller/Admin";

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const targetIsPaid = Boolean(isPaid);
  const oldStatus = order.paymentStatus;
  if (!Array.isArray(order.adminActions)) order.adminActions = [];
  if (!Array.isArray(order.paymentAuditLog)) order.paymentAuditLog = [];
  if (!Array.isArray(order.transactions)) order.transactions = [];

  order.adminActions.push({
    action: `MANUAL_OVERRIDE: isPaid ${order.isPaid} -> ${targetIsPaid}`,
    adminEmail: sellerEmail,
    reason,
    timestamp: new Date(),
  });
  order.paymentAuditLog.push({
    action: targetIsPaid ? "manual_mark_paid" : "manual_mark_unpaid",
    actor: sellerEmail,
    reason: reason || "Manual override",
    meta: { from: oldStatus, to: targetIsPaid ? "paid" : "unpaid" },
  });

  const transaction = await Transaction.create({
    orderId: order._id,
    transactionType: targetIsPaid ? "PAYMENT" : "REVERSAL",
    amount: Number(order.totalAmount || 0),
    status: "COMPLETED",
    method: "manual",
    reason: `Seller Override: ${reason || "No reason provided"}`,
  });

  order.paymentStatus = targetIsPaid ? "paid" : "unpaid";
  order.isPaid = targetIsPaid;
  if (targetIsPaid) {
    order.paidAt = order.paidAt || new Date();
    if (order.orderStatus === "pending") {
      order.orderStatus = "processing";
    }
  }
  order.transactions.push(transaction._id);

  await order.save();

  await createUserNotification({
    userId: order.userId,
    type: "PAYMENT_UPDATE",
    title: "Payment Status Updated",
    message: `Your order #${String(order._id).slice(-6).toUpperCase()} payment is now ${targetIsPaid ? "PAID" : "UNPAID"}.`,
    meta: { orderId: order._id, paymentStatus: order.paymentStatus },
  });

  return res.status(200).json({ success: true, order });
});

export const initiateManualRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const sellerEmail = req.seller?.email || "Seller/Admin";

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus !== "paid") {
    return res.status(400).json({ success: false, message: "Refunds can only be initiated for paid orders." });
  }

  const refundAmount = Number(amount || order.totalAmount - (order.refundedAmount || 0));
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return res.status(400).json({ success: false, message: "Insufficient balance for refund." });
  }

  const trans = await Transaction.create({
    orderId: order._id,
    transactionType: "REFUND",
    amount: refundAmount,
    status: "PENDING",
    method: order.paymentMethod,
    reason: `Seller Initiated: ${reason || "No reason provided"}`,
  });

  order.adminActions.push({
    action: "REFUND_INITIATED",
    adminEmail: sellerEmail,
    reason,
  });
  order.paymentAuditLog.push({
    action: "refund_initiated",
    actor: sellerEmail,
    reason: reason || "Manual refund initiated",
    meta: { amount: refundAmount, transactionId: trans._id },
  });
  order.transactions.push(trans._id);
  await order.save();

  const refundResult = await processRefund(trans._id);
  if (refundResult.success) {
    return res.status(200).json({ success: true, message: "Refund processed successfully." });
  }

  return res.status(500).json({
    success: false,
    message: "Refund record created but gateway call failed.",
    error: refundResult.error,
  });
});
