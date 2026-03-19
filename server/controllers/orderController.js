import crypto from "crypto";
import mongoose from "mongoose";
import Stripe from "stripe";
import Address from "../models/Address.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import {
  decreaseStockForItems,
  increaseStockForItems,
  isProductAvailable,
  normalizeLineItems,
} from "../utils/inventory.js";
import { finalizeCheckoutSessionPayment, markOrderPaymentFailed } from "./webhookController.js";
import logger from "../utils/logger.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE = 0.02;
const REUSE_WINDOW_MS = 20 * 60 * 1000;

const ORDER_STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const CANCELLED_STATUSES = ["cancelled", "CANCELLED"];
const DELIVERED_FINAL_STATUSES = ["delivered", "completed", "DELIVERED", "COMPLETED"];

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
      const error = new Error(
        `Only ${Math.max(0, Number(product.countInStock || 0))} left for ${product.name}`
      );
      error.statusCode = 409;
      throw error;
    }
    subtotal += Number(product.offerPrice || 0) * item.quantity;
  }
  return subtotal;
};

const roundCurrency = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const calculateOrderTotals = (subtotal) => {
  const subtotalAmount = roundCurrency(subtotal);
  const taxAmount = roundCurrency(subtotalAmount * TAX_RATE);
  const totalAmount = Math.round(subtotalAmount + taxAmount);

  return { subtotalAmount, taxAmount, totalAmount };
};

const calculateOrderTotalsFromOrderItems = (orderItems = []) => {
  const subtotal = (orderItems || []).reduce((sum, item) => {
    const unitPrice = Number(item?.priceAtPurchase || item?.offerPrice || item?.price || 0);
    const quantity = Number(item?.quantity || 0);
    return sum + unitPrice * quantity;
  }, 0);

  return calculateOrderTotals(subtotal);
};

const isStripePaymentMethod = (value = "") => {
  const normalized = String(value).trim().toLowerCase();
  return normalized === "stripe" || normalized === "online";
};

const buildCheckoutFingerprint = ({ userId, lineItems, shippingAddress, totalAmount }) => {
  const normalizedItems = [...lineItems]
    .map((item) => ({
      productId: String(item.productId),
      quantity: Number(item.quantity),
    }))
    .sort((a, b) => a.productId.localeCompare(b.productId));

  const addressSnapshot = {
    street: shippingAddress?.street || "",
    city: shippingAddress?.city || "",
    state: shippingAddress?.state || "",
    postalCode: shippingAddress?.zipcode || shippingAddress?.postalCode || "",
  };

  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        userId: String(userId),
        items: normalizedItems,
        address: addressSnapshot,
        totalAmount: Number(totalAmount),
      })
    )
    .digest("hex");
};

const getFrontendOrigin = (req) =>
  req.headers.origin || process.env.FRONTEND_URL || "http://localhost:5173";

const toAddressObjectFromDoc = (addressDoc = {}) => ({
  firstName: String(addressDoc.firstName || "").trim(),
  lastName: String(addressDoc.lastName || "").trim(),
  email: String(addressDoc.email || "").trim(),
  phone: String(addressDoc.phone || "").trim(),
  street: String(addressDoc.street || "").trim(),
  city: String(addressDoc.city || "").trim(),
  state: String(addressDoc.state || "").trim(),
  zipcode: String(addressDoc.zipcode || addressDoc.zipCode || addressDoc.postalCode || "").trim(),
  country: String(addressDoc.country || "").trim() || "India",
});

