import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../Context/AppContext";

const BestSeller = () => {
  const { products } = useAppContext();

  return (
    <div className="mt-16 px-4">
      <p className="text-2xl md:text-3xl font-medium">Best Sellers</p>

      {/* Responsive grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 mt-6">
        {products
          .filter((product) => product.inStock)
          .slice(0, 5) // Only display 5
          .map((product) => (
            <div key={product._id} className="w-full h-auto max-w-xs mx-auto">
              <ProductCard product={product} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default BestSeller;
