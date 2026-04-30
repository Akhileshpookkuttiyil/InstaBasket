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
  Ban,
  RotateCcw,
  X,
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

const statusStyles = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  processing: "border-blue-200 bg-blue-50 text-blue-700",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const paymentStyles = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unpaid: "border-amber-200 bg-amber-50 text-amber-700",
  refunded: "border-sky-200 bg-sky-50 text-sky-700",
};

const labelize = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const getPaymentState = (order) =>
  String(order.paymentStatus || (order.isPaid ? "paid" : "unpaid")).toLowerCase();

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
        const normalizedStatus = String(order.orderStatus || "").toLowerCase();
        const paymentState = getPaymentState(order);
        if (["delivered", "completed"].includes(String(order.orderStatus).toLowerCase())) {
          acc.revenue += Number(order.totalAmount || 0);
        }
        if (["pending", "processing"].includes(normalizedStatus)) {
          acc.active += 1;
        }
        if (paymentState === "unpaid") {
          acc.unpaid += 1;
        }
        return acc;
      },
      { orders: 0, revenue: 0, active: 0, unpaid: 0 }
    );
  }, [orders]);

  return (
    <div className="no-scrollbar h-[95vh] overflow-y-scroll p-4 md:p-8">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <ShoppingCart size={22} className="text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Orders</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Track fulfillment, payment state, returns, and order value.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[520px]">
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Orders</p>
              <p className="mt-1 text-xl font-semibold text-gray-800">{totals.orders}</p>
            </div>
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Active</p>
              <p className="mt-1 text-xl font-semibold text-blue-700">{totals.active}</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-600">Unpaid</p>
              <p className="mt-1 text-xl font-semibold text-amber-700">{totals.unpaid}</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Revenue</p>
              <p className="mt-1 text-xl font-semibold text-emerald-700">
                {formatWholeCurrency(totals.revenue, currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1.25fr)_repeat(4,minmax(140px,1fr))_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by customer or ID..."
              value={filters.q}
              onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
          >
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{labelize(s)}</option>)}
          </select>
          <select
            value={filters.paymentMethod}
            onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
          >
            <option value="">All payments</option>
            <option value="cod">COD</option>
            <option value="stripe">Stripe</option>
          </select>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              aria-label="Start date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              aria-label="End date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
            />
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <X size={15} />
            Clear
          </button>
        </div>
        {hasInvalidDateRange && (
          <p className="mt-3 text-sm font-medium text-rose-600">
            End date must be after start date.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white p-16 text-center">
            <ShoppingCart className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="font-medium text-gray-500">No orders match the selected filters.</p>
          </div>
        ) : (
          orders.map((order) => {
            const normalizedStatus = String(order.orderStatus || "pending").toLowerCase();
            const paymentState = getPaymentState(order);
            const isStatusLocked = ["cancelled", "delivered", "completed"].includes(normalizedStatus);
            const paymentSelectValue =
              paymentState === "refunded" ? "refunded" : paymentState === "paid" ? "paid" : "unpaid";

            return (
              <div key={order._id} className="rounded-xl border border-gray-200 bg-white shadow-sm transition-colors hover:border-primary/40">
                <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1.05fr_1.2fr_.85fr_.9fr] lg:items-center">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <FileText size={13} />
                      Order reference
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      #{String(order._id).slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={13} />
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <User size={13} />
                      Customer
                    </p>
                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {order.userId?.name || "Anonymous"}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {order.userId?.email || "No Email"}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <CreditCard size={13} />
                      Payment
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium uppercase text-gray-600">
                        {order.paymentMethod || "N/A"}
                      </span>
                      <select
                        value={paymentSelectValue}
                        onChange={(e) => updatePaymentStatus(order._id, String(e.target.value) === "paid" ? "true" : "false")}
                        disabled={paymentState === "refunded"}
                        className={`rounded-md border px-2 py-1 text-xs font-semibold outline-none ${paymentStyles[paymentSelectValue] || paymentStyles.unpaid} disabled:cursor-not-allowed`}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        {paymentState === "refunded" && <option value="refunded">Refunded</option>}
                      </select>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatWholeCurrency(order.totalAmount, currency)}
                    </p>
                  </div>

                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <Truck size={13} />
                      Fulfillment
                    </p>
                    <select
                      value={normalizedStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      disabled={statusUpdatingId === order._id || isStatusLocked}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-70 ${statusStyles[normalizedStatus] || "border-gray-200 bg-gray-50 text-gray-700"}`}
                    >
                      {getAllowedStatusOptions(order.orderStatus).map((status) => (
                        <option key={status} value={status}>
                          {labelize(status)}
                        </option>
                      ))}
                    </select>
                    {statusUpdatingId === order._id && (
                      <p className="mt-1 text-xs font-medium text-primary">Updating status...</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-gray-50/60 px-4 py-3">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="mr-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <Package size={13} />
                        Items
                      </p>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} className="flex max-w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5">
                          <span className="truncate text-xs font-medium text-gray-700">{item.product?.name || "Deleted Product"}</span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">x{item.quantity}</span>
                          {item.returnStatus !== "NONE" && <Ban size={12} className="ml-1 text-rose-500" title={item.returnStatus} />}
                        </div>
                      ))}
                    </div>
                    {order.refundedAmount > 0 && (
                      <div className="flex shrink-0 items-center gap-1.5 rounded-md border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600">
                        <RotateCcw size={13} />
                        Refunded {formatWholeCurrency(order.refundedAmount, currency)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Orders;