const resolveAddressFromOrder = async ({ order, user }) => {
  const existing = order?.shippingAddress;

  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    const fromExisting = toAddressObjectFromDoc(existing);
    if (fromExisting.street && fromExisting.city && fromExisting.state && fromExisting.zipcode) {
      return fromExisting;
    }
  }

  const maybeAddressId = typeof existing === "string" ? existing : existing?._id?.toString?.();
  if (maybeAddressId && mongoose.Types.ObjectId.isValid(maybeAddressId)) {
    const addressDoc = await Address.findOne({
      _id: maybeAddressId,
      userId: order.userId,
    }).lean();
    if (addressDoc) {
      return toAddressObjectFromDoc(addressDoc);
    }
  }

  const fallbackAddress = await Address.findOne({ userId: order.userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
  if (fallbackAddress) {
    return toAddressObjectFromDoc(fallbackAddress);
  }

  return {
    firstName: "",
    lastName: "",
    email: String(user?.email || "").trim(),
    phone: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "India",
  };
};

const normalizeCountryCode = (value = "") => {
  const normalized = String(value).trim();
  if (!normalized) return "IN";

  if (normalized.length === 2) return normalized.toUpperCase();

  const lower = normalized.toLowerCase();
  if (lower === "india") return "IN";
  if (lower === "united states" || lower === "usa" || lower === "us") return "US";
  if (lower === "united kingdom" || lower === "uk") return "GB";

  return "IN";
};

const buildStripeContactDetails = ({ shippingAddress, user }) => {
  const address = shippingAddress || {};

  const firstName = String(address?.firstName || "").trim();
  const lastName = String(address?.lastName || "").trim();
  const fullNameFromAddress = `${firstName} ${lastName}`.trim();
  const fallbackName = String(user?.name || "").trim();
  const name = fullNameFromAddress || fallbackName || "Customer";

  const line1 = String(address?.street || "").trim();
  const city = String(address?.city || "").trim();
  const state = String(address?.state || "").trim();
  const postalCode = String(address?.zipcode || address?.zipCode || address?.postalCode || "").trim();
  const country = normalizeCountryCode(address?.country);

  const email = String(address?.email || user?.email || "").trim() || undefined;
  const phone = String(address?.phone || "").trim() || undefined;

  const stripeAddress = {
    line1: line1 || undefined,
    city: city || undefined,
    state: state || undefined,
    postal_code: postalCode || undefined,
    country,
  };

  return {
    name,
    email,
    phone,
    stripeAddress,
    hasFullAddress: Boolean(line1 && city && state && postalCode),
  };
};

const buildStripeLineItemsForOrder = (order, productNameMap = new Map()) =>
  (order.items || []).map((item) => ({
    price_data: {
      currency: "inr",
      product_data: {
        name:
          productNameMap.get(String(item.product)) ||
          item.product?.name ||
          "Product",
      },
      unit_amount: Math.round(Number(item.priceAtPurchase || 0) * (1 + TAX_RATE) * 100),
    },
    quantity: Number(item.quantity),
  }));

const resolveOpenSessionIfReusable = async (order) => {
  if (!order?.stripeSessionId) return null;
  try {
    const session = await stripeInstance.checkout.sessions.retrieve(order.stripeSessionId);
    if (session?.status === "open" && session?.payment_status !== "paid" && session?.url) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
};

const createStripeSessionForOrder = async ({ order, user, origin, lineItems }) => {
  const metadata = {
    orderId: order._id.toString(),
    userId: order.userId.toString(),
  };

  const shippingAddress = await resolveAddressFromOrder({ order, user });
  order.shippingAddress = shippingAddress;

  const { name, email, phone, stripeAddress, hasFullAddress } = buildStripeContactDetails({
    shippingAddress,
    user,
  });

  const customer = await stripeInstance.customers.create({
    name,
    email,
    phone,
    address: stripeAddress,
    metadata,
  });

  const session = await stripeInstance.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: lineItems,
    metadata,
    payment_intent_data: hasFullAddress
      ? {
          metadata,
          shipping: {
            name,
            phone,
            address: stripeAddress,
          },
        }
      : { metadata },
    client_reference_id: order._id.toString(),
    customer: customer.id,
    billing_address_collection: "auto",
    success_url: `${origin}/loader?next=my-orders&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  if (!hasFullAddress) {
    logger.warn("Stripe checkout created with partial app address", { orderId: String(order._id) });
  }

  order.stripeSessionId = session.id;
  if (session.payment_intent) {
    order.stripePaymentIntentId = String(session.payment_intent);
  } else if (!order.stripePaymentIntentId) {
    order.set("stripePaymentIntentId", undefined);
  }
  await order.save();

  return session;
};

export const placeOrderStripe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { items, shippingAddress = {} } = req.body;
  const origin = getFrontendOrigin(req);

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) {
    return res.status(400).json({ success: false, message: normalized.message });
  }

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);
  const productMap = await getProductsByIds(productIds);

  let subtotal;
  try {
    subtotal = validateAndCalculateSubtotal(lineItems, productMap);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }

  const normalizedShippingAddress = {
    firstName: String(shippingAddress?.firstName || "").trim(),
    lastName: String(shippingAddress?.lastName || "").trim(),
    email: String(shippingAddress?.email || "").trim(),
    phone: String(shippingAddress?.phone || "").trim(),
    street: String(shippingAddress?.street || "").trim(),
    city: String(shippingAddress?.city || "").trim(),
    state: String(shippingAddress?.state || "").trim(),
    zipcode: String(
      shippingAddress?.zipcode ||
        shippingAddress?.zipCode ||
        shippingAddress?.postalCode ||
        ""
    ).trim(),
    country: String(shippingAddress?.country || "India").trim(),
  };

  if (
    !normalizedShippingAddress.street ||
    !normalizedShippingAddress.city ||
    !normalizedShippingAddress.state ||
    !normalizedShippingAddress.zipcode
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required for Stripe checkout.",
    });
  }

  const { subtotalAmount, taxAmount, totalAmount } = calculateOrderTotals(subtotal);
  const checkoutFingerprint = buildCheckoutFingerprint({
    userId,
    lineItems,
    shippingAddress: normalizedShippingAddress,
    totalAmount,
  });

  const recentCutoff = new Date(Date.now() - REUSE_WINDOW_MS);
  let order = await Order.findOne({
    userId,
    paymentMethod: "stripe",
    paymentStatus: "unpaid",
    orderStatus: "pending",
    checkoutFingerprint,
    createdAt: { $gte: recentCutoff },
  }).sort({ createdAt: -1 });

  if (!order) {
    order = await Order.create({
      userId,
      items: mapOrderItemsForStorage(lineItems, productMap),
      shippingAddress: normalizedShippingAddress,
      paymentMethod: "stripe",
      paymentStatus: "unpaid",
      orderStatus: "pending",
      subtotalAmount,
      taxAmount,
      totalAmount,
      isPaid: false,
      inventoryApplied: false,
      checkoutFingerprint,
    });
  } else {
    const shouldUpdateTotals =
      Number(order.subtotalAmount || 0) !== subtotalAmount ||
      Number(order.taxAmount || 0) !== taxAmount ||
      Number(order.totalAmount || 0) !== totalAmount;

    if (shouldUpdateTotals) {
      order.subtotalAmount = subtotalAmount;
      order.taxAmount = taxAmount;
      order.totalAmount = totalAmount;
      await order.save();
    }
  }

  const reusableSession = await resolveOpenSessionIfReusable(order);
  if (reusableSession?.url) {
    return res.status(200).json({
      success: true,
      url: reusableSession.url,
      orderId: order._id,
      reused: true,
    });
  }

  const user = await User.findById(userId).select("_id name email");
  const stripeLineItems = lineItems.map((item) => {
    const product = productMap.get(item.productId);
    return {
      price_data: {
        currency: "inr",
        product_data: { name: product?.name || "Product" },
        unit_amount: Math.round(Number(product?.offerPrice || 0) * (1 + TAX_RATE) * 100),
      },
      quantity: item.quantity,
    };
  });

  const stripeSession = await createStripeSessionForOrder({
    order,
    user,
    origin,
    lineItems: stripeLineItems,
  });

  await createUserNotification({
    userId,
    type: "ORDER_UPDATE",
    title: "Payment Pending",
    message: `Order #${String(order._id).slice(-6).toUpperCase()} is awaiting payment confirmation.`,
    meta: { orderId: order._id, status: order.orderStatus, paymentStatus: order.paymentStatus },
  });

  return res.status(201).json({
    success: true,
    url: stripeSession.url,
    orderId: order._id,
  });
});

