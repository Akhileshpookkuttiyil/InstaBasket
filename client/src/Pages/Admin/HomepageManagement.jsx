import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  Image as ImageIcon,
  LayoutTemplate,
  Save,
  Sparkles,
} from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import useContentStore from "../../store/useContentStore";
import { defaultHomeContent } from "../../shared/content/defaultContent";
import { HOMEPAGE_TEXT_POSITION_OPTIONS } from "../../shared/content/homepageLayout";
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

  const [saving, setSaving] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [supportAssetsOpen, setSupportAssetsOpen] = useState(false);
  const [formState, setFormState] = useState({
    heroTitle: "",
    heroSubtitle: "",
    heroPosition: "center-left",
    ctaLabel: "",
    ctaHref: "",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
    bottomTitle: "",
    bottomText: "",
    bottomPosition: "center-right",
    heroDesktopFile: null,
    heroMobileFile: null,
    bottomDesktopFile: null,
    bottomMobileFile: null,
    addressFile: null,
    features: [createFeatureDraft(), createFeatureDraft(), createFeatureDraft(), createFeatureDraft()],
  });

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
      heroTitle: effectiveContent?.heroBanner?.title || "",
      heroSubtitle: effectiveContent?.heroBanner?.subtitle || "",
      heroPosition:
        effectiveContent?.heroBanner?.position ||
        defaultHomeContent.heroBanner.position,
      ctaLabel: effectiveContent?.heroBanner?.cta?.label || "",
      ctaHref: effectiveContent?.heroBanner?.cta?.href || "",
      secondaryCtaLabel:
        effectiveContent?.heroBanner?.secondaryCta?.label || "",
      secondaryCtaHref:
        effectiveContent?.heroBanner?.secondaryCta?.href || "",
      bottomTitle: effectiveContent?.bottomBanner?.title || "",
      bottomText: effectiveContent?.bottomBanner?.text || "",
      bottomPosition:
        effectiveContent?.bottomBanner?.position ||
        defaultHomeContent.bottomBanner.position,
      heroDesktopFile: null,
      heroMobileFile: null,
      bottomDesktopFile: null,
      bottomMobileFile: null,
      addressFile: null,
      features: nextFeatures.length
        ? nextFeatures
        : [createFeatureDraft(), createFeatureDraft(), createFeatureDraft(), createFeatureDraft()],
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

  const draftContent = useMemo(
    () => ({
      heroBanner: {
        desktopImage: previews.heroDesktop,
        mobileImage: previews.heroMobile,
        position: formState.heroPosition,
        title: formState.heroTitle,
        subtitle: formState.heroSubtitle,
        cta: {
          label: formState.ctaLabel,
          href: formState.ctaHref,
        },
        secondaryCta: {
          label: formState.secondaryCtaLabel,
          href: formState.secondaryCtaHref,
        },
      },
      bottomBanner: {
        desktopImage: previews.bottomDesktop,
        mobileImage: previews.bottomMobile,
        position: formState.bottomPosition,
        title: formState.bottomTitle,
        text: formState.bottomText,
      },
      features: formState.features.map((feature, index) => ({
        title: feature.title,
        description: feature.description,
        icon: previews.featureIcons[index] || getImageUrl(feature.icon, "marketing"),
      })),
      illustrations: {
        address: previews.address,
      },
    }),
    [
      formState.bottomPosition,
      formState.bottomText,
      formState.bottomTitle,
      formState.ctaHref,
      formState.ctaLabel,
      formState.features,
      formState.heroPosition,
      formState.heroSubtitle,
      formState.heroTitle,
      formState.secondaryCtaHref,
      formState.secondaryCtaLabel,
      previews,
    ]
  );

  const updateField = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
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

    const payload = new FormData();
    payload.append(
      "heroBanner",
      JSON.stringify({
        title: formState.heroTitle,
        subtitle: formState.heroSubtitle,
        position: formState.heroPosition,
        cta: {
          label: formState.ctaLabel,
          href: formState.ctaHref,
        },
        secondaryCta: {
          label: formState.secondaryCtaLabel,
          href: formState.secondaryCtaHref,
        },
      })
    );
    payload.append(
      "bottomBanner",
      JSON.stringify({
        title: formState.bottomTitle,
        text: formState.bottomText,
        position: formState.bottomPosition,
      })
    );
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
        <Panel
          title="Homepage Editor"
          description="Edit live homepage content and validate it in the storefront-style preview before publishing."
          action={
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:opacity-60"
            >
              <Save size={15} />
              {saving ? "Saving..." : "Publish"}
            </button>
          }
        >
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-gray-600">
            The preview mirrors the homepage structure so admins can see layout, hierarchy, and messaging before publishing.
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
              value={formState.heroPosition}
              onChange={(nextValue) => updateField("heroPosition", nextValue)}
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={formState.heroTitle}
                onChange={(event) => updateField("heroTitle", event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Subtitle</label>
              <textarea
                rows={4}
                value={formState.heroSubtitle}
                onChange={(event) => updateField("heroSubtitle", event.target.value)}
                className={textAreaClassName}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Primary CTA</label>
                <input
                  value={formState.ctaLabel}
                  onChange={(event) => updateField("ctaLabel", event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Primary Link</label>
                <input
                  value={formState.ctaHref}
                  onChange={(event) => updateField("ctaHref", event.target.value)}
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary CTA</label>
                <input
                  value={formState.secondaryCtaLabel}
                  onChange={(event) =>
                    updateField("secondaryCtaLabel", event.target.value)
                  }
                  className={inputClassName}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary Link</label>
                <input
                  value={formState.secondaryCtaHref}
                  onChange={(event) =>
                    updateField("secondaryCtaHref", event.target.value)
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
              value={formState.bottomPosition}
              onChange={(nextValue) => updateField("bottomPosition", nextValue)}
            />

            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={formState.bottomTitle}
                onChange={(event) => updateField("bottomTitle", event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Supporting copy
              </label>
              <textarea
                rows={3}
                value={formState.bottomText}
                onChange={(event) => updateField("bottomText", event.target.value)}
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
        description="A storefront-style mockup that updates instantly as you edit content."
        className="xl:max-h-[calc(100vh-150px)] xl:overflow-hidden"
      >
        <div className="xl:max-h-[calc(100vh-245px)] xl:overflow-y-auto xl:pr-1">
          <HomepageVisualPreview
            draftContent={draftContent}
            categories={categoryList}
            categoriesLoading={categoriesLoading}
            onHeroFieldChange={(field, value) => {
              const map = {
                title: "heroTitle",
                subtitle: "heroSubtitle",
                ctaLabel: "ctaLabel",
                secondaryCtaLabel: "secondaryCtaLabel",
              };
              updateField(map[field], value);
            }}
            onBottomFieldChange={(field, value) => {
              const map = {
                title: "bottomTitle",
                text: "bottomText",
              };
              updateField(map[field], value);
            }}
            onFeatureFieldChange={(index, field, value) =>
              updateFeature(index, { [field]: value })
            }
          />
        </div>
      </Panel>
    </form>
  );
};

export default HomepageManagement;
