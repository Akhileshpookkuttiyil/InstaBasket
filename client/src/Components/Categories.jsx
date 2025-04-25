import React from "react";
import { categories } from "../assets/assets";
import { useAppContext } from "../Context/AppContext";

const Categories = () => {
  const { navigate } = useAppContext();

  return (
    <div className="mt-16">
      {/* Header */}
      <p className="text-2xl md:text-3xl font-medium">Categories</p>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 mt-6 gap-6">
        {categories.map((category) => (
          <div
            key={category.path} // Use a unique key for performance optimization
            className="group cursor-pointer py-5 px-3 rounded-lg flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-transform duration-200"
            style={{ backgroundColor: category.bgColor }}
            onClick={() => {
              // Smooth navigation and scrolling
              navigate(`/products/${category.path.toLowerCase()}`);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            {/* Category Image */}
            <img
              src={category.image}
              alt={category.text}
              className="group-hover:scale-105 transition-transform duration-200 max-w-[100px]"
            />
            {/* Category Name */}
            <p className="text-sm font-medium text-center mt-2">
              {category.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