export const payExistingOrderStripe = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const origin = getFrontendOrigin(req);

  const order = await Order.findById(id).populate("items.product", "name");
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (String(order.userId) !== String(userId)) {
    return res.status(403).json({ success: false, message: "Unauthorized" });
  }
  if (!isStripePaymentMethod(order.paymentMethod)) {
    return res.status(400).json({ success: false, message: "Only Stripe orders can be retried." });
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
    return res.status(400).json({ success: false, message: "Order is already settled." });
  }
  const normalizedOrderStatus = String(order.orderStatus || "").toLowerCase();
  if (normalizedOrderStatus === "cancelled" || normalizedOrderStatus === "completed" || normalizedOrderStatus === "delivered") {
    return res.status(400).json({ success: false, message: "Order is not payable in current state." });
  }

  const retryTotals = calculateOrderTotalsFromOrderItems(order.items || []);
  const hasTotalsChanged =
    Number(order.subtotalAmount || 0) !== retryTotals.subtotalAmount ||
    Number(order.taxAmount || 0) !== retryTotals.taxAmount ||
    Number(order.totalAmount || 0) !== retryTotals.totalAmount;

  if (hasTotalsChanged) {
    order.subtotalAmount = retryTotals.subtotalAmount;
    order.taxAmount = retryTotals.taxAmount;
    order.totalAmount = retryTotals.totalAmount;
    await order.save();
  }

  const reusableSession = await resolveOpenSessionIfReusable(order);
  if (reusableSession?.url) {
    return res.status(200).json({
      success: true,
      url: reusableSession.url,
      orderId: order._id,
      reused: true,
    });
  }

  const user = await User.findById(userId).select("_id name email");
  const productNameMap = new Map(
    (order.items || [])
      .filter((item) => item.product)
      .map((item) => [String(item.product._id || item.product), item.product.name])
  );

  const stripeSession = await createStripeSessionForOrder({
    order,
    user,
    origin,
    lineItems: buildStripeLineItemsForOrder(order, productNameMap),
  });

  return res.status(200).json({
    success: true,
    url: stripeSession.url,
    orderId: order._id,
  });
});

