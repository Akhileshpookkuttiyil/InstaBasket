import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";
import useContentStore from "../../store/useContentStore";
import { defaultHomeContent } from "../../shared/content/defaultContent";
import { getImageFallback, getImageUrl } from "../../shared/lib/image";

const createFeatureDraft = (feature = {}) => ({
  title: feature.title || "",
  description: feature.description || "",
  icon: feature.icon || null,
  file: null,
});

const filePreview = (file, fallback) => (file ? URL.createObjectURL(file) : fallback);

const HomepageManagement = () => {
  const { homeContent, homeContentLoading, homeContentError, fetchContent } =
    useContentStore();
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState({
    heroTitle: "",
    heroSubtitle: "",
    ctaLabel: "",
    ctaHref: "",
    secondaryCtaLabel: "",
    secondaryCtaHref: "",
    bottomTitle: "",
    bottomText: "",
    heroDesktopFile: null,
    heroMobileFile: null,
    bottomDesktopFile: null,
    bottomMobileFile: null,
    addressFile: null,
    features: [createFeatureDraft(), createFeatureDraft(), createFeatureDraft(), createFeatureDraft()],
  });

  const effectiveContent = homeContent || defaultHomeContent;

  useEffect(() => {
    if (homeContentLoading || homeContent === null) {
      return;
    }

    const nextFeatures = (effectiveContent?.features?.length
      ? effectiveContent.features
      : defaultHomeContent.features
    ).map((feature) => createFeatureDraft(feature));

    setFormState((prev) => ({
      ...prev,
      heroTitle: effectiveContent?.heroBanner?.title || "",
      heroSubtitle: effectiveContent?.heroBanner?.subtitle || "",
      ctaLabel: effectiveContent?.heroBanner?.cta?.label || "",
      ctaHref: effectiveContent?.heroBanner?.cta?.href || "",
      secondaryCtaLabel: effectiveContent?.heroBanner?.secondaryCta?.label || "",
      secondaryCtaHref: effectiveContent?.heroBanner?.secondaryCta?.href || "",
      bottomTitle: effectiveContent?.bottomBanner?.title || "",
      bottomText: effectiveContent?.bottomBanner?.text || "",
      heroDesktopFile: null,
      heroMobileFile: null,
      bottomDesktopFile: null,
      bottomMobileFile: null,
      addressFile: null,
      features: nextFeatures,
    }));
  }, [effectiveContent, homeContent, homeContentLoading]);

  const previews = useMemo(
    () => ({
      heroDesktop: filePreview(
        formState.heroDesktopFile,
        getImageUrl(effectiveContent?.heroBanner?.desktopImage, "marketing")
      ),
      heroMobile: filePreview(
        formState.heroMobileFile,
        getImageUrl(effectiveContent?.heroBanner?.mobileImage, "marketing")
      ),
      bottomDesktop: filePreview(
        formState.bottomDesktopFile,
        getImageUrl(effectiveContent?.bottomBanner?.desktopImage, "marketing")
      ),
      bottomMobile: filePreview(
        formState.bottomMobileFile,
        getImageUrl(effectiveContent?.bottomBanner?.mobileImage, "marketing")
      ),
      address: filePreview(
        formState.addressFile,
        getImageUrl(effectiveContent?.illustrations?.address, "marketing")
      ),
    }),
    [effectiveContent, formState]
  );

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
      })
    );
    payload.append(
      "illustrations",
      JSON.stringify({})
    );
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

    if (formState.heroDesktopFile) payload.append("heroDesktopImage", formState.heroDesktopFile);
    if (formState.heroMobileFile) payload.append("heroMobileImage", formState.heroMobileFile);
    if (formState.bottomDesktopFile) payload.append("bottomDesktopImage", formState.bottomDesktopFile);
    if (formState.bottomMobileFile) payload.append("bottomMobileImage", formState.bottomMobileFile);
    if (formState.addressFile) payload.append("addressIllustration", formState.addressFile);

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
      toast.error(error.response?.data?.message || "Failed to update homepage content");
    } finally {
      setSaving(false);
    }
  };

  const PreviewImage = ({ label, src }) => (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{label}</p>
      <img
        src={src || getImageFallback("marketing")}
        alt={label}
        className="h-36 w-full rounded-2xl border border-gray-200 object-cover"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />
    </div>
  );

  if (homeContentLoading || homeContent === null) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <section
            key={`homepage-section-skeleton-${index}`}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="h-7 w-48 animate-pulse rounded-full bg-slate-200" />
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((__, fieldIndex) => (
                  <div
                    key={`homepage-field-skeleton-${index}-${fieldIndex}`}
                    className="h-12 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 2 }).map((__, previewIndex) => (
                  <div
                    key={`homepage-preview-skeleton-${index}-${previewIndex}`}
                    className="h-48 animate-pulse rounded-2xl bg-slate-100"
                  />
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  }

  if (homeContentError && homeContent === defaultHomeContent) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
        {homeContentError}
      </div>
    );
  }

  return (
    <form onSubmit={submitHomeContent} className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Hero Banner</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                value={formState.heroTitle}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, heroTitle: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Subtitle</label>
              <textarea
                rows={4}
                value={formState.heroSubtitle}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    heroSubtitle: event.target.value,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Primary CTA Text</label>
                <input
                  value={formState.ctaLabel}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, ctaLabel: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Primary CTA Link</label>
                <input
                  value={formState.ctaHref}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, ctaHref: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary CTA Text</label>
                <input
                  value={formState.secondaryCtaLabel}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      secondaryCtaLabel: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Secondary CTA Link</label>
                <input
                  value={formState.secondaryCtaHref}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      secondaryCtaHref: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Desktop Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    heroDesktopFile: event.target.files?.[0] || null,
                  }))
                }
                className="mt-2 block w-full text-sm text-gray-600"
              />
              <div className="mt-3">
                <PreviewImage label="Desktop Preview" src={previews.heroDesktop} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mobile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    heroMobileFile: event.target.files?.[0] || null,
                  }))
                }
                className="mt-2 block w-full text-sm text-gray-600"
              />
              <div className="mt-3">
                <PreviewImage label="Mobile Preview" src={previews.heroMobile} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Bottom Banner & Illustration</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Bottom Banner Title</label>
              <input
                value={formState.bottomTitle}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, bottomTitle: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bottom Banner Text</label>
              <textarea
                rows={4}
                value={formState.bottomText}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, bottomText: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Bottom Desktop Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      bottomDesktopFile: event.target.files?.[0] || null,
                    }))
                  }
                  className="mt-2 block w-full text-sm text-gray-600"
                />
                <div className="mt-3">
                  <PreviewImage label="Bottom Desktop Preview" src={previews.bottomDesktop} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Bottom Mobile Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      bottomMobileFile: event.target.files?.[0] || null,
                    }))
                  }
                  className="mt-2 block w-full text-sm text-gray-600"
                />
                <div className="mt-3">
                  <PreviewImage label="Bottom Mobile Preview" src={previews.bottomMobile} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Address Illustration</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  addressFile: event.target.files?.[0] || null,
                }))
              }
              className="mt-2 block w-full text-sm text-gray-600"
            />
            <div className="mt-3">
              <PreviewImage label="Address Illustration Preview" src={previews.address} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">Homepage Features</h2>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {formState.features.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
            >
              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      updateFeature(index, { file: event.target.files?.[0] || null })
                    }
                    className="block w-full text-sm text-gray-600"
                  />
                  <img
                    src={filePreview(
                      feature.file,
                      getImageUrl(feature.icon, "marketing")
                    )}
                    alt={feature.title || `Feature ${index + 1}`}
                    className="mt-3 h-24 w-24 rounded-2xl border border-gray-200 object-cover"
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
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      rows={3}
                      value={feature.description}
                      onChange={(event) =>
                        updateFeature(index, { description: event.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dull disabled:opacity-60"
        >
          {saving ? "Saving Homepage..." : "Save Homepage Content"}
        </button>
      </div>
    </form>
  );
};

export default HomepageManagement;
