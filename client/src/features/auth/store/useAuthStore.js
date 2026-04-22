import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";

const useAuthStore = create((set, get) => ({
  user: null,
  isSeller: false,
  isAdmin: false,
  showUserLogin: false,
  loading: true,
  authChecked: false,

  setshowUserLogin: (show) => set({ showUserLogin: show }),
  setIsSeller: (status) => set({ isSeller: status }),

  fetchUser: async () => {
    set((state) => ({
      loading: true,
      authChecked: state.authChecked,
    }));

    try {
      const { data } = await apiClient.get("/api/user/auth");
      if (data.success) {
        set({
          user: data.user,
          isAdmin: data.user?.isAdmin === true,
          loading: false,
          authChecked: true,
        });
        return data.user.cartItems || {};
      }

      set({ user: null, isAdmin: false, loading: false, authChecked: true });
    } catch (error) {
      set({ user: null, isAdmin: false, loading: false, authChecked: true });
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

  adminLogin: async ({ email, password }) => {
    try {
      const { data } = await apiClient.post("/api/admin/login", { email, password });

      if (data.success) {
        set({
          user: data.user,
          isAdmin: data.user?.isAdmin === true,
          loading: false,
          authChecked: true,
        });

        return {
          success: true,
          user: data.user,
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Admin login failed",
      };
    }

    return {
      success: false,
      message: "Admin login failed",
    };
  },

  logout: async () => {
    try {
      const logoutPath = get().isAdmin ? "/api/admin/logout" : "/api/user/logout";
      const { data } = await apiClient.get(logoutPath);
      if (data.success) {
        set({
          user: null,
          isSeller: false,
          isAdmin: false,
          loading: false,
          authChecked: true,
        });
        toast.success("Logged out successfully");
        return true;
      }
    } catch {
      toast.error("Logout failed");
    }

    return false;
  },

  setUser: (userOrUpdater) =>
    set((state) => {
      const nextUser =
        typeof userOrUpdater === "function"
          ? userOrUpdater(state.user)
          : userOrUpdater;

      return {
        user: nextUser,
        isAdmin: nextUser?.isAdmin === true,
        loading: false,
        authChecked: true,
      };
    }),
}));

export default useAuthStore;
