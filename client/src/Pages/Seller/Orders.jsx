import React, { useEffect, useState } from "react";
import { useAppContext } from "../../Context/AppContext";
import { assets } from "../../assets/assets";
import toast from "react-hot-toast";

// Map currency symbols to ISO currency codes
const symbolToCodeMap = {
  "₹": "INR",
  $: "USD", // could be used for USD or others
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₽": "RUB",
  "₩": "KRW",
  "₺": "TRY",
  R$: "BRL",
  C$: "CAD",
  A$: "AUD",
  "₦": "NGN",
  "د.إ": "AED",
  "﷼": "SAR",
  S$: "SGD",
  NZ$: "NZD",
};

const Orders = () => {
  const { currency: currencySymbol, axios } = useAppContext(); // Still using the symbol from .env
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/order/seller");
      if (data.success) {
        console.log("Fetched orders:", data.orders);
        setOrders(data.orders);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Format currency using code derived from symbol
  const formatCurrency = (amount) => {
    const code = symbolToCodeMap[currencySymbol] || "USD"; // fallback to USD if unknown
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
      }).format(amount);
    } catch (e) {
      console.error("Invalid currency formatting:", e);
      return `${currencySymbol}${amount}`;
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll">
      <div className="md:p-10 p-4 space-y-4">
        <h2 className="text-lg font-medium">Orders List</h2>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="flex flex-col md:items-center md:flex-row gap-5 justify-between p-5 max-w-4xl rounded-md border border-gray-300"
            >
              <div className="flex gap-5 max-w-80">
                <img
                  className="w-12 h-12 object-cover"
                  src={assets.box_icon}
                  alt="Order Box Icon"
                  loading="lazy"
                />
                <div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col">
                      <p className="font-medium">
                        {item.product.name}{" "}
                        <span className="text-primary">x {item.quantity}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-sm md:text-base text-black/60">
                <p className="text-black/80">
                  {order.shippingAddress.firstName}{" "}
                  {order.shippingAddress.lastName}
                </p>
                <p>
                  {order.shippingAddress.street}, {order.shippingAddress.city}
                </p>
                <p>
                  {order.shippingAddress.state}, {order.shippingAddress.zipcode}
                  , {order.shippingAddress.country}
                </p>
                <p>{order.shippingAddress.phone}</p>
              </div>

              <p className="font-medium text-lg my-auto">
                {formatCurrency(order.totalAmount)}
              </p>

              <div className="flex flex-col text-sm md:text-base text-black/60">
                <p>Method: {order.paymentMethod}</p>
                <p>
                  Date:{" "}
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(order.createdAt))}
                </p>
                <p>Payment: {order.isPaid ? "Paid" : "Pending"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
