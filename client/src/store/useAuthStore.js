import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

// Axios default setup
axios.defaults.withCredentials = true;
// Use VITE_BASE_URL for production; in dev the Vite proxy handles /api/* routing
if (import.meta.env.VITE_BASE_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
}

const useAuthStore = create((set, get) => ({
  user: null,
  isSeller: false,
  showUserLogin: false,
  loading: true,

  setShowUserLogin: (show) => set({ showUserLogin: show }),

  // Also expose setshowUserLogin as alias for components that reference it that way
  setshowUserLogin: (show) => set({ showUserLogin: show }),

  fetchUser: async () => {
    try {
      const { data } = await axios.get("/api/user/auth");
      if (data.success) {
        set({ user: data.user, loading: false });
        return data.user.cartItems || {};
      } else {
        set({ user: null, loading: false });
      }
    } catch (error) {
      set({ user: null, loading: false });
      // Suppress 401 noise (expected when not logged in)
      if (error?.response?.status !== 401) {
        console.error("Auth check failed:", error.message);
      }
    }
    return null;
  },

  fetchSellerStatus: async () => {
    try {
      const { data } = await axios.get("/api/seller/auth");
      set({ isSeller: data.success });
    } catch (error) {
      set({ isSeller: false });
    }
  },

  logout: async () => {
    try {
      const { data } = await axios.get("/api/user/logout");
      if (data.success) {
        set({ user: null, isSeller: false });
        toast.success("Logged out successfully");
        return true;
      }
    } catch (error) {
      toast.error("Logout failed");
    }
    return false;
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
