import mongoose from "mongoose";
import Order from "../models/Order.js";
import Transaction from "../models/Transaction.js";

/**
 * Net Revenue Calculation:
 * Revenue = Sum of all DELIVERED/COMPLETED order amounts - Sum of all successful REFUND amounts.
 * 
 * Order flow:
 * pending -> processing -> delivered -> completed (Revenue counted at completed)
 * refunded values are deducted from completed revenue.
 */
export const calculateNetRevenue = async (timeRange = null) => {
  const query = { orderStatus: { $in: ["delivered", "completed", "DELIVERED", "COMPLETED"] } };
  const refundQuery = { transactionType: "REFUND", status: "COMPLETED" };

  if (timeRange) {
    const { from, to } = timeRange;
    query.createdAt = { $gte: new Date(from), $lte: new Date(to) };
    refundQuery.createdAt = { $gte: new Date(from), $lte: new Date(to) };
  }

  // 1. Get delivered/completed orders gross total
  const grossResult = await Order.aggregate([
    { $match: query },
    { $group: { _id: null, totalSales: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
  ]);

  const grossSales = grossResult.length > 0 ? grossResult[0].totalSales : 0;
  const deliveredCount = grossResult.length > 0 ? grossResult[0].count : 0;

  // 2. Get Total Refunded Amounts
  const refundResult = await Transaction.aggregate([
    { $match: refundQuery },
    { $group: { _id: null, totalRefunded: { $sum: "$amount" } } }
  ]);

  const totalRefunded = refundResult.length > 0 ? refundResult[0].totalRefunded : 0;

  return {
    grossSales,
    totalRefunded,
    netRevenue: grossSales - totalRefunded,
    orderCount: deliveredCount
  };
};

/**
 * Detailed Aggregation for Analytics Dashboard
 */
export const getRevenueReport = async (startDate, endDate) => {
  const result = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
        orderStatus: { $in: ["delivered", "completed", "DELIVERED", "COMPLETED"] }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        dailyGross: { $sum: "$totalAmount" },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return result;
};
