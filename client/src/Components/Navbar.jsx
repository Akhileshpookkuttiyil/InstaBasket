import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";
import { useAppContext } from "../Context/AppContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false); // State for mobile menu
  const {
    user,
    setUser,
    setshowUserLogin,
    navigate,
    searchQuery,
    setsearchQuery,
    getCartCount,
  } = useAppContext();

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      setUser(null); // Clear user data
      navigate("/"); // Redirect to home page
    }
  };

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      navigate("/products"); // Navigate to products page on search query
    }
  }, [searchQuery, navigate]);

  return (
    <nav
      role="navigation"
      aria-label="Primary Navigation"
      className="flex items-center justify-between px-2 md:px-8 lg:px-12 xl:px-16 py-4 border-b border-gray-300 bg-white relative transition-all"
    >
      {/* Logo */}
      <NavLink
        to="/"
        aria-label="Navigate to homepage"
        onClick={() => {
          setMenuOpen(false);
          setsearchQuery("");
        }}
      >
        <img className="h-10" src={assets.logo} alt="Company Logo" />
      </NavLink>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-8">
        {/* Navigation Links */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "text-primary" : "text-gray-600"
          }
          onClick={() => setsearchQuery("")}
        >
          Home
        </NavLink>
        <NavLink
          to="/products"
          className={({ isActive }) =>
            isActive ? "text-primary" : "text-gray-600"
          }
          onClick={() => setsearchQuery("")}
        >
          All Products
        </NavLink>
        <NavLink
          to="/contact"
          className={({ isActive }) =>
            isActive ? "text-primary" : "text-gray-600"
          }
          onClick={() => setsearchQuery("")}
        >
          Contact
        </NavLink>

        {/* Search Bar */}
        <div className="hidden lg:flex items-center text-sm gap-2 border border-gray-300 px-3 rounded-full">
          <input
            aria-label="Search for products"
            value={searchQuery}
            onChange={(e) => setsearchQuery(e.target.value)}
            className="py-1.5 w-full bg-transparent outline-none placeholder-gray-500"
            type="text"
            placeholder="Search products"
          />
          {searchQuery.trim().length > 0 ? (
            <button
              aria-label="Clear search query"
              onClick={() => setsearchQuery("")}
              className="text-sm text-gray-500 hover:text-primary"
            >
              ✕
            </button>
          ) : (
            <button aria-label="Search for products">
              <img
                src={assets.search_icon}
                alt="Search Icon"
                className="w-4 h-4 cursor-pointer"
              />
            </button>
          )}
        </div>

        {/* Cart */}
        <button
          aria-label="Open cart"
          onClick={() => navigate("/cart")}
          className="relative cursor-pointer"
        >
          <img
            src={assets.nav_cart_icon}
            alt="Cart Icon"
            className="w-6 opacity-80"
          />
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {getCartCount() || 0}
          </span>
        </button>

        {/* User Login/Logout */}
        {!user ? (
          <button
            onClick={() => setshowUserLogin(true)}
            className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition text-white rounded-full"
          >
            Login
          </button>
        ) : (
          <div className="relative group">
            <img
              src={assets.profile_icon}
              alt="User Icon"
              className="w-10 h-10 rounded-full cursor-pointer"
            />
            <ul
              role="menu"
              className="hidden group-hover:flex absolute top-10 right-0 bg-white shadow-md border border-gray-200 py-2.5 w-30 rounded-md text-sm z-40 flex-col"
            >
              <li
                role="menuitem"
                onClick={() => navigate("/my-orders")}
                className="p-1.5 pl-3 hover:bg-primary/10 cursor-pointer"
              >
                My Orders
              </li>
              <li
                role="menuitem"
                onClick={handleLogout}
                className="p-1.5 pl-3 hover:bg-primary/10 cursor-pointer"
              >
                Log Out
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <div className="flex items-center gap-6 sm:hidden">
        {/* Cart Button */}
        <button
          aria-label="Open cart"
          onClick={() => navigate("/cart")}
          className="relative cursor-pointer"
        >
          <img
            src={assets.nav_cart_icon}
            alt="Cart Icon"
            className="w-6 opacity-80"
          />
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full">
            {getCartCount() || 0}
          </span>
        </button>

        {/* Menu Toggle */}
        <button
          aria-label="Toggle mobile menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <img src={assets.menu_icon} alt="Menu Icon" />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          role="menu"
          className="absolute top-[60px] left-0 w-full bg-white shadow-md py-4 flex flex-col items-start gap-2 px-5 text-sm md:hidden"
        >
          <NavLink to="/" onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>
          <NavLink to="/products" onClick={() => setMenuOpen(false)}>
            All Products
          </NavLink>
          {user && (
            <NavLink to="/my-orders" onClick={() => setMenuOpen(false)}>
              My Orders
            </NavLink>
          )}
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </NavLink>
          {!user ? (
            <button
              onClick={() => {
                setMenuOpen(false);
                setshowUserLogin(true);
              }}
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary transition text-white rounded-full text-sm"
            >
              Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="cursor-pointer px-6 py-2 mt-2 bg-primary hover:bg-primary transition text-white rounded-full text-sm"
            >
              Log Out
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
