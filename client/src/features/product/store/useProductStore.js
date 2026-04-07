import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";

const useProductStore = create((set) => ({
  products: [],
  searchQuery: "",
  loading: false,

  setsearchQuery: (query) => set({ searchQuery: query }),

  fetchProducts: async (params = {}, options = {}) => {
    const silent = Boolean(options?.silent);
    if (!silent) {
      set({ loading: true });
    }

    try {
      const { data } = await apiClient.get("/api/products/all", { params });
      if (data.success) {
        set((state) => ({
          products: data.products,
          loading: silent ? state.loading : false,
        }));
      } else {
        toast.error(data.message);
        if (!silent) {
          set({ loading: false });
        }
      }
    } catch (error) {
      console.error("Fetch products failed:", error.message);
      if (!silent) {
        set({ loading: false });
      }
    }
  },
}));

export default useProductStore;
