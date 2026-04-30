import React from "react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, removeFromCart, cartItems } = useCartStore();
  const { user } = useAuthStore();
  const currency = import.meta.env.VITE_CURRENCY || "$";

  if (!product) return null;

  const itemQuantity = cartItems?.[product._id] || 0;
  const stockCount = Number(product?.countInStock || 0);
  const isOutOfStock = !product?.inStock || stockCount <= 0;
  const isAtMaxStock = stockCount > 0 && itemQuantity >= stockCount;
  const mrp = Number(product?.price || 0);
  const offer = Number(product?.offerPrice || 0);
  const discountPercent =
    mrp > offer && mrp > 0 ? Math.round(((mrp - offer) / mrp) * 100) : 0;
  const rating = Number(product?.rating ?? 0);
  const ratingCount = Number(product?.ratingCount ?? 0);

  return (
    <div
      onClick={() => {
        navigate(
          `/products/${String(product?.category || "unknown").toLowerCase()}/${
            product._id
          }`
        );
        scrollTo({ top: 0, behavior: "smooth" });
      }}
      className="group relative mx-auto flex h-full w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
    >
      <div className="relative flex h-44 shrink-0 items-center justify-center bg-gradient-to-b from-gray-50 to-white p-3 sm:h-48">
        {/* Responsive badge stack prevents discount and stock labels from colliding on narrow cards. */}
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-col items-start gap-1.5 sm:flex-row sm:items-start sm:justify-between">
          {discountPercent > 0 && (
            <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-gray-900">
              {discountPercent}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="rounded-full bg-gray-800 px-2.5 py-1 text-[11px] font-medium text-white sm:ml-auto">
              Out of Stock
            </span>
          )}
        </div>
        <img
          className="relative z-0 h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          src={getImageUrl(product?.image?.[0], "product")}
          alt={product?.name || "Product"}
          onError={(e) => {
            e.currentTarget.src = getImageFallback("product");
          }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3 sm:p-3.5">
        {/* Fixed content bands keep every card the same height across title length and stock states. */}
        <div className="flex flex-col gap-1">
          <p className="truncate text-[11px] uppercase tracking-wide text-gray-500">
            {product.category}
          </p>
          <p className="line-clamp-2 min-h-[40px] overflow-hidden text-[15px] font-semibold leading-[1.35] text-gray-800">
            {product.name}
          </p>
        </div>

        <div className="flex min-w-0 items-center gap-0.5 text-xs text-gray-500">
          {Array(5)
            .fill("")
            .map((_, i) => (
              <img
                key={i}
                className="w-3.5"
                src={i < Math.round(rating) ? assets.star_icon : assets.star_dull_icon}
                alt="rating"
              />
            ))}
          <p className="ml-1 truncate">
            ({rating.toFixed(1)}{ratingCount > 0 ? ` · ${ratingCount}` : ""})
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-lg font-bold text-gray-900">
              {currency} {offer}
            </span>
            {mrp > 0 && (
              <span className="text-xs text-gray-500 line-through">
                {currency} {mrp}
              </span>
            )}
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full justify-start text-primary sm:w-auto sm:justify-end"
          >
            {!itemQuantity ? (!isOutOfStock ? (
              <button
                className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-primary-dull sm:w-auto"
                onClick={() => {
                  addToCart(product._id, user);
                }}
              >
                <img
                  className="w-3.5 brightness-0 invert"
                  src={assets.cart_icon}
                  alt="cart icon"
                />
                <span>Add</span>
              </button>
            ) : (
              <button
                className="min-h-[38px] w-full rounded-md border border-gray-300 bg-gray-100 px-3.5 py-2 text-sm font-medium text-gray-500 cursor-not-allowed sm:w-auto"
                disabled
              >
                Out of Stock
              </button>
            )) : (
              <div className="flex h-[34px] w-full items-center justify-between overflow-hidden rounded-md border border-primary/35 bg-primary/10 select-none sm:w-auto sm:justify-start">
                <button
                  onClick={() => {
                    removeFromCart(product._id, user);
                  }}
                  className="h-full px-2.5 text-base font-semibold hover:bg-primary/20"
                >
                  -
                </button>
                <span className="min-w-8 text-center text-sm font-semibold text-gray-800">
                  {itemQuantity}
                </span>
                <button
                  onClick={() => {
                    addToCart(product._id, user);
                  }}
                  disabled={isOutOfStock || isAtMaxStock}
                  className="h-full px-2.5 text-base font-semibold hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-40"
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
