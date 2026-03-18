import mongoose from "mongoose";
import stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import { calculateNetRevenue } from "../utils/analytics.js";
import {
  decreaseStockForItems,
  increaseStockForItems,
  isProductAvailable,
  normalizeLineItems,
} from "../utils/inventory.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE = 0.02;

const LOGISTICAL_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "CONFIRMED"],
  CANCELLED: [],
  RETURNED: [],
};

const mapOrderItemsForStorage = (lineItems, productMap) =>
  lineItems.map((item) => {
    const product = productMap.get(item.productId);
    return {
      product: item.productId,
      quantity: item.quantity,
      priceAtPurchase: Number(product?.offerPrice || 0),
      returnStatus: "NONE",
    };
  });

const toLineItemsFromOrder = (orderItems = []) =>
  orderItems.map((item) => ({
    productId: String(item.product),
    quantity: Number(item.quantity),
  }));

const getProductsByIds = async (productIds, session) => {
  const query = Product.find({ _id: { $in: productIds } }).select(
    "_id name offerPrice countInStock inStock"
  );
  if (session) query.session(session);
  const products = await query;
  return new Map(products.map((product) => [String(product._id), product]));
};

const validateAndCalculateSubtotal = (lineItems, productMap) => {
  let subtotal = 0;
  for (const item of lineItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      const error = new Error(`Product ${item.productId} unavailable`);
      error.statusCode = 404;
      throw error;
    }
    if (!isProductAvailable(product) || item.quantity > Number(product.countInStock || 0)) {
       const error = new Error(`Only ${Math.max(0, Number(product.countInStock || 0))} left for ${product.name}`);
       error.statusCode = 409;
       throw error;
    }
    subtotal += Number(product.offerPrice || 0) * item.quantity;
  }
  return subtotal;
};

// Place order with Stripe (New Order)
export const placeOrderStripe = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;
  const { origin } = req.headers;

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) return res.status(400).json({ success: false, message: normalized.message });

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);
  const productMap = await getProductsByIds(productIds);

  let subtotal = 0;
  try {
    subtotal = validateAndCalculateSubtotal(lineItems, productMap);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: mapOrderItemsForStorage(lineItems, productMap),
    shippingAddress,
    paymentMethod: "Online",
    totalAmount,
    orderStatus: "PENDING",
    paymentStatus: "PENDING",
  });

  const stripeSession = await stripeInstance.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems.map((item) => {
      const product = productMap.get(item.productId);
      return {
        price_data: {
          currency: "inr",
          product_data: { name: product?.name || "Product" },
          unit_amount: Math.round(Number(product?.offerPrice || 0) * (1 + TAX_RATE) * 100),
        },
        quantity: item.quantity,
      };
    }),
    success_url: `${origin}/loader?next=my-orders`,
    cancel_url: `${origin}/cart`,
    metadata: { orderId: order._id.toString(), userId: userId.toString() },
  });

  res.status(201).json({ success: true, url: stripeSession.url });
});

// Pay for an Existing Unpaid Order
export const payExistingOrderStripe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { origin } = req.headers;

  const order = await Order.findById(id).populate("items.product");
  if (!order) return res.status(404).json({ success: false, message: "Order not found" });

  if (String(order.userId) !== String(userId)) return res.status(403).json({ success: false, message: "Unauthorized" });

  if (order.paymentStatus === "PAID") return res.status(400).json({ success: false, message: "Already paid" });
  if (["CANCELLED", "RETURNED"].includes(order.orderStatus)) return res.status(400).json({ success: false, message: "Order is inactive" });

  const stripeSession = await stripeInstance.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.product?.name || "Product" },
        unit_amount: Math.round(item.priceAtPurchase * (1 + TAX_RATE) * 100),
      },
      quantity: item.quantity,
    })),
    success_url: `${origin}/loader?next=my-orders`,
    cancel_url: `${origin}/account/orders`,
    metadata: { orderId: order._id.toString(), userId: userId.toString() },
  });

  res.status(200).json({ success: true, url: stripeSession.url });
});

