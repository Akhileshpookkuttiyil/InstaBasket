import mongoose from "mongoose";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";

/**
 * 1. SAFE SYSTEM RESET (Admin Only)
 * Allows clearing testing data without breaking production users unless requested.
 */
export const resetSystemData = asyncHandler(async (req, res) => {
  const { clearUsers = false, secretKey } = req.body;

  // Additional safety layer
  if (secretKey !== process.env.ADMIN_RESET_KEY) {
    return res.status(403).json({ success: false, message: "Invalid reset key" });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // 1. Clear Orders & Transactions
      await Order.deleteMany({}).session(session);
      await Transaction.deleteMany({}).session(session);
      await Notification.deleteMany({}).session(session);

      // 2. Reset Inventory Status (Optional based on business rule)
      // For a full reset, we might want to restock everything
      await Product.updateMany({}, { $set: { "items.returnStatus": "NONE" } }).session(session);

      // 3. Clear Users if toggled
      if (clearUsers) {
        // KEEP the admin user
        await User.deleteMany({ email: { $ne: process.env.SELLER_EMAIL } }).session(session);
      }
    });

    res.status(200).json({ success: true, message: "System data reset successfully" });
  } finally {
    await session.endSession();
  }
});

/**
 * 2. MANUAL PAYMENT OVERRIDE
 * Mark as PAID, UNPAID, or REFUNDED manually.
 */
export const updatePaymentStatusManual = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  const adminEmail = req.seller?.email || "Admin"; // From authSeller middleware

  if (!["PAID", "UNPAID", "REFUNDED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid payment status" });
  }

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  // Safety: Prevent marking as PAID if delivered previously (logic check)
  // Actually, usually it's the other way around. 
  
  const oldStatus = order.paymentStatus;
  
  // 1. Record Audit Log
  order.adminActions.push({
    action: `MANUAL_PAYMENT_UPDATE: ${oldStatus} -> ${status}`,
    adminEmail,
    reason,
    timestamp: new Date()
  });

  // 2. Create Audit Transaction
  const transaction = await Transaction.create({
    orderId: order._id,
    transactionType: status === "REFUNDED" ? "REFUND" : "PAYMENT",
    amount: status === "REFUNDED" ? order.totalAmount : 0, // Manual override usually implies 0 physical cash at checkout time
    status: "COMPLETED",
    method: "Manual Override",
    reason: `Admin Override: ${reason}`
  });

  order.paymentStatus = status;
  order.transactions.push(transaction._id);
  
  await order.save();

  // 3. Notify User
  await createUserNotification({
    userId: order.userId,
    type: "PAYMENT_UPDATE",
    title: "Payment Status Updated",
    message: `The payment status for your order #${String(order._id).slice(-6).toUpperCase()} has been manually updated to ${status}.`,
    meta: { orderId: order._id, status }
  });

  res.status(200).json({ success: true, order });
});

/**
 * 3. TRIGGER REFUND (Admin Manual)
 */
export const initiateManualRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (order.paymentStatus !== "PAID") {
    return res.status(400).json({ success: false, message: "Only paid orders can be refunded" });
  }

  const refundAmount = amount || (order.totalAmount - order.refundedAmount);
  
  if (refundAmount <= 0) {
    return res.status(400).json({ success: false, message: "Invalid refund amount" });
  }

  order.paymentStatus = "REFUND_PENDING";
  order.adminActions.push({
    action: "REFUND_INITIATED",
    adminEmail: req.seller?.email || "Admin",
    reason
  });

  await order.save();

  // Create Transaction for pending refund
  const trans = await Transaction.create({
    orderId: order._id,
    transactionType: "REFUND",
    amount: refundAmount,
    status: "PENDING",
    method: order.paymentMethod,
    reason: `Manual Refund: ${reason}`
  });

  // NOTE: Actual gateway call would happen here or via a dedicated service

  res.status(200).json({ success: true, message: "Refund initiated", transactionId: trans._id });
});
