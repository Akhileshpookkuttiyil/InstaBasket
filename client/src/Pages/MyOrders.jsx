import React, { useEffect, useState } from "react";
import useAuthStore from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import apiClient from "../shared/lib/apiClient";
import RatingModal from "../Components/RatingModal";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratedProducts, setRatedProducts] = useState(new Set());
  const [ratingModalData, setRatingModalData] = useState(null);
  
  const { user } = useAuthStore();
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const navigate = useNavigate();

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/api/order/user");
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.message || "Failed to fetch orders");
      }
    } catch (err) {
      setError(err.message || "Unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchMyOrders();
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
      } catch (err) {
        console.error("Failed to fetch ratings:", err.message);
      }
    };

    fetchMyRatings();
  }, [user]);

  const getStatusClass = (status) => {
    switch (status) {
      case "PENDING":
        return "text-amber-500";
      case "CONFIRMED":
        return "text-blue-500 font-semibold";
      case "SHIPPED":
        return "text-indigo-500";
      case "DELIVERED":
        return "text-green-600 font-bold";
      case "CANCELLED":
        return "text-red-500";
      case "RETURNED":
        return "text-purple-600";
      default:
        return "text-gray-500";
    }
  };

  if (loading && user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-500 mt-20">{error}</p>;
  }

  if (!orders.length || !user) {
    return (
      <div className="text-center mt-20 py-20 bg-gray-50 rounded-xl mx-4 md:mx-auto max-w-2xl">
        <p className="text-3xl font-bold text-gray-400 mb-2">No orders yet</p>
        <p className="text-gray-500 mb-6">Your shopping bag is waiting to be filled!</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-primary text-white rounded-lg shadow-md hover:brightness-90 transition">
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col items-start w-max mb-8">
        <p className="text-3xl font-bold text-gray-800">My Orders</p>
        <div className="w-12 h-1 bg-primary rounded-full mt-1"></div>
      </div>

      <div className="space-y-8">
        {orders.map((order) => {
          const {
            id,
            paymentMethod,
            totalAmount,
            orderStatus,
            paymentStatus,
            createdAt,
            items,
          } = order;

          return (
            <div
              key={id}
              className="bg-white border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden transition-all hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)]"
            >
              <div className="bg-gray-50/50 px-6 py-4 flex flex-wrap justify-between items-center gap-4 border-b border-gray-100">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Order ID</p>
                    <p className="text-sm font-mono text-gray-600">#{String(id).slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Placed On</p>
                    <p className="text-sm font-medium text-gray-700">{new Date(createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total</p>
                    <p className="text-lg font-bold text-primary">{currency}{totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${orderStatus === 'DELIVERED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {orderStatus}
                  </div>
                </div>
              </div>

              <div className="px-6 divide-y divide-gray-100">
                {items?.map((item, index) => {
                  const { product, quantity, returnStatus } = item;
                  const {
                    id: productId,
                    name = "Unknown Product",
                    category = "N/A",
                    image = [],
                    offerPrice = 0,
                  } = product || {};

                  const isDelivered = orderStatus === "DELIVERED";
                  const isRated = ratedProducts.has(String(productId));

                  return (
                    <div
                      key={productId || index}
                      className="py-6 flex flex-col md:flex-row items-center gap-6"
                    >
                      <div 
                        onClick={() => navigate(`/products/${category?.toLowerCase() || 'item'}/${productId}`)}
                        className="w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={image?.[0] || "/placeholder.jpg"}
                          alt={name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div className="flex-grow text-center md:text-left">
                        <h3 className="text-lg font-semibold text-gray-800 line-clamp-1">{name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{category}</p>
                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-medium text-gray-500">
                          <span>Qty: {quantity}</span>
                          <span>•</span>
                          <span>Unit Price: {currency}{offerPrice.toLocaleString()}</span>
                        </div>
                        
                        {returnStatus !== 'NONE' && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                            Return {returnStatus}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center md:items-end gap-3 flex-shrink-0">
                         <div className="flex flex-col items-center md:items-end">
                            <p className="text-xs text-gray-400 font-medium">Payment: {paymentMethod}</p>
                            <p className={`text-xs font-bold uppercase tracking-widest ${paymentStatus === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{paymentStatus}</p>
                         </div>
                        
                        {isDelivered && productId && (
                          <button
                            onClick={() =>
                              setRatingModalData({
                                productId,
                                productName: name,
                                productImage: image?.[0],
                              })
                            }
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                              isRated 
                              ? "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50" 
                              : "bg-primary text-white hover:brightness-90"
                            }`}
                          >
                            {isRated ? "Edit Review" : "Rate Product"}
                          </button>
                        )}

                        {paymentStatus !== 'PAID' && !['CANCELLED', 'RETURNED'].includes(orderStatus) && (
                          <button
                            onClick={async () => {
                              try {
                                const { data } = await apiClient.post(`/api/order/${id}/pay`);
                                if (data.success && data.url) {
                                  window.location.href = data.url;
                                }
                              } catch (e) {
                                toast.error("Payment initiation failed.");
                              }
                            }}
                            className="w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition"
                          >
                            Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

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
