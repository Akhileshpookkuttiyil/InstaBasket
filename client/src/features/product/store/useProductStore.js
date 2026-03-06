import { create } from "zustand";
import toast from "react-hot-toast";
import apiClient from "../../../shared/lib/apiClient";

const useProductStore = create((set) => ({
  products: [],
  searchQuery: "",
  loading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setsearchQuery: (query) => set({ searchQuery: query }),

  fetchProducts: async (params = {}) => {
    set({ loading: true });

    try {
      const { data } = await apiClient.get("/api/products/all", { params });
      if (data.success) {
        set({ products: data.products, loading: false });
      } else {
        toast.error(data.message);
        set({ loading: false });
      }
    } catch (error) {
      console.error("Fetch products failed:", error.message);
      set({ loading: false });
    }
  },
}));

export default useProductStore;
