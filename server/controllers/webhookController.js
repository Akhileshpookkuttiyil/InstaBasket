import mongoose from "mongoose";
import Stripe from "stripe";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Notification from "../models/Notification.js";
import { createUserNotification } from "../utils/notification.js";
import logger from "../utils/logger.js";
import {
  decreaseStockForItems,
  increaseStockForItems,
  normalizeLineItems,
} from "../utils/inventory.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

const toNormalizedOrderItems = (order) =>
  normalizeLineItems(
    (order.items || []).map((item) => ({
      productId: item.product,
      quantity: item.quantity,
    }))
  );

const addProcessedEventId = (order, eventId) => {
  if (!eventId) return;
  if (!Array.isArray(order.processedWebhookEvents)) {
    order.processedWebhookEvents = [];
  }
  if (!order.processedWebhookEvents.includes(eventId)) {
    order.processedWebhookEvents.push(eventId);
  }
};

const hasProcessedEvent = (order, eventId) =>
  Boolean(eventId && Array.isArray(order?.processedWebhookEvents) && order.processedWebhookEvents.includes(eventId));

const clearPendingPaymentNotification = async ({ userId, orderId, session }) => {
  const query = Notification.deleteMany({
    userId,
    type: "ORDER_UPDATE",
    title: "Payment Pending",
    "meta.orderId": orderId,
  });

  if (session) query.session(session);
  await query;
};

const ensurePaymentTransaction = async ({ order, paymentId, session, reason }) => {
  const existingQuery = Transaction.findOne({
    orderId: order._id,
    transactionType: "PAYMENT",
    paymentId,
    status: "COMPLETED",
  });
  if (session) existingQuery.session(session);
  const existing = await existingQuery;

  if (existing) return existing;

  return Transaction.create(
    [
      {
        orderId: order._id,
        transactionType: "PAYMENT",
        paymentId,
        amount: Number(order.totalAmount || 0),
        status: "COMPLETED",
        method: "stripe",
        reason,
      },
    ],
    session ? { session } : undefined
  ).then((docs) => docs[0]);
};

const applyPaymentUpdate = async ({ checkoutSession, eventId, source, session }) => {
  const orderId = checkoutSession?.metadata?.orderId || checkoutSession?.client_reference_id;
  if (!orderId) {
    return { success: false, ignored: true, message: "Missing orderId in Stripe payload." };
  }

  const orderQuery = Order.findById(orderId);
  if (session) orderQuery.session(session);
  const order = await orderQuery;
  if (!order) {
    return { success: false, ignored: true, message: "Order not found." };
  }

  if (hasProcessedEvent(order, eventId)) {
    return { success: true, idempotent: true, order };
  }

  if ((order.paymentStatus === "paid" || order.isPaid) && order.inventoryApplied) {
    await clearPendingPaymentNotification({ userId: order.userId, orderId: order._id, session });
    addProcessedEventId(order, eventId);
    if (checkoutSession.id && !order.stripeSessionId) {
      order.stripeSessionId = checkoutSession.id;
    }
    if (checkoutSession.payment_intent && !order.stripePaymentIntentId) {
      order.stripePaymentIntentId = String(checkoutSession.payment_intent);
      order.paymentId = String(checkoutSession.payment_intent);
    }
    await order.save(session ? { session } : undefined);
    return { success: true, idempotent: true, order };
  }

  const normalized = toNormalizedOrderItems(order);
  if (!normalized.valid || normalized.items.length === 0) {
    order.paymentStatus = "paid";
    order.isPaid = true;
    order.orderStatus = "cancelled";
    order.inventoryApplied = false;
    order.paymentFailureReason = "No valid line items found at payment confirmation.";
    order.stripeSessionId = checkoutSession.id || order.stripeSessionId;
    order.stripePaymentIntentId = checkoutSession.payment_intent
      ? String(checkoutSession.payment_intent)
      : order.stripePaymentIntentId;
    order.paymentId = order.stripePaymentIntentId || order.paymentId || checkoutSession.id;
    addProcessedEventId(order, eventId);
    await order.save(session ? { session } : undefined);
    await ensurePaymentTransaction({
      order,
      paymentId: order.paymentId,
      session,
      reason: `Stripe ${source}: line items invalid`,
    });
    await clearPendingPaymentNotification({ userId: order.userId, orderId: order._id, session });
    return { success: true, cancelled: true, order };
  }

  const stockResult = await decreaseStockForItems(normalized.items, session);
  if (!stockResult.success) {
    if (!session && stockResult.updatedLineItems?.length) {
      await increaseStockForItems(stockResult.updatedLineItems);
    }

    order.paymentStatus = "paid";
    order.isPaid = true;
    order.orderStatus = "cancelled";
    order.inventoryApplied = false;
    order.paymentFailureReason = "Paid successfully but inventory became unavailable.";
    order.stripeSessionId = checkoutSession.id || order.stripeSessionId;
    order.stripePaymentIntentId = checkoutSession.payment_intent
      ? String(checkoutSession.payment_intent)
      : order.stripePaymentIntentId;
    order.paymentId = order.stripePaymentIntentId || order.paymentId || checkoutSession.id;
    addProcessedEventId(order, eventId);
    await order.save(session ? { session } : undefined);

    await ensurePaymentTransaction({
      order,
      paymentId: order.paymentId,
      session,
      reason: `Stripe ${source}: paid but out of stock`,
    });
    await clearPendingPaymentNotification({ userId: order.userId, orderId: order._id, session });

    await createUserNotification({
      userId: order.userId,
      type: "PAYMENT_UPDATE",
      title: "Payment Received, Order Cancelled",
      message: "Payment was captured, but one or more items sold out. Refund will be initiated.",
      meta: { orderId: order._id, status: "cancelled", paymentStatus: "paid" },
    });

    return { success: true, cancelled: true, order };
  }

  order.paymentStatus = "paid";
  order.isPaid = true;
  order.paidAt = order.paidAt || new Date();
  order.inventoryApplied = true;
  order.paymentFailureReason = "";
  order.stripeSessionId = checkoutSession.id || order.stripeSessionId;
  order.stripePaymentIntentId = checkoutSession.payment_intent
    ? String(checkoutSession.payment_intent)
    : order.stripePaymentIntentId;
  order.paymentId = order.stripePaymentIntentId || order.paymentId || checkoutSession.id;

  if (!["delivered", "completed"].includes(order.orderStatus)) {
    order.orderStatus = "processing";
  }

  addProcessedEventId(order, eventId);
  await order.save(session ? { session } : undefined);

  const cartUnset = normalized.items.reduce((acc, item) => {
    acc[`cartItems.${item.productId}`] = "";
    return acc;
  }, {});
  await User.findByIdAndUpdate(order.userId, { $unset: cartUnset }, session ? { session } : undefined);

  await ensurePaymentTransaction({
    order,
    paymentId: order.paymentId,
    session,
    reason: `Stripe ${source}: payment confirmed`,
  });

  await clearPendingPaymentNotification({ userId: order.userId, orderId: order._id, session });

  await createUserNotification({
    userId: order.userId,
    type: "PAYMENT_UPDATE",
    title: "Payment Confirmed",
    message: `Order #${String(order._id).slice(-6).toUpperCase()} payment is confirmed.`,
    meta: { orderId: order._id, status: order.orderStatus, paymentStatus: order.paymentStatus },
  });

  return { success: true, order };
};

