import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import OtpVerificationForm from "./OtpVerificationForm";
import apiClient from "../shared/lib/apiClient";
import { env } from "../shared/config/env";
import { User as UserIcon, Mail, Lock, X } from "lucide-react";

const GoogleLoginButton = ({ onSuccess }) => {
  const loginWithGoogle = useGoogleLogin({
    onSuccess,
    onError: () => toast.error("Google login failed"),
  });

  return (
    <button
      type="button"
      onClick={() => loginWithGoogle()}
      className="w-full py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition inline-flex items-center justify-center gap-2"
    >
      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.5 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
        />
        <path
          fill="#34A853"
          d="M3.6 7.6l3.2 2.3C7.6 7.8 9.6 6.4 12 6.4c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.5 14.7 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.6z"
        />
        <path
          fill="#FBBC05"
          d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-2.4 0-4.4-1.4-5.1-3.4l-3.3 2.5C5.1 19.4 8.3 21.5 12 21.5z"
        />
        <path
          fill="#4285F4"
          d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.5c-.2 1.2-.9 2.2-2 2.9l3 2.4c1.7-1.6 2.6-4 2.6-7.6z"
        />
      </svg>
      Continue with Google
    </button>
  );
};

const Login = () => {
  const { setshowUserLogin, setUser } = useAuthStore();
  const { setCartItems } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const returnTo =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/")
      ? location.state.from
      : "/";

  const completeLogin = (data) => {
    setUser(data.user);
    setCartItems(data.user.cartItems || {});
    setshowUserLogin(false);
    navigate(returnTo, { replace: true });
  };

  const handleResendOtp = async () => {
    try {
      const { data } = await apiClient.post("/api/user/register/resend", {
        name,
        email,
        password,
      });

      if (data?.success) {
        toast.success("OTP resent to your email.");
      } else {
        toast.error(data?.message || "Failed to resend OTP");
      }
    } catch (err) {
      if (err?.response?.status === 429) {
        toast.error("Too many OTP requests. Please try again after a while.");
      } else {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to resend OTP";
        toast.error(message);
      }
    }
  };

  const handleGoogleLogin = async (res) => {
    try {
      const response = await apiClient.post("/api/user/google-login", {
        token: res.access_token,
      });
      toast.success("Google login success");
      completeLogin(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Google login failed");
    }
  };

  const handleUseDemoAccount = () => {
    setState("login");
    setEmail(env.demoUserEmail);
    setPassword(env.demoUserPassword);
    toast.success("Demo credentials filled. Click Login to continue.");
  };

  const handleOtpSubmit = async () => {
    try {
      const otpCode = otp.join("");
      const { data } = await apiClient.post("/api/user/register/verify", {
        email,
        otp: otpCode,
      });

      if (data.success) {
        toast.success("Verification successful!");
        setUser(data.user);
        setCartItems(data.user.cartItems || {});
        setshowUserLogin(false);
        navigate(returnTo, { replace: true });
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to verify OTP");
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === "login") {
        const { data } = await apiClient.post("/api/user/login", {
          email,
          password,
        });

        if (data.success) {
          toast.success(data.message);
          completeLogin(data);
        } else {
          toast.error(data.message);
        }
      } else if (state === "register-init") {
        const { data } = await apiClient.post("/api/user/register/initiate", {
          name,
          email,
          password,
        });

        if (data.success) {
          toast.success("OTP sent to your email.");
          setState("register-verify");
        } else {
          toast.error(data.message);
        }
      }
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || "An error occurred";
      toast.error(message);
    }
  };

  return (
    <div
      onClick={() => setshowUserLogin(false)}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4 text-sm text-gray-600"
    >
      {state === "register-verify" ? (
        <OtpVerificationForm
          otp={otp}
          setOtp={setOtp}
          onSubmit={handleOtpSubmit}
          onResend={handleResendOtp}
          onClose={() => setshowUserLogin(false)}
          email={email}
        />
      ) : (
        <form
          onSubmit={onSubmitHandler}
          onClick={(e) => e.stopPropagation()}
          className="relative flex flex-col gap-3 w-full max-w-80 sm:max-w-[380px] md:translate-y-6 items-start border border-gray-200 bg-white p-5 py-6 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setshowUserLogin(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Close login modal"
          >
            <X size={20} />
          </button>
          <p className="text-2xl font-medium m-auto">
            <span className="text-primary">User</span>{" "}
            {state === "login" ? "Login" : "Create Account"}
          </p>

          {state === "login" && (
            <p className="w-full text-center text-xs leading-5 text-gray-500">
              You can explore the app using a demo account or sign in with your own credentials.
            </p>
          )}

          {state === "register-init" && (
            <div className="w-full">
              <p className="mb-1">Name</p>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  placeholder="type here"
                  className="border border-gray-200 w-full py-2 pl-9 pr-3 outline-primary"
                  type="text"
                  required
                />
              </div>
            </div>
          )}
          <div className="w-full">
              <p className="mb-1">Email</p>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={(e) => setEmail(e.target.value)}
                  value={email}
                  placeholder="type here"
                  className="border border-gray-200 w-full py-2 pl-9 pr-3 outline-primary"
                  type="email"
                  required
                />
            </div>
          </div>
          <div className="w-full">
              <p className="mb-1">Password</p>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  onChange={(e) => setPassword(e.target.value)}
                  value={password}
                  placeholder="type here"
                  className="border border-gray-200 w-full py-2 pl-9 pr-3 outline-primary"
                  type="password"
                  required
                />
            </div>
          </div>

          <p className="w-full text-center">
            {state === "login"
              ? "Create an account?"
              : "Already have an account?"}{" "}
            <span
              onClick={() =>
                setState((prev) =>
                  prev === "login" ? "register-init" : "login"
                )
              }
              className="text-primary cursor-pointer"
            >
              click here
            </span>
          </p>

          <p className="w-full text-center text-sm">
            Are you a seller?{" "}
            <a href="/seller" className="text-primary cursor-pointer">
              Go to Seller Login
            </a>
          </p>

          <button
            type="submit"
            className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer"
          >
            {state === "login" ? "Login" : "Continue"}
          </button>

          {state === "login" && (
            <button
              type="button"
              onClick={handleUseDemoAccount}
              className="w-full py-2 border border-primary/30 text-primary hover:bg-primary/5 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Use Demo Account
            </button>
          )}

          {env.googleClientId ? (
            <GoogleLoginButton onSuccess={handleGoogleLogin} />
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 border border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed inline-flex items-center justify-center gap-2"
              title="Set VITE_GOOGLE_CLIENT_ID to enable Google login"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 opacity-60" aria-hidden="true">
                <path
                  fill="#9CA3AF"
                  d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C17 3.5 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
                />
              </svg>
              Google login unavailable
            </button>
          )}
        </form>
      )}
    </div>
  );
};

export default Login;
