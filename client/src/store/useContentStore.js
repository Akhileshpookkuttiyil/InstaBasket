import { create } from "zustand";
import apiClient from "../shared/lib/apiClient";
import {
  defaultHomeContent,
  normalizeCategories,
} from "../shared/content/defaultContent";

const useContentStore = create((set) => ({
  categories: [],
  adminCategories: [],
  homeContent: null,
  loading: false,
  categoriesLoading: false,
  adminCategoriesLoading: false,
  homeContentLoading: false,
  hasLoaded: false,
  categoriesError: "",
  adminCategoriesError: "",
  homeContentError: "",

  fetchCategories: async () => {
    set({ categoriesLoading: true, categoriesError: "" });

    try {
      const { data } = await apiClient.get("/api/categories");
      const nextCategories =
        data?.success && Array.isArray(data.categories)
          ? normalizeCategories(data.categories)
          : [];

      set({
        categories: nextCategories,
        categoriesLoading: false,
        categoriesError: "",
      });

      return nextCategories;
    } catch (error) {
      set({
        categories: [],
        categoriesLoading: false,
        categoriesError:
          error?.response?.data?.message || "Failed to load categories",
      });

      return [];
    }
  },

  fetchHomeContent: async () => {
    set({ homeContentLoading: true, homeContentError: "" });

    try {
      const { data } = await apiClient.get("/api/site-content/home");
      const nextHomeContent =
        data?.success && data.content ? data.content : defaultHomeContent;

      set({
        homeContent: nextHomeContent,
        homeContentLoading: false,
        homeContentError: "",
      });

      return nextHomeContent;
    } catch (error) {
      set({
        homeContent: defaultHomeContent,
        homeContentLoading: false,
        homeContentError:
          error?.response?.data?.message || "Failed to load homepage content",
      });

      return defaultHomeContent;
    }
  },

  fetchAdminCategories: async () => {
    set({ adminCategoriesLoading: true, adminCategoriesError: "" });

    try {
      const { data } = await apiClient.get("/api/admin/categories");
      const nextCategories =
        data?.success && Array.isArray(data.categories)
          ? normalizeCategories(data.categories)
          : [];

      set({
        adminCategories: nextCategories,
        adminCategoriesLoading: false,
        adminCategoriesError: "",
      });

      return nextCategories;
    } catch (error) {
      set({
        adminCategories: [],
        adminCategoriesLoading: false,
        adminCategoriesError:
          error?.response?.data?.message || "Failed to load admin categories",
      });

      return [];
    }
  },

  fetchContent: async () => {
    set({ loading: true });

    const [categoriesResult, homeContentResult] = await Promise.all([
      useContentStore.getState().fetchCategories(),
      useContentStore.getState().fetchHomeContent(),
    ]);

    set({
      categories: categoriesResult,
      homeContent: homeContentResult,
      loading: false,
      hasLoaded: true,
    });
  },

  setCategories: (categories) =>
    set({
      categories: normalizeCategories(categories),
      categoriesError: "",
    }),

  setAdminCategories: (categories) =>
    set({
      adminCategories: normalizeCategories(categories),
      adminCategoriesError: "",
    }),
}));

export default useContentStore;
