import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";
import {
  Search,
  Calendar,
  CreditCard,
  User,
  ShoppingBag as ShoppingCart,
  Package,
  FileText,
  Truck,
  Clock,
  Ban
} from "lucide-react";

const ORDER_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "cancelled",
];

const ORDER_STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

const formatWholeCurrency = (value, currencySymbol) =>
  `${currencySymbol}${Math.round(Number(value || 0)).toLocaleString()}`;

const getAllowedStatusOptions = (currentStatus) => {
  const normalized = String(currentStatus || "pending").toLowerCase();
  const nextStatuses = ORDER_STATUS_TRANSITIONS[normalized] || [];
  return Array.from(new Set([normalized, ...nextStatuses]));
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
  const hasInvalidDateRange =
    Boolean(filters.dateFrom) &&
    Boolean(filters.dateTo) &&
    new Date(filters.dateFrom) > new Date(filters.dateTo);

  const fetchOrders = useCallback(async () => {
    if (hasInvalidDateRange) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/order/seller", {
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
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters, hasInvalidDateRange]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  const updateStatus = async (orderId, orderStatus) => {
    try {
      setStatusUpdatingId(orderId);
      const { data } = await apiClient.patch(`/api/seller/orders/${orderId}/status`, {
        orderStatus: orderStatus,
      });
      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, orderStatus: data.order.orderStatus } : order
          )
        );
        toast.success(`Status: ${orderStatus}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const updatePaymentStatus = async (orderId, isPaid) => {
    const reason = prompt("Reason for payment override:");
    if (!reason) return;

    try {
      const { data } = await apiClient.patch(`/api/seller/orders/${orderId}/payment`, {
        isPaid: isPaid === "true",
        reason,
      });
      if (data.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId ? { ...order, isPaid: isPaid === "true" } : order
          )
        );
        toast.success(`Payment updated`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Override failed");
    }
  };

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.orders += 1;
        if (["delivered", "completed"].includes(String(order.orderStatus).toLowerCase())) {
          acc.revenue += Number(order.totalAmount || 0);
        }
        return acc;
      },
      { orders: 0, revenue: 0 }
    );
  }, [orders]);

  return (
    <div className="no-scrollbar h-[95vh] overflow-y-scroll p-4 md:p-8 bg-gray-50/30">
      {/* Search & Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(340px,1fr)_auto] items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-2xl">
                <ShoppingCart size={24} className="text-primary" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-gray-900 leading-none">Order Management</h2>
                <p className="text-gray-500 text-xs mt-1 font-medium tracking-wide border-t border-gray-50 pt-1">Unified Logistics & Financial Control</p>
            </div>
          </div>
          <div className="relative w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by customer or ID..."
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-10 pr-3 py-3 text-sm outline-none focus:border-primary/40 focus:bg-white transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
             <div className="px-4 py-2 bg-gray-50 rounded-xl flex flex-col items-end">
                <p className="text-[10px] uppercase font-bold text-gray-400">Total Count</p>
                <p className="text-lg font-black text-gray-800 leading-none">{totals.orders}</p>
             </div>
             <div className="px-4 py-2 bg-emerald-50 rounded-xl flex flex-col items-end border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-500">Net Revenue</p>
                <p className="text-lg font-black text-emerald-700 leading-none">{formatWholeCurrency(totals.revenue, currency)}</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 items-center">
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-primary/40 focus:bg-white appearance-none"
          >
            <option value="">All Logistics</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-primary/40 focus:bg-white appearance-none"
          >
            <option value="">All Payments</option>
            <option value="cod">COD</option>
            <option value="stripe">Stripe</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
              Start
            </span>
            <div className="relative w-full">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                aria-label="Start date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-10 pr-3 py-3 text-sm font-black text-gray-600 outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="shrink-0 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-600">
              End
            </span>
            <div className="relative w-full">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                aria-label="End date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-10 pr-3 py-3 text-sm font-black text-gray-600 outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setFilters({
                q: "",
                status: "",
                paymentMethod: "",
                dateFrom: "",
                dateTo: "",
              })
            }
            className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
        {hasInvalidDateRange && (
          <p className="mt-3 text-xs font-semibold text-rose-600">
            End date must be after start date.
          </p>
        )}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full" /></div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-gray-200">
            <ShoppingCart className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-400 font-bold">No active orders found.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div key={order._id} className="bg-white rounded-3xl border border-gray-100 p-6 transition-all hover:shadow-md hover:border-primary/10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* ID & Time */}
                <div className="space-y-1 border-r border-gray-50 pr-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1"><FileText size={12}/> Reference</p>
                  <p className="text-lg font-black text-gray-900 group-hover:text-primary transition-colors">#{String(order._id).slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1"><Clock size={12} /> {new Date(order.createdAt).toLocaleString()}</p>
                </div>

                {/* Customer */}
                <div className="space-y-1 border-r border-gray-50 pr-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1"><User size={12}/> Merchant/User</p>
                  <p className="text-base font-bold text-gray-800 leading-tight">{order.userId?.name || "Anonymous"}</p>
                  <p className="text-xs text-gray-400 truncate font-medium">{order.userId?.email || "No Email"}</p>
                </div>

                {/* Financials */}
                <div className="space-y-1 border-r border-gray-50 pr-4">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1"><CreditCard size={12}/> Financial State</p>
                  <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-medium">{String(order.paymentMethod || "").toUpperCase()}</span>
                          {(() => {
                            const paymentState = String(order.paymentStatus || (order.isPaid ? "paid" : "unpaid")).toLowerCase();
                            return (
                          <select 
                            value={paymentState === "refunded" ? "refunded" : paymentState === "paid" ? "paid" : "unpaid"}
                            onChange={(e) => updatePaymentStatus(order._id, String(e.target.value) === "paid" ? "true" : "false")}
                            disabled={paymentState === "refunded"}
                            className={`text-[11px] font-black border-none px-2 py-0.5 rounded cursor-pointer leading-none ${paymentState === "paid" ? 'text-emerald-600 bg-emerald-50' : paymentState === "refunded" ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50 uppercase shadow-sm'}`}
                          >
                             <option value="paid" className="bg-white text-emerald-600">PAID</option>
                             <option value="unpaid" className="bg-white text-amber-600">UNPAID</option>
                             {paymentState === "refunded" && <option value="refunded" className="bg-white text-blue-600">REFUNDED</option>}
                          </select>
                            );
                          })()}
                      </div>
                      <p className="text-xl font-black text-gray-900">{formatWholeCurrency(order.totalAmount, currency)}</p>
                  </div>
                </div>

                {/* Status selector */}
                <div className="space-y-1 min-w-[200px]">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1"><Truck size={12}/> Logistics Update</p>
                  <select
                    value={String(order.orderStatus || "pending").toLowerCase()}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    disabled={statusUpdatingId === order._id || ["cancelled", "delivered", "completed"].includes(String(order.orderStatus || "").toLowerCase())}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm font-bold text-gray-700 outline-none focus:bg-white disabled:opacity-50 transition-all cursor-pointer hover:border-primary/20 capitalize"
                  >
                    {getAllowedStatusOptions(order.orderStatus).map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  {statusUpdatingId === order._id && <p className="text-[10px] text-primary animate-pulse font-bold tracking-widest pl-1">UPDATING...</p>}
                </div>
              </div>

              {/* Items Summary Strip */}
              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-wrap gap-2 items-center">
                 <p className="text-[10px] uppercase font-bold text-gray-300 mr-2 flex items-center gap-1"><Package size={12} /> Summary:</p>
                 {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-700">{item.product?.name || "Deleted Product"}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-lg">x{item.quantity}</span>
                        {item.returnStatus !== 'NONE' && <Ban size={12} className="text-rose-400 ml-1" title={item.returnStatus} />}
                    </div>
                 ))}
                 {order.refundedAmount > 0 && (
                    <div className="ml-auto text-xs font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                        Refunded: {formatWholeCurrency(order.refundedAmount, currency)}
                    </div>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
