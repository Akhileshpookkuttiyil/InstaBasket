import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";

const useProductStore = create((set) => ({
  products: [],
  searchQuery: "",
  loading: false,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setsearchQuery: (query) => set({ searchQuery: query }),

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const { data } = await axios.get("/api/products/all");
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
