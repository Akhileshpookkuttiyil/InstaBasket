import stripe from "stripe";
import Transaction from "../models/Transaction.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Centralized Refund Processing Service
 * Handles: API calls to gateway, Transaction updates, Order status updates
 */
export const processRefund = async (transactionId) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction || transaction.transactionType !== "REFUND" || transaction.status === "COMPLETED") {
    return { success: false, message: "Invalid or already completed transaction" };
  }

  const order = await Order.findById(transaction.orderId);
  if (!order) return { success: false, message: "Order not found" };

  try {
    // 1. Initial status change
    transaction.status = "PENDING";
    await transaction.save();

    let gatewayRefundId = null;

    if (order.paymentMethod === "Online") {
      // Find the original payment payment_intent or charge_id
      const paymentTransaction = await Transaction.findOne({
        orderId: order._id,
        transactionType: "PAYMENT",
        status: "COMPLETED"
      });

      if (paymentTransaction?.paymentId) {
        const stripeRefund = await stripeInstance.refunds.create({
          payment_intent: paymentTransaction.paymentId,
          amount: Math.round(transaction.amount * 100), // Stripe uses cents
        });
        gatewayRefundId = stripeRefund.id;
      }
    } else {
      // COD Refund - Manual process, mark as completed
      gatewayRefundId = "MANUAL-COD-" + Date.now();
    }

    // 2. Finalize Status
    transaction.status = "COMPLETED";
    transaction.refundId = gatewayRefundId;
    await transaction.save();

    // Check if total amount refunded matches total order or if still moving
    const allRefunded = order.totalAmount <= order.refundedAmount;
    if (allRefunded) {
      order.paymentStatus = "REFUNDED";
    }

    await order.save();
    return { success: true };
  } catch (error) {
    console.error("Refund processing failed:", error);
    transaction.status = "FAILED";
    transaction.reason = error.message;
    await transaction.save();

    order.paymentStatus = "REFUND_FAILED";
    await order.save();

    return { success: false, error: error.message };
  }
};

/**
 * Background Retry Task (Mock for Chron)
 */
export const retryFailedRefunds = async () => {
  const failedTransactions = await Transaction.find({
    transactionType: "REFUND",
    status: "FAILED"
  });

  for (const tx of failedTransactions) {
    console.log(`Retrying refund for order: ${tx.orderId}`);
    await processRefund(tx._id);
  }
};
