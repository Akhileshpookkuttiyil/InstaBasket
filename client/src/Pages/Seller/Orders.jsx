import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";
import {
  Search,
  Calendar,
  Filter,
  CreditCard,
  User,
  ShoppingBag as ShoppingCart,
  Package,
  DollarSign,
  FileText,
  Truck,
  RefreshCw,
  Trash2,
  Lock,
} from "lucide-react";

// Updated Logistical Statuses to match Backend Redesign
const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
];

const ORDER_STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "CONFIRMED"],
  CANCELLED: [],
  RETURNED: [],
};

const formatAddress = (shippingAddress) => {
  if (!shippingAddress) return "N/A";
  if (typeof shippingAddress === "string") return shippingAddress;

  return [
    shippingAddress.street,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.zipcode || shippingAddress.postalCode,
    shippingAddress.country,
  ]
    .filter(Boolean)
    .join(", ");
};

const getAllowedStatusOptions = (currentStatus) => {
  const nextStatuses = ORDER_STATUS_TRANSITIONS[currentStatus] || [];
  return Array.from(new Set([currentStatus, ...nextStatuses]));
};

const Orders = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    paymentMethod: "",
    dateFrom: "",
    dateTo: "",
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/seller/orders", {
        params: {
          ...filters,
          q: filters.q || undefined,
          status: filters.status || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      });

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data.message || "Failed to fetch orders");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const updateStatus = async (orderId, orderStatus) => {
    try {
      setStatusUpdatingId(orderId);
      const { data } = await apiClient.patch(`/api/seller/orders/${orderId}/status`, {
        status: orderStatus,
      });
      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, orderStatus: data.order.orderStatus } : order
          )
        );
        toast.success(`Order status moved to ${orderStatus}`);
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Update failed");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const updatePaymentStatus = async (orderId, status) => {
    const reason = prompt("Enter reason for manual payment override:");
    if (!reason) return;

    try {
      const { data } = await apiClient.patch(`/api/seller/orders/${orderId}/payment`, {
        status,
        reason,
      });
      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, paymentStatus: status } : order
          )
        );
        toast.success(`Payment status manually updated to ${status}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Override failed");
    }
  };

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.orders += 1;
        // Naive sum for current view
        acc.revenue += Number(order.totalAmount || 0);
        return acc;
      },
      { orders: 0, revenue: 0 }
    );
  }, [orders]);

  return (
    <div className="no-scrollbar h-[95vh] overflow-y-scroll p-4 md:p-8">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingCart size={24} className="text-primary" />
          <h2 className="text-xl font-semibold text-gray-800">Orders Management</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Redesigned Logistical (Order) & Financial (Payment) State Management.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search order/user"
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary text-gray-600"
            />
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary text-gray-600"
            />
          </div>
          <div className="relative">
            <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={filters.paymentMethod}
              onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary appearance-none text-gray-700"
            >
              <option value="">All Payments</option>
              <option value="COD">COD</option>
              <option value="Online">Online</option>
            </select>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/3 -translate-y-1/2 text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary appearance-none text-gray-700"
            >
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500">Filtered Orders</p>
              <p className="font-semibold text-gray-800">{totals.orders}</p>
            </div>
            <Package size={24} className="text-gray-400/50" />
          </div>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm flex items-center justify-between border border-emerald-100">
            <div>
              <p className="text-emerald-600 font-medium">Filtered Gross</p>
              <p className="font-bold text-emerald-800">
                {currency}
                {totals.revenue.toLocaleString()}
              </p>
            </div>
            <DollarSign size={24} className="text-emerald-500/50" />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
            No orders found.
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 flex items-center gap-1 mb-1"><FileText size={14}/> Order</p>
                  <p className="font-semibold text-gray-800">
                    #{String(order._id).slice(-8).toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-500 flex items-center gap-1 mb-1"><User size={14}/> Customer</p>
                  <p className="font-medium text-gray-800">
                    {order.userId?.name || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500">{order.userId?.email || "N/A"}</p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-500 flex items-center gap-1 mb-1"><CreditCard size={14}/> Financials</p>
                  <p className="text-sm text-gray-700">
                    Method: <span className="font-medium">{order.paymentMethod}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <select
                      value={order.paymentStatus}
                      onChange={(e) => updatePaymentStatus(order._id, e.target.value)}
                      className={`text-xs font-bold border-none bg-transparent outline-none cursor-pointer ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-amber-600'}`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PAID">PAID</option>
                      <option value="UNPAID">UNPAID</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </div>
                  <p className="text-sm font-bold text-gray-900">
                    {currency}
                    {Number(order.totalAmount || 0).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase text-gray-500 flex items-center gap-1 mb-1"><Truck size={14}/> Logistics</p>
                  <select
                    value={order.orderStatus}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    disabled={statusUpdatingId === order._id || ["CANCELLED", "RETURNED"].includes(order.orderStatus)}
                    className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-primary disabled:opacity-60 bg-gray-50"
                  >
                    {getAllowedStatusOptions(order.orderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3">
                <div className="flex justify-between items-center mb-2">
                   <p className="text-xs uppercase text-gray-500 flex items-center gap-1"><Package size={14}/> Items</p>
                   {order.refundedAmount > 0 && (
                     <p className="text-xs font-medium text-red-600 italic">Refunded: {currency}{order.refundedAmount.toLocaleString()}</p>
                   )}
                </div>
                <div className="space-y-1">
                  {(order.items || []).map((item) => (
                    <div key={item._id} className="flex justify-between text-sm text-gray-700">
                       <span>{item.product?.name || "Unknown Product"} x {item.quantity}</span>
                       <span className={`text-xs px-2 py-0.5 rounded-full ${item.returnStatus === 'RETURNED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                         {item.returnStatus}
                       </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
