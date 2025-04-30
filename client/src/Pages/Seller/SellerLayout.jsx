import React from "react";
import { useAppContext } from "../../Context/AppContext";
import { assets } from "../../assets/assets";
import { Link, NavLink, Outlet } from "react-router-dom";

const SellerLayout = () => {
  const { setIsSeller } = useAppContext();

  const sidebarLinks = [
    { name: "Add Product", path: "/seller", icon: assets.add_icon },
    {
      name: "Product List",
      path: "/seller/product-list",
      icon: assets.product_list_icon,
    },
    { name: "Orders", path: "/seller/orders", icon: assets.order_icon },
  ];

  const handleLogout = () => {
    setIsSeller(false);
  };

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white">
        <Link to="/">
          <img
            src={assets.logo}
            alt="logo"
            className="cursor-pointer w-34 md:w-38"
          />
        </Link>
        <div className="flex items-center gap-5 text-gray-500">
          <p>Hi! Admin</p>
          <button
            onClick={handleLogout}
            className="border rounded-full text-sm px-4 py-1"
            aria-label="Logout from Seller Dashboard"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Sidebar & Content */}
      <div className="flex">
        {/* Sidebar */}
        <nav className="md:w-64 w-16 border-r h-[95vh] border-gray-300 pt-4 flex flex-col">
          {sidebarLinks.map(({ name, path, icon }) => (
            <NavLink
              to={path}
              key={name}
              end={path === "/seller"}
              className={({ isActive }) =>
                `flex items-center py-3 px-4 gap-3 ${
                  isActive
                    ? "border-r-4 md:border-r-[6px] bg-primary/10 border-primary text-primary"
                    : "hover:bg-gray-100/90"
                }`
              }
            >
              <img src={icon} alt={`${name} icon`} className="w-7 h-7" />
              <p className="md:block hidden">{name}</p>
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
