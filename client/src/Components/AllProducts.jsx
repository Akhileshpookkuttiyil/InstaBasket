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
    // Wait for products to be loaded
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
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  const inStockProducts = filteredProducts.filter((product) => product.inStock);

  return (
    <div className="mt-16 flex flex-col">
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium uppercase">All Products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <ProductSkeleton key={index} />
          ))
        ) : inStockProducts.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full mt-10">
            No products found.
          </p>
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
