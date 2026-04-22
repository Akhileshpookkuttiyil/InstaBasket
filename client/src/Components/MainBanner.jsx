import React, { memo } from "react";
import styles from "./MainBanner.module.css";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import useContentStore from "../store/useContentStore";
import { defaultHomeContent } from "../shared/content/defaultContent";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const MainBanner = memo(() => {
  const navigate = useNavigate();
  const { homeContent } = useContentStore();
  const heroBanner = homeContent?.heroBanner || defaultHomeContent.heroBanner;
  const desktopBanner = getImageUrl(heroBanner?.desktopImage, "marketing");
  const mobileBanner = getImageUrl(heroBanner?.mobileImage, "marketing");

  return (
    <div className="relative">
      <img
        rel="preload"
        srcSet={`${desktopBanner} 1024w, ${mobileBanner} 600w`}
        sizes="(max-width: 768px) 600px, 1024px"
        src={desktopBanner}
        alt="Promotional banner"
        className="w-full hidden md:block max-w-screen"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />
      <img
        rel="preload"
        srcSet={`${mobileBanner} 600w`}
        sizes="600px"
        src={mobileBanner}
        alt="Mobile-friendly promotional banner"
        className="w-full block md:hidden max-w-screen"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.src = getImageFallback("marketing");
        }}
      />

      <div
        className={`absolute inset-0 flex flex-col justify-center items-center md:items-start text-center md:text-left px-4 sm:px-6 md:px-10 lg:px-16 ${styles.fadeIn}`}
      >
        <h1 className="text-gray-800 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          {heroBanner?.title || defaultHomeContent.heroBanner.title}
        </h1>

        <p className="mt-4 text-gray-600 text-lg md:text-xl lg:text-2xl max-w-md">
          {heroBanner?.subtitle || defaultHomeContent.heroBanner.subtitle}
        </p>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Link
            className="group px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            to={heroBanner?.cta?.href || defaultHomeContent.heroBanner.cta.href}
          >
            {heroBanner?.cta?.label || defaultHomeContent.heroBanner.cta.label}
            <img
              className="transition-transform duration-300 group-hover:translate-x-1 md:hidden"
              src={assets.white_arrow_icon}
              alt="arrow"
            />
          </Link>
          <div
            role="button"
            className="group px-6 py-3 border border-gray-300 text-gray-800 hover:border-gray-400 hover:text-gray-900 font-medium rounded shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            onClick={() => {
              navigate(
                heroBanner?.secondaryCta?.href ||
                  defaultHomeContent.heroBanner.secondaryCta.href
              );
              scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {heroBanner?.secondaryCta?.label ||
              defaultHomeContent.heroBanner.secondaryCta.label}
            <img
              className="transition-transform duration-300 group-hover:translate-x-1"
              src={assets.black_arrow_icon}
              alt="arrow"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default MainBanner;
