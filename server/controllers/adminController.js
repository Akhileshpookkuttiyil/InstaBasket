import mongoose from "mongoose";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createUserNotification } from "../utils/notification.js";
import { processRefund } from "../services/refundService.js";

const DELIVERED_STATUSES = ["delivered", "completed", "DELIVERED", "COMPLETED"];
const PENDING_STATUSES = ["pending", "PENDING"];
const PROCESSING_STATUSES = ["processing", "CONFIRMED", "SHIPPED"];
const CANCELLED_STATUSES = ["cancelled", "CANCELLED"];

const isValidResetSecret = (providedSecret) => {
  const configured = String(process.env.ADMIN_RESET_KEY || "").trim();
  if (!configured) {
    return { ok: false, message: "ADMIN_RESET_KEY is not configured on server." };
  }
  if (String(providedSecret || "").trim() !== configured) {
    return { ok: false, message: "Unauthorized reset attempt." };
  }
  return { ok: true };
};

const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const shiftDays = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const shiftMonths = (date, amount) => {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
};

const formatDayKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const percentageChange = (currentValue, previousValue) => {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);

  if (previous === 0) {
    if (current === 0) {
      return { value: 0, direction: "neutral", label: "No change" };
    }

    return { value: 100, direction: "up", label: "New activity" };
  }

  const rawValue = ((current - previous) / previous) * 100;
  const roundedValue = Math.round(rawValue * 10) / 10;

  return {
    value: Math.abs(roundedValue),
    direction: roundedValue > 0 ? "up" : roundedValue < 0 ? "down" : "neutral",
    label: `${roundedValue > 0 ? "+" : ""}${roundedValue}% vs previous period`,
  };
};

const statusNormalizationExpression = {
  $switch: {
    branches: [
      {
        case: { $in: ["$orderStatus", PENDING_STATUSES] },
        then: "pending",
      },
      {
        case: { $in: ["$orderStatus", PROCESSING_STATUSES] },
        then: "processing",
      },
      {
        case: { $in: ["$orderStatus", DELIVERED_STATUSES] },
        then: "delivered",
      },
      {
        case: { $in: ["$orderStatus", CANCELLED_STATUSES] },
        then: "cancelled",
      },
    ],
    default: "pending",
  },
};

const paymentNormalizationExpression = {
  $switch: {
    branches: [
      {
        case: { $eq: ["$paymentStatus", "refunded"] },
        then: "refunded",
      },
      {
        case: {
          $or: [{ $eq: ["$paymentStatus", "paid"] }, { $eq: ["$isPaid", true] }],
        },
        then: "paid",
      },
    ],
    default: "unpaid",
  },
};

