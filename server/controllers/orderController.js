import mongoose from "mongoose";
import stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import {
  buildAvailabilitySnapshot,
  decreaseStockForItems,
  getRestockedProductIds,
  increaseStockForItems,
  isProductAvailable,
  normalizeLineItems,
} from "../utils/inventory.js";
import { notifyAndClearStockSubscribers } from "../utils/stockNotification.js";

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

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapOrderItemsForStorage = (lineItems) =>
  lineItems.map((item) => ({
    product: item.productId,
    quantity: item.quantity,
  }));

const toLineItemsFromOrder = (orderItems = []) =>
  orderItems.map((item) => ({
    productId: String(item.product),
    quantity: Number(item.quantity),
  }));

const getProductsByIds = async (productIds, session) => {
  const query = Product.find({ _id: { $in: productIds } }).select(
    "_id name offerPrice countInStock inStock"
  );
  if (session) {
    query.session(session);
  }
  const products = await query;
  return new Map(products.map((product) => [String(product._id), product]));
};

const validateAndCalculateSubtotal = (lineItems, productMap) => {
  let subtotal = 0;

  for (const item of lineItems) {
    const product = productMap.get(item.productId);
    if (!product) {
      throw createHttpError(404, `Product ${item.productId} unavailable`);
    }

    if (!isProductAvailable(product) || item.quantity > Number(product.countInStock || 0)) {
      throw createHttpError(
        409,
        `Only ${Math.max(0, Number(product.countInStock || 0))} left for ${product.name}`
      );
    }

    subtotal += Number(product.offerPrice || 0) * item.quantity;
  }

  return subtotal;
};

const respondKnownError = (res, error) => {
  if (!error?.statusCode) {
    return false;
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
  return true;
};

// Place order with Stripe : POST /api/order/stripe
export const placeOrderStripe = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;
  const { origin } = req.headers;

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) {
    return res.status(400).json({
      success: false,
      message: normalized.message,
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Identification failed: User not found",
    });
  }

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);
  const productMap = await getProductsByIds(productIds);

  let subtotal = 0;
  try {
    subtotal = validateAndCalculateSubtotal(lineItems, productMap);
  } catch (error) {
    if (respondKnownError(res, error)) {
      return;
    }
    throw error;
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: mapOrderItemsForStorage(lineItems),
    shippingAddress,
    paymentMethod: "Online",
    totalAmount,
    isPaid: false,
    orderStatus: "order initiated",
    inventoryApplied: false,
    inventoryRestored: false,
  });

  let stripeSession;
  try {
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

    const stripeLineItems = lineItems.map((item) => {
      const product = productMap.get(item.productId);
      const price = Number(product?.offerPrice || 0);

      return {
        price_data: {
          currency: "inr",
          product_data: { name: product?.name || "Product" },
          unit_amount: Math.round(price * (1 + TAX_RATE) * 100),
        },
        quantity: item.quantity,
      };
    });

    stripeSession = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customer.id,
      line_items: stripeLineItems,
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });
  } catch (error) {
    await Order.findOneAndDelete({
      _id: order._id,
      isPaid: false,
      orderStatus: "order initiated",
      inventoryApplied: false,
    });
    throw error;
  }

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

  res.status(201).json({
    success: true,
    message: "Secure checkout initialized",
    url: stripeSession.url,
  });
});

