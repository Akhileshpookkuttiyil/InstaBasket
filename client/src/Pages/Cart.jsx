import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    setCartItems,
    removeFromCart,
    updateCartItem,
    getCartCount,
    getCartAmount,
    navigate,
    axios,
    user,
  } = useAppContext();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const cartArray = useMemo(() => {
    return Object.keys(cartItems)
      .map((id) => {
        const product = products.find((p) => p._id === id);
        return product ? { ...product, quantity: cartItems[id] } : null;
      })
      .filter(Boolean);
  }, [cartItems, products]);

  const tax = useMemo(() => getCartAmount() * 0.02, [cartItems]);
  const total = useMemo(() => getCartAmount() + tax, [tax]);

  useEffect(() => {
    if (user) fetchAddresses();
  }, [user]);

  const fetchAddresses = async () => {
    try {
      const { data } = await axios.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses);
        setSelectedAddress(data.addresses[0] || null);
        if (data.addresses.length === 0) {
          toast.error("No delivery address found. Please add one.");
        }
      } else {
        toast.error("Failed to fetch addresses.");
      }
    } catch {
      toast.error("Something went wrong while loading addresses.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!cartArray.length) return toast.error("Your cart is empty.");
    if (!selectedAddress)
      return toast.error("Please select a delivery address.");
    if (!selectedPaymentMethod) return toast.error("Select a payment method.");

    const invalidItem = cartArray.find(
      (item) => item.quantity > (item.countInStock || 0)
    );
    if (invalidItem) {
      return toast.error(
        `"${invalidItem.name}" exceeds available stock (${invalidItem.countInStock} max)`
      );
    }

    setIsPlacingOrder(true);

    const payload = {
      userId: user._id,
      items: cartArray.map(({ _id, quantity }) => ({
        productId: _id,
        quantity,
      })),
      shippingAddress: selectedAddress,
      paymentMethod: selectedPaymentMethod,
    };

    try {
      if (selectedPaymentMethod === "COD") {
        const { data } = await axios.post("/api/order/cod", payload);
        if (data.success) {
          toast.success("Order placed successfully!");
          setCartItems({});
          navigate("/my-orders");
        } else {
          toast.error("Failed to place order.");
        }
      } else {
        toast("Redirecting to payment gateway...");
        const { data } = await axios.post("/api/order/stripe", payload);
        if (data.success && data.url) {
          window.location.replace(data.url);
        } else {
          toast.error("Payment initiation failed.");
        }
      }
    } catch {
      toast.error("Something went wrong while placing the order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!products.length || !cartItems) return null;

  if (!cartArray.length) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-medium mb-4">Your cart is empty 🛒</p>
        <button
          onClick={() => {
            navigate("/products");
            scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 mt-16">
      {/* Cart Items Section */}
      <div className="flex-1 max-w-4xl">
        <h1 className="text-3xl font-medium mb-6">
          Shopping Cart{" "}
          <span className="text-sm text-primary">({getCartCount()} Items)</span>
        </h1>

        <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 font-medium pb-3">
          <p className="text-left">Product</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Action</p>
        </div>

        {cartArray.map((product) => (
          <div
            key={product._id}
            className="grid grid-cols-[2fr_1fr_1fr] items-center py-4 border-t border-gray-200"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 border border-gray-200 rounded cursor-pointer"
                onClick={() => {
                  navigate(
                    `/products/${product.category.toLowerCase()}/${product._id}`
                  );
                  scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <img
                  src={product.image[0]}
                  alt={product.name}
                  className="object-cover w-full h-full"
                  onError={(e) => (e.target.src = assets.fallback_image)}
                />
              </div>
              <div>
                <p className="font-semibold hidden md:block">{product.name}</p>
                <p className="text-sm text-gray-500">
                  Weight: {product.weight || "N/A"}
                </p>
                <div className="flex items-center mt-1">
                  <span className="mr-2">Qty:</span>
                  <select
                    className="border border-gray-200 outline-none rounded px-2 py-1"
                    value={cartItems[product._id]}
                    onChange={(e) =>
                      updateCartItem(product._id, Number(e.target.value))
                    }
                  >
                    {Array.from(
                      { length: Math.min(5, product.stock || 5) },
                      (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      )
                    )}
                  </select>
                </div>
                {product.quantity > product.stock && (
                  <p className="text-xs text-red-500 mt-1">
                    Max available: {product.stock}
                  </p>
                )}
              </div>
            </div>

            <p className="text-center">
              {currency}
              {(product.offerPrice * product.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => removeFromCart(product._id)}
              className="mx-auto"
            >
              <img src={assets.remove_icon} alt="remove" className="w-6 h-6" />
            </button>
          </div>
        ))}

        <button
          onClick={() => {
            navigate("/products");
            scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-8 text-primary font-medium flex items-center gap-2 group"
        >
          <img
            src={assets.arrow_right_icon_colored}
            alt="arrow"
            className="group-hover:-translate-x-1 transition"
          />
          Continue Shopping
        </button>
      </div>

      {/* Summary Section */}
      <div className="max-w-sm w-full bg-gray-100/40 p-5 border border-gray-200 rounded">
        <h2 className="text-xl font-medium mb-4">Order Summary</h2>

        {/* Address */}
        <div>
          <label className="text-sm font-semibold">Delivery Address</label>
          <p className="text-sm mt-1">
            {selectedAddress
              ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}`
              : "No address selected"}
          </p>
          <button
            onClick={() => setShowAddressDropdown((prev) => !prev)}
            className="text-primary text-sm hover:underline mt-1"
          >
            Change
          </button>

          {showAddressDropdown && (
            <div className="relative z-10 bg-white border border-gray-200 rounded shadow mt-2 max-h-60 overflow-y-auto">
              {addresses.map((address, i) => (
                <p
                  key={i}
                  onClick={() => {
                    setSelectedAddress(address);
                    setShowAddressDropdown(false);
                  }}
                  className="p-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {address.street}, {address.city}, {address.state}
                </p>
              ))}
              <p
                onClick={() => navigate("/add-address")}
                className="text-primary text-center p-2 hover:bg-primary/10 cursor-pointer"
              >
                + Add New Address
              </p>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mt-6">
          <label className="text-sm font-semibold mb-1 block">
            Payment Method
          </label>
          <select
            className="w-full border border-gray-200 outline-none px-3 py-2 rounded bg-white"
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          >
            <option value="COD">Cash On Delivery</option>
            <option value="Online">Online Payment</option>
          </select>
        </div>

        {/* Price Breakdown */}
        <div className="mt-6 text-sm text-gray-700 space-y-2">
          <div className="flex justify-between">
            <span>Price</span>
            <span>
              {currency}
              {getCartAmount().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Shipping Fee</span>
            <span className="text-green-600">Free</span>
          </div>
          <div className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {tax.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-3 mt-3">
            <span>Total</span>
            <span>
              {currency}
              {total.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Place Order */}
        <button
          onClick={handlePlaceOrder}
          disabled={
            isPlacingOrder || !selectedAddress || !selectedPaymentMethod
          }
          className={`w-full py-3 mt-6 font-medium rounded transition ${
            isPlacingOrder || !selectedAddress || !selectedPaymentMethod
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dull"
          }`}
        >
          {isPlacingOrder
            ? "Placing Order..."
            : selectedPaymentMethod === "COD"
            ? "Place Order (Cash on Delivery)"
            : "Pay Now (Online Payment)"}
        </button>
      </div>
    </div>
  );
};

export default Cart;
