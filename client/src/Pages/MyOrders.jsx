import React, { useEffect, useState } from "react";
import { useAppContext } from "../Context/AppContext";

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currency, axios, user,navigate } = useAppContext();

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/order/user");
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
    if (!user) {
      console.log("User not logged in");
      return;
    }
    fetchMyOrders();
  }, [user]);

  const getStatusClass = (status) => {
    switch (status) {
      case "order placed":
        return "text-blue-500";
      case "shipped":
        return "text-yellow-500";
      case "delivered":
        return "text-green-600";
      case "cancelled":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  if (loading) {
    return <p className="text-center mt-20">Loading your orders...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 mt-20">{error}</p>;
  }

  if (!orders.length) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-medium mb-4">No orders found 🛒</p>
      </div>
    );
  }

  return (
    <div className="mt-16 pb-16">
      <div className="flex flex-col items-end w-max mb-8">
        <p className="text-2xl font-medium uppercase">My Orders</p>
        <div className="w-16 h-0.5 bg-primary rounded-full"></div>
      </div>

      {orders.map((order) => {
        const {
          id,
          paymentMethod,
          totalAmount,
          orderStatus,
          createdAt,
          items,
        } = order;

        return (
          <div
            key={id}
            className="border border-gray-200 rounded-lg p-4 mb-10 py-5 max-w-4xl"
          >
            <p className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col">
              <span>Order ID: {id}</span>
              <span>Payment: {paymentMethod}</span>
              <span>
                Total Amount: {currency}
                {totalAmount}
              </span>
            </p>

            {items?.map((item, index) => {
              const { product, quantity } = item;
              const isLastItem = items.length !== index + 1;
              console.log("Item:", item);

              const {
                _id: productId,
                name = "Unknown Product",
                category = "N/A",
                image = [],
                offerPrice = 0,
              } = product || {}; // Fallback if product is null

              return (
                <div
                  key={productId || index}
                  className={`relative bg-white text-gray-500/70 ${
                    isLastItem ? "border-b border-gray-300" : ""
                  } flex flex-col md:flex-row md:items-center justify-between py-5 gap-4 p-4 md:gap-16 w-full max-w-4xl`}
                >
                  <div className="flex items-center mb-4 md:mb-0 cursor-pointer">
                    <div onClick={() => {
                  navigate(
                    `/products/${product.category.toLowerCase()}/${item.product.id}`
                  );
                  scrollTo({ top: 0, behavior: "smooth" });
                }} className="bg-primary/10 p-4 rounded-lg">
                      <img
                        src={image?.[0] || "/placeholder.jpg"}
                        alt={name}
                        className="w-16 h-16 object-cover"
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-xl font-medium text-gray-800">
                        {name}
                      </h2>
                      <p className="text-gray-500/60 text-sm">{category}</p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0">
                    <p>Quantity: {quantity || "1"}</p>
                    <p className={`font-medium ${getStatusClass(orderStatus)}`}>
                      Status: {orderStatus}
                    </p>
                    <p>
                      Date:{" "}
                      {new Date(createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <p className="text-primary text-lg font-medium">
                    Amount: {currency}
                    {offerPrice * quantity}
                  </p>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default MyOrders;
