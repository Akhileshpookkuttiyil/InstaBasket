import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Calendar,
  CreditCard,
  FileText,
  Package,
  RotateCcw,
  Search,
  ShoppingBag as ShoppingCart,
  Truck,
  User,
  X,
} from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import { EmptyState, Panel, StatCard } from "./components/AdminSurface";

const ORDER_STATUSES = ["pending", "processing", "delivered", "cancelled"];

const ORDER_STATUS_TRANSITIONS = {
  pending: ["processing", "cancelled"],
  processing: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

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

const formatCurrency = (value, currencySymbol) =>
  `${currencySymbol}${Math.round(Number(value || 0)).toLocaleString()}`;

const getPaymentState = (order) =>
  String(order.paymentStatus || (order.isPaid ? "paid" : "unpaid")).toLowerCase();

const getAllowedStatusOptions = (currentStatus) => {
  const normalized = String(currentStatus || "pending").toLowerCase();
  const nextStatuses = ORDER_STATUS_TRANSITIONS[normalized] || [];
  return Array.from(new Set([normalized, ...nextStatuses]));
};

const AdminOrders = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [paymentUpdatingId, setPaymentUpdatingId] = useState("");
  const [refundingId, setRefundingId] = useState("");
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
      const { data } = await apiClient.get("/api/admin/orders", {
        params: {
          q: filters.q || undefined,
          status: filters.status || undefined,
          paymentMethod: filters.paymentMethod || undefined,
          dateFrom: filters.dateFrom || undefined,
          dateTo: filters.dateTo || undefined,
        },
      });

      if (data?.success) {
        setOrders(data.orders || []);
      } else {
        toast.error(data?.message || "Failed to fetch orders");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to fetch orders");
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
      const { data } = await apiClient.patch(
        `/api/admin/orders/${orderId}/status`,
        { orderStatus }
      );
      if (data?.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? { ...order, orderStatus: data.order.orderStatus }
              : order
          )
        );
        toast.success(`Order marked ${orderStatus}`);
      } else {
        toast.error(data?.message || "Failed to update order");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update order");
    } finally {
      setStatusUpdatingId("");
    }
  };

  const updatePaymentStatus = async (orderId, isPaid) => {
    const reason = window.prompt("Reason for payment override:");
    if (!reason) return;

    try {
      setPaymentUpdatingId(orderId);
      const { data } = await apiClient.patch(
        `/api/admin/orders/${orderId}/payment`,
        {
          isPaid,
          reason,
        }
      );
      if (data?.success) {
        setOrders((prev) =>
          prev.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  isPaid,
                  paymentStatus: isPaid ? "paid" : "unpaid",
                }
              : order
          )
        );
        toast.success("Payment status updated");
      } else {
        toast.error(data?.message || "Failed to update payment");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update payment"
      );
    } finally {
      setPaymentUpdatingId("");
    }
  };

  const triggerRefund = async (order) => {
    const amountInput = window.prompt(
      "Refund amount. Leave blank to refund the remaining balance."
    );
    if (amountInput === null) return;

    const reason = window.prompt("Reason for refund:");
    if (!reason) return;

    const payload = { reason };
    if (String(amountInput || "").trim()) {
      payload.amount = Number(amountInput);
    }

    try {
      setRefundingId(order._id);
      const { data } = await apiClient.post(
        `/api/admin/orders/${order._id}/refund`,
        payload
      );
      if (data?.success) {
        toast.success(data.message || "Refund initiated");
        fetchOrders();
      } else {
        toast.error(data?.message || "Failed to start refund");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to start refund");
    } finally {
      setRefundingId("");
    }
  };

  const totals = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        acc.orders += 1;
        const normalizedStatus = String(order.orderStatus || "").toLowerCase();
        const paymentState = getPaymentState(order);
        if (["delivered", "completed"].includes(normalizedStatus)) {
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
    <div className="min-w-0 max-w-full space-y-6">
      <Panel
        title="Order management"
        description="Track fulfillment, override payment state when required, and initiate refunds from the admin console."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Orders" value={loading ? "..." : totals.orders} />
            <StatCard label="Active" value={loading ? "..." : totals.active} />
            <StatCard label="Unpaid" value={loading ? "..." : totals.unpaid} />
            <StatCard
              label="Revenue"
              value={loading ? "..." : formatCurrency(totals.revenue, currency)}
            />
          </div>

          {/* Filters collapse from multi-column desktop controls into stable
              stacked groups so long search and date inputs cannot push width. */}
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto]">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Filter by customer or ID"
                value={filters.q}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, q: event.target.value }))
                }
                className="h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, status: event.target.value }))
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {labelize(status)}
                </option>
              ))}
            </select>
            <select
              value={filters.paymentMethod}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  paymentMethod: event.target.value,
                }))
              }
              className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors focus:border-primary"
            >
              <option value="">All payments</option>
              <option value="cod">COD</option>
              <option value="stripe">Stripe</option>
            </select>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateTo: event.target.value,
                  }))
                }
                className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-primary"
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
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 2xl:w-auto"
            >
              <X size={15} />
              Clear
            </button>
          </div>
        </div>

        {hasInvalidDateRange ? (
          <p className="mt-3 text-sm font-medium text-rose-600">
            End date must be after start date.
          </p>
        ) : null}
      </Panel>

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-500">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders match the selected filters"
          description="Clear or adjust the filters to inspect a broader set of orders."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const normalizedStatus = String(order.orderStatus || "pending").toLowerCase();
            const paymentState = getPaymentState(order);
            const isStatusLocked = ["cancelled", "delivered", "completed"].includes(
              normalizedStatus
            );
            const paymentSelectValue =
              paymentState === "refunded"
                ? "refunded"
                : paymentState === "paid"
                  ? "paid"
                  : "unpaid";

            return (
              <Panel key={order._id} className="overflow-hidden">
                <div className="grid min-w-0 grid-cols-1 gap-4 2xl:grid-cols-[1.05fr_1.2fr_.85fr_.9fr] 2xl:items-center">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <FileText size={13} />
                      Order reference
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">
                      #{String(order._id).slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
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
                      {order.userId?.email || "No email"}
                    </p>
                  </div>

                  <div className="min-w-0">
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
                        onChange={(event) =>
                          updatePaymentStatus(order._id, event.target.value === "paid")
                        }
                        disabled={
                          paymentUpdatingId === order._id || paymentState === "refunded"
                        }
                        className={`min-w-0 max-w-full rounded-md border px-2 py-1 text-xs font-semibold outline-none ${
                          paymentStyles[paymentSelectValue] || paymentStyles.unpaid
                        } disabled:cursor-not-allowed disabled:opacity-70`}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        {paymentState === "refunded" ? (
                          <option value="refunded">Refunded</option>
                        ) : null}
                      </select>
                    </div>
                    <p className="mt-2 text-lg font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount, currency)}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                      <Truck size={13} />
                      Fulfillment
                    </p>
                    <select
                      value={normalizedStatus}
                      onChange={(event) =>
                        updateStatus(order._id, event.target.value)
                      }
                      disabled={statusUpdatingId === order._id || isStatusLocked}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm font-semibold outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-70 ${
                        statusStyles[normalizedStatus] ||
                        "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {getAllowedStatusOptions(order.orderStatus).map((status) => (
                        <option key={status} value={status}>
                          {labelize(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="mr-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                        <Package size={13} />
                        Items
                      </p>
                      {(order.items || []).map((item, index) => (
                        <div
                          key={`${order._id}-item-${index}`}
                          className="flex max-w-full items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5"
                        >
                          <span className="truncate text-xs font-medium text-gray-700">
                            {item.product?.name || "Deleted product"}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-gray-600">
                            x{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      {Number(order.refundedAmount || 0) > 0 ? (
                        <div className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                          <RotateCcw size={13} />
                          Refunded {formatCurrency(order.refundedAmount, currency)}
                        </div>
                      ) : null}

                      {paymentState === "paid" ? (
                        <button
                          type="button"
                          onClick={() => triggerRefund(order)}
                          disabled={refundingId === order._id}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <RotateCcw size={13} />
                          {refundingId === order._id ? "Refunding..." : "Refund"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
