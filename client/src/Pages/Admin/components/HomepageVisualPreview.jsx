import React, { useEffect, useRef, useState } from "react";
import { defaultHomeContent } from "../../../shared/content/defaultContent";
import {
  getHomepageBlockClasses,
  getHomepageOverlayClasses,
} from "../../../shared/content/homepageLayout";
import { getImageFallback, getImageUrl } from "../../../shared/lib/image";

const sectionLabelClassName =
  "absolute left-3 top-3 rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600";

const editableClassName =
  "rounded-lg border border-transparent px-2 py-1 transition hover:border-primary/30 hover:bg-white/70 focus:border-primary/40 focus:bg-white/80";

const InlineEditableField = ({
  value,
  onChange,
  placeholder,
  multiline = false,
  className = "",
  inputClassName = "",
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [editing]);

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          rows={3}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => setEditing(false)}
          className={`w-full resize-none rounded-lg border border-primary/40 bg-white/85 px-3 py-2 text-sm outline-none ${inputClassName}`}
          placeholder={placeholder}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        className={`w-full rounded-lg border border-primary/40 bg-white/85 px-3 py-2 text-sm outline-none ${inputClassName}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={`${editableClassName} ${className}`}
    >
      {value || placeholder}
    </button>
  );
};

const PreviewSection = ({ label, children, className = "" }) => (
  <section className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>
    <span className={sectionLabelClassName}>{label}</span>
    {children}
  </section>
);

const HomepageVisualPreview = ({
  draftContent,
  categories,
  categoriesLoading,
  onHeroFieldChange,
  onBottomFieldChange,
  onFeatureFieldChange,
}) => {
  const heroBanner = draftContent?.heroBanner || defaultHomeContent.heroBanner;
  const bottomBanner = draftContent?.bottomBanner || defaultHomeContent.bottomBanner;
  const features = Array.isArray(draftContent?.features) ? draftContent.features : [];

  return (
    <div className="space-y-6">
      <PreviewSection label="Hero Banner" className="bg-gray-50">
        <div className="relative">
          <img
            src={getImageUrl(heroBanner.desktopImage, "marketing")}
            alt="Hero preview"
            className="hidden h-[360px] w-full object-cover md:block"
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />
          <img
            src={getImageUrl(heroBanner.mobileImage, "marketing")}
            alt="Hero preview mobile"
            className="h-[420px] w-full object-cover md:hidden"
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />

          <div
            className={`absolute inset-0 flex px-5 py-8 md:px-10 ${getHomepageOverlayClasses(
              heroBanner.position
            )}`}
          >
            <div className={`flex max-w-xl flex-col ${getHomepageBlockClasses(heroBanner.position)}`}>
              <InlineEditableField
                value={heroBanner.title}
                onChange={(nextValue) => onHeroFieldChange("title", nextValue)}
                placeholder="Hero title"
                className="text-3xl font-bold leading-tight text-gray-800 md:text-5xl"
                inputClassName="text-xl font-semibold text-gray-800 md:text-2xl"
              />
              <InlineEditableField
                value={heroBanner.subtitle}
                onChange={(nextValue) => onHeroFieldChange("subtitle", nextValue)}
                placeholder="Hero subtitle"
                multiline
                className="mt-4 max-w-md text-base leading-7 text-gray-600 md:text-xl"
                inputClassName="text-sm leading-6 text-gray-700"
              />

              <div className="mt-6 flex flex-col gap-3 md:flex-row">
                <InlineEditableField
                  value={heroBanner.cta?.label}
                  onChange={(nextValue) => onHeroFieldChange("ctaLabel", nextValue)}
                  placeholder="Primary CTA"
                  className="inline-flex items-center rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md"
                  inputClassName="bg-white text-sm text-gray-800"
                />
                <InlineEditableField
                  value={heroBanner.secondaryCta?.label}
                  onChange={(nextValue) => onHeroFieldChange("secondaryCtaLabel", nextValue)}
                  placeholder="Secondary CTA"
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white/80 px-5 py-3 text-sm font-medium text-gray-800 shadow-sm"
                  inputClassName="bg-white text-sm text-gray-800"
                />
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection label="Categories" className="p-5">
        <p className="text-2xl font-medium text-gray-800">Categories</p>
        {categoriesLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={`category-preview-skeleton-${index}`}
                className="h-32 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
            Published categories will appear here.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((category) => (
              <div
                key={category.slug}
                className="rounded-lg px-3 py-5 shadow-sm"
                style={{ backgroundColor: category.bgColor || "#F5F5F5" }}
              >
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={getImageUrl(category.image, "category")}
                    alt={category.name}
                    className="max-w-[90px]"
                    onError={(event) => {
                      event.currentTarget.src = getImageFallback("category");
                    }}
                  />
                  <p className="mt-2 text-center text-sm font-medium text-gray-800">
                    {category.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PreviewSection>

      <PreviewSection label="Best Seller Products" className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-medium text-gray-800">Best Sellers</p>
            <p className="mt-1 text-sm text-gray-500">
              Product cards are driven by your catalog and appear here on the live storefront.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`best-seller-preview-${index}`}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="h-36 rounded-lg bg-gray-100" />
              <div className="mt-4 h-4 w-3/4 rounded-full bg-gray-100" />
              <div className="mt-2 h-3 w-1/2 rounded-full bg-gray-100" />
              <div className="mt-5 h-9 rounded-md bg-primary/15" />
            </div>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection label="Bottom Banner" className="bg-gray-50">
        <div className="relative">
          <img
            src={getImageUrl(bottomBanner.desktopImage, "marketing")}
            alt="Bottom banner preview"
            className="hidden h-[320px] w-full object-cover md:block"
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />
          <img
            src={getImageUrl(bottomBanner.mobileImage, "marketing")}
            alt="Bottom banner preview mobile"
            className="h-[420px] w-full object-cover md:hidden"
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />

          <div
            className={`absolute inset-0 flex px-5 py-8 md:px-12 ${getHomepageOverlayClasses(
              bottomBanner.position
            )}`}
          >
            <div className={`flex max-w-md flex-col ${getHomepageBlockClasses(bottomBanner.position)}`}>
              <InlineEditableField
                value={bottomBanner.title}
                onChange={(nextValue) => onBottomFieldChange("title", nextValue)}
                placeholder="Bottom banner title"
                className="text-2xl font-semibold text-primary md:text-3xl"
                inputClassName="text-lg font-semibold text-gray-800"
              />

              <div className="mt-4 space-y-3">
                {features.map((feature, index) => (
                  <div
                    key={`preview-feature-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-transparent bg-white/50 p-2"
                  >
                    <img
                      src={getImageUrl(feature.icon, "marketing")}
                      alt={feature.title || `Feature ${index + 1}`}
                      className="h-10 w-10 rounded-xl object-cover"
                      onError={(event) => {
                        event.currentTarget.src = getImageFallback("marketing");
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <InlineEditableField
                        value={feature.title}
                        onChange={(nextValue) =>
                          onFeatureFieldChange(index, "title", nextValue)
                        }
                        placeholder={`Feature ${index + 1} title`}
                        className="w-full text-left text-base font-semibold text-gray-800"
                        inputClassName="text-sm font-medium text-gray-800"
                      />
                      <InlineEditableField
                        value={feature.description}
                        onChange={(nextValue) =>
                          onFeatureFieldChange(index, "description", nextValue)
                        }
                        placeholder="Feature description"
                        multiline
                        className="mt-1 w-full text-left text-sm leading-6 text-gray-600"
                        inputClassName="text-sm leading-6 text-gray-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection label="Newsletter" className="p-5">
        <div className="rounded-2xl bg-primary/10 px-5 py-6">
          <p className="text-xl font-semibold text-gray-800">Subscribe to our newsletter</p>
          <p className="mt-2 text-sm text-gray-600">
            This section stays on the homepage and uses the shared storefront styling.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="h-11 flex-1 rounded-md border border-gray-300 bg-white" />
            <div className="h-11 w-full rounded-md bg-primary sm:w-40" />
          </div>
        </div>
      </PreviewSection>
    </div>
  );
};

export default HomepageVisualPreview;
