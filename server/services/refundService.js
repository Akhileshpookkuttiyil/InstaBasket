import Stripe from "stripe";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
const isStripePaymentMethod = (method) => {
  const normalized = String(method || "").toLowerCase();
  return normalized === "stripe" || normalized === "online";
};

const getStripePaymentReference = async (order) => {
  if (order?.stripePaymentIntentId) return order.stripePaymentIntentId;
  if (order?.paymentId) return order.paymentId;

  const paymentTransaction = await Transaction.findOne({
    orderId: order._id,
    transactionType: "PAYMENT",
    status: "COMPLETED",
    paymentId: { $exists: true, $ne: null },
  }).sort({ createdAt: -1 });

  return paymentTransaction?.paymentId || null;
};

export const processRefund = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.transactionType !== "REFUND") {
    return { success: false, message: "Invalid transaction" };
  }
  if (transaction.status === "COMPLETED") {
    return { success: true, message: "Refund already completed" };
  }

  const order = await Order.findById(transaction.orderId);
  if (!order) return { success: false, message: "Order not found" };

  try {
    transaction.status = "PENDING";
    await transaction.save();

    let gatewayRefundId = null;

    if (isStripePaymentMethod(order.paymentMethod)) {
      const paymentIntentId = await getStripePaymentReference(order);
      if (!paymentIntentId) {
        throw new Error("No Stripe payment reference available for refund.");
      }

      const stripeRefund = await stripeInstance.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(Number(transaction.amount || 0) * 100),
      });
      gatewayRefundId = stripeRefund.id;
    } else {
      gatewayRefundId = `MANUAL-COD-${Date.now()}`;
    }

    transaction.status = "COMPLETED";
    transaction.refundId = gatewayRefundId;
    await transaction.save();

    order.refundedAmount = Number(order.refundedAmount || 0) + Number(transaction.amount || 0);
    if (order.refundedAmount >= Number(order.totalAmount || 0)) {
      order.paymentStatus = "refunded";
    }
    if (!Array.isArray(order.paymentAuditLog)) order.paymentAuditLog = [];
    order.paymentAuditLog.push({
      action: "refund_completed",
      actor: "system",
      reason: "Refund processed successfully",
      meta: { refundId: gatewayRefundId, transactionId: transaction._id, amount: transaction.amount },
    });
    await order.save();

    return { success: true, refundId: gatewayRefundId };
  } catch (error) {
    transaction.status = "FAILED";
    transaction.reason = error.message;
    await transaction.save();

    if (!Array.isArray(order.paymentAuditLog)) order.paymentAuditLog = [];
    order.paymentAuditLog.push({
      action: "refund_failed",
      actor: "system",
      reason: error.message,
      meta: { transactionId: transaction._id },
    });
    await order.save();

    return { success: false, error: error.message };
  }
};

export const retryFailedRefunds = async () => {
  const failedTransactions = await Transaction.find({
    transactionType: "REFUND",
    status: "FAILED",
  });

  for (const tx of failedTransactions) {
    await processRefund(tx._id);
  }
};
