import { create } from "zustand";
import apiClient from "../shared/lib/apiClient";
import {
  defaultHomeContent,
  normalizeCategories,
} from "../shared/content/defaultContent";

const useContentStore = create((set) => ({
  categories: null,
  adminCategories: null,
  homeContent: null,
  loading: true,
  categoriesLoading: true,
  adminCategoriesLoading: true,
  homeContentLoading: true,
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
        categoriesError: "",
      });

      return nextCategories;
    } catch (error) {
      set({
        categories: [],
        categoriesError:
          error?.response?.data?.message || "Failed to load categories",
      });

      return [];
    } finally {
      set({
        categoriesLoading: false,
      });
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
        homeContentError: "",
      });

      return nextHomeContent;
    } catch (error) {
      set({
        homeContent: defaultHomeContent,
        homeContentError:
          error?.response?.data?.message || "Failed to load homepage content",
      });

      return defaultHomeContent;
    } finally {
      set({
        homeContentLoading: false,
      });
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
        adminCategoriesError: "",
      });

      return nextCategories;
    } catch (error) {
      set({
        adminCategories: [],
        adminCategoriesError:
          error?.response?.data?.message || "Failed to load admin categories",
      });

      return [];
    } finally {
      set({
        adminCategoriesLoading: false,
      });
    }
  },

  fetchContent: async () => {
    set({ loading: true });

    try {
      const [categoriesResult, homeContentResult] = await Promise.all([
        useContentStore.getState().fetchCategories(),
        useContentStore.getState().fetchHomeContent(),
      ]);

      set({
        categories: categoriesResult,
        homeContent: homeContentResult,
        hasLoaded: true,
      });
    } finally {
      set({
        loading: false,
      });
    }
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
