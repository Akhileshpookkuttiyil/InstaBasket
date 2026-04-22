import React from "react";
import useAuthStore from "../../store/useAuthStore";
import useContentStore from "../../store/useContentStore";
import { EmptyState, Panel, StatCard } from "./components/AdminSurface";

const AdminOverview = () => {
  const { user } = useAuthStore();
  const { categories, homeContent, categoriesError, homeContentError } = useContentStore();

  const activeCategories = categories.filter((category) => category.isActive !== false);
  const heroTitle = homeContent?.heroBanner?.title || "Not configured";
  const hasContentIssue = Boolean(categoriesError || homeContentError);

  return (
    <div className="space-y-6">
      <Panel className="bg-white">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          Overview
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">
          {user?.name || "Admin"} controls the live storefront experience.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          Category taxonomy, homepage visuals, and merchandised messaging now
          come from live API-backed content. This dashboard gives you a cleaner
          operating view over what is published.
        </p>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Active categories"
          value={activeCategories.length}
          hint={`${categories.length} total categories in the catalog`}
        />
        <StatCard
          label="Homepage features"
          value={homeContent?.features?.length || 0}
          hint="Feature blocks currently configured for the marketing section"
        />
        <StatCard
          label="Hero headline"
          value={heroTitle}
          hint="Current homepage hero title from live content"
        />
      </div>

      {hasContentIssue ? (
        <EmptyState
          title="Some storefront content could not be loaded"
          description={[
            categoriesError,
            homeContentError,
          ]
            .filter(Boolean)
            .join(" ")}
        />
      ) : null}
    </div>
  );
};

export default AdminOverview;
