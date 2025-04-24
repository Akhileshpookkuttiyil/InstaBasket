import React from "react";
import Navbar from "./Components/Navbar";
import { Routes, Route, useLocation } from "react-router-dom";
import Home from "./Pages/Home";
import Footer from "./Components/Footer";
import { Toaster } from "react-hot-toast";
import { useAppContext } from "./Context/AppContext";
import Login from "./Components/Login";
import AllProducts from "./Components/AllProducts";

const App = () => {
  // Determine if the current path is a seller-related page
  const isSellerPath = useLocation().pathname.includes("/seller");

  // Access context for the login modal
  const { showUserLogin } = useAppContext();

  return (
    <div>
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
          {/* Add Additional Routes Here */}
        </Routes>
      </div>

      {/* Conditionally Render Footer */}
      {!isSellerPath && <Footer />}
    </div>
  );
};

export default App;
