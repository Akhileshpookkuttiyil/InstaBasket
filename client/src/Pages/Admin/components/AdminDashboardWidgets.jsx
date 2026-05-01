import React, { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Dot,
  MoreHorizontal,
} from "lucide-react";

const chartCurrency = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const linePoint = (index, total, value, maxValue, width, height, padding) => {
  const safeMax = Math.max(maxValue, 1);
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const x =
    total <= 1
      ? padding.left + usableWidth / 2
      : padding.left + (usableWidth / (total - 1)) * index;
  const y = padding.top + usableHeight - (value / safeMax) * usableHeight;

  return { x, y };
};

const buildLinePath = (points) =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

const buildAreaPath = (points, height, padding) => {
  if (points.length === 0) return "";

  const baselineY = height - padding.bottom;
  return [
    `M ${points[0].x} ${baselineY}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1].x} ${baselineY}`,
    "Z",
  ].join(" ");
};

const formatMoney = (value, symbol) =>
  `${symbol}${chartCurrency.format(Math.round(Number(value || 0)))}`;

const formatCompact = (value) => {
  const numericValue = Number(value || 0);

  if (numericValue >= 1000000) {
    return `${(numericValue / 1000000).toFixed(1)}M`;
  }

  if (numericValue >= 1000) {
    return `${(numericValue / 1000).toFixed(1)}K`;
  }

  return `${numericValue}`;
};

export const StatusBadge = ({ tone = "neutral", children }) => {
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    info: "border-sky-200 bg-sky-50 text-sky-700",
    neutral: "border-gray-200 bg-gray-50 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        styles[tone] || styles.neutral
      }`}
    >
      {children}
    </span>
  );
};

export const TrendBadge = ({ trend }) => {
  const direction = trend?.direction || "neutral";
  const Icon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : MoreHorizontal;
  const styles = {
    up: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    down: "bg-rose-50 text-rose-700 ring-rose-100",
    neutral: "bg-gray-100 text-gray-600 ring-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        styles[direction] || styles.neutral
      }`}
    >
      <Icon size={13} />
      {trend?.value ? `${trend.value}%` : trend?.label || "Stable"}
    </span>
  );
};

export const MetricCard = ({ label, value, trend, subtext }) => (
  <div className="min-w-0 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
          {label}
        </p>
        <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className="shrink-0 self-start">
        <TrendBadge trend={trend} />
      </div>
    </div>
    <p className="mt-3 text-sm text-gray-500">{subtext || trend?.label || "Live metric"}</p>
  </div>
);

export const SegmentedToggle = ({ options, value, onChange }) => (
  <div className="inline-flex max-w-full flex-wrap rounded-full border border-gray-200 bg-gray-50 p-1">
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onChange(option.value)}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          value === option.value
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-800"
        }`}
      >
        {option.label}
      </button>
    ))}
  </div>
);

export const AnalyticsTrendChart = ({ data, currencySymbol }) => {
  const { revenuePoints, orderPoints, areaPath, revenuePath, orderPath, maxRevenue, maxOrders } =
    useMemo(() => {
      const width = 760;
      const height = 320;
      const padding = { top: 16, right: 20, bottom: 40, left: 20 };
      const revenueMax = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);
      const orderMax = Math.max(...data.map((item) => Number(item.orders || 0)), 1);
      const revenueSeries = data.map((item, index) =>
        linePoint(index, data.length, Number(item.revenue || 0), revenueMax, width, height, padding)
      );
      const orderSeries = data.map((item, index) =>
        linePoint(index, data.length, Number(item.orders || 0), orderMax, width, height, padding)
      );

      return {
        revenuePoints: revenueSeries,
        orderPoints: orderSeries,
        areaPath: buildAreaPath(revenueSeries, height, padding),
        revenuePath: buildLinePath(revenueSeries),
        orderPath: buildLinePath(orderSeries),
        maxRevenue: revenueMax,
        maxOrders: orderMax,
      };
    }, [data]);

  if (!data.length) {
    return <div className="py-16 text-center text-sm text-gray-500">No trend data available.</div>;
  }

  return (
    <div className="min-w-0 max-w-full space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Revenue peak</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">
            {formatMoney(maxRevenue, currencySymbol)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order peak</p>
          <p className="mt-2 text-xl font-semibold text-gray-900">{formatCompact(maxOrders)}</p>
        </div>
      </div>

      {/* SVG scales inside a clipped wrapper so chart drawing never pushes the
          dashboard wider than its panel on smaller breakpoints. */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-b from-white via-white to-gray-50/80 p-3">
        <svg viewBox="0 0 760 320" className="h-[220px] w-full sm:h-[250px] lg:h-[280px]">
          <defs>
            <linearGradient id="revenue-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(34,197,94,0.24)" />
              <stop offset="100%" stopColor="rgba(34,197,94,0.02)" />
            </linearGradient>
          </defs>

          {[64, 128, 192, 256].map((y) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="740"
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="4 6"
            />
          ))}

          <path d={areaPath} fill="url(#revenue-fill)" />
          <path
            d={revenuePath}
            fill="none"
            stroke="#16A34A"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={orderPath}
            fill="none"
            stroke="#0F766E"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="10 10"
          />

          {revenuePoints.map((point, index) => (
            <g key={`point-${data[index].key}`}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#16A34A" />
              <circle cx={orderPoints[index].x} cy={orderPoints[index].y} r="3.5" fill="#0F766E" />
              <text
                x={point.x}
                y="300"
                textAnchor="middle"
                className="fill-gray-500 text-[11px] font-medium"
              >
                {data[index].label}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
          Revenue
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-700" />
          Orders
        </span>
      </div>
    </div>
  );
};

export const OrderStatusDonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const colors = ["#F59E0B", "#0284C7", "#16A34A", "#E11D48"];
  let cumulative = 0;

  const segments = data.map((item, index) => {
    const count = Number(item.count || 0);
    const fraction = total > 0 ? count / total : 0;
    const strokeLength = fraction * 282.743;
    const dashArray = `${strokeLength} ${282.743 - strokeLength}`;
    const dashOffset = -cumulative * 282.743;
    cumulative += fraction;

    return {
      ...item,
      color: colors[index % colors.length],
      dashArray,
      dashOffset,
      percentage: total > 0 ? Math.round(fraction * 100) : 0,
    };
  });

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)] lg:items-center">
      <div className="mx-auto w-full max-w-[12rem]">
        <svg viewBox="0 0 120 120" className="h-auto w-full max-w-full">
          <circle cx="60" cy="60" r="45" fill="none" stroke="#E5E7EB" strokeWidth="12" />
          {segments.map((segment) => (
            <circle
              key={segment.key}
              cx="60"
              cy="60"
              r="45"
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={segment.dashArray}
              strokeDashoffset={segment.dashOffset}
              transform="rotate(-90 60 60)"
            />
          ))}
          <text x="60" y="55" textAnchor="middle" className="fill-gray-500 text-[10px] font-semibold uppercase tracking-[0.18em]">
            Orders
          </text>
          <text x="60" y="72" textAnchor="middle" className="fill-gray-900 text-xl font-semibold">
            {formatCompact(total)}
          </text>
        </svg>
      </div>

      <div className="grid min-w-0 gap-3">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-sm font-medium text-gray-700">{segment.label}</span>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-gray-900">{segment.count}</p>
              <p className="text-xs text-gray-500">{segment.percentage}% of orders</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QuickViewRow = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 break-words text-sm text-gray-800">{value || "Not available"}</p>
  </div>
);

export const LegendPill = ({ color, label }) => (
  <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
    <Dot size={16} style={{ color }} />
    {label}
  </span>
);
