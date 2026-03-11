import React from "react";
import { assets } from "../../assets/assets";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";
import {
  LayoutDashboard,
  Plus,
  Package,
  ShoppingBag,
  Users,
  LogOut,
  Store
} from "lucide-react";

const SellerLayout = () => {
  const navigate = useNavigate();
  const { fetchSellerStatus } = useAuthStore();

  const sidebarLinks = [
    { name: "Dashboard", path: "/seller", icon: LayoutDashboard },
    { name: "Add Product", path: "/seller/add-product", icon: Plus },
    { name: "Products", path: "/seller/product-list", icon: Package },
    { name: "Orders", path: "/seller/orders", icon: ShoppingBag },
    { name: "Users", path: "/seller/users", icon: Users },
  ];

  const handleLogout = async () => {
    try {
      const { data } = await apiClient.get("/api/seller/logout");
      if (data.success) {
        toast.success(data.message);
        fetchSellerStatus(); // update auth store
        navigate("/seller");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-200 py-3 bg-white">
        <Link to="/">
          <img
            src={assets.logo}
            alt="logo"
            className="cursor-pointer w-34 md:w-38"
          />
        </Link>
        <div className="flex items-center gap-5 text-gray-500">
          <div className="hidden md:flex items-center gap-2 text-sm">
            <Store size={18} />
            <p>Seller Panel</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-gray-300 text-sm px-4 py-1 hover:bg-gray-50"
            aria-label="Logout from Seller Dashboard"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Sidebar & Content */}
      <div className="flex bg-gray-50/60">
        {/* Sidebar */}
        <nav className="md:w-64 w-16 border-r h-[95vh] border-gray-200 bg-white pt-4 flex flex-col">
          {sidebarLinks.map(({ name, path, icon }) => (
            <NavLink
              to={path}
              key={name}
              end={path === "/seller"}
              className={({ isActive }) =>
                `mx-2 mb-1 flex items-center rounded-lg py-2.5 px-3 gap-3 ${
                  isActive
                    ? "bg-primary/15 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {React.createElement(icon, { size: 20, strokeWidth: 2 })}
              <p className="md:block hidden font-medium">{name}</p>
            </NavLink>
          ))}
        </nav>

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default SellerLayout;
