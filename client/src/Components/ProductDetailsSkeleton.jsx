import React from "react";

const ProductDetailsSkeleton = () => {
  return (
    <div className="mt-12 animate-pulse">
      {/* Breadcrumb */}
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-6"></div>

      {/* Main Layout */}
      <div className="flex flex-col md:flex-row gap-16">
        {/* Image Section */}
        <div className="flex gap-4">
          {/* Thumbnail List */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[70px] h-[70px] bg-gray-300 rounded" />
            ))}
          </div>

          {/* Main Image */}
          <div className="w-[300px] h-[300px] bg-gray-300 rounded" />
        </div>

        {/* Text Section */}
        <div className="w-full md:w-1/2 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/4" />

          {/* Price */}
          <div className="mt-6 space-y-2">
            <div className="h-4 bg-gray-300 rounded w-1/3" />
            <div className="h-6 bg-gray-300 rounded w-1/4" />
          </div>

          {/* Description */}
          <div className="space-y-2 mt-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-300 rounded w-full" />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-10">
            <div className="h-10 bg-gray-300 rounded w-full" />
            <div className="h-10 bg-gray-300 rounded w-full" />
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-20">
        <div className="h-6 bg-gray-300 rounded w-1/4 mx-auto mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[250px] bg-gray-300 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsSkeleton;
