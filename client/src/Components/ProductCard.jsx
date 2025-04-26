import React from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../Context/AppContext";

const ProductCard = ({ product }) => {
  const { navigate } = useAppContext();
  const { currency, addToCart, removeFromCart, cartItems } = useAppContext();
  if (!product) return null; // Prevent errors if product is undefined

  const itemQuantity = cartItems?.[product._id] || 0; // Avoid undefined errors

  return (
    <div
      onClick={() => {
        navigate(`/products/${product.category.toLowerCase()}/${product._id}`);
        scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="border border-gray-500/20 rounded-md bg-white w-[200px] max-w-[220px] mx-auto px-3 py-2"
    >
      <div className="group cursor-pointer flex items-center justify-center px-2">
        <img
          className="group-hover:scale-105 transition max-w-26 md:max-w-36"
          src={product?.image?.[0]}
          alt={product?.name || "Product"}
        />
      </div>
      <div className="text-gray-500/60 text-sm">
        <p>{product.category}</p>
        <p className="text-gray-700 font-medium text-lg truncate w-full">
          {product.name}
        </p>
        <div className="flex items-center gap-0.5">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <img
                key={i}
                className="md:w-3.5 w-3"
                src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                alt="rating"
              />
            ))}
          <p>({4})</p>
        </div>
        <div className="flex items-end justify-between mt-3">
          <p className="md:text-xl text-base font-medium text-primary">
            {currency}
            {product.offerPrice}{" "}
            <span className="text-gray-500/60 md:text-sm text-xs line-through">
              {currency} {product.price}
            </span>
          </p>
          <div className="text-primary">
            {!itemQuantity ? (
              <button
                className="group flex items-center justify-center gap-2 px-4 py-2 bg-primary/25 hover:bg-primary-dark transition-all duration-300 rounded-md text-white cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product._id);
                }}
              >
                <img className="w-4" src={assets.cart_icon} alt="cart icon" />
                <span className="group-hover:scale-105 transition-transform duration-300 text-primary-dull">
                  Add
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-2 md:w-20 w-16 h-[34px] bg-primary/25 rounded select-none">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromCart(product._id);
                  }}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  -
                </button>
                <span className="w-5 text-center">{itemQuantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product._id);
                  }}
                  className="cursor-pointer text-md px-2 h-full"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
