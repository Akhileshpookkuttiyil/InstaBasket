import React, { useEffect, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";

const AllProducts = () => {
  const { products, searchQuery } = useAppContext();

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!products || products.length === 0) return;

    try {
      const filtered = searchQuery
        ? products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : products;

      setFilteredProducts(filtered);
      setLoading(false);
    } catch {
      setError("Failed to load products.");
      setLoading(false);
    }
  }, [products, searchQuery]);

  if (error) {
    return <p className="text-center text-red-500 mt-10 px-4">{error}</p>;
  }

  const inStockProducts = filteredProducts.filter((product) => product.inStock);

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
        ) : inStockProducts.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 mt-10">
            No products found.
          </div>
        ) : (
          inStockProducts.map((product, index) => (
            <ProductCard key={index} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default AllProducts;
