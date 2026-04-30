import React, { useEffect, useRef, useState } from "react";
import { Edit3 } from "lucide-react";
import { defaultHomeContent } from "../../../shared/content/defaultContent";
import {
  getHomepageBlockClasses,
  getHomepageBreakpointContent,
  getHomepageOverlayClasses,
} from "../../../shared/content/homepageLayout";
import { getImageFallback, getImageUrl } from "../../../shared/lib/image";
import NewsLetter from "../../../Components/NewsLetter";
import ProductCard from "../../../Components/ProductCard";

const sectionLabelClassName =
  "absolute left-3 top-3 rounded-full border border-gray-200 bg-white/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600";

const editableClassName =
  "group relative rounded-lg border border-transparent px-2 py-1 transition hover:border-primary/30 hover:bg-white/70 focus:border-primary/40 focus:bg-white/80";

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
      className={`block w-full text-inherit ${editableClassName} ${className}`}
    >
      <span className={`flex items-center gap-1.5 ${
        className.includes('text-center') || className.includes('items-center') ? 'justify-center' : 
        className.includes('text-right') || className.includes('items-end') ? 'justify-end' : 'justify-start'
      }`}>
        {value || placeholder}
        <Edit3 size={12} className="text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
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
  bestSellers = [],
  viewportMode = "web",
  onHeroFieldChange,
  onBottomFieldChange,
  onFeatureFieldChange,
}) => {
  const responsiveContent = getHomepageBreakpointContent(
    draftContent || defaultHomeContent,
    viewportMode
  );
  const heroBanner = responsiveContent?.heroBanner || defaultHomeContent.heroBanner;
  const bottomBanner =
    responsiveContent?.bottomBanner || defaultHomeContent.bottomBanner;
  const features = Array.isArray(draftContent?.features) ? draftContent.features : [];

  const isMobile = viewportMode === "mobile";
  const isTablet = viewportMode === "tablet";
  const isWeb = viewportMode === "web";
  const isAtLeastTablet = isWeb || isTablet;
  const bottomIsCentered = bottomBanner.position === "center";
  const bottomIsRightAligned = bottomBanner.position.includes("right");

  return (
    <div className="space-y-10">
      <PreviewSection label="Hero Banner" className="bg-gray-50">
        <div className="relative">
          <img
            src={getImageUrl(heroBanner.desktopImage, "marketing")}
            alt="Hero preview"
            className={`${isAtLeastTablet ? "block" : "hidden"} h-[420px] w-full object-cover`}
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />
          <img
            src={getImageUrl(heroBanner.mobileImage, "marketing")}
            alt="Hero preview mobile"
            className={`${isMobile ? "block" : "hidden"} h-[460px] w-full object-cover`}
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />

          <div className="absolute inset-0">
            <div
              className={`mx-auto flex h-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${getHomepageOverlayClasses(
                heroBanner.position
              )}`}
            >
              <div
                className={`flex w-full max-w-2xl flex-col ${getHomepageBlockClasses(
                  heroBanner.position
                )}`}
              >
                <div className="w-full">
                  <InlineEditableField
                    value={heroBanner.title}
                    onChange={(nextValue) => onHeroFieldChange("title", nextValue)}
                    placeholder="Hero title"
                    className={`${
                      isWeb ? "text-6xl" : isTablet ? "text-5xl" : "text-4xl"
                    } font-bold leading-tight text-gray-800 ${getHomepageBlockClasses(
                      heroBanner.position
                    )}`}
                    inputClassName={`${
                      isWeb ? "text-3xl" : "text-2xl"
                    } font-semibold text-gray-800`}
                  />
                </div>
                <div className="mt-3 w-full">
                  <InlineEditableField
                    value={heroBanner.subtitle}
                    onChange={(nextValue) => onHeroFieldChange("subtitle", nextValue)}
                    placeholder="Hero subtitle"
                    multiline
                    className={`max-w-md ${
                      isWeb ? "text-2xl" : isTablet ? "text-xl" : "text-lg"
                    } leading-7 text-gray-600 ${getHomepageBlockClasses(
                      heroBanner.position
                    )}`}
                    inputClassName="text-sm leading-6 text-gray-700"
                  />
                </div>

                <div
                  className={`mt-8 flex ${
                    isAtLeastTablet ? "flex-row" : "flex-col"
                  } gap-4`}
                >
                  <InlineEditableField
                    value={heroBanner.cta?.label}
                    onChange={(nextValue) => onHeroFieldChange("ctaLabel", nextValue)}
                    placeholder="Primary CTA"
                    className="inline-flex items-center rounded bg-primary px-6 py-3 text-sm font-medium text-white shadow-md"
                    inputClassName="bg-white text-sm text-gray-800"
                  />
                  <InlineEditableField
                    value={heroBanner.secondaryCta?.label}
                    onChange={(nextValue) =>
                      onHeroFieldChange("secondaryCtaLabel", nextValue)
                    }
                    placeholder="Secondary CTA"
                    className="inline-flex items-center rounded border border-gray-300 bg-white/80 px-6 py-3 text-sm font-medium text-gray-800 shadow-sm"
                    inputClassName="bg-white text-sm text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection label="Categories" className="p-5">
        <p className={`font-medium ${isAtLeastTablet ? "text-3xl" : "text-2xl"}`}>Categories</p>
        {categoriesLoading ? (
          <div className={`mt-6 grid gap-6 ${isWeb ? "grid-cols-7" : isTablet ? "grid-cols-4" : "grid-cols-2"}`}>
            {Array.from({ length: 7 }).map((_, index) => (
              <div
                key={`category-preview-skeleton-${index}`}
                className="h-36 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            No categories are published yet.
          </div>
        ) : (
          <div className={`mt-6 grid gap-6 ${isWeb ? "grid-cols-7" : isTablet ? "grid-cols-4" : "grid-cols-2"}`}>
            {categories.map((category) => (
              <div
                key={category.slug}
                className="group rounded-lg px-3 py-5 shadow-md transition-transform duration-200 hover:shadow-lg"
                style={{ backgroundColor: category.bgColor || "#F5F5F5" }}
              >
                <div className="flex flex-col items-center justify-center">
                  <img
                    src={getImageUrl(category.image, "category")}
                    alt={category.name}
                    className="max-w-[100px] transition-transform duration-200 group-hover:scale-105"
                    onError={(event) => {
                      event.currentTarget.src = getImageFallback("category");
                    }}
                  />
                  <p className="mt-2 text-center text-sm font-medium">
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
            <p className={`font-medium ${isAtLeastTablet ? "text-3xl" : "text-2xl"}`}>Best Sellers</p>
            <p className="mt-1 text-sm text-gray-500">
              Product cards are driven by your catalog and appear here on the live storefront.
            </p>
          </div>
        </div>
        <div className={`mt-6 grid gap-6 ${isWeb ? "grid-cols-4" : isAtLeastTablet ? "grid-cols-2" : "grid-cols-1"}`}>
          {bestSellers.length > 0
            ? bestSellers.map((product, index) => (
                <div key={`best-seller-real-${index}`} className="pointer-events-none select-none">
                  <ProductCard product={product} />
                </div>
              ))
            : Array.from({ length: 4 }).map((_, index) => (
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
            className={`${isAtLeastTablet ? "block" : "hidden"} min-h-[400px] w-full object-cover`}
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />
          <img
            src={getImageUrl(bottomBanner.mobileImage, "marketing")}
            alt="Bottom banner preview mobile"
            className={`${isMobile ? "block" : "hidden"} min-h-[460px] w-full object-cover`}
            onError={(event) => {
              event.currentTarget.src = getImageFallback("marketing");
            }}
          />

          <div className="absolute inset-0">
            <div
              className={`mx-auto flex h-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 ${getHomepageOverlayClasses(
                bottomBanner.position
              )}`}
            >
              <div
                className={`flex w-full max-w-md flex-col ${getHomepageBlockClasses(
                  bottomBanner.position
                )}`}
              >
                <div
                  className={`flex w-full ${
                    // Match the live BottomBanner h1 alignment: the editable
                    // heading sits on the same edge as the feature icon stack.
                    bottomIsCentered
                      ? "justify-center"
                      : bottomIsRightAligned
                        ? "justify-end"
                        : "justify-start"
                  }`}
                >
                  <InlineEditableField
                    value={bottomBanner.title}
                    onChange={(nextValue) => onBottomFieldChange("title", nextValue)}
                    placeholder="Bottom banner title"
                    className={`w-full max-w-[24rem] px-0 py-0 ${
                      isAtLeastTablet ? "text-3xl" : "text-2xl"
                    } font-semibold text-primary ${getHomepageBlockClasses(
                      bottomBanner.position
                    )}`}
                    inputClassName="text-lg font-semibold text-gray-800"
                  />
                </div>

                {features.map((feature, index) => {
                  const isCentered = bottomIsCentered;
                  const isRightAligned = bottomIsRightAligned;
                  return (
                    <div
                      key={`preview-feature-${index}`}
                      className={`mt-3 flex w-full max-w-[24rem] transition-all duration-300 hover:scale-105 ${
                        isCentered
                          ? "flex-col items-center text-center"
                          : `items-center gap-4 ${
                              // Match storefront alignment: right-positioned
                              // stacks keep icons on the heading's text edge.
                              isRightAligned
                                ? "flex-row-reverse justify-start"
                                : "flex-row justify-start"
                            }`
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                        <img
                          src={getImageUrl(feature.icon, "marketing")}
                          alt={feature.title || `Feature ${index + 1}`}
                          className="max-h-full max-w-full object-contain"
                          onError={(event) => {
                            event.currentTarget.src = getImageFallback("marketing");
                          }}
                        />
                      </div>
                      <div
                        className={`min-w-0 ${
                          // Fixed text column width keeps stacked rows aligned
                          // without reintroducing the large icon/text gap.
                          isCentered ? "mt-3 max-w-xs" : "w-full max-w-xs"
                        }`}
                      >
                        <InlineEditableField
                          value={feature.title}
                          onChange={(nextValue) =>
                            onFeatureFieldChange(index, "title", nextValue)
                          }
                          placeholder={`Feature ${index + 1} title`}
                          className={`w-full px-0 py-0 font-bold text-gray-800 ${
                            isCentered || isRightAligned
                              ? isCentered
                                ? "text-center"
                                : "text-right"
                              : "text-left"
                          }`}
                          inputClassName="text-sm font-medium text-gray-800"
                        />
                        <InlineEditableField
                          value={feature.description}
                          onChange={(nextValue) =>
                            onFeatureFieldChange(index, "description", nextValue)
                          }
                          placeholder="Feature description"
                          multiline
                          className={`mt-1 w-full px-0 py-0 text-xs text-gray-500/80 sm:text-sm ${
                            isCentered || isRightAligned
                              ? isCentered
                                ? "text-center"
                                : "text-right"
                              : "text-left"
                          }`}
                          inputClassName="text-sm leading-6 text-gray-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </PreviewSection>

      <PreviewSection label="Newsletter" className="p-5">
        <NewsLetter previewMode className="mt-0 pb-0" />
      </PreviewSection>
    </div>
  );
};

export default HomepageVisualPreview;
