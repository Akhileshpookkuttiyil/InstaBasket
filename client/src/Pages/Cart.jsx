import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../Context/AppContext";
import { assets, dummyAddress } from "../assets/assets";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    removeFromCart,
    updateCartItem,
    getCartCount,
    getCartAmount,
    navigate,
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState(dummyAddress);
  const [selectedAddress, setSelectedAddress] = useState(dummyAddress[0]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("COD");

  const fetchCartData = () => {
    const data = Object.keys(cartItems)
      .map((id) => {
        const product = products.find((p) => p._id === id);
        if (!product) return null;
        return { ...product, quantity: cartItems[id] }; // Add quantity to the product
      })
      .filter(Boolean); // Remove null values
      console.log("Cart Data:", data);
    setCartArray(data);
  };

  const tax = useMemo(() => getCartAmount() * 0.02, [cartItems]);
  const total = useMemo(() => getCartAmount() + tax, [tax, cartItems]);

  const handlePlaceOrder = () => {
    if (!cartArray.length) return alert("Your cart is empty.");
    if (!selectedAddress) return alert("Please select a delivery address.");

    console.log("Order placed:", {
      products: cartArray,
      address: selectedAddress,
      payment: selectedPaymentMethod,
    });

    // TODO: Add actual order submission logic here.
  };

  useEffect(() => {
    if (products.length && cartItems) fetchCartData();
  }, [products, cartItems]);

  if (!products.length || !cartItems) return null;

  if (!cartArray.length) {
    return (
      <div className="text-center mt-20">
        <p className="text-2xl font-medium mb-4">Your cart is empty 🛒</p>
        <button
          onClick={() => navigate("/products")}
          className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-dull transition"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row mt-16 gap-6">
      {/* Cart Section */}
      <div className="flex-1 max-w-4xl">
        <h1 className="text-3xl font-medium mb-6">
          Shopping Cart{" "}
          <span className="text-sm text-primary">({getCartCount()} Items)</span>
        </h1>

        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr] text-gray-500 font-medium pb-3 text-base">
          <p className="text-left">Product Details</p>
          <p className="text-center">Subtotal</p>
          <p className="text-center">Action</p>
        </div>

        {/* Items */}
        {cartArray.map((product) => (
          <div
            key={product._id}
            className="grid grid-cols-[2fr_1fr_1fr] items-center text-gray-600 text-sm md:text-base font-medium pt-4"
          >
            <div className="flex items-center gap-4 md:gap-6">
              <div
                className="w-24 h-24 border border-gray-200 rounded flex justify-center items-center cursor-pointer"
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
                  className="object-cover max-w-full h-full"
                />
              </div>
              <div>
                <p className="font-semibold hidden md:block">{product.name}</p>
                <p className="text-gray-500/70">
                  Weight: {product.weight || "N/A"}
                </p>
                <div className="flex items-center mt-1">
                  <p className="mr-2">Qty:</p>
                  <select
                    className="outline-none border border-gray-200 px-2 py-1"
                    value={cartItems[product._id]}
                    onChange={(e) =>
                      updateCartItem(product._id, Number(e.target.value))
                    }
                  >
                    {Array.from(
                      { length: Math.max(9, cartItems[product._id]) },
                      (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-center">
              {currency}
              {(product.offerPrice * product.quantity).toFixed(2)}
            </p>
            <button
              onClick={() => removeFromCart(product._id)}
              className="mx-auto cursor-pointer"
            >
              <img src={assets.remove_icon} alt="remove" className="w-6 h-6" />
            </button>
          </div>
        ))}

        {/* Continue Shopping */}
        <button
          onClick={() => {
            navigate("/products");
            scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-8 flex items-center gap-2 text-primary font-medium group"
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
      <div className="max-w-sm w-full bg-gray-100/40 p-5 border border-gray-200">
        <h2 className="text-xl font-medium">Order Summary</h2>
        <hr className="my-5 border-gray-300" />

        {/* Address */}
        <div className="mb-6 text-gray-700">
          <p className="text-sm font-medium uppercase">Delivery Address</p>
          <div className="relative mt-2 flex justify-between items-start">
            <p>
              {selectedAddress
                ? `${selectedAddress.street}, ${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.country}`
                : "No address selected"}
            </p>
            <button
              onClick={() => setShowAddressDropdown((prev) => !prev)}
              className="text-primary hover:underline ml-2"
            >
              Change
            </button>

            {showAddressDropdown && (
              <div className="absolute top-full mt-2 bg-white border border-gray-200 shadow w-full z-10">
                {addresses.map((address, i) => (
                  <p
                    key={i}
                    onClick={() => {
                      setSelectedAddress(address);
                      setShowAddressDropdown(false);
                    }}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {address.street}, {address.city}, {address.state},{" "}
                    {address.country}
                  </p>
                ))}
                <p
                  onClick={() => navigate("/add-address")}
                  className="text-center text-primary p-2 hover:bg-primary/10 cursor-pointer"
                >
                  Add New Address
                </p>
              </div>
            )}
          </div>

          <p className="text-sm font-medium uppercase mt-6">Payment Method</p>
          <select
            className="w-full border border-gray-200 px-3 py-2 mt-2 outline-none bg-white"
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          >
            <option value="COD">Cash On Delivery</option>
            <option value="Online">Online Payment</option>
          </select>
        </div>

        {/* Summary */}
        <hr className="border-gray-200" />
        <div className="text-gray-600 mt-4 space-y-2 text-sm">
          <p className="flex justify-between">
            <span>Price</span>
            <span>
              {currency}
              {getCartAmount().toFixed(2)}
            </span>
          </p>
          <p className="flex justify-between">
            <span>Shipping Fee</span>
            <span className="text-green-600">Free</span>
          </p>
          <p className="flex justify-between">
            <span>Tax (2%)</span>
            <span>
              {currency}
              {tax.toFixed(2)}
            </span>
          </p>
          <p className="flex justify-between text-base font-semibold pt-3">
            <span>Total</span>
            <span>
              {currency}
              {total.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          className="w-full py-3 mt-6 bg-primary text-white font-medium hover:bg-primary-dull transition"
        >
          {selectedPaymentMethod === "COD"
            ? "Place Order (Cash On Delivery)"
            : "Pay Now (Online Payment)"}
        </button>
      </div>
    </div>
  );
};

export default Cart;
