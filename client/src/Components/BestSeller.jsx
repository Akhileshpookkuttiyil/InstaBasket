import React from "react";
import ProductCard from "./ProductCard";
import { useAppContext } from "../Context/AppContext";

const BestSeller = () => {
  const { products } = useAppContext();

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Best Sellers</p>

      {/* Professionally responsive grid layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8 xl:gap-10 justify-items-center items-start mt-6">
        {products
          .filter((product) => product.inStock)
          .slice(0, 5)
          .map((product) => (
            <div key={product._id} className="w-64 h-80">
              <ProductCard product={product} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default BestSeller;
