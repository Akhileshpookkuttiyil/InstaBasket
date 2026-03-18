import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { cookieOptions } from "../config/env.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";

export const sellerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.SELLER_EMAIL) {
    const isPasswordMatch = password === process.env.SELLER_PASSWORD;

    if (isPasswordMatch) {
      const sellerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("sellerToken", sellerToken, cookieOptions);

      return res.status(200).json({
        success: true,
        message: "Welcome back, Admin",
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized access credentials",
  });
});

export const checkAuthSeller = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
  });
});

export const sellerLogout = asyncHandler(async (req, res) => {
  res.clearCookie("sellerToken", cookieOptions);

  res.status(200).json({
    success: true,
    message: "Session ended successfully",
  });
});

/**
 * Redesigned Seller Summary to match new Logistical/Financial state machine
 */
export const getSellerSummary = asyncHandler(async (req, res) => {
  // Logic: Only count revenue for DELIVERED orders minus REFUNDED amounts
  const revenueMatch = { orderStatus: "DELIVERED" };
  const generalOrderMatch = { orderStatus: { $ne: "CANCELLED" } };

  const lowStockCriteria = { countInStock: { $gt: 0, $lte: 5 } };
  const outOfStockCriteria = {
    $or: [{ countInStock: { $lte: 0 } }, { inStock: false }],
  };

  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalProducts,
    inStockProducts,
    lowStockProducts,
    outOfStockProducts,
    lowStockAlerts,
    outOfStockAlerts,
    totalOrders,
    pendingOrders,
    deliveredOrders,
    revenueAgg,
    monthlyRevenueAgg,
    recentOrders,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({
      $or: [{ isActive: true }, { isActive: { $exists: false } }],
    }),
    User.countDocuments({ isActive: false }),
    Product.countDocuments(),
    Product.countDocuments({ inStock: true, countInStock: { $gt: 0 } }),
    Product.countDocuments(lowStockCriteria),
    Product.countDocuments(outOfStockCriteria),
    Product.find(lowStockCriteria)
      .select("_id name countInStock inStock")
      .sort({ countInStock: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
    Product.find(outOfStockCriteria)
      .select("_id name countInStock inStock")
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean(),
    Order.countDocuments(generalOrderMatch),
    // Pending includes CONFIRMED and SHIPPED (Logistics active)
    Order.countDocuments({ orderStatus: { $in: ["CONFIRMED", "SHIPPED"] } }),
    Order.countDocuments({ orderStatus: "DELIVERED" }),
    
    // Revenue Calculation (Reflecting the new DELIVERED rule)
    Order.aggregate([
      { $match: revenueMatch },
      { $group: { _id: null, grossRevenue: { $sum: "$totalAmount" }, totalRefunds: { $sum: "$refundedAmount" } } },
    ]),
    
    Order.aggregate([
      { $match: revenueMatch },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: { $subtract: ["$totalAmount", "$refundedAmount"] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 },
    ]),
    
    Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const stats = revenueAgg[0] || { grossRevenue: 0, totalRefunds: 0 };

  res.status(200).json({
    success: true,
    summary: {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalProducts,
      inStockProducts,
      lowStockProducts,
      outOfStockProducts,
      lowStockAlerts,
      outOfStockAlerts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: stats.grossRevenue - stats.totalRefunds,
      monthlyRevenue: monthlyRevenueAgg
        .map((item) => ({
          month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
          revenue: item.revenue,
          orders: item.orders,
        }))
        .reverse(),
      recentOrders,
    },
  });
});

export const getSellerUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;

  const query = {};
  if (q && q.trim()) {
    const safe = q.trim();
    query.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const users = await User.find(query)
    .select("name email isActive createdAt profileImage googleImage provider")
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((user) => user._id);
  const orderStats = await Order.aggregate([
    {
      $match: {
        userId: { $in: userIds },
        orderStatus: { $ne: "CANCELLED" }
      },
    },
    {
      $group: {
        _id: "$userId",
        ordersCount: { $sum: 1 },
        totalSpent: { $sum: { $subtract: ["$totalAmount", "$refundedAmount"] } },
      },
    },
  ]);

  const statsByUserId = new Map(
    orderStats.map((stat) => [stat._id.toString(), stat])
  );

  const usersWithStats = users.map((user) => {
    const stats = statsByUserId.get(user._id.toString());
    return {
      ...user,
      isActive: user.isActive !== false,
      ordersCount: stats?.ordersCount || 0,
      totalSpent: stats?.totalSpent || 0,
    };
  });

  res.status(200).json({
    success: true,
    users: usersWithStats,
  });
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user id",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive must be boolean",
    });
  }

  const user = await User.findByIdAndUpdate(
    id,
    { isActive },
    { new: true, select: "name email isActive createdAt" }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    user,
  });
});
