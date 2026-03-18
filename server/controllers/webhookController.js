import mongoose from "mongoose";
import stripe from "stripe";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import {
  decreaseStockForItems,
  normalizeLineItems,
} from "../utils/inventory.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;

  switch (type) {
    case "checkout.session.completed": {
      const checkoutSession = data.object;
      const { orderId, userId } = checkoutSession.metadata || {};
      if (!orderId) break;

      const dbSession = await mongoose.startSession();
      try {
        await dbSession.withTransaction(async () => {
          const order = await Order.findById(orderId).session(dbSession);
          if (!order) return;

          // Idempotency check
          if (order.paymentStatus === "PAID") return;

          const lineItems = normalizeLineItems(
            (order.items || []).map((item) => ({
              productId: item.product,
              quantity: item.quantity,
            }))
          );

          // Handle Stock Availability after payment
          const stockUpdateResult = await decreaseStockForItems(
            lineItems.items,
            dbSession
          );

          if (!stockUpdateResult.success) {
            // CRITICAL: Payment received but stock unavailable
            // Move to REFUND_PENDING and CANCELLED
            order.paymentStatus = "REFUND_PENDING";
            order.orderStatus = "CANCELLED";
            
            const refundTransaction = await Transaction.create([{
              orderId: order._id,
              transactionType: "REFUND",
              amount: order.totalAmount,
              status: "PENDING",
              method: "Online",
              reason: "Auto-refund: Item out of stock after payment"
            }], { session: dbSession });

            order.transactions.push(refundTransaction[0]._id);
            await order.save({ session: dbSession });

            await createUserNotification({
              userId: order.userId,
              title: "Payment received, but items unavailable",
              message: "Unfortunately, an item sold out. A full refund has been initiated automatically.",
              type: "order",
              meta: { orderId: order._id, status: "CANCELLED" },
            });
            return;
          }

          // Normal Success Flow
          order.paymentStatus = "PAID";
          order.orderStatus = "CONFIRMED";
          order.inventoryApplied = true;

          const paymentTransaction = await Transaction.create([{
            orderId: order._id,
            transactionType: "PAYMENT",
            paymentId: checkoutSession.payment_intent,
            amount: order.totalAmount,
            status: "COMPLETED",
            method: "Online",
          }], { session: dbSession });

          order.transactions.push(paymentTransaction[0]._id);
          await order.save({ session: dbSession });

          await User.findByIdAndUpdate(
            order.userId,
            { $set: { cartItems: {} } },
            { session: dbSession }
          );

          await createUserNotification({
            userId: order.userId,
            title: "Order confirmed",
            message: `Your payment was successful and order #${String(order._id).slice(-6).toUpperCase()} is confirmed.`,
            type: "order",
            meta: { orderId: order._id, status: "CONFIRMED" },
          });
        });
      } catch (error) {
        console.error("Webhook processing error:", error);
        throw error;
      } finally {
        await dbSession.endSession();
      }
      break;
    }

    case "checkout.session.expired": {
      const checkoutSession = data.object;
      const orderId = checkoutSession?.metadata?.orderId;
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          orderStatus: "CANCELLED",
          paymentStatus: "PENDING"
        });
      }
      break;
    }

    // Add other cases like refund succeeded/failed if syncing from gateway
  }

  res.json({ received: true });
});
