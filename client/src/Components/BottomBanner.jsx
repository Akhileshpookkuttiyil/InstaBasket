import React from "react";
import useContentStore from "../store/useContentStore";
import { defaultHomeContent } from "../shared/content/defaultContent";
import {
  getHomepageBlockClasses,
  getHomepageOverlayClasses,
} from "../shared/content/homepageLayout";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const BottomBanner = () => {
  const { homeContent, homeContentLoading } = useContentStore();
  const bottomBanner = homeContent?.bottomBanner || defaultHomeContent.bottomBanner;
  const bottomPosition =
    bottomBanner?.position || defaultHomeContent.bottomBanner.position;
  const features = homeContent?.features?.length
    ? homeContent.features
    : defaultHomeContent.features;

  if (homeContentLoading || homeContent === null) {
    return (
      <div className="relative mt-24 overflow-hidden rounded-[32px] bg-slate-100">
        <div className="hidden h-[360px] animate-pulse md:block" />
        <div className="h-[420px] animate-pulse md:hidden" />
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:items-end md:px-24">
          <div className="w-full max-w-md">
            <div className="h-10 w-2/3 rounded-full bg-white/85" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`feature-skeleton-${index}`} className="mt-6 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white/80" />
                <div className="flex-1">
                  <div className="h-4 w-2/3 rounded-full bg-white/80" />
                  <div className="mt-2 h-3 w-full rounded-full bg-white/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-24">
      <img
        src={getImageUrl(bottomBanner?.desktopImage, "marketing")}
        alt="bottom banner"
        className="w-full hidden md:block"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />
      <img
        src={getImageUrl(bottomBanner?.mobileImage, "marketing")}
        alt="bottom banner"
        className="w-full md:hidden"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />

      <div className="absolute inset-0">
        <div
          className={`mx-auto flex h-full max-w-7xl px-6 py-8 md:px-10 lg:px-16 ${getHomepageOverlayClasses(
            bottomPosition
          )}`}
        >
          <div
            className={`flex max-w-md flex-col ${getHomepageBlockClasses(
              bottomPosition
            )}`}
          >
            <h1 className="text-2xl font-semibold text-primary md:text-3xl">
              {bottomBanner?.title || defaultHomeContent.bottomBanner.title}
            </h1>
            {features.map((feature, index) => {
              const isCentered = bottomPosition === "center";
              const isRightAligned = bottomPosition.includes("right");
              return (
                <div
                  key={index}
                  className={`mt-6 flex w-full transition-all duration-300 hover:scale-105 ${
                    isCentered
                      ? "flex-col items-center text-center"
                      : "flex-row items-center gap-4"
                  }`}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                    <img
                      src={getImageUrl(feature.icon, "marketing")}
                      alt={feature.title}
                      className="max-h-full max-w-full object-contain"
                      onError={(event) => {
                        event.currentTarget.src = getImageFallback("marketing");
                      }}
                    />
                  </div>
                  <div
                    className={`${
                      isCentered ? "mt-3 max-w-xs" : "flex-1 min-w-0"
                    } ${isRightAligned ? "text-right" : "text-left"}`}
                  >
                    <h3 className="text-lg font-bold md:text-xl">
                      {feature.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500/80 sm:text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomBanner;
