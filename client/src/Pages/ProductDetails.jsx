import React, { useCallback, useEffect, useState } from "react";
import useProductStore from "../store/useProductStore";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import { Link, useParams, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import ProductCard from "../Components/ProductCard";
import ProductDetailsSkeleton from "../Components/ProductDetailsSkeleton";
import RatingModal from "../Components/RatingModal";
import apiClient from "../shared/lib/apiClient";
import { UserCircle2 } from "lucide-react";

const DEFAULT_STAR_DISTRIBUTION = [5, 4, 3, 2, 1].map((stars) => ({
  stars,
  count: 0,
  percentage: 0,
}));
const REVIEWS_PAGE_SIZE = 8;

const ProductDetails = () => {
  const { products } = useProductStore();
  const { addToCart } = useCartStore();
  const { user, setshowUserLogin } = useAuthStore();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();
  const { id } = useParams();

  const [thumbnail, setThumbnail] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [productRatings, setProductRatings] = useState([]);
  const [ratingSummary, setRatingSummary] = useState({
    averageRating: 0,
    totalRatings: 0,
    distribution: DEFAULT_STAR_DISTRIBUTION,
  });
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingRefreshKey, setRatingRefreshKey] = useState(0);

  const product = products.find((item) => item._id === id);

  useEffect(() => {
    if (product) {
      setThumbnail(product.image[0]);
      setLoading(false);
      return;
    }

    if (products.length > 0) {
      setLoading(false);
    }
  }, [product, products.length]);

  // Set related products
  useEffect(() => {
    if (products.length > 0 && product?.category) {
      const related = products.filter(
        (item) => item.category === product.category && item._id !== product._id
      );
      setRelatedProducts(related.slice(0, 5));
    }
  }, [products, product]);

  const fetchRatings = useCallback(
    async ({ page = 1, append = false, includeSummary = true, includePagination = true } = {}) => {
      if (!product?._id) return;

      try {
        if (append) {
          setLoadingMoreReviews(true);
        } else {
          setLoadingRatings(true);
        }

        const { data } = await apiClient.get(
          `/api/ratings/product/${product._id}?page=${page}&limit=${REVIEWS_PAGE_SIZE}&includeSummary=${includeSummary}&includePagination=${includePagination}`
        );

        if (data.success) {
          const fetchedRatings = data.ratings || [];
          setProductRatings((previousRatings) =>
            append ? [...previousRatings, ...fetchedRatings] : fetchedRatings
          );

          if (includeSummary && data.summary) {
            const summary = data.summary;
            setRatingSummary({
              averageRating: summary.averageRating || 0,
              totalRatings: summary.totalRatings || 0,
              distribution:
                Array.isArray(summary.distribution) && summary.distribution.length === 5
                  ? summary.distribution
                  : DEFAULT_STAR_DISTRIBUTION,
            });
          }

          const apiHasMore = data.pagination?.hasMore;
          setHasMoreReviews(
            typeof apiHasMore === "boolean"
              ? apiHasMore
              : fetchedRatings.length === REVIEWS_PAGE_SIZE
          );
          setReviewsPage(page);
        }
      } catch (error) {
        console.error("Failed to fetch ratings:", error.message);
      } finally {
        setLoadingRatings(false);
        setLoadingMoreReviews(false);
      }
    },
    [product?._id]
  );

  useEffect(() => {
    fetchRatings({
      page: 1,
      append: false,
      includeSummary: true,
      includePagination: true,
    });
  }, [fetchRatings, ratingRefreshKey]);

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

  const averageRating = ratingSummary.averageRating ?? product.rating ?? 0;
  const totalRatings = ratingSummary.totalRatings ?? product.ratingCount ?? 0;
  const ratingDistribution =
    Array.isArray(ratingSummary.distribution) && ratingSummary.distribution.length === 5
      ? ratingSummary.distribution
      : DEFAULT_STAR_DISTRIBUTION;
  const handleLoadMoreReviews = () => {
    if (loadingRatings || loadingMoreReviews || !hasMoreReviews) {
      return;
    }

    fetchRatings({
      page: reviewsPage + 1,
      append: true,
      includeSummary: false,
      includePagination: false,
    });
  };

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
                  src={i < Math.round(averageRating) ? assets.star_icon : assets.star_dull_icon}
                  alt={`Rating ${i + 1}`}
                  className="w-4 h-4"
                />
              ))}
            <p className="text-base ml-2 text-gray-500">
              ({averageRating.toFixed(1)} · {totalRatings} review{totalRatings === 1 ? "" : "s"})
            </p>
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
              onClick={() => addToCart(product._id, user)}
              className="w-full py-3 bg-gray-50 border border-primary hover:bg-gray-200 text-gray-800 font-medium rounded transition cursor-pointer"
            >
              Add to Cart
            </button>
            <button
              onClick={() => {
                addToCart(product._id, user);
                navigate("/cart");
              }}
              className="w-full py-3 bg-primary hover:border hover:bg-primary-dull text-white font-medium rounded transition cursor-pointer"
            >
              Buy Now
            </button>
          </div>

          <button
            onClick={() => {
              if (!user) {
                setshowUserLogin(true);
                return;
              }
              setShowRatingModal(true);
            }}
            className="mt-4 w-full py-3 border border-primary text-primary hover:bg-primary/10 rounded transition"
          >
            Rate & Review Product
          </button>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Customer Reviews</h2>
          <p className="text-sm text-gray-500">
            Average Rating: <span className="font-medium text-gray-700">{averageRating.toFixed(1)}</span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
          <div className="grid gap-5 md:grid-cols-[220px_1fr] border-b border-gray-100 pb-5 mb-5">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Overall Rating</p>
              <p className="text-3xl font-semibold text-gray-800 mt-1">{averageRating.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-2">
                {Array(5)
                  .fill("")
                  .map((_, i) => (
                    <img
                      key={`summary-star-${i}`}
                      src={i < Math.round(averageRating) ? assets.star_icon : assets.star_dull_icon}
                      alt="rating star"
                      className="w-4 h-4"
                    />
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {totalRatings} verified rating{totalRatings === 1 ? "" : "s"}
              </p>
            </div>

            <div className="space-y-2.5">
              {ratingDistribution.map((row) => (
                <div key={`distribution-${row.stars}`} className="grid grid-cols-[52px_1fr_36px] items-center gap-3">
                  <p className="text-sm text-gray-600">{row.stars} star</p>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 text-right">{row.count}</p>
                </div>
              ))}
            </div>
          </div>

          {loadingRatings ? (
            <p className="text-gray-500">Loading reviews...</p>
          ) : productRatings.length === 0 ? (
            <p className="text-gray-500">No reviews yet. Be the first to review this product.</p>
          ) : (
            <>
              <div className="space-y-4">
                {productRatings.map((item) => (
                  <div
                    key={item._id}
                    className="border border-gray-100 rounded p-4 bg-gray-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserCircle2 size={18} className="text-gray-500" />
                        <p className="font-medium text-gray-800">
                          {item.userId?.name || "Verified Buyer"}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {Array(5)
                        .fill("")
                        .map((_, index) => (
                          <img
                            key={`${item._id}-${index}`}
                            src={index < item.rating ? assets.star_icon : assets.star_dull_icon}
                            alt="rating star"
                            className="w-3.5 h-3.5"
                          />
                        ))}
                    </div>
                    {item.review ? (
                      <p className="text-sm text-gray-600 mt-2">{item.review}</p>
                    ) : (
                      <p className="text-sm text-gray-400 mt-2">No written review provided.</p>
                    )}
                  </div>
                ))}
              </div>

              {hasMoreReviews && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleLoadMoreReviews}
                    disabled={loadingMoreReviews}
                    className="px-6 py-2 border border-primary text-primary rounded hover:bg-primary/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingMoreReviews ? "Loading..." : "Load More Reviews"}
                  </button>
                </div>
              )}
            </>
          )}
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

      {showRatingModal && (
        <RatingModal
          productId={product._id}
          productName={product.name}
          productImage={product.image?.[0]}
          onClose={() => setShowRatingModal(false)}
          onSaved={() => setRatingRefreshKey((prev) => prev + 1)}
        />
      )}
    </div>
  );
};

export default ProductDetails;