// Place order with COD
export const placeOrderCOD = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) return res.status(400).json({ success: false, message: normalized.message });

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);
  const session = await mongoose.startSession();
  
  try {
    let order;
    await session.withTransaction(async () => {
      const productMap = await getProductsByIds(productIds, session);
      const subtotal = validateAndCalculateSubtotal(lineItems, productMap);

      const stockResult = await decreaseStockForItems(lineItems, session);
      if (!stockResult.success) throw new Error("Stock unavailable");

      const totalAmount = Math.round(subtotal * (1 + TAX_RATE));
      [order] = await Order.create([{
        userId,
        items: mapOrderItemsForStorage(lineItems, productMap),
        shippingAddress,
        totalAmount,
        paymentMethod: "COD",
        orderStatus: "CONFIRMED",
        paymentStatus: "PENDING",
        inventoryApplied: true,
      }], { session });

      await User.findByIdAndUpdate(userId, { $set: { cartItems: {} } }, { session });
    });
    res.status(201).json({ success: true, orderId: order._id });
  } finally {
    await session.endSession();
  }
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ userId }).populate("items.product").sort({ createdAt: -1 }).lean();
  res.status(200).json({ success: true, orders });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentMethod, q } = req.query;
  const query = {};
  if (status) query.orderStatus = status;
  if (paymentMethod) query.paymentMethod = paymentMethod;

  let orders = await Order.find(query).populate("items.product").populate("userId", "name email").sort({ createdAt: -1 }).lean();

  if (q) {
     const needle = q.toLowerCase();
     orders = orders.filter(o => 
       o.userId?.name?.toLowerCase().includes(needle) || 
       String(o._id).toLowerCase().includes(needle)
     );
  }
  res.status(200).json({ success: true, orders });
});

/**
 * Logistical Status Update with Delivery Rule
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const nextStatus = String(req.body?.status || req.body?.orderStatus || "").trim().toUpperCase();

  const session = await mongoose.startSession();
  try {
    let resultOrder;
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error("Order not found");

      // CRITICAL: Delivery Rule enforcement
      if (nextStatus === "DELIVERED" && order.paymentStatus !== "PAID") {
         throw new Error("Cannot deliver an unpaid order. Collect payment first.");
      }

      const currentStatus = order.orderStatus.toUpperCase();
      const allowed = LOGISTICAL_TRANSITIONS[currentStatus] || [];
      if (currentStatus !== nextStatus && !allowed.includes(nextStatus)) {
        throw new Error(`Forbidden transition from ${currentStatus} to ${nextStatus}`);
      }

      if (nextStatus === "CANCELLED" && order.inventoryApplied) {
        await increaseStockForItems(toLineItemsFromOrder(order.items), session);
        order.inventoryApplied = false;
        if (order.paymentStatus === "PAID") order.paymentStatus = "REFUND_PENDING";
      }

      order.orderStatus = nextStatus;
      await order.save({ session });
      resultOrder = order;
    });
    res.status(200).json({ success: true, order: resultOrder });
  } catch (error) {
    if (error.message.includes("support sessions") || error.message.includes("Transaction")) {
        return handleFallbackUpdate(id, nextStatus, res);
    }
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

async function handleFallbackUpdate(id, nextStatus, res) {
  const order = await Order.findById(id);
  if (nextStatus === "DELIVERED" && order.paymentStatus !== "PAID") {
    return res.status(400).json({ success: false, message: "Cannot deliver an unpaid order." });
  }
  if (nextStatus === "CANCELLED" && order.inventoryApplied) {
    await increaseStockForItems(toLineItemsFromOrder(order.items));
    order.inventoryApplied = false;
  }
  order.orderStatus = nextStatus;
  await order.save();
  res.status(200).json({ success: true, order });
}

export const approveReturn = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { itemIds } = req.body;
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order || order.orderStatus !== "RETURN_REQUESTED") throw new Error("Invalid state");

      let refundAmount = 0;
      const toRestock = [];
      order.items.forEach(item => {
        if (itemIds.includes(String(item._id)) && item.returnStatus === "REQUESTED") {
          item.returnStatus = "RETURNED";
          refundAmount += item.priceAtPurchase * item.quantity;
          toRestock.push({ productId: item.product, quantity: item.quantity });
        }
      });

      const totalRefund = Math.round(refundAmount * (1 + TAX_RATE));
      await increaseStockForItems(toRestock, session);

      const trans = await Transaction.create([{
        orderId: order._id, transactionType: "REFUND", amount: totalRefund, status: "PENDING", method: order.paymentMethod
      }], { session });

      order.refundedAmount += totalRefund;
      order.paymentStatus = "REFUND_PENDING";
      order.transactions.push(trans[0]._id);
      if (order.items.every(i => ["RETURNED", "NONE"].includes(i.returnStatus))) order.orderStatus = "RETURNED";
      await order.save({ session });
    });
    res.status(200).json({ success: true, message: "Return approved" });
  } finally {
    await session.endSession();
  }
});

export const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const metrics = await calculateNetRevenue({ from, to });
  res.status(200).json({ success: true, ...metrics });
});
