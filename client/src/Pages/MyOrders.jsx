import React, { useEffect, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import { dummyOrders } from "../assets/assets";

const MyOrders = () => {
  const [MyOrders, setMyOrders] = useState([]);
  const { currency } = useAppContext();

  const fetchMyOrders = async () => {
    setMyOrders(dummyOrders);
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  if (!MyOrders.length) {
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

      {MyOrders.map((order) => (
        <div
          className="border border-gray-200 rounded-lg p-4 mb-10 py-5 max-w-4xl"
          key={order._id}
        >
          <p className="flex justify-between md:items-center text-gray-400 md:font-medium max-md:flex-col">
            <span>OrderId: {order._id}</span>
            <span>Payment: {order.paymentType}</span>
            <span>
              Total Amount: {currency}
              {order.amount}
            </span>
          </p>

          {order.items?.map((item) => (
            <div
              key={item.product._id}
              className={`relative bg-white text-gray-500/70 ${
                order.items.length !== order.items.indexOf(item) + 1
                  ? "border-b border-gray-300"
                  : ""
              } flex flex-col md:flex-row md:items-center justify-between py-5 gap-4 p-4 md:gap-16 w-full max-w-4xl`}
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <img
                    src={item.product.image[0]}
                    alt={item.product.name}
                    className="w-16 h-16"
                  />
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium text-gray-800">
                    {item.product.name}
                  </h2>
                  <p className="text-gray-500/60 text-sm">
                    {item.product.category}
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center md:ml-8 mb-4 md:mb-0">
                <p>Quantity: {item.quantity || "1"}</p>
                <p
                  className={`font-medium ${
                    order.status === "Completed"
                      ? "text-green-500"
                      : order.status === "Pending"
                      ? "text-yellow-500"
                      : "text-red-500"
                  }`}
                >
                  Status: {order.status}
                </p>
                <p>
                  Date:{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <p className="text-primary text-lg font-medium">
                Amount: {currency}
                {item.product.offerPrice * item.quantity}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MyOrders;
