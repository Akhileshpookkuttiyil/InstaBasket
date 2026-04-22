import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import useProductStore from "../store/useProductStore";
import ProductCard from "./ProductCard";
import useContentStore from "../store/useContentStore";

const ProductCategory = () => {
  const { products } = useProductStore();
  const { categories, categoriesLoading } = useContentStore();
  const { category } = useParams();

  const categoryName = category?.toLowerCase();
  const normalizeValue = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const foundCategory = useMemo(() => 
    (categories || []).find((item) => {
      const slug = String(item.slug || "").toLowerCase();
      return slug === categoryName;
    }),
    [categories, categoryName]
  );

  const productsInCategory = useMemo(() => 
    products.filter((product) => 
      typeof product.category === "string" &&
      normalizeValue(product.category) === normalizeValue(categoryName)
    ),
    [products, categoryName]
  );

  if (categoriesLoading || categories === null) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <p className="text-lg font-medium text-slate-500">Loading category...</p>
      </div>
    );
  }

  if (!foundCategory) {
    return (
      <div className="mt-16 flex items-center justify-center">
        <p className="text-2xl font-medium text-primary">Category not found!</p>
      </div>
    );
  }

  return (
    <div className="mt-16">
      {/* Header */}
      <div className="flex flex-col items-end w-max">
        <p className="text-2xl font-medium">
          {(foundCategory.text || foundCategory.name).toUpperCase()}
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
