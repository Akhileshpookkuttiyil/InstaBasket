import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import apiClient from "../shared/lib/apiClient";
import RatingModal from "../Components/RatingModal";
import { getImageFallback, getImageUrl } from "../shared/lib/image";

const normalizePaymentMethod = (value = "") => {
  const normalized = String(value).toLowerCase();
  if (normalized === "stripe" || normalized === "online") return "stripe";
  return "cod";
};

const normalizePaymentStatus = (order) => {
  if (order?.paymentStatus) return String(order.paymentStatus).toLowerCase();
  return order?.isPaid ? "paid" : "unpaid";
};

const normalizeOrderStatus = (value = "") => {
  const normalized = String(value || "").toLowerCase();
  return normalized === "completed" ? "delivered" : normalized;
};

const formatWholeCurrency = (value, currencySymbol) =>
  `${currencySymbol}${Math.round(Number(value || 0)).toLocaleString()}`;

const getStatusClass = (status) => {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "processing":
      return "text-blue-600 font-semibold";
    case "delivered":
      return "text-emerald-600 font-semibold";
    case "completed":
      return "text-emerald-700 font-bold";
    case "cancelled":
      return "text-rose-500 font-semibold";
    default:
      return "text-amber-600 font-semibold";
  }
};

const getPaymentBadgeClass = (paymentStatus) => {
  switch (paymentStatus) {
    case "paid":
      return "border-emerald-100 text-emerald-600 bg-emerald-50/40";
    case "refunded":
      return "border-blue-100 text-blue-600 bg-blue-50/40";
    default:
      return "border-amber-100 text-amber-600 bg-amber-50/40";
  }
};

