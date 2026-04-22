import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ImagePlus, LayoutDashboard, Layers3, LogOut } from "lucide-react";
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
    <div className="flex h-full flex-col px-4 py-6">
      <div className="px-3 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
          InstaBasket
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
          Admin
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Clean control over categories, homepage content, and storefront assets.
        </p>
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
                `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
    <div className="flex items-center justify-between px-4 py-4 md:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          Content management
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-900">
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
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
      >
        <LogOut size={16} />
        Logout
      </button>
    </div>
  );

  return <AdminShell sidebar={sidebar} header={header}><Outlet /></AdminShell>;
};

export default AdminLayout;
