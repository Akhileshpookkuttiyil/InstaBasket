import React from "react";
import useContentStore from "../store/useContentStore";
import { defaultHomeContent } from "../shared/content/defaultContent";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const BottomBanner = () => {
  const { homeContent } = useContentStore();
  const bottomBanner = homeContent?.bottomBanner || defaultHomeContent.bottomBanner;
  const features = homeContent?.features?.length
    ? homeContent.features
    : defaultHomeContent.features;

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

      <div className="absolute inset-0 flex flex-col items-center md:items-end md:justify-center pt-16 md:pt-0 md:pr-24">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-primary">
            {bottomBanner?.title || defaultHomeContent.bottomBanner.title}
          </h1>
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-4 mt-4 transition duration-300 ease-in-out transform hover:scale-105"
            >
              <img
                src={getImageUrl(feature.icon, "marketing")}
                alt={feature.title}
                className="md:w-11 w-9"
                onError={(event) => {
                  event.currentTarget.src = getImageFallback("marketing");
                }}
              />
              <div>
                <h3 className="text-lg md:text-xl font-semibold">
                  {feature.title}
                </h3>
                <p className="text-gray-500/70 text-xs sm:text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BottomBanner;
