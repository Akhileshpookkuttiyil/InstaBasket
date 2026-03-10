import React, { useEffect } from "react";
import { Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Login from "./Components/Login";
import AllProducts from "./Components/AllProducts";
import Noresults from "./Components/Noresults";
import ProductCategory from "./Components/ProductCategory";
import Loading from "./Components/Loading";
import Home from "./Pages/Home";
import ContactPage from "./Pages/Contact";
import ProductDetails from "./Pages/ProductDetails";
import Cart from "./Pages/Cart";
import AddAdress from "./Pages/AddAdress";
import MyOrders from "./Pages/MyOrders";
import UserProfile from "./Pages/UserProfile";
import UserAddresses from "./Pages/UserAddresses";
import UserSettings from "./Pages/UserSettings";
import SellerLogin from "./Components/Seller/SellerLogin";
import SellerLayout from "./Pages/Seller/SellerLayout";
import Dashboard from "./Pages/Seller/Dashboard";
import AddProducts from "./Pages/Seller/AddProducts";
import ProductsList from "./Pages/Seller/ProductsList";
import Orders from "./Pages/Seller/Orders";
import Users from "./Pages/Seller/Users";
import useAuthStore from "./features/auth/store/useAuthStore";
import useProductStore from "./features/product/store/useProductStore";
import useCartStore from "./features/cart/store/useCartStore";

const App = () => {
  const isSellerPath = useLocation().pathname.includes("/seller");

  const { isSeller, showUserLogin, fetchUser, fetchSellerStatus } = useAuthStore();
  const { fetchProducts } = useProductStore();
  const { setCartItems } = useCartStore();

  useEffect(() => {
    const init = async () => {
      const cartItems = await fetchUser();
      if (cartItems) {
        setCartItems(cartItems);
      }
      await fetchProducts();
      await fetchSellerStatus();
    };

    init();
  }, [fetchProducts, fetchSellerStatus, fetchUser, setCartItems]);

  return (
    <div className="text-default min-h-screen text-gray-700 bg-white">
      {!isSellerPath && <Navbar />}
      {showUserLogin && <Login />}
      <Toaster />

      <div className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32"}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/products/:category" element={<ProductCategory />} />
          <Route path="/products/:category/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/add-address" element={<AddAdress />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/my-addresses" element={<UserAddresses />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="*" element={<Noresults />} />
          <Route path="/loader" element={<Loading />} />
          <Route path="/users" element={<Navigate to="/seller/users" replace />} />
          <Route path="/orders" element={<Navigate to="/seller/orders" replace />} />
          <Route
            path="/seller"
            element={isSeller ? <SellerLayout /> : <SellerLogin />}
          >
            <Route index element={isSeller ? <Dashboard /> : null} />
            <Route path="add-product" element={isSeller ? <AddProducts /> : <Navigate to="/seller" />} />
            <Route path="product-list" element={isSeller ? <ProductsList /> : <Navigate to="/seller" />} />
            <Route path="orders" element={isSeller ? <Orders /> : <Navigate to="/seller" />} />
            <Route path="users" element={isSeller ? <Users /> : <Navigate to="/seller" />} />
          </Route>
        </Routes>
      </div>

      {!isSellerPath && <Footer />}
    </div>
  );
};

export default App;
