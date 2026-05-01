import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import useAuthStore from "../../store/useAuthStore";
import { getImageFallback, getImageUrl } from "../../shared/lib/image";
import {
  EmptyState,
  ErrorState,
  Panel,
  SkeletonRows,
} from "./components/AdminSurface";
import {
  AnalyticsTrendChart,
  LegendPill,
  MetricCard,
  OrderStatusDonutChart,
  QuickViewRow,
  SegmentedToggle,
  StatusBadge,
} from "./components/AdminDashboardWidgets";

const formatCurrency = (value, symbol) =>
  `${symbol}${Math.round(Number(value || 0)).toLocaleString()}`;

const toneByOrderStatus = {
  pending: "warning",
  processing: "info",
  delivered: "success",
  cancelled: "danger",
};

const toneByPaymentStatus = {
  paid: "success",
  unpaid: "warning",
  refunded: "info",
};

const labelize = (value) =>
  String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const QuickViewModal = ({ order, currencySymbol, onClose }) => {
  if (!order) return null;

  const address = order.shippingAddress || {};
  const addressText = [
    address.street,
    address.city,
    address.state,
    address.zipcode || address.postalCode,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-gray-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Recent order quick view
            </p>
            <h3 className="mt-2 text-xl font-semibold text-gray-900">
              #{String(order._id).slice(-8).toUpperCase()}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {order.customer?.name || "Unknown customer"} -{" "}
              {order.customer?.email || "No email"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <QuickViewRow
              label="Amount"
              value={formatCurrency(order.totalAmount, currencySymbol)}
            />
            <QuickViewRow label="Payment" value={labelize(order.paymentMethod)} />
            <QuickViewRow
              label="Payment status"
              value={labelize(order.paymentStatus)}
            />
            <QuickViewRow label="Order status" value={labelize(order.orderStatus)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="rounded-2xl border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <h4 className="text-sm font-semibold text-gray-800">Items</h4>
              </div>
              <div className="divide-y divide-gray-100">
                {(order.items || []).map((item, index) => (
                  <div
                    key={`${order._id}-quick-item-${index}`}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800">
                        {item.productName || "Deleted product"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty {item.quantity} - {formatCurrency(item.priceAtPurchase, currencySymbol)} each
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(
                          Number(item.quantity || 0) * Number(item.priceAtPurchase || 0),
                          currencySymbol
                        )}
                      </p>
                      {item.returnStatus && item.returnStatus !== "NONE" ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          {labelize(item.returnStatus)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <QuickViewRow
                label="Placed at"
                value={new Date(order.createdAt).toLocaleString()}
              />
              <QuickViewRow label="Shipping address" value={addressText} />
              <QuickViewRow
                label="Customer reference"
                value={order.customer?.email || "No email"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminOverview = () => {
  const { user } = useAuthStore();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartRange, setChartRange] = useState("weekly");
  const [activeOrder, setActiveOrder] = useState(null);

  useEffect(() => {
    const fetchDashboardAnalytics = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await apiClient.get("/api/admin/dashboard-analytics");
        if (data?.success) {
          setAnalytics(data.analytics || null);
        } else {
          setError(data?.message || "Failed to load dashboard analytics");
        }
      } catch (requestError) {
        setError(
          requestError?.response?.data?.message ||
            "Failed to load dashboard analytics"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAnalytics();
  }, []);

  const metricCards = useMemo(() => {
    const metrics = analytics?.metrics;
    if (!metrics) return [];

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(metrics.totalRevenue.value, currency),
        trend: metrics.totalRevenue.trend,
        subtext: "Lifetime fulfilled revenue. Trend compares the current 30-day window.",
      },
      {
        label: "Total Orders",
        value: metrics.totalOrders.value,
        trend: metrics.totalOrders.trend,
        subtext: "All orders in the system. Trend compares the current 30-day window.",
      },
      {
        label: "Pending Orders",
        value: metrics.pendingOrders.value,
        trend: metrics.pendingOrders.trend,
        subtext: "Orders still waiting on fulfillment movement",
      },
      {
        label: "Delivered Orders",
        value: metrics.deliveredOrders.value,
        trend: metrics.deliveredOrders.trend,
        subtext: "All delivered or completed orders with 30-day momentum.",
      },
      {
        label: "Total Customers",
        value: metrics.totalCustomers.value,
        trend: metrics.totalCustomers.trend,
        subtext: "All registered customers in the platform",
      },
      {
        label: "Total Products",
        value: metrics.totalProducts.value,
        trend: metrics.totalProducts.trend,
        subtext: "Live catalog product count",
      },
      {
        label: "Low Stock Products",
        value: metrics.lowStockProducts.value,
        trend: metrics.lowStockProducts.trend,
        subtext: "Products at 5 units or fewer right now",
      },
      {
        label: "Today's Revenue",
        value: formatCurrency(metrics.todaysRevenue.value, currency),
        trend: metrics.todaysRevenue.trend,
        subtext: "Revenue created today compared with yesterday",
      },
    ];
  }, [analytics, currency]);

  const chartData = useMemo(() => {
    if (!analytics?.charts) return [];
    return chartRange === "monthly"
      ? analytics.charts.monthly || []
      : analytics.charts.weekly || [];
  }, [analytics, chartRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonRows rows={3} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <SkeletonRows rows={5} />
          <SkeletonRows rows={5} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Dashboard analytics unavailable"
        description={error}
      />
    );
  }

  if (!analytics) {
    return (
      <EmptyState
        title="No analytics available"
        description="Analytics will appear here once the commerce data becomes available."
      />
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Ecommerce analytics
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
              {user?.name || "Admin"} is looking at live business performance.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-500">
              Revenue, order flow, inventory pressure, and product performance are
              computed from live order, product, and customer data. The dashboard
              keeps expensive aggregation on the server so the admin page stays fast.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <LegendPill color="#16A34A" label="Revenue analytics" />
            <LegendPill color="#0F766E" label="Order analytics" />
          </div>
        </div>
      </Panel>

      {/* Cards stay on an auto-wrapping grid so metric count can grow without
          forcing the admin viewport wider than the screen. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            trend={card.trend}
            subtext={card.subtext}
          />
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
        <Panel
          title="Sales analytics"
          description="Revenue and order velocity for the selected time horizon."
          action={
            <SegmentedToggle
              options={[
                { label: "Weekly", value: "weekly" },
                { label: "Monthly", value: "monthly" },
              ]}
              value={chartRange}
              onChange={setChartRange}
            />
          }
        >
          {/* The chart uses a single server payload and client-side range toggles to
              avoid re-fetching or re-aggregating the same analytics data. */}
          <AnalyticsTrendChart data={chartData} currencySymbol={currency} />
        </Panel>

        <Panel
          title="Order status distribution"
          description="Current ratio of pending, processing, delivered, and cancelled orders."
        >
          <OrderStatusDonutChart data={analytics.orderStatusDistribution || []} />
        </Panel>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Panel
          title="Top selling products"
          description="Best performing products ranked by fulfilled sales volume and revenue."
          action={
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Manage products
              <ArrowRight size={14} />
            </Link>
          }
        >
          {analytics.topProducts.length === 0 ? (
            <EmptyState
              title="No product sales yet"
              description="Top sellers will appear automatically when delivered orders start coming in."
            />
          ) : (
            <div className="space-y-3">
              {analytics.topProducts.map((product, index) => (
                <div
                  key={product._id || `${product.name}-${index}`}
                  className="grid min-w-0 gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 lg:grid-cols-[minmax(0,1.4fr)_110px_120px] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={getImageUrl(product.image, "product")}
                      alt={product.name}
                      className="h-14 w-14 rounded-xl object-cover"
                      onError={(event) => {
                        event.currentTarget.src = getImageFallback("product");
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {product.category || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Units sold
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {product.quantitySold}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Revenue
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Recent orders"
          description="Live order activity with payment and fulfillment status at a glance."
          action={
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              View all orders
              <ArrowRight size={14} />
            </Link>
          }
        >
          {analytics.recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="The recent orders panel will populate as soon as checkout activity begins."
            />
          ) : (
            /* The table keeps a desktop header while each row collapses into a
               stacked grid on smaller screens so order data stays readable. */
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              <div className="hidden grid-cols-[120px_minmax(0,1.35fr)_130px_130px_110px_90px] gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-gray-500 xl:grid">
                <span>Order</span>
                <span>Customer</span>
                <span>Payment</span>
                <span>Status</span>
                <span>Amount</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-gray-100">
                {analytics.recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="grid min-w-0 gap-4 px-4 py-4 xl:grid-cols-[120px_minmax(0,1.35fr)_130px_130px_110px_90px] xl:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        #{String(order._id).slice(-8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {order.customer?.name || "Unknown customer"}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {order.customer?.email || "No email"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        tone={toneByPaymentStatus[order.paymentStatus] || "neutral"}
                      >
                        {labelize(order.paymentStatus)}
                      </StatusBadge>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        tone={toneByOrderStatus[order.orderStatus] || "neutral"}
                      >
                        {labelize(order.orderStatus)}
                      </StatusBadge>
                    </div>

                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount, currency)}
                    </div>

                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveOrder(order)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 xl:w-auto"
                      >
                        Quick view
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Low stock alerts"
        description="Products below the live stock threshold, ordered by urgency."
        action={
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Open product manager
            <ArrowRight size={14} />
          </Link>
        }
      >
        {analytics.lowStockAlerts.length === 0 ? (
          <EmptyState
            title="No low stock alerts"
            description="Inventory levels are healthy across the current product catalog."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.lowStockAlerts.map((product) => (
              <div
                key={product._id}
                className="rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={getImageUrl(product.image, "product")}
                    alt={product.name}
                    className="h-14 w-14 rounded-xl object-cover"
                    onError={(event) => {
                      event.currentTarget.src = getImageFallback("product");
                    }}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-amber-700">
                      {product.category || "Uncategorized"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-amber-200 bg-white/80 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Remaining stock
                    </p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {product.countInStock}
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-white/80 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Next action
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-900">
                      Restock or adjust visibility
                    </p>
                  </div>
                </div>

                <Link
                  to="/admin/products"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:underline"
                >
                  Manage inventory
                  <ArrowRight size={14} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <QuickViewModal
        order={activeOrder}
        currencySymbol={currency}
        onClose={() => setActiveOrder(null)}
      />
    </div>
  );
};

export default AdminOverview;
