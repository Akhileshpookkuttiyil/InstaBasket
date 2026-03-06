import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";

const formatCurrency = (value, currencySymbol) => {
  const safeValue = Number(value || 0);
  return `${currencySymbol}${safeValue.toLocaleString()}`;
};

const StatCard = ({ title, value, subtitle, linkTo }) => {
  const CardContent = (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-primary/40 transition-colors cursor-pointer">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
      {subtitle ? (
        <p className="mt-1 text-sm text-gray-500 font-medium">{subtitle}</p>
      ) : null}
    </div>
  );

  return linkTo ? <Link to={linkTo}>{CardContent}</Link> : CardContent;
};

const Dashboard = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/seller/summary");
      if (data.success) {
        setSummary(data.summary);
      } else {
        toast.error(data.message || "Failed to load dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const revenueTrend = useMemo(() => {
    return summary?.monthlyRevenue || [];
  }, [summary]);

  if (loading) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-gray-500">Dashboard data unavailable.</p>
      </div>
    );
  }

  return (
    <div className="no-scrollbar h-[95vh] overflow-y-scroll p-4 md:p-8">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-gradient-to-r from-white via-white to-primary/10 p-5">
        <h2 className="text-2xl font-semibold text-gray-800">Seller Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">
          Real-time view of revenue, users, orders, and stock health.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue, currency)}
          subtitle={`${summary.deliveredOrders} delivered orders`}
          linkTo="/seller/orders"
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders}
          subtitle={`${summary.pendingOrders} active`}
          linkTo="/seller/orders"
        />
        <StatCard
          title="Users"
          value={summary.totalUsers}
          subtitle={`${summary.activeUsers} active / ${summary.inactiveUsers} inactive`}
          linkTo="/seller/users"
        />
        <StatCard
          title="Products"
          value={summary.totalProducts}
          subtitle={`${summary.lowStockProducts} low stock`}
          linkTo="/seller/product-list"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-800">Revenue by Month</h3>
          {revenueTrend.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No revenue data yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {revenueTrend.map((item) => (
                <div
                  key={item.month}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-gray-700">{item.month}</p>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">
                      {formatCurrency(item.revenue, currency)}
                    </p>
                    <p className="text-xs text-gray-500">{item.orders} orders</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800">Inventory Health</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-600">In Stock</span>
              <span className="font-semibold text-gray-800">
                {summary.inStockProducts}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-600">Low Stock</span>
              <span className="font-semibold text-amber-600">
                {summary.lowStockProducts}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
              <span className="text-gray-600">Delivered Orders</span>
              <span className="font-semibold text-emerald-600">
                {summary.deliveredOrders}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800">Recent Orders</h3>
          <Link
            to="/seller/orders"
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All Orders →
          </Link>
        </div>
        <div className="mt-4 space-y-2">
          {(summary.recentOrders || []).length === 0 ? (
            <p className="text-sm text-gray-500">No recent orders found.</p>
          ) : (
            summary.recentOrders.map((order) => (
              <div
                key={order._id}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    #{String(order._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.userId?.name || "Unknown user"} | {order.userId?.email || "N/A"}
                  </p>
                </div>
                <div className="text-xs text-gray-600">
                  <p>{order.paymentMethod}</p>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatCurrency(order.totalAmount, currency)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
