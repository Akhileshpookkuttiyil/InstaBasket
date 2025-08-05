import React, { memo } from "react";
import styles from "./MainBanner.module.css";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";

const MainBanner = memo(() => {
  return (
    <div className="relative">
      {/* Banner Images with srcset */}
      <img
        rel="preload"
        srcSet={`${assets.main_banner_bg} 1024w, ${assets.main_banner_bg_sm} 600w`}
        sizes="(max-width: 768px) 600px, 1024px"
        src={assets.main_banner_bg}
        alt="Promotional banner"
        className="w-full hidden md:block max-w-screen"
        loading="lazy"
      />
      <img
        rel="preload"
        srcSet={`${assets.main_banner_bg_sm} 600w`}
        sizes="600px"
        src={assets.main_banner_bg_sm}
        alt="Mobile-friendly promotional banner"
        className="w-full block md:hidden max-w-screen"
        loading="lazy"
      />

      {/* Content */}
      <div
        className={`absolute inset-0 flex flex-col justify-center items-center md:items-start text-center md:text-left px-4 sm:px-6 md:px-10 lg:px-16 ${styles.fadeIn}`}
      >
        {/* Heading */}
        <h1 className="text-gray-800 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
          Discover Exclusive Deals!
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-gray-600 text-lg md:text-xl lg:text-2xl max-w-md">
          Shop the best products at unbeatable prices, tailored just for you.
        </p>

        {/* Buttons */}
        <div className="flex flex-col md:flex-row gap-4 mt-6">
          {/* Primary Button */}
          <Link
            className="group px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1 flex items-center gap-2"
            to="/products"
          >
            Start Shopping
            <img
              className="transition-transform duration-300 group-hover:translate-x-1 md:hidden"
              src={assets.white_arrow_icon}
              alt="arrow"
            />
          </Link>
          {/* Secondary Button */}
          <Link
            className="group px-6 py-3 border border-gray-300 text-gray-800 hover:border-gray-400 hover:text-gray-900 font-medium rounded shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            to="/products"
          >
            Explore Now
            <img
              className="transition-transform duration-300 group-hover:translate-x-1"
              src={assets.black_arrow_icon}
              alt="arrow"
            />
          </Link>
        </div>
      </div>
    </div>
  );
});

export default MainBanner;
