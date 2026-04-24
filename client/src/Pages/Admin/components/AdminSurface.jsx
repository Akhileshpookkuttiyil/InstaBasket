import React from "react";

export const AdminShell = ({ sidebar, header, children }) => (
  <div className="h-screen overflow-hidden bg-gray-50/60 text-gray-800">
    <div className="mx-auto grid h-full max-w-[1440px] md:grid-cols-[248px_1fr]">
      <aside className="h-full overflow-y-auto border-r border-gray-200 bg-white">{sidebar}</aside>
      <div className="flex min-w-0 min-h-0 flex-col">
        <header className="shrink-0 border-b border-gray-200 bg-white">
          {header}
        </header>
        <main className="h-[calc(100vh-73px)] overflow-y-auto p-4 md:h-[calc(100vh-69px)] md:p-6">
          {children}
        </main>
      </div>
    </div>
  </div>
);

export const Panel = ({ title, description, action, children, className = "" }) => (
  <section className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
    {(title || description || action) && (
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 px-4 py-4 md:px-5">
        <div className="min-w-0 flex-1">
          {title ? <h2 className="text-base font-semibold text-gray-800">{title}</h2> : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-gray-500">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    )}
    <div className="px-4 py-4 md:px-5">{children}</div>
  </section>
);

export const StatCard = ({ label, value, hint }) => (
  <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2.5 text-2xl font-semibold text-gray-800">{value}</p>
    {hint ? <p className="mt-2 text-sm text-gray-500">{hint}</p> : null}
  </div>
);

export const EmptyState = ({ title, description }) => (
  <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
    <p className="text-lg font-semibold text-gray-800">{title}</p>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">{description}</p>
  </div>
);

export const ErrorState = ({ title, description, onRetry }) => (
  <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-6 py-8">
    <p className="text-lg font-semibold text-rose-900">{title}</p>
    <p className="mt-2 text-sm leading-6 text-rose-700">{description}</p>
    {onRetry ? (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg border border-rose-300 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
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
        className="h-16 animate-pulse rounded-xl bg-gray-100"
      />
    ))}
  </div>
);
