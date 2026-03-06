import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";

const useAuthStore = create((set) => ({
  user: null,
  isSeller: false,
  showUserLogin: false,
  loading: true,

  setShowUserLogin: (show) => set({ showUserLogin: show }),
  setshowUserLogin: (show) => set({ showUserLogin: show }),

  fetchUser: async () => {
    try {
      const { data } = await apiClient.get("/api/user/auth");
      if (data.success) {
        set({ user: data.user, loading: false });
        return data.user.cartItems || {};
      }

      set({ user: null, loading: false });
    } catch (error) {
      set({ user: null, loading: false });
      if (error?.response?.status !== 401) {
        console.error("Auth check failed:", error.message);
      }
    }

    return null;
  },

  fetchSellerStatus: async () => {
    try {
      const { data } = await apiClient.get("/api/seller/auth");
      set({ isSeller: data.success });
    } catch {
      set({ isSeller: false });
    }
  },

  logout: async () => {
    try {
      const { data } = await apiClient.get("/api/user/logout");
      if (data.success) {
        set({ user: null, isSeller: false });
        toast.success("Logged out successfully");
        return true;
      }
    } catch {
      toast.error("Logout failed");
    }

    return false;
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
