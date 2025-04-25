import React, { useEffect, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import ProductCard from "./ProductCard";

const AllProducts = () => {
  const { products, searchQuery } = useAppContext();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (searchQuery.length > 0) {
        setFilteredProducts(
          products.filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      } else {
        setFilteredProducts(products);
      }
      setLoading(false);
    } catch {
      setError("Failed to load products.");
      setLoading(false);
    }
  }, [products, searchQuery]);

  if (error) {
    return <p className="text-center text-red-500 mt-10">{error}</p>;
  }

  return loading ? (
    <div className="text-center mt-10">Loading products...</div>
  ) : (
    <div className="mt-16 flex flex-col">
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium uppercase">All Products</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6 lg:grid-cols-5 mt-6">
        {filteredProducts.filter((product) => product.inStock).length === 0 ? (
          <p className="text-center text-gray-500 mt-10">No products found.</p>
        ) : (
          filteredProducts
            .filter((product) => product.inStock)
            .map((product, index) => (
              <ProductCard key={index} product={product} />
            ))
        )}
      </div>
    </div>
  );
};

export default AllProducts;