export const finalizeCheckoutSessionPayment = async ({
  checkoutSession,
  source = "webhook",
  eventId = null,
}) => {
  if (!checkoutSession || checkoutSession.payment_status !== "paid") {
    return { success: true, ignored: true, message: "Session is not paid." };
  }

  const dbSession = await mongoose.startSession();
  try {
    let result;
    await dbSession.withTransaction(async () => {
      result = await applyPaymentUpdate({
        checkoutSession,
        eventId,
        source,
        session: dbSession,
      });
    });
    return result || { success: true };
  } catch (error) {
    if (
      error.message.includes("does not support transactions") ||
      error.message.includes("replica set")
    ) {
      return applyPaymentUpdate({
        checkoutSession,
        eventId,
        source,
        session: null,
      });
    }
    throw error;
  } finally {
    await dbSession.endSession();
  }
};

export const markOrderPaymentFailed = async ({
  orderId,
  reason = "payment_failed",
  eventId = null,
}) => {
  if (!orderId) return { success: false, ignored: true };

  const order = await Order.findById(orderId);
  if (!order) return { success: false, ignored: true };

  if (hasProcessedEvent(order, eventId)) {
    return { success: true, idempotent: true, order };
  }

  if (order.paymentStatus === "paid" || order.isPaid) {
    addProcessedEventId(order, eventId);
    await order.save();
    return { success: true, ignored: true, message: "Order already paid." };
  }

  order.orderStatus = "cancelled";
  order.paymentStatus = "unpaid";
  order.isPaid = false;
  order.paymentFailureReason = reason;
  addProcessedEventId(order, eventId);
  await order.save();

  await createUserNotification({
    userId: order.userId,
    type: "PAYMENT_UPDATE",
    title: "Payment Not Completed",
    message: `Order #${String(order._id).slice(-6).toUpperCase()} was cancelled because payment did not complete.`,
    meta: { orderId: order._id, status: order.orderStatus, paymentStatus: order.paymentStatus },
  });

  return { success: true, order };
};

const resolveOrderIdFromPaymentIntent = async (paymentIntent) => {
  if (!paymentIntent) return null;

  const metadataOrderId = paymentIntent.metadata?.orderId;
  if (metadataOrderId) return metadataOrderId;

  const byIntent = await Order.findOne({ stripePaymentIntentId: paymentIntent.id }).select("_id");
  if (byIntent?._id) return String(byIntent._id);

  const sessions = await stripeInstance.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });
  const session = sessions.data?.[0];
  return session?.metadata?.orderId || session?.client_reference_id || null;
};

export const stripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await finalizeCheckoutSessionPayment({
          checkoutSession: event.data.object,
          source: "checkout.session.completed",
          eventId: event.id,
        });
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
        if (!orderId) break;

        const sessionList = await stripeInstance.checkout.sessions.list({
          payment_intent: paymentIntent.id,
          limit: 1,
        });
        const checkoutSession = sessionList.data?.[0];
        await finalizeCheckoutSessionPayment({
          checkoutSession:
            checkoutSession || {
              id: null,
              payment_status: "paid",
              payment_intent: paymentIntent.id,
              metadata: { orderId },
            },
          source: "payment_intent.succeeded",
          eventId: event.id,
        });
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
        await markOrderPaymentFailed({
          orderId,
          reason: "payment_intent_failed",
          eventId: event.id,
        });
        break;
      }

      case "checkout.session.expired": {
        const checkoutSession = event.data.object;
        const orderId = checkoutSession?.metadata?.orderId || checkoutSession?.client_reference_id;
        await markOrderPaymentFailed({
          orderId,
          reason: "checkout_session_expired",
          eventId: event.id,
        });
        break;
      }

      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing error", { error: error.message, eventType: event?.type });
    return res.status(500).json({ received: false });
  }
};
