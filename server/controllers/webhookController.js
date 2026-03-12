import mongoose from "mongoose";
import stripe from "stripe";
import Order from "../models/Order.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import { decreaseStockForItems, normalizeLineItems } from "../utils/inventory.js";

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
      if (!orderId) {
        break;
      }

      const dbSession = await mongoose.startSession();
      let webhookState = {
        orderPlaced: false,
        wasAlreadyPlaced: false,
        stockIssue: false,
        userId: userId || null,
        orderId,
      };

      try {
        await dbSession.withTransaction(async () => {
          const order = await Order.findById(orderId).session(dbSession);
          if (!order) {
            return;
          }

          webhookState.userId = String(order.userId);
          webhookState.orderId = String(order._id);

          if (order.isPaid && order.inventoryApplied) {
            webhookState.orderPlaced = true;
            webhookState.wasAlreadyPlaced = true;
            return;
          }

          if (["cancelled", "returned"].includes(order.orderStatus)) {
            order.isPaid = true;
            await order.save({ session: dbSession });
            webhookState.stockIssue = true;
            return;
          }

          const lineItems = normalizeLineItems(
            (order.items || []).map((item) => ({
              productId: item.product,
              quantity: item.quantity,
            }))
          );

          if (!lineItems.valid || lineItems.items.length === 0) {
            order.isPaid = true;
            order.orderStatus = "cancelled";
            order.inventoryApplied = false;
            await order.save({ session: dbSession });
            webhookState.stockIssue = true;
            return;
          }

          const stockUpdateResult = await decreaseStockForItems(
            lineItems.items,
            dbSession
          );

          if (!stockUpdateResult.success) {
            order.isPaid = true;
            order.orderStatus = "cancelled";
            order.inventoryApplied = false;
            await order.save({ session: dbSession });
            webhookState.stockIssue = true;
            return;
          }

          order.isPaid = true;
          order.orderStatus = "order placed";
          order.inventoryApplied = true;
          order.inventoryRestored = false;
          await order.save({ session: dbSession });

          await User.findByIdAndUpdate(
            order.userId,
            { $set: { cartItems: {} } },
            { session: dbSession }
          );

          webhookState.orderPlaced = true;
        });
      } finally {
        await dbSession.endSession();
      }

      if (
        webhookState.orderPlaced &&
        !webhookState.wasAlreadyPlaced &&
        webhookState.userId
      ) {
        await createUserNotification({
          userId: webhookState.userId,
          title: "Order placed successfully",
          message: `Your order #${webhookState.orderId
            .slice(-6)
            .toUpperCase()} has been confirmed.`,
          type: "order",
          meta: {
            orderId: webhookState.orderId,
            status: "order placed",
          },
        });
      }

      if (webhookState.stockIssue && webhookState.userId) {
        await createUserNotification({
          userId: webhookState.userId,
          title: "Payment received, order unavailable",
          message:
            "One or more items sold out before confirmation. Please contact support for a refund.",
          type: "order",
          meta: {
            orderId: webhookState.orderId,
            status: "cancelled",
          },
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = data.object;
      const sessionList = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      const checkoutSession = sessionList.data[0];
      const orderId = checkoutSession?.metadata?.orderId;
      if (orderId) {
        await Order.findOneAndDelete({
          _id: orderId,
          isPaid: false,
          inventoryApplied: false,
        });
      }
      break;
    }

    case "checkout.session.expired": {
      const checkoutSession = data.object;
      const orderId = checkoutSession?.metadata?.orderId;
      if (orderId) {
        const order = await Order.findOneAndUpdate(
          {
            _id: orderId,
            isPaid: false,
            orderStatus: "order initiated",
          },
          {
            orderStatus: "cancelled",
          },
          { new: true }
        );

        if (order) {
          await createUserNotification({
            userId: order.userId,
            title: "Payment session expired",
            message: `Order #${String(order._id)
              .slice(-6)
              .toUpperCase()} was cancelled because payment was not completed.`,
            type: "order",
            meta: {
              orderId: order._id,
              status: "cancelled",
            },
          });
        }
      }
      break;
    }

    default:
      console.warn(`Unhandled Stripe event: ${type}`);
  }

  res.json({ received: true });
});
