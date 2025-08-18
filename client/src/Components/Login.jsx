import React, { useState } from "react";
import { useAppContext } from "../Context/AppContext";
import toast from "react-hot-toast";
import OtpVerificationForm from "./OtpVerificationForm";
import { useGoogleLogin } from "@react-oauth/google";

const Login = () => {
  const { setshowUserLogin, axios, setUser, navigate, setCartItems } =
    useAppContext();

  const [state, setState] = useState("login"); // 'login' | 'register-init' | 'register-verify'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleResendOtp = async () => {
    try {
      const { data } = await axios.post("/api/user/register/resend", {
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
      if (err.status === 429) {
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
      const response = await axios.post(
        "/api/user/google-login",
        { token: res.access_token },
        { withCredentials: true }
      );
      setUser(response.data.user);
      toast.success("Google login success");
      setshowUserLogin(false);
    } catch (error) {
      console.error(error);
      toast.error("Google login failed");
    }
  };

  const loginWithGoogle = useGoogleLogin({
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    onSuccess: handleGoogleLogin,
    onError: () => toast.error("Google login failed"),
  });

  const handleOtpSubmit = async () => {
    try {
      const otpCode = otp.join("");
      const { data } = await axios.post("/api/user/register/verify", {
        email,
        otp: otpCode,
      });
      if (data.success) {
        toast.success("Verification successful!");
        setUser(data.user);
        setCartItems(data.user.cartItems || []);
        setshowUserLogin(false);
        navigate("/");
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
        const { data } = await axios.post("/api/user/login", {
          email,
          password,
        });
        if (data.success) {
          toast.success(data.message);
          setUser(data.user);
          setCartItems(data.user.cartItems || []);
          navigate("/");
          setshowUserLogin(false);
        } else toast.error(data.message);
      } else if (state === "register-init") {
        const { data } = await axios.post("/api/user/register/initiate", {
          name,
          email,
          password,
        });
        if (data.success) {
          toast.success("OTP sent to your email.");
          setState("register-verify");
        } else toast.error(data.message);
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
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 text-sm text-gray-600"
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
          className="flex flex-col gap-4 m-auto items-start p-8 py-12 w-80 sm:w-[352px] rounded-lg shadow-xl border border-gray-200 bg-white"
        >
          <p className="text-2xl font-medium m-auto">
            <span className="text-primary">User</span>{" "}
            {state === "login" ? "Login" : "Create Account"}
          </p>

          {state === "register-init" && (
            <div className="w-full">
              <p>Name</p>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                placeholder="type here"
                className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
                type="text"
                required
              />
            </div>
          )}
          <div className="w-full">
            <p>Email</p>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              placeholder="type here"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
              type="email"
              required
            />
          </div>
          <div className="w-full">
            <p>Password</p>
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              placeholder="type here"
              className="border border-gray-200 rounded w-full p-2 mt-1 outline-primary"
              type="password"
              required
            />
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

          <button
            type="submit"
            className="bg-primary hover:bg-primary-dull transition-all text-white w-full py-2 rounded-md cursor-pointer"
          >
            {state === "login" ? "Login" : "Continue"}
          </button>
          <div className="mt-4">
            <button
              onClick={loginWithGoogle}
              aria-label="Sign in with Google"
              className="w-full flex items-center justify-center gap-2 py-2 border rounded-full text-sm font-medium text-gray-800 bg-white shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <img
                src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
                alt=""
                className="w-5 h-5"
              />
              <span>Sign in with Google</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Login;
