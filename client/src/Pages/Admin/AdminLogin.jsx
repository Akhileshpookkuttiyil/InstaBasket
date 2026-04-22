import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Lock, Mail, ShieldAlert } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7f4]">
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(148,220,28,0.18),_transparent_35%),linear-gradient(180deg,_#f8fbf2_0%,_#eef4e7_100%)] px-4 py-10 text-gray-800">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-[0_30px_80px_rgba(16,36,24,0.12)] backdrop-blur md:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-between bg-[#102418] px-8 py-10 text-white md:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary/80">
                InstaBasket Admin
              </p>
              <h1 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
                Secure access for storefront operators.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/72">
                Sign in with an admin-approved account to manage categories,
                homepage content, and other protected operations.
              </p>
            </div>

            <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-primary/15 p-3 text-primary">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold">Role-based enforcement</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Credentials are verified by the backend and admin access is
                    granted only when the authenticated user record has
                    <span className="font-semibold text-white"> isAdmin === true</span>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-10 md:px-10">
            <div className="mx-auto w-full max-w-md">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-gray-400">
                Admin Login
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-gray-900">
                Welcome back
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Use your admin email and password to continue to the console.
              </p>

              {statusMessage && (
                <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {statusMessage}
                </div>
              )}

              {authChecked && !loading && user && !isAdmin && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You are currently signed in with a non-admin account. Sign in
                  with an admin account to continue.
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Email
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-primary focus-within:bg-white">
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
                  <span className="mb-2 block text-sm font-medium text-gray-700">
                    Password
                  </span>
                  <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-primary focus-within:bg-white">
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
                  className="w-full rounded-2xl bg-[#102418] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#183422] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Signing in..." : "Sign in to Admin"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => navigate("/", { replace: true })}
                className="mt-6 text-sm font-medium text-gray-500 transition hover:text-gray-800"
              >
                Return to storefront
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
