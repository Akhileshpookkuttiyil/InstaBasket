import React from "react";

export const AdminShell = ({ sidebar, header, children }) => (
  <div className="min-h-screen bg-[#f4f6f4] text-slate-900">
    <div className="mx-auto grid min-h-screen max-w-[1440px] md:grid-cols-[248px_1fr]">
      <aside className="border-r border-slate-200/80 bg-[#fbfcfb]">{sidebar}</aside>
      <div className="min-w-0">
        <header className="border-b border-slate-200/80 bg-[#fbfcfb]/90 backdrop-blur">
          {header}
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  </div>
);

export const Panel = ({ title, description, action, children, className = "" }) => (
  <section className={`rounded-[28px] border border-slate-200 bg-white ${className}`}>
    {(title || description || action) && (
      <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-start md:justify-between md:px-6">
        <div>
          {title ? <h2 className="text-lg font-semibold tracking-[-0.02em] text-slate-900">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    )}
    <div className="px-5 py-5 md:px-6">{children}</div>
  </section>
);

export const StatCard = ({ label, value, hint }) => (
  <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-5">
    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{value}</p>
    {hint ? <p className="mt-2 text-sm text-slate-500">{hint}</p> : null}
  </div>
);

export const EmptyState = ({ title, description }) => (
  <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
    <p className="text-lg font-semibold text-slate-900">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
);

export const ErrorState = ({ title, description, onRetry }) => (
  <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-6 py-8">
    <p className="text-lg font-semibold text-rose-900">{title}</p>
    <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-full border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
      >
        Retry
      </button>
    ) : null}
  </div>
);

export const SkeletonRows = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div
        key={`skeleton-${index}`}
        className="h-16 animate-pulse rounded-[20px] bg-slate-100"
      />
    ))}
  </div>
);
