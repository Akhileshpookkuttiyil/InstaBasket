import React from "react";
import { useNavigate } from "react-router-dom";
import useContentStore from "../store/useContentStore";
import { getImageUrl, getImageFallback } from "../shared/lib/image";

const Categories = () => {
  const navigate = useNavigate();
  const { categories, categoriesLoading, categoriesError } = useContentStore();
  const hasCategories = Array.isArray(categories) && categories.length > 0;

  return (
    <div className="mt-16">
      <p className="text-2xl md:text-3xl font-medium">Categories</p>

      {categoriesLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={`category-skeleton-${index}`}
              className="h-36 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : categoriesError ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-5 text-sm text-rose-700">
          {categoriesError}
        </div>
      ) : categories === null ? null : !hasCategories ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No categories are published yet.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
          {categories.map((category) => (
            <div
              key={category.slug}
              className="group cursor-pointer rounded-lg px-3 py-5 shadow-md transition-transform duration-200 hover:shadow-lg"
              style={{ backgroundColor: category.bgColor || "#F5F5F5" }}
              onClick={() => {
                navigate(`/products/${category.slug}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <img
                  src={getImageUrl(category.image, "category")}
                  alt={category.text || category.name}
                  className="max-w-[100px] transition-transform duration-200 group-hover:scale-105"
                  onError={(event) => {
                    event.currentTarget.src = getImageFallback("category");
                  }}
                />
                <p className="mt-2 text-center text-sm font-medium">
                  {category.text || category.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
