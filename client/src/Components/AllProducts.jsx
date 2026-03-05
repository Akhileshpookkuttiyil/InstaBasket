import React, { useMemo } from "react";
import useProductStore from "../store/useProductStore";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";

const AllProducts = () => {
  const { products, searchQuery, loading } = useProductStore();

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = searchQuery
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesSearch && product.inStock;
    });
  }, [products, searchQuery]);

  return (
    <div className="mt-16 px-4 sm:px-6 lg:px-12">
      {/* Heading */}
      <div className="flex flex-col items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold uppercase text-center">
          All Products
        </h2>
        <div className="w-16 h-1 bg-primary rounded-full mt-2" />
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {loading ? (
          Array.from({ length: 10 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 mt-10">
            No products found for "{searchQuery}".
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default AllProducts;
