import React, { useEffect, useState } from "react";
import useContentStore from "../store/useContentStore";
import { defaultHomeContent } from "../shared/content/defaultContent";
import {
  getHomepageBlockClasses,
  getHomepageBreakpointContent,
  getHomepageOverlayClasses,
} from "../shared/content/homepageLayout";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const getCurrentBreakpoint = () => {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
};

const BottomBanner = () => {
  const { homeContent, homeContentLoading } = useContentStore();
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint);
  const responsiveContent = getHomepageBreakpointContent(
    homeContent || defaultHomeContent,
    breakpoint
  );
  const bottomBanner =
    responsiveContent?.bottomBanner || defaultHomeContent.bottomBanner;
  const bottomPosition =
    bottomBanner?.position || defaultHomeContent.bottomBanner.position;
  const features = homeContent?.features?.length
    ? homeContent.features
    : defaultHomeContent.features;

  useEffect(() => {
    const handleResize = () => setBreakpoint(getCurrentBreakpoint());
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    <div className="relative mt-24 w-full max-w-full overflow-hidden">
      <img
        src={getImageUrl(bottomBanner?.desktopImage, "marketing")}
        alt="bottom banner"
        className="hidden min-h-[360px] w-full max-w-full object-cover md:block"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />
      <img
        src={getImageUrl(bottomBanner?.mobileImage, "marketing")}
        alt="bottom banner"
        className="block min-h-[420px] w-full max-w-full object-cover md:hidden"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`mx-auto flex h-full max-w-7xl px-4 py-6 sm:px-6 md:px-10 lg:px-16 ${getHomepageOverlayClasses(
            bottomPosition
          )}`}
        >
          <div
            className={`flex w-full max-w-md min-w-0 flex-col ${getHomepageBlockClasses(
              bottomPosition
            )}`}
          >
            <h1 className="w-full max-w-[24rem] text-2xl font-semibold text-primary md:text-3xl">
              {bottomBanner?.title || defaultHomeContent.bottomBanner.title}
            </h1>
            {features.map((feature, index) => {
              const isCentered = bottomPosition === "center";
              const isRightAligned = bottomPosition.includes("right");
              return (
                <div
                  key={index}
                  className={`mt-4 flex w-full max-w-[24rem] min-w-0 transition-all duration-300 hover:scale-105 md:mt-6 ${
                    isCentered
                      ? "flex-col items-center text-center"
                      : `items-center gap-4 ${
                          // Right-aligned banner positions keep the icons on
                          // the right edge so the heading text ends there too.
                          isRightAligned
                            ? "flex-row-reverse justify-start"
                            : "flex-row justify-start"
                        }`
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
                      // Fixed text column width keeps icon/text groups aligned
                      // across rows without adding extra desktop/tablet space.
                      isCentered ? "mt-3 max-w-xs" : "min-w-0 w-full max-w-xs"
                    } ${isRightAligned ? "text-right" : "text-left"}`}
                  >
                    <h3 className="break-words text-lg font-bold md:text-xl">
                      {feature.title}
                    </h3>
                    <p className="mt-1 break-words text-xs text-gray-500/80 sm:text-sm">
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
