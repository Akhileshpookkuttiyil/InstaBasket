import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail } from "lucide-react";
import { assets } from "../../assets/assets";
import useAuthStore from "../../store/useAuthStore";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, authChecked, loading, adminLogin } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const initialMessage =
    typeof location.state?.message === "string" ? location.state.message : "";
  const [statusMessage, setStatusMessage] = useState(initialMessage);

  useEffect(() => {
    setStatusMessage(
      typeof location.state?.message === "string" ? location.state.message : ""
    );
  }, [location.state]);

  if (!authChecked || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/60">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary"
          aria-label="Loading admin session"
        />
      </div>
    );
  }

  if (authChecked && !loading && user && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage("");

    const result = await adminLogin({ email, password });

    setSubmitting(false);

    if (!result.success) {
      setStatusMessage(result.message);
      toast.error(result.message);
      return;
    }

    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50/60 px-4 py-6 text-gray-800">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-7">
          <img src={assets.logo} alt="InstaBasket" className="w-36" />

          <div className="mt-5">
            <p className="text-sm font-medium text-primary">Admin Login</p>
            <h1 className="mt-2 text-2xl font-semibold text-gray-800">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Use your admin email and password to continue to the console.
            </p>
          </div>

          {statusMessage && (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {statusMessage}
            </div>
          )}

          {authChecked && !loading && user && !isAdmin && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You are currently signed in with a non-admin account. Sign in with an admin account to continue.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus-within:border-primary">
                <Mail size={18} className="text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="admin@instabasket.com"
                  autoComplete="email"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus-within:border-primary">
                <Lock size={18} className="text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dull disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Signing in..." : "Sign in to Admin"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 text-sm font-medium text-primary transition hover:text-primary-dull"
          >
            Return to storefront
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
