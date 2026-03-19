import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useProductStore from "../store/useProductStore";
import {
  Package,
  CreditCard,
  RefreshCcw,
  ShieldCheck,
  Info,
  LogOut,
  UserCircle2,
  MapPinHouse,
  Settings,
  Bell,
  CheckCheck,
  Circle,
  Trash2,
} from "lucide-react";
import apiClient from "../shared/lib/apiClient";
import Avatar from "./Avatar";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  
  const { 
    user, 
    
    setshowUserLogin, 
    logout,
    loading 
  } = useAuthStore();
  
  const { 
    getCartCount, 
    setCartItems 
  } = useCartStore();
  
  const { 
    searchQuery, 
    setsearchQuery 
  } = useProductStore();
  
  const navigate = useNavigate();
  const userId = user?._id;

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      const success = await logout();
      if (success) {
        setCartItems({});
        setUserMenuOpen(false);
        setNotificationOpen(false);
        setNotifications([]);
        setUnreadCount(0);
        navigate("/");
      }
    }
  };

  const fetchNotifications = useCallback(async (showLoader = false) => {
    if (!userId) return;

    if (showLoader) {
      setNotificationsLoading(true);
    }

    try {
      const { data } = await apiClient.get("/api/notifications/user?limit=12");
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error.message);
    } finally {
      if (showLoader) {
        setNotificationsLoading(false);
      }
    }
  }, [userId]);

  const markNotificationRead = async (notificationId) => {
    try {
      await apiClient.patch(`/api/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Failed to mark notification read:", error.message);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const { data } = await apiClient.patch("/api/notifications/read-all");
      if (data.success) {
        setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications read:", error.message);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { data } = await apiClient.delete(`/api/notifications/${notificationId}`);
      if (data.success) {
        setNotifications((prev) => prev.filter((item) => item._id !== notificationId));
        setUnreadCount(Number(data.unreadCount || 0));
      }
    } catch (error) {
      console.error("Failed to delete notification:", error.message);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { data } = await apiClient.delete("/api/notifications/clear-all");
      if (data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to clear notifications:", error.message);
    }
  };

  const getNotificationTypeMeta = (type = "") => {
    const normalizedType = String(type || "").toUpperCase();
    switch (normalizedType) {
      case "PAYMENT_UPDATE":
        return {
          Icon: CreditCard,
          label: "Payment",
          iconClass: "text-emerald-600",
          bgClass: "bg-emerald-50",
          chipClass: "border-emerald-100 text-emerald-600 bg-emerald-50/60",
        };
      case "REFUND_UPDATE":
        return {
          Icon: RefreshCcw,
          label: "Refund",
          iconClass: "text-blue-600",
          bgClass: "bg-blue-50",
          chipClass: "border-blue-100 text-blue-600 bg-blue-50/60",
        };
      case "ACCOUNT":
        return {
          Icon: ShieldCheck,
          label: "Account",
          iconClass: "text-violet-600",
          bgClass: "bg-violet-50",
          chipClass: "border-violet-100 text-violet-600 bg-violet-50/60",
        };
      case "SYSTEM":
        return {
          Icon: Info,
          label: "System",
          iconClass: "text-amber-600",
          bgClass: "bg-amber-50",
          chipClass: "border-amber-100 text-amber-600 bg-amber-50/60",
        };
      case "ORDER_UPDATE":
      default:
        return {
          Icon: Package,
          label: "Order",
          iconClass: "text-primary",
          bgClass: "bg-primary/10",
          chipClass: "border-primary/20 text-primary bg-primary/10",
        };
    }
  };

  const formatNotificationTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const openNotification = async (item) => {
    if (!item.isRead) {
      await markNotificationRead(item._id);
    }
    setNotificationOpen(false);
    navigate("/my-orders");
  };

  const renderNotificationPanel = ({ mobile = false } = {}) => (
    <div
      className={`${
        mobile
          ? "sm:hidden absolute top-[60px] right-2 left-2"
          : "absolute top-12 right-0 w-[22rem]"
      } rounded-2xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50/70">
        <div className="flex items-center gap-2">
          <Bell size={15} className="text-gray-600" />
          <p className="font-semibold text-sm text-gray-800">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          onClick={markAllNotificationsRead}
          className="w-7 h-7 rounded-full border border-gray-200 text-gray-600 hover:text-primary hover:border-primary/40 hover:bg-primary/5 inline-flex items-center justify-center transition"
          title="Mark all as read"
          aria-label="Mark all notifications read"
        >
          <CheckCheck size={14} />
        </button>
      </div>

      <div className={`${mobile ? "max-h-72" : "max-h-80"} overflow-y-auto`}>
        {notificationsLoading ? (
          <p className="px-4 py-6 text-sm text-gray-500">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map((item) => {
            const { Icon, label, iconClass, bgClass, chipClass } = getNotificationTypeMeta(item.type);
            return (
              <div
                key={item._id}
                className={`px-3 py-3 border-b border-gray-100 last:border-b-0 ${
                  item.isRead ? "bg-white" : "bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-8 h-8 rounded-full ${bgClass} inline-flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon size={14} className={iconClass} />
                  </span>

                  <button
                    onClick={() => openNotification(item)}
                    className="flex-1 text-left hover:bg-gray-50 rounded-md px-1 py-0.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{item.title}</p>
                      {!item.isRead && (
                        <Circle size={8} className="fill-primary text-primary mt-1.5 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${chipClass}`}
                      >
                        {label}
                      </span>
                      <p className="text-[11px] text-gray-400">
                        {formatNotificationTime(item.createdAt)}
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => deleteNotification(item._id)}
                    className="w-7 h-7 rounded-full border border-transparent text-gray-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 inline-flex items-center justify-center transition shrink-0 mt-0.5"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-gray-200 bg-gray-50/60">
        <button
          onClick={clearAllNotifications}
          disabled={notifications.length === 0}
          className="w-full rounded-lg px-3 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 border border-rose-100 text-rose-600 hover:bg-rose-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
          Clear all notifications
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      if (window.location.pathname !== "/products") {
        navigate("/products");
      }
    }
  }, [searchQuery, navigate]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setNotificationOpen(false);
      return;
    }

    fetchNotifications(true);

    const intervalId = setInterval(() => {
      fetchNotifications(false);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchNotifications, userId]);

  return (
    <nav
      role="navigation"
      aria-label="Primary Navigation"
      className="flex items-center justify-between px-2 md:px-8 lg:px-12 xl:px-16 py-4 border-b border-gray-300 bg-white relative transition-all z-40"
    >
      {/* Logo */}
      <NavLink
        to="/"
        aria-label="Navigate to homepage"
        onClick={() => {
          setMenuOpen(false);
          setUserMenuOpen(false);
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
              x
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
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center">
            {loading ? (
              <svg
                className="w-3 h-3 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              getCartCount() || 0
            )}
          </span>
        </button>

        {user && (
          <div className="relative">
            <button
              type="button"
              aria-label="Open notifications"
              onClick={() => {
                setNotificationOpen((prev) => !prev);
                setUserMenuOpen(false);
                fetchNotifications(false);
              }}
              className="relative p-1.5 rounded-full hover:bg-gray-100 transition"
            >
              <Bell size={20} className="text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[10px] font-medium text-white bg-primary w-[17px] h-[17px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              renderNotificationPanel()
            )}
          </div>
        )}

        {/* User Login/Logout */}
        <div className="min-w-[40px] flex items-center justify-center">
          {loading ? (
            <svg
              className="w-5 h-5 text-primary animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : !user ? (
            <button
              onClick={() => setshowUserLogin(true)}
              className="cursor-pointer px-8 py-2 bg-primary hover:bg-primary-dull transition text-white rounded-full"
            >
              Login
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen((prev) => !prev);
                  setNotificationOpen(false);
                }}
                className="rounded-full"
                aria-expanded={userMenuOpen}
                aria-controls="user-dropdown-menu"
              >
                <Avatar user={user} size="w-8 h-8" />
              </button>
              <ul
                id="user-dropdown-menu"
                role="menu"
                aria-label="User menu"
                className={`absolute top-12 right-0 bg-white shadow-md border border-gray-200 py-2.5 w-48 rounded-md text-sm z-40 flex-col ${
                  userMenuOpen ? "flex" : "hidden"
                }`}
              >
                <li
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/my-orders");
                  }}
                  className="p-2 px-3 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-gray-700"
                >
                  <Package size={16} className="text-gray-500" /> My Orders
                </li>
                <li
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/profile");
                  }}
                  className="p-2 px-3 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-gray-700"
                >
                  <UserCircle2 size={16} className="text-gray-500" /> Profile
                </li>
                <li
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/my-addresses");
                  }}
                  className="p-2 px-3 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-gray-700"
                >
                  <MapPinHouse size={16} className="text-gray-500" /> Addresses
                </li>
                <li
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    navigate("/settings");
                  }}
                  className="p-2 px-3 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-gray-700"
                >
                  <Settings size={16} className="text-gray-500" /> Settings
                </li>
                <li
                  role="menuitem"
                  onClick={() => {
                    setUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="p-2 px-3 hover:bg-primary/10 cursor-pointer flex items-center gap-2 text-gray-700"
                >
                  <LogOut size={16} className="text-gray-500" /> Log Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="flex items-center gap-6 sm:hidden">
        {user && (
          <button
            type="button"
            aria-label="Open notifications"
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              fetchNotifications(false);
            }}
            className="relative cursor-pointer"
          >
            <Bell size={20} className="text-gray-700" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 text-[10px] text-white bg-primary w-[16px] h-[16px] rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

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
          <span className="absolute -top-2 -right-3 text-xs text-white bg-primary w-[18px] h-[18px] rounded-full flex items-center justify-center">
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

      {user && notificationOpen && renderNotificationPanel({ mobile: true })}

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
            <>
              <NavLink to="/my-orders" onClick={() => setMenuOpen(false)}>
                My Orders
              </NavLink>
              <NavLink to="/profile" onClick={() => setMenuOpen(false)}>
                Profile
              </NavLink>
              <NavLink to="/my-addresses" onClick={() => setMenuOpen(false)}>
                Addresses
              </NavLink>
              <NavLink to="/settings" onClick={() => setMenuOpen(false)}>
                Settings
              </NavLink>
            </>
          )}
          <NavLink to="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </NavLink>
          {loading ? (
            <div className="px-6 py-2 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            </div>
          ) : !user ? (
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