// Place order with COD : POST /api/order/cod
export const placeOrderCOD = asyncHandler(async (req, res) => {
  const { items, shippingAddress } = req.body;
  const userId = req.user.id;

  const normalized = normalizeLineItems(items);
  if (!normalized.valid) {
    return res.status(400).json({
      success: false,
      message: normalized.message,
    });
  }

  const lineItems = normalized.items;
  const productIds = lineItems.map((item) => item.productId);

  const session = await mongoose.startSession();
  let order;

  try {
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw createHttpError(404, "User not found");
      }

      const productMap = await getProductsByIds(productIds, session);
      const subtotal = validateAndCalculateSubtotal(lineItems, productMap);

      const stockUpdateResult = await decreaseStockForItems(lineItems, session);
      if (!stockUpdateResult.success) {
        const failedProduct = productMap.get(stockUpdateResult.failedProductId);
        throw createHttpError(
          409,
          `Only ${Math.max(
            0,
            Number(failedProduct?.countInStock || 0)
          )} left for ${failedProduct?.name || "a product"}`
        );
      }

      const totalAmount = Math.round(subtotal * (1 + TAX_RATE));
      const [createdOrder] = await Order.create(
        [
          {
            userId,
            items: mapOrderItemsForStorage(lineItems),
            shippingAddress,
            totalAmount,
            paymentMethod: "COD",
            isPaid: false,
            orderStatus: "order placed",
            inventoryApplied: true,
            inventoryRestored: false,
          },
        ],
        { session }
      );

      order = createdOrder;
      await User.findByIdAndUpdate(
        userId,
        { $set: { cartItems: {} } },
        { session }
      );
    });
  } catch (error) {
    if (respondKnownError(res, error)) {
      return;
    }
    throw error;
  } finally {
    await session.endSession();
  }

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

// Get User Orders : GET /api/order/user
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

// Get All Orders (Seller) : GET /api/order/seller
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

  const session = await mongoose.startSession();
  let updatedOrder = null;
  let previousStatus = "";
  let restockedProductIds = [];

  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(id).session(session);
      if (!order) {
        throw createHttpError(404, "Order not found");
      }

      previousStatus = order.orderStatus;
      if (previousStatus === nextStatus) {
        updatedOrder = order.toObject();
        return;
      }

      if (order.paymentMethod === "Online" && !order.isPaid && nextStatus !== "cancelled") {
        throw createHttpError(409, "Unpaid online orders cannot be status-updated");
      }

      const allowedNextStatuses = getAllowedNextStatuses(previousStatus);
      if (!allowedNextStatuses.includes(nextStatus)) {
        throw createHttpError(
          409,
          `Status cannot move from "${previousStatus}" to "${nextStatus}"`
        );
      }

      const shouldRestoreInventory =
        ["cancelled", "returned"].includes(nextStatus) &&
        order.inventoryApplied &&
        !order.inventoryRestored;

      if (shouldRestoreInventory) {
        const lineItems = toLineItemsFromOrder(order.items);
        const productIds = lineItems.map((item) => item.productId);

        const productsBeforeRestore = await Product.find({
          _id: { $in: productIds },
        })
          .select("_id countInStock inStock")
          .session(session);
        const beforeSnapshot = buildAvailabilitySnapshot(productsBeforeRestore);

        const productsAfterRestore = await increaseStockForItems(lineItems, session);
        restockedProductIds = getRestockedProductIds(beforeSnapshot, productsAfterRestore);
        order.inventoryRestored = true;
      }

      order.orderStatus = nextStatus;
      await order.save({ session });
      updatedOrder = order.toObject();
    });
  } catch (error) {
    if (respondKnownError(res, error)) {
      return;
    }
    throw error;
  } finally {
    await session.endSession();
  }

  if (previousStatus !== nextStatus) {
    const statusMessages = {
      "order placed": "Your order has been placed and is being processed.",
      shipped: "Your order has been shipped.",
      delivered: "Your order was delivered successfully.",
      cancelled: "Your order has been cancelled.",
      returned: "Your order return has been processed.",
    };

    await createUserNotification({
      userId: updatedOrder.userId,
      title: "Order status updated",
      message:
        statusMessages[nextStatus] ||
        `Your order status is now "${nextStatus}".`,
      type: "order",
      meta: {
        orderId: updatedOrder._id,
        status: nextStatus,
      },
    });
  }

  if (restockedProductIds.length > 0) {
    const restockedProducts = await Product.find({
      _id: { $in: restockedProductIds },
    }).select("_id name");

    await Promise.all(
      restockedProducts.map((product) =>
        notifyAndClearStockSubscribers({
          productId: product._id,
          productName: product.name,
        })
      )
    );
  }

  res.status(200).json({
    success: true,
    message:
      previousStatus === nextStatus
        ? "Order status already up to date"
        : "Order status updated",
    order: updatedOrder,
    allowedNextStatuses: getAllowedNextStatuses(nextStatus),
  });
});