export const placeOrderCOD = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) {
    return res.status(400).json({ success: false, message: normalized.message });
  }

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);
  const session = await mongoose.startSession();

  try {
    let order;
    await session.withTransaction(async () => {
      const productMap = await getProductsByIds(productIds, session);
      const subtotal = validateAndCalculateSubtotal(lineItems, productMap);

      const stockResult = await decreaseStockForItems(lineItems, session);
      if (!stockResult.success) {
        throw new Error("Stock unavailable");
      }

      const { subtotalAmount, taxAmount, totalAmount } = calculateOrderTotals(subtotal);
      [order] = await Order.create(
        [
          {
            userId,
            items: mapOrderItemsForStorage(lineItems, productMap),
            shippingAddress,
            subtotalAmount,
            taxAmount,
            totalAmount,
            paymentMethod: "cod",
            paymentStatus: "unpaid",
            orderStatus: "processing",
            isPaid: false,
            inventoryApplied: true,
          },
        ],
        { session }
      );

      const cartUnset = lineItems.reduce((acc, item) => {
        acc[`cartItems.${item.productId}`] = "";
        return acc;
      }, {});
      await User.findByIdAndUpdate(userId, { $unset: cartUnset }, { session });
    });

    return res.status(201).json({ success: true, orderId: order._id });
  } finally {
    await session.endSession();
  }
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ userId })
    .populate("items.product")
    .sort({ createdAt: -1 })
    .lean();

  const normalizedOrders = orders.map((order) => ({
    ...order,
    orderStatus: (() => {
      const normalizedStatus = String(order.orderStatus || "pending").toLowerCase();
      return normalizedStatus === "completed" ? "delivered" : normalizedStatus;
    })(),
  }));

  return res.status(200).json({
    success: true,
    orders: normalizedOrders,
  });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, paymentMethod, q, dateFrom, dateTo } = req.query;
  const query = {};
  if (status) {
    const normalizedStatus = String(status).toLowerCase();
    if (normalizedStatus === "delivered") {
      query.orderStatus = { $in: DELIVERED_FINAL_STATUSES };
    } else if (normalizedStatus === "cancelled") {
      query.orderStatus = { $in: CANCELLED_STATUSES };
    } else if (normalizedStatus === "pending") {
      query.orderStatus = { $in: ["pending", "PENDING"] };
    } else if (normalizedStatus === "processing") {
      query.orderStatus = { $in: ["processing", "CONFIRMED", "SHIPPED"] };
    } else {
      query.orderStatus = normalizedStatus;
    }
  }
  if (paymentMethod) {
    const normalizedMethod = String(paymentMethod).toLowerCase();
    if (normalizedMethod === "stripe") {
      query.paymentMethod = { $in: ["stripe", "Online", "online"] };
    } else if (normalizedMethod === "cod") {
      query.paymentMethod = { $in: ["cod", "COD"] };
    } else {
      query.paymentMethod = normalizedMethod;
    }
  }
  if (dateFrom || dateTo) {
    const createdAt = {};
    if (dateFrom) {
      const fromDate = new Date(`${dateFrom}T00:00:00.000Z`);
      if (Number.isNaN(fromDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid start date" });
      }
      createdAt.$gte = fromDate;
    }
    if (dateTo) {
      const toDate = new Date(`${dateTo}T23:59:59.999Z`);
      if (Number.isNaN(toDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid end date" });
      }
      createdAt.$lte = toDate;
    }
    if (createdAt.$gte && createdAt.$lte && createdAt.$gte > createdAt.$lte) {
      return res.status(400).json({ success: false, message: "End date must be after start date" });
    }
    query.createdAt = createdAt;
  }

  let orders = await Order.find(query)
    .populate("items.product")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  orders = orders.map((order) => ({
    ...order,
    orderStatus: (() => {
      const normalizedStatus = String(order.orderStatus || "pending").toLowerCase();
      return normalizedStatus === "completed" ? "delivered" : normalizedStatus;
    })(),
  }));

  if (q) {
    const needle = String(q).toLowerCase();
    orders = orders.filter(
      (order) =>
        order.userId?.name?.toLowerCase().includes(needle) ||
        String(order._id).toLowerCase().includes(needle)
    );
  }

  return res.status(200).json({ success: true, orders });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const nextStatus = String(req.body?.status || req.body?.orderStatus || "")
    .trim()
    .toLowerCase();

  if (!ORDER_STATUS_TRANSITIONS[nextStatus]) {
    return res.status(400).json({ success: false, message: "Invalid order status" });
  }

  const session = await mongoose.startSession();
  try {
    let updatedOrder;
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) throw new Error("Order not found");

      const currentStatus = String(order.orderStatus || "pending").toLowerCase();
      const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
      if (currentStatus !== nextStatus && !allowed.includes(nextStatus)) {
        throw new Error(`Forbidden transition from ${currentStatus} to ${nextStatus}`);
      }

      if (nextStatus === "delivered" && isStripePaymentMethod(order.paymentMethod) && order.paymentStatus !== "paid") {
        throw new Error("Cannot deliver an unpaid Stripe order.");
      }

      if (nextStatus === "cancelled" && order.inventoryApplied) {
        await increaseStockForItems(toLineItemsFromOrder(order.items), session);
        order.inventoryApplied = false;
      }

      order.orderStatus = nextStatus;
      if (nextStatus === "delivered" && !order.isPaid && order.paymentMethod === "cod") {
        order.paymentStatus = "paid";
        order.isPaid = true;
        order.paidAt = order.paidAt || new Date();
      }
      await order.save({ session });
      updatedOrder = order;
    });

    return res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  } finally {
    await session.endSession();
  }
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: "Session ID required" });
  }

  let checkoutSession;
  try {
    checkoutSession = await stripeInstance.checkout.sessions.retrieve(String(sessionId));
  } catch {
    return res.status(404).json({ success: false, message: "Invalid or expired Stripe session." });
  }

  const orderId = checkoutSession?.metadata?.orderId || checkoutSession?.client_reference_id;
  if (!orderId) {
    return res.status(400).json({ success: false, message: "Session is not linked to an order." });
  }

  const order = await Order.findById(orderId).select("_id userId paymentStatus orderStatus paymentMethod");
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found for this session." });
  }

  if (String(order.userId) !== String(req.user.id)) {
    return res.status(403).json({ success: false, message: "Unauthorized payment verification." });
  }

  if (checkoutSession.payment_status === "paid") {
    await finalizeCheckoutSessionPayment({
      checkoutSession,
      source: "verify-endpoint",
      eventId: `verify:${checkoutSession.id}`,
    });
    return res.status(200).json({ success: true, message: "Payment verified." });
  }

  if (checkoutSession.status === "expired") {
    await markOrderPaymentFailed({
      orderId,
      reason: "checkout_session_expired",
      eventId: `verify-expired:${checkoutSession.id}`,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Session is not paid yet.",
    paymentStatus: checkoutSession.payment_status,
    sessionStatus: checkoutSession.status,
  });
});
