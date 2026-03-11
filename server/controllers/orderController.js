import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { createUserNotification } from "../utils/notification.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE = 0.02;
const MANAGEABLE_ORDER_STATUSES = [
  "order placed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];
const ORDER_STATUS_TRANSITIONS = {
  "order initiated": ["order placed", "cancelled"],
  "order placed": ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

const getAllowedNextStatuses = (currentStatus) =>
  ORDER_STATUS_TRANSITIONS[currentStatus] || [];

// Place order with Stripe : POST /api/order/placeorderstripe
export const placeOrderStripe = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;
  const userId = req.user.id;
  const { origin } = req.headers;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "Identification failed: User not found" });
  }

  const productData = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} unavailable` });
    }

    if (item.quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
    }

    productData.push({
      productId: product._id,
      name: product.name,
      price: product.offerPrice,
      quantity: item.quantity,
    });

    subtotal += product.offerPrice * item.quantity;
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: productData.map((p) => ({ product: p.productId, quantity: p.quantity })),
    shippingAddress,
    paymentMethod,
    totalAmount,
    isPaid: false,
  });

  await createUserNotification({
    userId,
    title: "Order created",
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} is created and awaiting payment.`,
    type: "order",
    meta: {
      orderId: order._id,
      status: order.orderStatus,
    },
  });

  const customer = await stripeInstance.customers.create({
    name: user.name,
    email: user.email,
    address: {
      line1: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      postal_code: shippingAddress.zipcode || shippingAddress.postalCode,
      country: "IN",
    },
  });

  const line_items = productData.map((item) => ({
    price_data: {
      currency: "inr",
      product_data: { name: item.name },
      unit_amount: Math.round(item.price * (1 + TAX_RATE) * 100),
    },
    quantity: item.quantity,
  }));

  const session = await stripeInstance.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer: customer.id,
    line_items,
    success_url: `${origin}/loader?next=my-orders`,
    cancel_url: `${origin}/cart`,
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  res.status(201).json({
    success: true,
    message: "Secure checkout initialized",
    url: session.url,
  });
});

// Place order with COD : POST /api/order/placeordercod
export const placeOrderCOD = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  let subtotal = 0;
  const formattedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} unavailable` });
    }

    if (item.quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Stock limit reached for ${product.name}` });
    }

    subtotal += product.offerPrice * item.quantity;
    formattedItems.push({ product: product._id, quantity: item.quantity });
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: formattedItems,
    shippingAddress,
    totalAmount,
    paymentMethod: "COD",
    isPaid: false,
    orderStatus: "order placed",
  });

  await createUserNotification({
    userId,
    title: "Order placed successfully",
    message: `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed.`,
    type: "order",
    meta: {
      orderId: order._id,
      status: order.orderStatus,
    },
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully via COD",
    orderId: order._id,
  });
});

// Get User Orders : GET /api/order/getuserorders
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const orders = await Order.find({
    userId,
    $or: [{ paymentMethod: "COD" }, { isPaid: true }],
  })
    .populate("items.product")
    .sort({ createdAt: -1 })
    .lean();

  const safeOrders = (orders || []).map((order) => ({
    id: order._id,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    isPaid: order.isPaid,
    createdAt: order.createdAt,
    items: (order.items || []).map((item) => ({
      quantity: item.quantity,
      product: item.product
        ? {
            id: item.product._id,
            name: item.product.name,
            image: item.product.image,
            offerPrice: item.product.offerPrice,
            category: item.product.category,
          }
        : null,
    })),
  }));

  res.status(200).json({
    success: true,
    orders: safeOrders,
  });
});

// Get All Orders (Admin) : GET /api/order/getallorders
export const getAllOrders = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, status, paymentMethod, q } = req.query;

  const query = {
    $or: [{ paymentMethod: "COD" }, { isPaid: true }],
  };

  const validStatuses = [...MANAGEABLE_ORDER_STATUSES, "order initiated"];
  if (status && (validStatuses.includes(status) || status === "")) {
    if (status !== "") query.orderStatus = status;
  }

  if (paymentMethod && ["COD", "Online"].includes(paymentMethod)) {
    query.paymentMethod = paymentMethod;
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      query.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      query.createdAt.$lte = endDate;
    }
  }

  let orders = await Order.find(query)
    .populate("items.product")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    orders = orders.filter((order) => {
      const matchesUser =
        order.userId?.name?.toLowerCase().includes(needle) ||
        order.userId?.email?.toLowerCase().includes(needle);
      const matchesOrderId = String(order._id).toLowerCase().includes(needle);
      const matchesProduct = order.items?.some((item) =>
        item.product?.name?.toLowerCase().includes(needle)
      );
      return matchesUser || matchesOrderId || matchesProduct;
    });
  }

  res.status(200).json({
    success: true,
    orders,
  });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const nextStatus = String(req.body?.orderStatus || "")
    .trim()
    .toLowerCase();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order id",
    });
  }

  if (!MANAGEABLE_ORDER_STATUSES.includes(nextStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status",
    });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const previousStatus = order.orderStatus;
  if (previousStatus === nextStatus) {
    return res.status(200).json({
      success: true,
      message: "Order status already up to date",
      order,
      allowedNextStatuses: getAllowedNextStatuses(previousStatus),
    });
  }

  if (order.paymentMethod === "Online" && !order.isPaid) {
    return res.status(409).json({
      success: false,
      message: "Unpaid online orders cannot be status-updated",
    });
  }

  const allowedNextStatuses = getAllowedNextStatuses(previousStatus);
  if (!allowedNextStatuses.includes(nextStatus)) {
    return res.status(409).json({
      success: false,
      message: `Status cannot move from "${previousStatus}" to "${nextStatus}"`,
      allowedNextStatuses,
    });
  }

  order.orderStatus = nextStatus;
  await order.save();

  if (previousStatus !== nextStatus) {
    const statusMessages = {
      "order placed": "Your order has been placed and is being processed.",
      shipped: "Your order has been shipped.",
      delivered: "Your order was delivered successfully.",
      cancelled: "Your order has been cancelled.",
      returned: "Your order return has been processed.",
    };

    await createUserNotification({
      userId: order.userId,
      title: "Order status updated",
      message:
        statusMessages[nextStatus] ||
        `Your order status is now "${nextStatus}".`,
      type: "order",
      meta: {
        orderId: order._id,
        status: nextStatus,
      },
    });
  }

  res.status(200).json({
    success: true,
    message: "Order status updated",
    order,
    allowedNextStatuses: getAllowedNextStatuses(nextStatus),
  });
});
