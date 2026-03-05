import React, { useState } from "react";
import useAuthStore from "../../store/useAuthStore";
import toast from "react-hot-toast";
import axios from "axios";
import { Link, Navigate, useNavigate } from "react-router-dom";

const SellerLogin = () => {
  const { isSeller, fetchSellerStatus } = useAuthStore();
  const navigate = useNavigate();
  // const [email, setEmail] = useState("");
  // const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("seller@instabasket.com");
  const [password, setPassword] = useState("instabasket");

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/seller/login", {
        email,
        password,
      });

      if (data.success) {
        await fetchSellerStatus();
        toast.success(data.message);
        navigate("/seller/");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || error.message || "Login error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Redirect if already logged in
  if (isSeller) return <Navigate to="/seller/" replace />;

  return (
    <form
      onSubmit={onSubmitHandler}
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-sm text-gray-700"
    >
      <div className="flex flex-col gap-5 w-full max-w-md sm:w-[352px] p-4 py-10 rounded-lg shadow-xl border border-gray-200 bg-white">
        <h1 className="text-2xl font-semibold text-center">
          <span className="text-primary">Seller</span> Login
        </h1>

        {/* Email */}
        <div className="w-full">
          <label htmlFor="email" className="block mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2 mt-1 outline-primary"
          />
        </div>

        {/* Password */}
        <div className="w-full">
          <label htmlFor="password" className="block mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2 mt-1 outline-primary"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary-dull transition text-white w-full py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Link to user login */}
        <p className="w-full text-center text-sm text-gray-600">
          Are you a user?{" "}
          <Link
            to="/"
            className="text-primary underline hover:text-primary-dull"
          >
            Go to User Login
          </Link>
        </p>
      </div>
    </form>
  );
};

export default SellerLogin;
