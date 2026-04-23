import React from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ImagePlus, LayoutDashboard, Layers3, LogOut } from "lucide-react";
import { assets } from "../../assets/assets";
import useAuthStore from "../../store/useAuthStore";
import { AdminShell } from "./components/AdminSurface";

const links = [
  {
    label: "Overview",
    to: "/admin",
    end: true,
    icon: LayoutDashboard,
  },
  {
    label: "Categories",
    to: "/admin/categories",
    icon: Layers3,
  },
  {
    label: "Homepage",
    to: "/admin/homepage",
    icon: ImagePlus,
  },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();

  const sidebar = (
    <div className="flex h-full flex-col px-4 py-5">
      <div className="px-3 pb-4">
        <Link to="/" className="inline-flex">
          <img src={assets.logo} alt="InstaBasket" className="w-34 md:w-38" />
        </Link>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-primary/15 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between px-4 py-3 md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Content management
        </p>
        <h2 className="mt-1 text-xl font-semibold text-gray-800">
          {user?.name || "Admin"} workspace
        </h2>
      </div>
      <button
        onClick={async () => {
          const success = await logout();
          if (success) {
            navigate("/admin/login", { replace: true });
          }
        }}
        className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        <LogOut size={15} />
        Logout
      </button>
    </div>
  );

  return <AdminShell sidebar={sidebar} header={header}><Outlet /></AdminShell>;
};

export default AdminLayout;
