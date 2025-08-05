// components/ProductSkeleton.jsx
import React from "react";

const ProductSkeleton = () => {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow p-4 space-y-3">
      <div className="bg-gray-300 h-40 w-full rounded-md"></div>
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-6 bg-gray-300 rounded w-1/3"></div>
    </div>
  );
};

export default ProductSkeleton;
