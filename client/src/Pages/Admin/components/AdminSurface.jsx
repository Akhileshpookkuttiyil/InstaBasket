import React from "react";

export const AdminShell = ({ sidebar, header, children }) => (
  // h-screen + overflow-hidden on root clamps the shell to the viewport.
  // Only <main> scrolls; the sidebar and header stay fixed in place.
  <div className="h-screen w-full overflow-hidden bg-gray-50/60 text-gray-800">
    <div className="mx-auto grid h-full w-full max-w-[1440px] grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="min-w-0 border-b border-gray-200 bg-white md:h-full md:overflow-y-auto md:border-b-0 md:border-r">
        {sidebar}
      </aside>
      <div className="flex h-full min-w-0 max-w-full flex-col overflow-hidden">
        <header className="shrink-0 border-b border-gray-200 bg-white">
          {header}
        </header>
        <main className="w-full max-w-full flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          <div className="mx-auto flex w-full min-w-0 max-w-full flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  </div>
);

export const Panel = ({ title, description, action, children, className = "" }) => (
  <section className={`min-w-0 max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
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
        {action ? <div className="w-full min-w-0 sm:w-auto sm:shrink-0">{action}</div> : null}
      </div>
    )}
    <div className="min-w-0 max-w-full px-4 py-4 md:px-5">{children}</div>
  </section>
);

export const StatCard = ({ label, value, hint }) => (
  <div className="min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
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