const MyOrders = () => {
  const { user } = useAuthStore();
  const { fetchUserCart } = useCartStore();
  const navigate = useNavigate();
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryingOrderId, setRetryingOrderId] = useState("");
  const [ratedProducts, setRatedProducts] = useState(new Set());
  const [ratingModalData, setRatingModalData] = useState(null);

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get("/api/order/user");
      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyOrders();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchMyRatings = async () => {
      try {
        const { data } = await apiClient.get("/api/ratings/my");
        if (data.success) {
          setRatedProducts(
            new Set(
              (data.ratings || []).map((rating) =>
                String(rating.productId?._id || rating.productId)
              )
            )
          );
        }
      } catch (error) {
        console.error("Failed to fetch ratings:", error.message);
      }
    };
    fetchMyRatings();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchUserCart();
  }, [user, fetchUserCart]);
  const retryStripePayment = async (orderId) => {
    try {
      setRetryingOrderId(orderId);
      const { data } = await apiClient.post(`/api/order/${orderId}/pay`);
      if (data.success && data.url) {
        window.location.replace(data.url);
        return;
      }
      toast.error(data.message || "Unable to start payment retry.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Payment retry failed.");
    } finally {
      setRetryingOrderId("");
    }
  };

  const visibleOrders = useMemo(() => orders || [], [orders]);

  if (loading && user) {
    return <p className="text-center mt-20">Loading your orders...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-20">{error}</p>;
  }

  if (!visibleOrders.length || !user) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-medium mb-4">No orders found</p>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col items-start w-max mb-8">
        <p className="text-2xl font-medium uppercase tracking-widest">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full" />
      </div>

      {visibleOrders.map((order) => {
        const finalId = order._id || order.id;
        const paymentMethod = normalizePaymentMethod(order.paymentMethod);
        const paymentStatus = normalizePaymentStatus(order);
        const orderStatus = normalizeOrderStatus(order.orderStatus);
        const canRetry =
          paymentMethod === "stripe" &&
          paymentStatus === "unpaid" &&
          !["cancelled", "delivered"].includes(orderStatus);

        return (
          <div
            key={finalId}
            className="border border-gray-200 shadow-sm rounded-3xl p-4 md:p-8 mb-10 w-full bg-white transition-all hover:bg-gray-50/20"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between text-gray-400 gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-300">Reference</p>
                  <p className="text-xs font-mono font-bold text-gray-400">#{String(finalId).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-gray-300">Payment</p>
                  <p className="text-xs font-bold text-gray-500 flex items-center gap-2">
                    {paymentMethod.toUpperCase()}
                    <span
                      className={`text-[9px] px-2 py-0.5 border rounded uppercase ${getPaymentBadgeClass(
                        paymentStatus
                      )}`}
                    >
                      {paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:items-end gap-2">
                <div className="md:text-right">
                  <p className="text-[10px] uppercase font-black text-[#94dc1c]">Total</p>
                  <p className="text-xl font-black text-gray-800 leading-none">
                    {formatWholeCurrency(order.totalAmount, currency)}
                  </p>
                </div>
                {canRetry && (
                  <button
                    onClick={() => retryStripePayment(finalId)}
                    disabled={retryingOrderId === finalId}
                    className="text-[10px] px-4 py-1.5 rounded-full border border-primary text-primary font-black hover:bg-primary hover:text-white transition-all uppercase disabled:opacity-60"
                  >
                    {retryingOrderId === finalId ? "Retrying..." : "Retry Payment"}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {(order.items || []).map((item, index) => {
                const { product, quantity, priceAtPurchase } = item;
                const isLastItem = (order.items || []).length !== index + 1;
                const productId = product?._id;
                const name = product?.name || "Unknown Product";
                const category = product?.category || "N/A";
                const image = product?.image || [];
                const currentOfferPrice = product?.offerPrice || 0;
                const displayPrice = priceAtPurchase || currentOfferPrice;
                const isDeliveredOrCompleted = ["delivered", "completed"].includes(orderStatus);
                const isRated = ratedProducts.has(String(productId));

                return (
                  <div
                    key={productId || index}
                    className={`relative flex flex-col md:flex-row md:items-center justify-between py-5 gap-4 md:gap-8 w-full ${
                      isLastItem ? "border-b border-gray-100" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4 cursor-pointer">
                      <div
                        onClick={() => {
                          if (category && productId) {
                            navigate(`/products/${category.toLowerCase()}/${productId}`);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                        }}
                        className="bg-gray-50 p-2 rounded-2xl border border-gray-100 overflow-hidden w-20 h-20 flex-shrink-0"
                      >
                        <img
                          src={getImageUrl(image?.[0], "product")}
                          alt={name}
                          className="w-full h-full object-cover mix-blend-multiply transition-transform hover:scale-110"
                          onError={(event) => {
                            event.currentTarget.src = getImageFallback("product");
                          }}
                        />
                      </div>
                      <div className="max-w-[220px]">
                        <h2 className="text-base font-bold text-gray-800 leading-tight">{name}</h2>
                        <p className="text-gray-400 text-xs font-medium uppercase tracking-tighter">{category}</p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center md:ml-8 flex-grow">
                      <p className="text-xs text-gray-400 font-bold">
                        Qty: <span className="text-gray-700">{quantity || 1}</span>
                      </p>
                      <p className={`text-xs uppercase tracking-widest mt-1 font-black ${getStatusClass(orderStatus)}`}>
                        Status: {orderStatus}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium mt-1">
                        Placed On:{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      {isDeliveredOrCompleted && productId && (
                        <button
                          onClick={() =>
                            setRatingModalData({
                              productId,
                              productName: name,
                              productImage: image?.[0],
                            })
                          }
                          className="mt-3 inline-flex w-max text-[10px] px-4 py-1.5 rounded-full border border-primary text-primary font-black hover:bg-primary hover:text-white transition-all uppercase"
                        >
                          {isRated ? "Edit Review" : "Rate Product"}
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-gray-300 text-[10px] font-black uppercase">Subtotal</p>
                      <p className="text-lg font-black text-gray-700">
                        {formatWholeCurrency(
                          Number(displayPrice || 0) * Number(quantity || 1),
                          currency
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {ratingModalData && (
        <RatingModal
          productId={ratingModalData.productId}
          productName={ratingModalData.productName}
          productImage={ratingModalData.productImage}
          onClose={() => setRatingModalData(null)}
          onSaved={async () => {
            setRatingModalData(null);
            await fetchMyOrders();
          }}
        />
      )}
    </div>
  );
};

export default MyOrders;
