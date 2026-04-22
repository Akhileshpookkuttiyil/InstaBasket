import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Edit3, Plus, RefreshCw, Trash2, X } from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import { getImageFallback, getImageUrl } from "../../shared/lib/image";
import useContentStore from "../../store/useContentStore";
import {
  EmptyState,
  ErrorState,
  Panel,
  SkeletonRows,
} from "./components/AdminSurface";

const initialFormState = {
  name: "",
  slug: "",
  bgColor: "#F5F5F5",
  sortOrder: 0,
  isActive: true,
};

const fieldClassName =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-900 focus:bg-white";

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
      active
        ? "bg-emerald-100 text-emerald-700"
        : "bg-slate-200 text-slate-600"
    }`}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const CategoryManagement = () => {
  const {
    adminCategories,
    adminCategoriesLoading,
    adminCategoriesError,
    fetchAdminCategories,
    fetchCategories,
    fetchHomeContent,
  } = useContentStore();
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingCategory, setEditingCategory] = useState(null);
  const [formState, setFormState] = useState(initialFormState);
  const [imageFile, setImageFile] = useState(null);

  const previewUrl = useMemo(() => {
    if (imageFile) {
      return URL.createObjectURL(imageFile);
    }

    return getImageUrl(editingCategory?.image, "category");
  }, [editingCategory?.image, imageFile]);

  useEffect(() => {
    fetchAdminCategories();
  }, [fetchAdminCategories]);

  useEffect(() => {
    return () => {
      if (imageFile && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [imageFile, previewUrl]);

  const refreshCategoryCaches = async () => {
    await Promise.all([
      fetchAdminCategories(),
      fetchCategories(),
      fetchHomeContent(),
    ]);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormState(initialFormState);
    setImageFile(null);
  };

  const startEdit = (category) => {
    setEditingCategory(category);
    setFormState({
      name: category.name || "",
      slug: category.slug || "",
      bgColor: category.bgColor || "#F5F5F5",
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive !== false,
    });
    setImageFile(null);
  };

  const submitCategory = async (event) => {
    event.preventDefault();

    if (!formState.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    if (!editingCategory && !imageFile) {
      toast.error("Category image is required");
      return;
    }

    const payload = new FormData();
    payload.append("name", formState.name.trim());
    payload.append("slug", formState.slug.trim());
    payload.append("bgColor", formState.bgColor);
    payload.append("sortOrder", String(formState.sortOrder || 0));
    payload.append("isActive", String(formState.isActive));

    if (imageFile) {
      payload.append("image", imageFile);
    }

    setSaving(true);

    try {
      const { data } = await (editingCategory
        ? apiClient.put(`/api/admin/categories/${editingCategory._id}`, payload)
        : apiClient.post("/api/admin/categories", payload));

      if (!data?.success) {
        toast.error(data?.message || "Failed to save category");
        return;
      }

      toast.success(editingCategory ? "Category updated" : "Category created");
      resetForm();
      await refreshCategoryCaches();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) {
      return;
    }

    setDeletingId(category._id);

    try {
      const { data } = await apiClient.delete(`/api/admin/categories/${category._id}`);

      if (!data?.success) {
        toast.error(data?.message || "Failed to delete category");
        return;
      }

      toast.success("Category deleted");
      if (editingCategory?._id === category._id) {
        resetForm();
      }
      await refreshCategoryCaches();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to delete category");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Panel
        title={editingCategory ? "Edit category" : "Add category"}
        description="Create storefront categories with Cloudinary-hosted images, sort order, and publishing status."
        action={
          editingCategory ? (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <X size={14} />
              Cancel
            </button>
          ) : null
        }
        className="h-fit"
      >
        <form onSubmit={submitCategory} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, name: event.target.value }))
              }
              className={fieldClassName}
              placeholder="Fresh Fruits"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Slug</label>
            <input
              value={formState.slug}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, slug: event.target.value }))
              }
              className={fieldClassName}
              placeholder="fresh-fruits"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Background</label>
              <input
                type="color"
                value={formState.bgColor}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, bgColor: event.target.value }))
                }
                className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-2 py-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Sort order</label>
              <input
                type="number"
                min="0"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    sortOrder: Number(event.target.value || 0),
                  }))
                }
                className={fieldClassName}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, isActive: event.target.checked }))
              }
              className="rounded border-slate-300"
            />
            Publish category immediately
          </label>

          <div>
            <label className="text-sm font-medium text-slate-700">Category image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              className="mt-2 block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
            />
            <div className="mt-3 overflow-hidden rounded-[24px] border border-dashed border-slate-300 bg-slate-50">
              <img
                src={previewUrl || getImageFallback("category")}
                alt="Category preview"
                className="h-48 w-full object-cover"
                onError={(event) => {
                  event.currentTarget.src = getImageFallback("category");
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Plus size={16} />
            {saving
              ? "Saving..."
              : editingCategory
                ? "Update category"
                : "Create category"}
          </button>
        </form>
      </Panel>

      <Panel
        title="Category inventory"
        description="Every category below is coming from the backend. No hardcoded storefront fallbacks are used here."
        action={
          <button
            type="button"
            onClick={refreshCategoryCaches}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        }
      >
        {adminCategoriesLoading ? (
          <SkeletonRows rows={6} />
        ) : adminCategoriesError ? (
          <ErrorState
            title="Could not load categories"
            description={adminCategoriesError}
            onRetry={fetchAdminCategories}
          />
        ) : adminCategories.length === 0 ? (
          <EmptyState
            title="No categories found"
            description="Create your first category to populate the storefront category grid and seller product forms."
          />
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-slate-200">
            <div className="hidden grid-cols-[1.3fr_120px_140px_150px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 md:grid">
              <span>Name</span>
              <span>Image</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-slate-200">
              {adminCategories.map((category) => (
                <div
                  key={category._id}
                  className="grid gap-4 px-5 py-5 md:grid-cols-[1.3fr_120px_140px_150px] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4 md:block">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {category.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{category.slug}</p>
                      </div>
                      <div className="md:hidden">
                        <StatusBadge active={category.isActive !== false} />
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      Sort order: {category.sortOrder ?? 0}
                    </p>
                  </div>

                  <div>
                    <img
                      src={getImageUrl(category.image, "category")}
                      alt={category.name}
                      className="h-16 w-16 rounded-2xl object-cover"
                      onError={(event) => {
                        event.currentTarget.src = getImageFallback("category");
                      }}
                    />
                  </div>

                  <div className="hidden md:block">
                    <StatusBadge active={category.isActive !== false} />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(category)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCategory(category)}
                      disabled={deletingId === category._id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={14} />
                      {deletingId === category._id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
};

export default CategoryManagement;
