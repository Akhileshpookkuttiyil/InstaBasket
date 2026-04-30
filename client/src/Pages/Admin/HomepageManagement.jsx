import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  LayoutTemplate,
  Monitor,
  RotateCcw,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
} from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import useContentStore from "../../store/useContentStore";
import useProductStore from "../../store/useProductStore";
import { defaultHomeContent } from "../../shared/content/defaultContent";
import {
  getHomepageBreakpointContent,
  HOMEPAGE_BREAKPOINTS,
  HOMEPAGE_TEXT_POSITION_OPTIONS,
} from "../../shared/content/homepageLayout";
import { getImageFallback, getImageUrl } from "../../shared/lib/image";
import { ErrorState, Panel } from "./components/AdminSurface";
import HomepageVisualPreview from "./components/HomepageVisualPreview";

const createFeatureDraft = (feature = {}) => ({
  title: feature.title || "",
  description: feature.description || "",
  icon: feature.icon || null,
  file: null,
});

const inputClassName =
  "mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary";

const textAreaClassName = `${inputClassName} resize-none`;

const fileInputClassName =
  "mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white";

const createBreakpointDraft = (content, breakpoint) => {
  const breakpointContent = getHomepageBreakpointContent(content, breakpoint);
  return {
    heroTitle: breakpointContent?.heroBanner?.title || "",
    heroSubtitle: breakpointContent?.heroBanner?.subtitle || "",
    heroPosition:
      breakpointContent?.heroBanner?.position ||
      defaultHomeContent.heroBanner.position,
    ctaLabel: breakpointContent?.heroBanner?.cta?.label || "",
    ctaHref: breakpointContent?.heroBanner?.cta?.href || "",
    secondaryCtaLabel:
      breakpointContent?.heroBanner?.secondaryCta?.label || "",
    secondaryCtaHref:
      breakpointContent?.heroBanner?.secondaryCta?.href || "",
    bottomTitle: breakpointContent?.bottomBanner?.title || "",
    bottomText: breakpointContent?.bottomBanner?.text || "",
    bottomPosition:
      breakpointContent?.bottomBanner?.position ||
      defaultHomeContent.bottomBanner.position,
  };
};

const createBreakpointPayload = (draft = {}) => ({
  heroBanner: {
    title: draft.heroTitle,
    subtitle: draft.heroSubtitle,
    position: draft.heroPosition,
    cta: {
      label: draft.ctaLabel,
      href: draft.ctaHref,
    },
    secondaryCta: {
      label: draft.secondaryCtaLabel,
      href: draft.secondaryCtaHref,
    },
  },
  bottomBanner: {
    title: draft.bottomTitle,
    text: draft.bottomText,
    position: draft.bottomPosition,
  },
});

const PreviewImage = ({ label, src }) => (
  <div>
    <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
    <img
      src={src || getImageFallback("marketing")}
      alt={label}
      className="h-32 w-full rounded-xl border border-gray-200 object-cover"
      onError={(event) => {
        event.currentTarget.src = getImageFallback("marketing");
      }}
    />
  </div>
);

const PositionSelector = ({ label, value, onChange }) => (
  <div>
    <p className="text-sm font-medium text-gray-700">{label}</p>
    <div className="mt-2 grid grid-cols-2 gap-2">
      {HOMEPAGE_TEXT_POSITION_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
            value === option.value
              ? "border-primary bg-primary/10 text-gray-800"
              : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </div>
);

const CollapsibleHeader = ({ title, description, open, onToggle, icon: Icon }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-start justify-between gap-4 text-left"
  >
    <div className="flex items-start gap-3">
      {Icon ? (
        <div className="rounded-xl bg-primary/10 p-2 text-primary">
          <Icon size={18} />
        </div>
      ) : null}
      <div>
        <p className="text-base font-semibold text-gray-800">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
        ) : null}
      </div>
    </div>
    {open ? <ChevronDown size={18} className="shrink-0 text-gray-400" /> : <ChevronRight size={18} className="shrink-0 text-gray-400" />}
  </button>
);

