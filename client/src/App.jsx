import React from "react";
import Navbar from "./Components/Navbar";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import Footer from "./Components/Footer";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./Context/AppContext";
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

const App = () => {
  // Determine if the current path is a seller-related page
  const isSellerPath = useLocation().pathname.includes("/seller");

  // Access context for the login modal
  const { showUserLogin, isSeller } = useAppContext();

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
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/add-address" element={<AddAdress />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="*" element={<Noresults />} />
          {/* Add Additional Routes Here */}
          <Route
            path="/seller"
            element={isSeller ? <SellerLayout /> : <SellerLogin />}
          ></Route>
        </Routes>
      </div>

      {/* Conditionally Render Footer */}
      {!isSellerPath && <Footer />}
    </div>
  );
};

export default App;
