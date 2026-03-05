import React, { useEffect } from "react";
import Navbar from "./Components/Navbar";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import Footer from "./Components/Footer";
import { Toaster } from "react-hot-toast";
import useAuthStore from "./store/useAuthStore";
import useProductStore from "./store/useProductStore";
import useCartStore from "./store/useCartStore";
import Login from "./Components/Login";
import AllProducts from "./Components/AllProducts";
import Noresults from "./Components/Noresults";
import ProductCategory from "./Components/ProductCategory";
import ProductDetails from "./Pages/ProductDetails";
import Cart from "./Pages/Cart";
import AddAdress from "./Pages/AddAdress";
import MyOrders from "./Pages/MyOrders";
import SellerLogin from "./Components/Seller/SellerLogin";
import SellerLayout from "./Pages/Seller/SellerLayout";
import AddProducts from "./Pages/Seller/AddProducts";
import ProductsList from "./Pages/Seller/ProductsList";
import Orders from "./Pages/Seller/Orders";
import Loading from "./Components/Loading";
import ContactPage from "./Pages/Contact";

const App = () => {
  const isSellerPath = useLocation().pathname.includes("/seller");
  
  const { isSeller, showUserLogin, fetchUser, fetchSellerStatus } = useAuthStore();
  const { fetchProducts } = useProductStore();
  const { setCartItems } = useCartStore();

  useEffect(() => {
    const init = async () => {
      const cartItems = await fetchUser();
      if (cartItems) setCartItems(cartItems);
      fetchProducts();
      fetchSellerStatus();
    };
    init();
  }, []);

  return (
    <div className="text-default min-h-screen text-gray-700 bg-white">
      {/* Conditionally Render Navbar */}
      {!isSellerPath && <Navbar />}

      {/* Display Login Modal */}
      {showUserLogin && <Login />}

      {/* Toast Notifications */}
      <Toaster />

      {/* Main Page Content */}
      <div
        className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`} // Responsive padding for non-seller pages
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/add-address" element={<AddAdress />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="*" element={<Noresults />} />
          <Route path="/loader" element={<Loading />} />
          {/* Add Additional Routes Here */}
          <Route
            path="/seller"
            element={isSeller ? <SellerLayout /> : <SellerLogin />}
          >
            <Route index element={isSeller ? <AddProducts /> : null} />
            <Route path="product-list" element={<ProductsList />} />
            <Route path="orders" element={<Orders />} />
          </Route>
        </Routes>
      </div>

      {/* Conditionally Render Footer */}
      {!isSellerPath && <Footer />}
    </div>
  );
};

export default App;
