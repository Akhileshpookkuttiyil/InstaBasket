import React, { useEffect, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import { Link, useParams } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../Components/ProductCard";
import ProductDetailsSkeleton from "../Components/ProductDetailsSkeleton";

const ProductDetails = () => {
  const { products, navigate, currency, addToCart } = useAppContext();
  const { id } = useParams();

  const [thumbnail, setThumbnail] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true); // ✅ new loading state

  const product = products.find((item) => item._id === id);

  // Simulate loading (fake timeout to mimic fetching)
  useEffect(() => {
    if (product) {
      setThumbnail(product.image[0]);
      setLoading(false); // ✅ hide skeleton after data is available
    }
  }, [product]);

  // Set related products
  useEffect(() => {
    if (products.length > 0 && product?.category) {
      const related = products.filter(
        (item) => item.category === product.category && item._id !== product._id
      );
      setRelatedProducts(related.slice(0, 5));
    }
  }, [products, product]);

  // ✅ Show skeleton while loading
  if (loading) {
    return <ProductDetailsSkeleton />;
  }

  // Handle not found
  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-medium text-gray-500">Product not found!</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
      {/* Breadcrumb */}
      <p className="text-sm text-gray-500">
        <Link to="/">Home</Link> / <Link to="/products">Products</Link> /{" "}
        <Link to={`/products/${String(product.category).toLowerCase()}`}>
          {product.category}
        </Link>{" "}
        / <span className="text-primary">{product.name}</span>
      </p>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-16 mt-6">
        {/* Images */}
        <div className="flex gap-4">
          <div className="flex flex-col gap-3">
            {product.image.map((image) => (
              <div
                key={image}
                onClick={() => setThumbnail(image)}
                className="border border-gray-300 rounded cursor-pointer overflow-hidden hover:opacity-75"
              >
                <img
                  src={image}
                  alt="Thumbnail"
                  className="max-w-[70px] h-[70px] object-fill"
                />
              </div>
            ))}
          </div>
          <div className="border border-gray-300 rounded overflow-hidden">
            <img
              src={thumbnail}
              alt="Selected product"
              className="w-full h-full object-fill"
            />
          </div>
        </div>

        {/* Details */}
        <div className="text-sm w-full md:w-1/2">
          <h1 className="text-3xl font-semibold">{product.name}</h1>

          {/* Ratings */}
          <div className="flex items-center gap-1 mt-2">
            {Array(5)
              .fill("")
              .map((_, i) => (
                <img
                  key={i}
                  src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                  alt={`Rating ${i + 1}`}
                  className="w-4 h-4"
                />
              ))}
            <p className="text-base ml-2 text-gray-500">(4)</p>
          </div>

          {/* Price */}
          <div className="mt-6">
            <p className="text-gray-400 line-through">
              MRP: {currency}
              {product.price}
            </p>
            <p className="text-2xl font-semibold text-gray-800 mt-1">
              {currency}
              {product.offerPrice}
            </p>
            <span className="text-gray-400">(inclusive of all taxes)</span>
          </div>

          {/* Description */}
          <p className="text-base font-medium mt-6">About Product:</p>
          {Array.isArray(product.description) &&
          product.description.length > 0 ? (
            product.description.map((desc) => <li key={desc}>{desc}</li>)
          ) : (
            <li className="text-gray-400">No description available.</li>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-10">
            <button
              onClick={() => addToCart(product._id)}
              className="w-full py-3 bg-gray-50 border border-primary hover:bg-gray-200 text-gray-800 font-medium rounded transition cursor-pointer"
            >
              Add to Cart
            </button>
            <button
              onClick={() => {
                addToCart(product._id);
                navigate("/cart");
              }}
              className="w-full py-3 bg-primary hover:border hover:bg-primary-dull text-white font-medium rounded transition cursor-pointer"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="flex flex-col items-center mt-20">
        <div className="flex flex-col items-center w-max">
          <p className="text-3xl font-medium">Related Products</p>
          <div className="w-20 h-0.5 bg-primary rounded-full mt-2"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 mt-6 w-full">
          {relatedProducts
            .filter((product) => product.inStock)
            .map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
        </div>
        <button
          onClick={() => {
            navigate("/products");
            scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mx-auto cursor-pointer px-12 my-16 py-2.5 border rounded text-primary hover:bg-primary/10 transition"
        >
          See More
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