export const getAdminDashboardAnalytics = asyncHandler(async (_req, res) => {
  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = shiftDays(todayStart, -1);
  const currentPeriodStart = shiftDays(todayStart, -29);
  const previousPeriodStart = shiftDays(currentPeriodStart, -30);
  const weekStart = shiftDays(todayStart, -6);
  const monthSeriesStart = startOfDay(shiftMonths(new Date(todayStart.getFullYear(), todayStart.getMonth(), 1), -5));

  const [totalUsers, totalProducts, lowStockProducts, currentPeriodUsers, previousPeriodUsers, currentPeriodProducts, previousPeriodProducts, analyticsAgg] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Product.countDocuments({ countInStock: { $gt: 0, $lte: 5 } }),
    User.countDocuments({ createdAt: { $gte: currentPeriodStart } }),
    User.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    }),
    Product.countDocuments({ createdAt: { $gte: currentPeriodStart } }),
    Product.countDocuments({
      createdAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    }),
    // Keep dashboard work server-side with one faceted order aggregation so the
    // admin client can render from a single response without extra heavy joins.
    Order.aggregate([
      {
        $facet: {
        metrics: [
            {
              $match: {
                createdAt: { $gte: previousPeriodStart },
              },
            },
            {
              $project: {
                createdAt: 1,
                totalAmount: 1,
                refundedAmount: { $ifNull: ["$refundedAmount", 0] },
                normalizedStatus: statusNormalizationExpression,
              },
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $gte: ["$createdAt", currentPeriodStart] },
                    "current",
                    "previous",
                  ],
                },
                totalOrders: { $sum: 1 },
                pendingOrders: {
                  $sum: {
                    $cond: [
                      {
                        $in: ["$normalizedStatus", ["pending", "processing"]],
                      },
                      1,
                      0,
                    ],
                  },
                },
                deliveredOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$normalizedStatus", "delivered"] }, 1, 0],
                  },
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$normalizedStatus", "delivered"] },
                      { $subtract: ["$totalAmount", "$refundedAmount"] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          lifetimeMetrics: [
            {
              $project: {
                totalAmount: 1,
                refundedAmount: { $ifNull: ["$refundedAmount", 0] },
                normalizedStatus: statusNormalizationExpression,
              },
            },
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                pendingOrders: {
                  $sum: {
                    $cond: [
                      {
                        $in: ["$normalizedStatus", ["pending", "processing"]],
                      },
                      1,
                      0,
                    ],
                  },
                },
                deliveredOrders: {
                  $sum: {
                    $cond: [{ $eq: ["$normalizedStatus", "delivered"] }, 1, 0],
                  },
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$normalizedStatus", "delivered"] },
                      { $subtract: ["$totalAmount", "$refundedAmount"] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          todayRevenue: [
            {
              $match: {
                createdAt: { $gte: yesterdayStart },
              },
            },
            {
              $project: {
                createdAt: 1,
                totalAmount: 1,
                refundedAmount: { $ifNull: ["$refundedAmount", 0] },
                normalizedStatus: statusNormalizationExpression,
              },
            },
            {
              $group: {
                _id: {
                  $cond: [
                    { $gte: ["$createdAt", todayStart] },
                    "today",
                    "yesterday",
                  ],
                },
                totalRevenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$normalizedStatus", "delivered"] },
                      { $subtract: ["$totalAmount", "$refundedAmount"] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          weeklySales: [
            {
              $match: {
                createdAt: { $gte: weekStart },
              },
            },
            {
              $project: {
                createdAt: 1,
                totalAmount: 1,
                refundedAmount: { $ifNull: ["$refundedAmount", 0] },
                normalizedStatus: statusNormalizationExpression,
                dayKey: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$createdAt",
                  },
                },
              },
            },
            {
              $group: {
                _id: "$dayKey",
                orders: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$normalizedStatus", "delivered"] },
                      { $subtract: ["$totalAmount", "$refundedAmount"] },
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          monthlySales: [
            {
              $match: {
                createdAt: { $gte: monthSeriesStart },
              },
            },
            {
              $project: {
                createdAt: 1,
                totalAmount: 1,
                refundedAmount: { $ifNull: ["$refundedAmount", 0] },
                normalizedStatus: statusNormalizationExpression,
                monthKey: {
                  $dateToString: {
                    format: "%Y-%m",
                    date: "$createdAt",
                  },
                },
              },
            },
            {
              $group: {
                _id: "$monthKey",
                orders: { $sum: 1 },
                revenue: {
                  $sum: {
                    $cond: [
                      { $eq: ["$normalizedStatus", "delivered"] },
                      { $subtract: ["$totalAmount", "$refundedAmount"] },
                      0,
                    ],
                  },
                },
              },
            },
            { $sort: { _id: 1 } },
          ],
          topProducts: [
            {
              $match: {
                orderStatus: { $in: DELIVERED_STATUSES },
              },
            },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$items.product",
                quantitySold: { $sum: "$items.quantity" },
                revenue: {
                  $sum: {
                    $multiply: [
                      "$items.quantity",
                      { $ifNull: ["$items.priceAtPurchase", 0] },
                    ],
                  },
                },
              },
            },
            { $sort: { quantitySold: -1, revenue: -1 } },
            { $limit: 5 },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                _id: 1,
                quantitySold: 1,
                revenue: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ],
          recentOrders: [
            { $sort: { createdAt: -1 } },
            { $limit: 6 },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "customer",
              },
            },
            {
              $lookup: {
                from: "products",
                localField: "items.product",
                foreignField: "_id",
                as: "products",
              },
            },
            {
              $project: {
                _id: 1,
                totalAmount: 1,
                createdAt: 1,
                paymentMethod: 1,
                paymentStatus: paymentNormalizationExpression,
                orderStatus: statusNormalizationExpression,
                shippingAddress: 1,
                items: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: {
                      quantity: "$$item.quantity",
                      priceAtPurchase: "$$item.priceAtPurchase",
                      returnStatus: "$$item.returnStatus",
                      productName: {
                        $let: {
                          vars: {
                            matchedProduct: {
                              $arrayElemAt: [
                                {
                                  $filter: {
                                    input: "$products",
                                    as: "product",
                                    cond: { $eq: ["$$product._id", "$$item.product"] },
                                  },
                                },
                                0,
                              ],
                            },
                          },
                          in: {
                            $ifNull: ["$$matchedProduct.name", "Deleted product"],
                          },
                        },
                      },
                    },
                  },
                },
                customer: { $arrayElemAt: ["$customer", 0] },
              },
            },
          ],
          statusDistribution: [
            {
              $project: {
                normalizedStatus: statusNormalizationExpression,
              },
            },
            {
              $group: {
                _id: "$normalizedStatus",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const aggregateResult = analyticsAgg[0] || {};
  const metricsRows = aggregateResult.metrics || [];
  const lifetimeMetrics = aggregateResult.lifetimeMetrics?.[0] || {
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0,
  };
  const todayRevenueRows = aggregateResult.todayRevenue || [];
  const weeklyRows = aggregateResult.weeklySales || [];
  const monthlyRows = aggregateResult.monthlySales || [];

  const metricsByPeriod = metricsRows.reduce(
    (acc, row) => ({
      ...acc,
      [row._id]: row,
    }),
    {
      current: {
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
      },
      previous: {
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
      },
    }
  );

  const todayRevenueByPeriod = todayRevenueRows.reduce(
    (acc, row) => ({
      ...acc,
      [row._id]: row.totalRevenue || 0,
    }),
    {
      today: 0,
      yesterday: 0,
    }
  );

  const weeklyMap = new Map(weeklyRows.map((row) => [row._id, row]));
  // Fill missing periods with zeroes so chart toggles remain stable and
  // responsive layouts do not shift when a day or month has no activity.
  const weeklySeries = Array.from({ length: 7 }).map((_, index) => {
    const date = shiftDays(weekStart, index);
    const key = formatDayKey(date);
    const row = weeklyMap.get(key);

    return {
      key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      revenue: Number(row?.revenue || 0),
      orders: Number(row?.orders || 0),
    };
  });

  const monthlyMap = new Map(monthlyRows.map((row) => [row._id, row]));
  const monthlySeries = Array.from({ length: 6 }).map((_, index) => {
    const date = shiftMonths(monthSeriesStart, index);
    const key = formatMonthKey(date);
    const row = monthlyMap.get(key);

    return {
      key,
      label: date.toLocaleDateString("en-US", { month: "short" }),
      revenue: Number(row?.revenue || 0),
      orders: Number(row?.orders || 0),
    };
  });

  const topProducts = (aggregateResult.topProducts || []).map((entry) => ({
    _id: entry._id,
    name: entry.product?.name || "Deleted product",
    image: Array.isArray(entry.product?.image) ? entry.product.image[0] : "",
    category: entry.product?.category || "",
    quantitySold: Number(entry.quantitySold || 0),
    revenue: Number(entry.revenue || 0),
  }));

  const recentOrders = (aggregateResult.recentOrders || []).map((order) => ({
    _id: order._id,
    totalAmount: Number(order.totalAmount || 0),
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod || "cod",
    paymentStatus: order.paymentStatus || "unpaid",
    orderStatus: order.orderStatus || "pending",
    shippingAddress: order.shippingAddress || null,
    items: Array.isArray(order.items) ? order.items : [],
    customer: {
      name: order.customer?.name || "Unknown customer",
      email: order.customer?.email || "No email",
    },
  }));

  const distributionMap = (aggregateResult.statusDistribution || []).reduce(
    (acc, row) => ({
      ...acc,
      [row._id]: Number(row.count || 0),
    }),
    {
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
    }
  );

  const lowStockAlerts = await Product.find({ countInStock: { $gt: 0, $lte: 5 } })
    .select("_id name image countInStock category updatedAt")
    .sort({ countInStock: 1, updatedAt: -1 })
    .limit(6)
    .lean();

  const currentMetrics = metricsByPeriod.current;
  const previousMetrics = metricsByPeriod.previous;

  res.status(200).json({
    success: true,
    analytics: {
      generatedAt: now,
      metrics: {
        totalRevenue: {
          value: Number(lifetimeMetrics.totalRevenue || 0),
          trend: percentageChange(
            currentMetrics.totalRevenue,
            previousMetrics.totalRevenue
          ),
        },
        totalOrders: {
          value: Number(lifetimeMetrics.totalOrders || 0),
          trend: percentageChange(
            currentMetrics.totalOrders,
            previousMetrics.totalOrders
          ),
        },
        pendingOrders: {
          value: Number(lifetimeMetrics.pendingOrders || 0),
          trend: percentageChange(
            currentMetrics.pendingOrders,
            previousMetrics.pendingOrders
          ),
        },
        deliveredOrders: {
          value: Number(lifetimeMetrics.deliveredOrders || 0),
          trend: percentageChange(
            currentMetrics.deliveredOrders,
            previousMetrics.deliveredOrders
          ),
        },
        totalCustomers: {
          value: Number(totalUsers || 0),
          trend: percentageChange(
            currentPeriodUsers,
            previousPeriodUsers
          ),
        },
        totalProducts: {
          value: Number(totalProducts || 0),
          trend: percentageChange(
            currentPeriodProducts,
            previousPeriodProducts
          ),
        },
        lowStockProducts: {
          value: Number(lowStockProducts || 0),
          trend: {
            value: 0,
            direction: "neutral",
            label: "Live threshold: 5 units or less",
          },
        },
        todaysRevenue: {
          value: Number(todayRevenueByPeriod.today || 0),
          trend: percentageChange(
            todayRevenueByPeriod.today,
            todayRevenueByPeriod.yesterday
          ),
        },
      },
      charts: {
        weekly: weeklySeries,
        monthly: monthlySeries,
      },
      topProducts,
      recentOrders,
      lowStockAlerts: lowStockAlerts.map((product) => ({
        _id: product._id,
        name: product.name,
        category: product.category || "",
        image: Array.isArray(product.image) ? product.image[0] : "",
        countInStock: Number(product.countInStock || 0),
      })),
      orderStatusDistribution: [
        {
          key: "pending",
          label: "Pending",
          count: distributionMap.pending,
        },
        {
          key: "processing",
          label: "Processing",
          count: distributionMap.processing,
        },
        {
          key: "delivered",
          label: "Delivered",
          count: distributionMap.delivered,
        },
        {
          key: "cancelled",
          label: "Cancelled",
          count: distributionMap.cancelled,
        },
      ],
    },
  });
});

export const resetSystemData = asyncHandler(async (req, res) => {
  const { clearUsers = false, secretKey } = req.body;

  const resetAuth = isValidResetSecret(secretKey);
  if (!resetAuth.ok) {
    return res.status(403).json({ success: false, message: resetAuth.message });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Order.deleteMany({}).session(session);
      await Transaction.deleteMany({}).session(session);
      await Notification.deleteMany({}).session(session);
      await Product.updateMany({}, { $set: { "items.returnStatus": "NONE" } }).session(session);

      if (clearUsers) {
        await User.deleteMany({ email: { $ne: process.env.SELLER_EMAIL } }).session(session);
      }
    });
    return res.status(200).json({ success: true, message: "System environment reset." });
  } finally {
    await session.endSession();
  }
});

// Safe targeted cleanup: only orders/transactions/notifications
export const clearOrdersAndNotificationsSafe = asyncHandler(async (req, res) => {
  const { secretKey, dryRun = true } = req.body || {};

  const resetAuth = isValidResetSecret(secretKey);
  if (!resetAuth.ok) {
    return res.status(403).json({ success: false, message: resetAuth.message });
  }

  const [ordersCount, transactionsCount, notificationsCount] = await Promise.all([
    Order.countDocuments({}),
    Transaction.countDocuments({}),
    Notification.countDocuments({}),
  ]);

  if (dryRun) {
    return res.status(200).json({
      success: true,
      dryRun: true,
      message: "Dry run completed. Pass dryRun=false to execute deletion.",
      summary: {
        orders: ordersCount,
        transactions: transactionsCount,
        notifications: notificationsCount,
      },
    });
  }

  const session = await mongoose.startSession();
  try {
    let deleted = {
      orders: 0,
      transactions: 0,
      notifications: 0,
    };

    await session.withTransaction(async () => {
      const [ordersResult, transactionsResult, notificationsResult] = await Promise.all([
        Order.deleteMany({}).session(session),
        Transaction.deleteMany({}).session(session),
        Notification.deleteMany({}).session(session),
      ]);

      deleted = {
        orders: ordersResult.deletedCount || 0,
        transactions: transactionsResult.deletedCount || 0,
        notifications: notificationsResult.deletedCount || 0,
      };
    });

    return res.status(200).json({
      success: true,
      dryRun: false,
      message: "Orders, transactions, and notifications cleared safely.",
      deleted,
    });
  } finally {
    await session.endSession();
  }
});

export const updatePaymentStatusManual = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isPaid, reason } = req.body;
  const sellerEmail = req.seller?.email || req.user?.email || "Seller/Admin";

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const targetIsPaid = Boolean(isPaid);
  const oldStatus = order.paymentStatus;
  if (!Array.isArray(order.adminActions)) order.adminActions = [];
  if (!Array.isArray(order.paymentAuditLog)) order.paymentAuditLog = [];
  if (!Array.isArray(order.transactions)) order.transactions = [];

  order.adminActions.push({
    action: `MANUAL_OVERRIDE: isPaid ${order.isPaid} -> ${targetIsPaid}`,
    adminEmail: sellerEmail,
    reason,
    timestamp: new Date(),
  });
  order.paymentAuditLog.push({
    action: targetIsPaid ? "manual_mark_paid" : "manual_mark_unpaid",
    actor: sellerEmail,
    reason: reason || "Manual override",
    meta: { from: oldStatus, to: targetIsPaid ? "paid" : "unpaid" },
  });

  const transaction = await Transaction.create({
    orderId: order._id,
    transactionType: targetIsPaid ? "PAYMENT" : "REVERSAL",
    amount: Number(order.totalAmount || 0),
    status: "COMPLETED",
    method: "manual",
    reason: `Seller Override: ${reason || "No reason provided"}`,
  });

  order.paymentStatus = targetIsPaid ? "paid" : "unpaid";
  order.isPaid = targetIsPaid;
  if (targetIsPaid) {
    order.paidAt = order.paidAt || new Date();
    if (order.orderStatus === "pending") {
      order.orderStatus = "processing";
    }
  }
  order.transactions.push(transaction._id);

  await order.save();

  await createUserNotification({
    userId: order.userId,
    type: "PAYMENT_UPDATE",
    title: "Payment Status Updated",
    message: `Your order #${String(order._id).slice(-6).toUpperCase()} payment is now ${targetIsPaid ? "PAID" : "UNPAID"}.`,
    meta: { orderId: order._id, paymentStatus: order.paymentStatus },
  });

  return res.status(200).json({ success: true, order });
});

export const initiateManualRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  const sellerEmail = req.seller?.email || req.user?.email || "Seller/Admin";

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentStatus !== "paid") {
    return res.status(400).json({ success: false, message: "Refunds can only be initiated for paid orders." });
  }

  const refundAmount = Number(amount || order.totalAmount - (order.refundedAmount || 0));
  if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
    return res.status(400).json({ success: false, message: "Insufficient balance for refund." });
  }

  const trans = await Transaction.create({
    orderId: order._id,
    transactionType: "REFUND",
    amount: refundAmount,
    status: "PENDING",
    method: order.paymentMethod,
    reason: `Seller Initiated: ${reason || "No reason provided"}`,
  });

  order.adminActions.push({
    action: "REFUND_INITIATED",
    adminEmail: sellerEmail,
    reason,
  });
  order.paymentAuditLog.push({
    action: "refund_initiated",
    actor: sellerEmail,
    reason: reason || "Manual refund initiated",
    meta: { amount: refundAmount, transactionId: trans._id },
  });
  order.transactions.push(trans._id);
  await order.save();

  const refundResult = await processRefund(trans._id);
  if (refundResult.success) {
    return res.status(200).json({ success: true, message: "Refund processed successfully." });
  }

  return res.status(500).json({
    success: false,
    message: "Refund record created but gateway call failed.",
    error: refundResult.error,
  });
});