const StaticSectionHeader = ({ title, description, icon: Icon }) => (
  <div className="flex items-start gap-3">
    {Icon ? (
      <div className="rounded-xl bg-primary/10 p-2 text-primary">
        <Icon size={18} />
      </div>
    ) : null}
    <div>
      <p className="text-base font-semibold text-gray-800">{title}</p>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-gray-500">{description}</p>
      ) : null}
    </div>
  </div>
);

const HomepageManagement = () => {
  const {
    homeContent,
    homeContentLoading,
    homeContentError,
    categories,
    categoriesLoading,
    fetchContent,
  } = useContentStore();

  const { products: allProducts, fetchProducts: fetchAllProducts } = useProductStore();

  const [saving, setSaving] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportAssetsOpen, setSupportAssetsOpen] = useState(false);
  const [formState, setFormState] = useState({
    breakpoints: HOMEPAGE_BREAKPOINTS.reduce(
      (drafts, breakpoint) => ({
        ...drafts,
        [breakpoint]: createBreakpointDraft(defaultHomeContent, breakpoint),
      }),
      {}
    ),
    heroDesktopFile: null,
    heroMobileFile: null,
    bottomDesktopFile: null,
    bottomMobileFile: null,
    addressFile: null,
    features: [
      createFeatureDraft(),
      createFeatureDraft(),
      createFeatureDraft(),
      createFeatureDraft(),
    ],
  });

  const [viewportMode, setViewportMode] = useState("web"); // web, tablet, mobile
  const activeBreakpoint = viewportMode === "web" ? "desktop" : viewportMode;
  const activeDraft =
    formState.breakpoints?.[activeBreakpoint] ||
    formState.breakpoints?.desktop ||
    createBreakpointDraft(defaultHomeContent, activeBreakpoint);
  useEffect(() => {
    fetchAllProducts({ limit: 4 });
  }, [fetchAllProducts]);

  const viewportConfig = {
    web: { width: 1440, label: "Web", icon: Monitor },
    tablet: { width: 768, label: "Tablet", icon: Tablet },
    mobile: { width: 375, label: "Mobile", icon: Smartphone },
  };

  const currentConfig = viewportConfig[viewportMode];

  const effectiveContent = homeContent || defaultHomeContent;
  const categoryList = categories || [];

  useEffect(() => {
    if (homeContentLoading || homeContent === null) {
      return;
    }

    const nextFeatures = (effectiveContent?.features?.length
      ? effectiveContent.features
      : defaultHomeContent.features
    ).map((feature) => createFeatureDraft(feature));

    setFormState({
      // Each breakpoint has its own editable banner copy/alignment. Missing
      // values are merged from the root desktop content for old records.
      breakpoints: HOMEPAGE_BREAKPOINTS.reduce(
        (drafts, breakpoint) => ({
          ...drafts,
          [breakpoint]: createBreakpointDraft(effectiveContent, breakpoint),
        }),
        {}
      ),
      heroDesktopFile: null,
      heroMobileFile: null,
      bottomDesktopFile: null,
      bottomMobileFile: null,
      addressFile: null,
      features: [
        ...nextFeatures,
        ...Array.from({ length: Math.max(0, 4 - nextFeatures.length) }).map(() =>
          createFeatureDraft()
        ),
      ].slice(0, 4),
    });
  }, [effectiveContent, homeContent, homeContentLoading]);

  const previews = useMemo(
    () => ({
      heroDesktop:
        formState.heroDesktopFile
          ? URL.createObjectURL(formState.heroDesktopFile)
          : getImageUrl(effectiveContent?.heroBanner?.desktopImage, "marketing"),
      heroMobile:
        formState.heroMobileFile
          ? URL.createObjectURL(formState.heroMobileFile)
          : getImageUrl(effectiveContent?.heroBanner?.mobileImage, "marketing"),
      bottomDesktop:
        formState.bottomDesktopFile
          ? URL.createObjectURL(formState.bottomDesktopFile)
          : getImageUrl(effectiveContent?.bottomBanner?.desktopImage, "marketing"),
      bottomMobile:
        formState.bottomMobileFile
          ? URL.createObjectURL(formState.bottomMobileFile)
          : getImageUrl(effectiveContent?.bottomBanner?.mobileImage, "marketing"),
      address:
        formState.addressFile
          ? URL.createObjectURL(formState.addressFile)
          : getImageUrl(effectiveContent?.illustrations?.address, "marketing"),
      featureIcons: formState.features.map((feature) =>
        feature.file ? URL.createObjectURL(feature.file) : getImageUrl(feature.icon, "marketing")
      ),
    }),
    [effectiveContent, formState]
  );

  useEffect(
    () => () => {
      [
        previews.heroDesktop,
        previews.heroMobile,
        previews.bottomDesktop,
        previews.bottomMobile,
        previews.address,
        ...previews.featureIcons,
      ].forEach((previewUrl) => {
        if (typeof previewUrl === "string" && previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    },
    [previews]
  );

  const draftContent = useMemo(() => {
    const breakpointPayloads = HOMEPAGE_BREAKPOINTS.reduce(
      (payloads, breakpoint) => ({
        ...payloads,
        [breakpoint]: createBreakpointPayload(
          formState.breakpoints?.[breakpoint] || formState.breakpoints?.desktop
        ),
      }),
      {}
    );
    const desktopDraft = breakpointPayloads.desktop;

    return {
      heroBanner: {
        desktopImage: previews.heroDesktop,
        mobileImage: previews.heroMobile,
        ...desktopDraft.heroBanner,
      },
      bottomBanner: {
        desktopImage: previews.bottomDesktop,
        mobileImage: previews.bottomMobile,
        ...desktopDraft.bottomBanner,
      },
      ...breakpointPayloads,
      features: formState.features.map((feature, index) => ({
        title: feature.title,
        description: feature.description,
        icon: previews.featureIcons[index] || getImageUrl(feature.icon, "marketing"),
      })),
      illustrations: {
        address: previews.address,
      },
    };
  }, [formState.breakpoints, formState.features, previews]);

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const updateBreakpointField = (field, value) => {
    setFormState((prev) => ({
      ...prev,
      breakpoints: {
        ...prev.breakpoints,
        [activeBreakpoint]: {
          ...(prev.breakpoints?.[activeBreakpoint] || {}),
          [field]: value,
        },
      },
    }));
  };

  const updateFeature = (index, patch) => {
    setFormState((prev) => ({
      ...prev,
      features: prev.features.map((feature, currentIndex) =>
        currentIndex === index ? { ...feature, ...patch } : feature
      ),
    }));
  };

  const submitHomeContent = async (event) => {
    event.preventDefault();

    const breakpointPayloads = HOMEPAGE_BREAKPOINTS.reduce(
      (payloads, breakpoint) => ({
        ...payloads,
        [breakpoint]: createBreakpointPayload(
          formState.breakpoints?.[breakpoint] || formState.breakpoints?.desktop
        ),
      }),
      {}
    );
    const desktopDraft = breakpointPayloads.desktop;

    const payload = new FormData();
    payload.append(
      "heroBanner",
      JSON.stringify({
        ...desktopDraft.heroBanner,
      })
    );
    payload.append(
      "bottomBanner",
      JSON.stringify({
        ...desktopDraft.bottomBanner,
      })
    );
    HOMEPAGE_BREAKPOINTS.forEach((breakpoint) => {
      payload.append(breakpoint, JSON.stringify(breakpointPayloads[breakpoint]));
    });
    payload.append("illustrations", JSON.stringify({}));
    payload.append(
      "features",
      JSON.stringify(
        formState.features.map((feature) => ({
          title: feature.title,
          description: feature.description,
          icon: feature.icon,
        }))
      )
    );

    if (formState.heroDesktopFile) {
      payload.append("heroDesktopImage", formState.heroDesktopFile);
    }
    if (formState.heroMobileFile) {
      payload.append("heroMobileImage", formState.heroMobileFile);
    }
    if (formState.bottomDesktopFile) {
      payload.append("bottomDesktopImage", formState.bottomDesktopFile);
    }
    if (formState.bottomMobileFile) {
      payload.append("bottomMobileImage", formState.bottomMobileFile);
    }
    if (formState.addressFile) {
      payload.append("addressIllustration", formState.addressFile);
    }

    formState.features.forEach((feature, index) => {
      if (feature.file) {
        payload.append(`featureIcon_${index}`, feature.file);
      }
    });

    setSaving(true);
    try {
      const { data } = await apiClient.put("/api/admin/site-content/home", payload);
      if (data.success) {
        toast.success("Homepage content updated");
        await fetchContent();
      } else {
        toast.error(data.message || "Failed to update homepage content");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update homepage content"
      );
    } finally {
      setSaving(false);
    }
  };

  if (homeContentLoading || homeContent === null) {
    return (
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`homepage-controls-skeleton-${index}`}
              className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm"
            />
          ))}
        </div>
        <div className="h-[720px] animate-pulse rounded-2xl border border-gray-200 bg-white shadow-sm" />
      </div>
    );
  }

  if (homeContentError && homeContent === defaultHomeContent) {
    return (
      <ErrorState
        title="Could not load homepage content"
        description={homeContentError}
        onRetry={fetchContent}
      />
    );
  }

  return (
    <form
      onSubmit={submitHomeContent}
      className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]"
    >
      <div className="space-y-4 xl:max-h-[calc(100vh-150px)] xl:overflow-y-auto xl:pr-2">
        <Panel className="overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50/50 p-5">
            <h2 className="text-lg font-bold text-gray-800">Homepage Editor</h2>
            <p className="mt-1.5 text-sm leading-6 text-gray-500">
              Edit live homepage content and validate it in the storefront-style preview before publishing.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      "Discard all unsaved changes and reset to published version?"
                    )
                  ) {
                    fetchContent();
                  }
                }}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              >
                <RotateCcw size={15} />
                Discard
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dull disabled:opacity-60"
              >
                <Save size={15} />
                {saving ? "Saving..." : "Publish"}
              </button>
            </div>
          </div>
          <div className="p-5">
            <div className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-xs leading-5 text-gray-600">
              The preview mirrors the homepage structure so admins can see
              layout, hierarchy, and messaging before publishing.
            </div>
            {/* Breakpoint tabs scope banner edits so mobile/tablet/desktop no longer overwrite each other. */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
              {[
                { key: "mobile", label: "Mobile", icon: Smartphone },
                { key: "tablet", label: "Tablet", icon: Tablet },
                { key: "desktop", label: "Desktop", icon: Monitor },
              ].map(({ key, label, icon }) => {
                const BreakpointIcon = icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setViewportMode(key === "desktop" ? "web" : key)}
                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-2 py-2 text-xs font-semibold transition ${
                      activeBreakpoint === key
                        ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                        : "text-gray-500 hover:bg-white/70 hover:text-gray-700"
                    }`}
                  >
                    <BreakpointIcon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel>
          <StaticSectionHeader
            title="Hero Banner"
            description="Headline, subheadline, CTAs, images, and text alignment."
            icon={LayoutTemplate}
          />
          <div className="mt-5 space-y-4">
            <PositionSelector
              label="Text position"
              value={activeDraft.heroPosition}
              onChange={(nextValue) =>
                updateBreakpointField("heroPosition", nextValue)
              }
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={activeDraft.heroTitle}
                onChange={(event) =>
                  updateBreakpointField("heroTitle", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Subtitle</label>
              <textarea
                rows={4}
                value={activeDraft.heroSubtitle}
                onChange={(event) =>
                  updateBreakpointField("heroSubtitle", event.target.value)
                }
                className={textAreaClassName}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Primary CTA</label>
                <input
                  value={activeDraft.ctaLabel}
                  onChange={(event) =>
                    updateBreakpointField("ctaLabel", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Primary Link</label>
                <input
                  value={activeDraft.ctaHref}
                  onChange={(event) =>
                    updateBreakpointField("ctaHref", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary CTA</label>
                <input
                  value={activeDraft.secondaryCtaLabel}
                  onChange={(event) =>
                    updateBreakpointField("secondaryCtaLabel", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary Link</label>
                <input
                  value={activeDraft.secondaryCtaHref}
                  onChange={(event) =>
                    updateBreakpointField("secondaryCtaHref", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Desktop image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField("heroDesktopFile", event.target.files?.[0] || null)
                  }
                  className={fileInputClassName}
                />
                <div className="mt-3">
                  <PreviewImage label="Desktop preview" src={previews.heroDesktop} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mobile image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField("heroMobileFile", event.target.files?.[0] || null)
                  }
                  className={fileInputClassName}
                />
                <div className="mt-3">
                  <PreviewImage label="Mobile preview" src={previews.heroMobile} />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <StaticSectionHeader
            title="Bottom Banner"
            description="Preview and control the promotional banner and feature stack."
            icon={ImageIcon}
          />
          <div className="mt-5 space-y-4">
            <PositionSelector
              label="Text position"
              value={activeDraft.bottomPosition}
              onChange={(nextValue) =>
                updateBreakpointField("bottomPosition", nextValue)
              }
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={activeDraft.bottomTitle}
                onChange={(event) =>
                  updateBreakpointField("bottomTitle", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Supporting copy
              </label>
              <textarea
                rows={3}
                value={activeDraft.bottomText}
                onChange={(event) =>
                  updateBreakpointField("bottomText", event.target.value)
                }
                className={textAreaClassName}
              />
              <p className="mt-2 text-xs text-gray-500">
                Stored with homepage content for compatibility. The current storefront focuses visually on the feature list.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Desktop image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField("bottomDesktopFile", event.target.files?.[0] || null)
                  }
                  className={fileInputClassName}
                />
                <div className="mt-3">
                  <PreviewImage label="Desktop preview" src={previews.bottomDesktop} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mobile image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    updateField("bottomMobileFile", event.target.files?.[0] || null)
                  }
                  className={fileInputClassName}
                />
                <div className="mt-3">
                  <PreviewImage label="Mobile preview" src={previews.bottomMobile} />
                </div>
              </div>
            </div>
          </div>
        </Panel>

        <Panel>
          <CollapsibleHeader
            title="Homepage Features"
            description={`${formState.features.length} feature blocks shown in the bottom banner preview.`}
            icon={Sparkles}
            open={featuresOpen}
            onToggle={() => setFeaturesOpen((prev) => !prev)}
          />
          {featuresOpen ? (
            <div className="mt-5 space-y-4">
              {formState.features.map((feature, index) => (
                <div
                  key={`feature-editor-${index}`}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-4"
                >
                  <p className="text-sm font-semibold text-gray-800">
                    Feature {index + 1}
                  </p>
                  <div className="mt-3 grid gap-4 md:grid-cols-[96px_1fr]">
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          updateFeature(index, {
                            file: event.target.files?.[0] || null,
                          })
                        }
                        className="block w-full text-sm text-gray-600"
                      />
                      <img
                        src={previews.featureIcons[index] || getImageUrl(feature.icon, "marketing")}
                        alt={feature.title || `Feature ${index + 1}`}
                        className="mt-3 h-20 w-20 rounded-xl border border-gray-200 object-cover"
                        onError={(event) => {
                          event.currentTarget.src = getImageFallback("marketing");
                        }}
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Title</label>
                        <input
                          value={feature.title}
                          onChange={(event) =>
                            updateFeature(index, { title: event.target.value })
                          }
                          className={inputClassName}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={feature.description}
                          onChange={(event) =>
                            updateFeature(index, {
                              description: event.target.value,
                            })
                          }
                          className={textAreaClassName}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Feature blocks are collapsed to keep the visual preview in focus. Expand to edit titles, descriptions, and icons.
            </div>
          )}
        </Panel>

        <Panel>
          <CollapsibleHeader
            title="Support Assets"
            description="Shared image assets currently managed from this page."
            icon={Eye}
            open={supportAssetsOpen}
            onToggle={() => setSupportAssetsOpen((prev) => !prev)}
          />
          {supportAssetsOpen ? (
            <div className="mt-5">
              <label className="text-sm font-medium text-gray-700">
                Address illustration
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  updateField("addressFile", event.target.files?.[0] || null)
                }
                className={fileInputClassName}
              />
              <div className="mt-3">
                <PreviewImage label="Address illustration preview" src={previews.address} />
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Expand to update the shared address illustration used outside the homepage flow.
            </div>
          )}
        </Panel>
      </div>

      <Panel
        title="Live Preview"
        description="Pixel-accurate storefront simulation with responsive scaling."
        className="xl:max-h-[calc(100vh-150px)] xl:overflow-hidden"
        action={
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50/50 p-1">
            {Object.entries(viewportConfig).map(([mode, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewportMode(mode)}
                  title={`Preview ${config.label}`}
                  className={`flex h-8 w-10 items-center justify-center rounded-md transition-all ${
                    viewportMode === mode
                      ? "bg-white text-primary shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:bg-white/50 hover:text-gray-700"
                  }`}
                >
                  <Icon size={16} />
                </button>
              );
            })}
          </div>
        }
      >
        <div 
          className="relative h-[600px] overflow-hidden rounded-xl border border-gray-200 bg-gray-100/30 xl:h-[calc(100vh-245px)]"
        >
          {/* Status Bar */}
          <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {currentConfig.label} View ({currentConfig.width}px)
              </span>
            </div>
          </div>

          <div className="absolute inset-0 overflow-auto px-4 pt-12 pb-20">
            <div 
              className="flex justify-center"
              style={{ 
                minHeight: "100%",
                paddingBottom: "100px" 
              }}
            >
              <div
                style={{
                  // Keep preview readable without transform zoom: desktop fills
                  // the pane, while tablet/mobile keep their real viewport width
                  // unless the admin panel is narrower.
                  width: viewportMode === "web" ? "100%" : currentConfig.width,
                  maxWidth: "100%",
                }}
                className="h-fit shrink-0 bg-white shadow-2xl ring-1 ring-black/5"
              >
                <HomepageVisualPreview
                  draftContent={draftContent}
                  categories={categoryList}
                  categoriesLoading={categoriesLoading}
                  bestSellers={allProducts.slice(0, 4)}
                  viewportMode={viewportMode}
                  onHeroFieldChange={(field, value) => {
                    const map = {
                      title: "heroTitle",
                      subtitle: "heroSubtitle",
                      ctaLabel: "ctaLabel",
                      secondaryCtaLabel: "secondaryCtaLabel",
                    };
                    updateBreakpointField(map[field], value);
                  }}
                  onBottomFieldChange={(field, value) => {
                    const map = {
                      title: "bottomTitle",
                      text: "bottomText",
                    };
                    updateBreakpointField(map[field], value);
                  }}
                  onFeatureFieldChange={(index, field, value) =>
                    updateFeature(index, { [field]: value })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </form>
  );
};

export default HomepageManagement;
