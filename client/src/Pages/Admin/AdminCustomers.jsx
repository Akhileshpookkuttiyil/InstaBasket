import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search, UserCheck, UserX, X } from "lucide-react";
import Avatar from "../../Components/Avatar";
import apiClient from "../../shared/lib/apiClient";
import { EmptyState, Panel, SkeletonRows, StatCard } from "./components/AdminSurface";

const AdminCustomers = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingCustomerId, setUpdatingCustomerId] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/admin/users", {
        params: { q: search || undefined },
      });
      if (data?.success) {
        setCustomers(data.users || []);
      } else {
        toast.error(data?.message || "Failed to load customers");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const toggleCustomerStatus = async (customer) => {
    try {
      setUpdatingCustomerId(customer._id);
      const { data } = await apiClient.patch(
        `/api/admin/users/${customer._id}/status`,
        {
          isActive: !customer.isActive,
        }
      );

      if (data?.success) {
        setCustomers((prev) =>
          prev.map((item) =>
            item._id === customer._id
              ? { ...item, isActive: !item.isActive }
              : item
          )
        );
        toast.success(data.message || "Customer status updated");
      } else {
        toast.error(data?.message || "Failed to update customer");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update customer"
      );
    } finally {
      setUpdatingCustomerId("");
    }
  };

  const totals = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        acc.total += 1;
        if (customer.isActive) {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }
        return acc;
      },
      { total: 0, active: 0, inactive: 0 }
    );
  }, [customers]);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Panel
        title="Customer management"
        description="Review customer accounts, total spend, order history counts, and account status."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Customers" value={loading ? "..." : totals.total} />
            <StatCard label="Active" value={loading ? "..." : totals.active} />
            <StatCard label="Inactive" value={loading ? "..." : totals.inactive} />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by customer name or email"
                className="h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white pl-9 pr-10 text-sm outline-none transition-colors focus:border-primary"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                  aria-label="Clear customer search"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Search updates automatically with partial, case-insensitive matching.
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Customer directory"
        description="This view reuses the live customer and order data already flowing through the platform."
      >
        {loading ? (
          <SkeletonRows rows={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try a different search term or wait for customer accounts to be created."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:hidden">
              {customers.map((customer) => (
                <div
                  key={`customer-card-${customer._id}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full">
                      <Avatar user={customer} size="h-10 w-10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {customer.name}
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        {customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orders</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{customer.ordersCount || 0}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {currency}{Math.round(Number(customer.totalSpent || 0)).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          customer.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCustomerStatus(customer)}
                    disabled={updatingCustomerId === customer._id}
                    className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white transition ${
                      customer.isActive
                        ? "bg-rose-600 hover:bg-rose-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {customer.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                    {updatingCustomerId === customer._id
                      ? "Updating..."
                      : customer.isActive
                        ? "Block"
                        : "Unblock"}
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 lg:block">
              <div className="grid-cols-[minmax(0,1.5fr)_110px_130px_120px_120px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid">
                <span>Customer</span>
                <span>Orders</span>
                <span>Revenue</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <div
                    key={customer._id}
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1.5fr)_110px_130px_120px_120px] lg:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full">
                        <Avatar user={customer} size="h-10 w-10" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-800">
                          {customer.name}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {customer.email}
                        </p>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700">
                      {customer.ordersCount || 0}
                    </div>

                    <div className="text-sm font-medium text-gray-700">
                      {currency}
                      {Math.round(Number(customer.totalSpent || 0)).toLocaleString()}
                    </div>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          customer.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {customer.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => toggleCustomerStatus(customer)}
                        disabled={updatingCustomerId === customer._id}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white transition ${
                          customer.isActive
                            ? "bg-rose-600 hover:bg-rose-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {customer.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        {updatingCustomerId === customer._id
                          ? "Updating..."
                          : customer.isActive
                            ? "Block"
                            : "Unblock"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default AdminCustomers;
