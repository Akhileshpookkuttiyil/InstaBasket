import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";

const AdminRoute = () => {
  const { user, isAdmin, loading, authChecked } = useAuthStore();

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/60">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"
          aria-label="Loading admin access"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ message: "Access denied: Not an admin" }}
      />
    );
  }

  return <Outlet />;
};

export default AdminRoute;
