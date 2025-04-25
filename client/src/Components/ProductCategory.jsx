import React from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../Context/AppContext";
import { categories } from "../assets/assets";
import ProductCard from "./ProductCard";

const ProductCategory = () => {
  const { products } = useAppContext();
  const { category } = useParams();

  // Normalize the category for case-insensitive matching
  const categoryName = category?.toLowerCase();

  // Find the corresponding category object
  const foundCategory = categories.find(
    (item) => item.path.toLowerCase() === categoryName
  );

  // Filter products by category
  const productsInCategory = products.filter(
    (product) => product.category.toLowerCase() === categoryName
  );

  // Render if category not found
  if (!foundCategory) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <p className="text-2xl font-medium text-primary">Category not found!</p>
      </div>
    );
  }

  // Main component rendering
  return (
    <div className="mt-16">
      {/* Header */}
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium">
          {foundCategory.text.toUpperCase()}
        </p>
        <div className="w-16 h-0.5 rounded-full bg-primary"></div>
      </div>

      {/* Product Grid */}
      {productsInCategory.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6">
          {productsInCategory.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-2xl font-medium text-primary">No Products Found</p>
        </div>
      )}
    </div>
  );
};

export default ProductCategory;
