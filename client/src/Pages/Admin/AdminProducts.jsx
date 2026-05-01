import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Check,
  DollarSign,
  Edit,
  Filter,
  Layers,
  Package,
  Save,
  Search,
  Settings,
  Tag,
  X,
  XCircle,
} from "lucide-react";
import apiClient from "../../shared/lib/apiClient";
import useProductStore from "../../store/useProductStore";
import useContentStore from "../../store/useContentStore";
import { getImageFallback, getImageUrl } from "../../shared/lib/image";
import { EmptyState, Panel, StatCard } from "./components/AdminSurface";

const getEditableForm = (product) => ({
  name: product.name || "",
  category: product.category || "",
  description: Array.isArray(product.description)
    ? product.description.join("\n")
    : String(product.description || ""),
  price: product.price ?? 0,
  offerPrice: product.offerPrice ?? product.price ?? 0,
  countInStock: product.countInStock ?? 0,
  inStock: Boolean(product.inStock),
});

const AdminProducts = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const { fetchProducts } = useProductStore();
  const { categories, categoriesLoading } = useContentStore();
  const categoryList = categories || [];
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");

  const fetchAdminProducts = async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/admin/products", { params });
      if (data?.success) {
        setProducts(data.products || []);
      } else {
        toast.error(data?.message || "Failed to load products");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdminProducts({
        q: search || undefined,
        category: selectedCategory,
        inStock: stockStatus === "all" ? undefined : stockStatus === "instock",
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [search, selectedCategory, stockStatus]);

  const toggleStock = async (id, inStock) => {
    try {
      const { data } = await apiClient.post("/api/admin/products/stock", {
        id,
        inStock,
      });

      if (data?.success) {
        setProducts((prev) =>
          prev.map((product) =>
            product._id === id ? { ...product, inStock } : product
          )
        );
        fetchProducts({}, { silent: true });
        toast.success(data.message || "Stock updated");
      } else {
        toast.error(data?.message || "Failed to update stock");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update stock");
    }
  };

  const onEditOpen = (product) => {
    setEditingProduct(product);
    setEditForm(getEditableForm(product));
  };

  const onEditClose = () => {
    if (saving) return;
    setEditingProduct(null);
    setEditForm(null);
  };

  const onEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditSubmit = async (event) => {
    event.preventDefault();
    if (!editingProduct || !editForm) return;

    const numericPrice = Number(editForm.price);
    const numericOfferPrice = Number(editForm.offerPrice);
    const numericStock = Number(editForm.countInStock);

    if (!editForm.name || !editForm.category) {
      toast.error("Name and category are required.");
      return;
    }
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Price must be greater than 0.");
      return;
    }
    if (!Number.isFinite(numericOfferPrice) || numericOfferPrice < 0) {
      toast.error("Offer price is invalid.");
      return;
    }
    if (numericOfferPrice > numericPrice) {
      toast.error("Offer price cannot exceed product price.");
      return;
    }
    if (!Number.isInteger(numericStock) || numericStock < 0) {
      toast.error("Stock must be a non-negative integer.");
      return;
    }

    const payload = {
      name: editForm.name.trim(),
      category: editForm.category,
      description: String(editForm.description || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      price: numericPrice,
      offerPrice: numericOfferPrice,
      countInStock: numericStock,
      inStock: editForm.inStock && numericStock > 0,
    };

    try {
      setSaving(true);
      const { data } = await apiClient.patch(
        `/api/admin/products/${editingProduct._id}`,
        payload
      );

      if (data?.success) {
        toast.success("Product updated successfully");
        await fetchAdminProducts({
          q: search || undefined,
          category: selectedCategory,
          inStock: stockStatus === "all" ? undefined : stockStatus === "instock",
        });
        fetchProducts({}, { silent: true });
        onEditClose();
      } else {
        toast.error(data?.message || "Failed to update product");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  const summary = products.reduce(
    (acc, product) => {
      acc.total += 1;
      if (product.inStock && Number(product.countInStock || 0) > 0) {
        acc.inStock += 1;
      }
      if (Number(product.countInStock || 0) > 0 && Number(product.countInStock || 0) <= 5) {
        acc.lowStock += 1;
      }
      if (!product.inStock || Number(product.countInStock || 0) <= 0) {
        acc.outOfStock += 1;
      }
      return acc;
    },
    { total: 0, inStock: 0, lowStock: 0, outOfStock: 0 }
  );

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Panel
        title="Product operations"
        description="Monitor stock health and update live catalog details without leaving the admin panel."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Products" value={loading ? "..." : summary.total} />
            <StatCard label="In stock" value={loading ? "..." : summary.inStock} />
            <StatCard label="Low stock" value={loading ? "..." : summary.lowStock} />
            <StatCard label="Out of stock" value={loading ? "..." : summary.outOfStock} />
          </div>

          {/* Filters stay on a simple responsive grid to avoid the controls row
              expanding wider than the product page on mid-sized screens. */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full min-w-0 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none appearance-none focus:border-primary"
                disabled={categoriesLoading || categories === null}
              >
                <option value="all">All categories</option>
                {categoryList.map((category) => (
                  <option key={category.slug} value={category.path}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Layers
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <select
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
                className="h-11 rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none appearance-none focus:border-primary"
              >
                <option value="all">All stock states</option>
                <option value="instock">In stock</option>
                <option value="outofstock">Out of stock</option>
              </select>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Catalog inventory"
        description="All products below are live records from the commerce catalog."
      >
        {loading ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Try another filter or create products from the seller tools."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:hidden">
              {products.map((product) => (
                <div
                  key={`product-card-${product._id}`}
                  className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-gray-200 bg-white p-2">
                      <img
                        src={getImageUrl(product.image?.[0], "product")}
                        alt={product.name}
                        className="h-14 w-14 object-cover"
                        onError={(event) => {
                          event.currentTarget.src = getImageFallback("product");
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Price</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {currency}{product.offerPrice ?? product.price}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Stock</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {product.countInStock ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <label
                      className="relative inline-flex cursor-pointer items-center gap-3"
                      aria-label={`Toggle stock for ${product.name}`}
                    >
                      <input
                        type="checkbox"
                        checked={product.inStock}
                        readOnly
                        onClick={() => toggleStock(product._id, !product.inStock)}
                        className="peer sr-only"
                      />
                      <div className="h-7 w-12 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-emerald-600" />
                      <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5">
                        {product.inStock ? (
                          <Check size={12} className="text-emerald-600" />
                        ) : (
                          <X size={12} className="text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {product.inStock ? "In stock" : "Out of stock"}
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => onEditOpen(product)}
                      className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition hover:bg-primary-dull"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <Package size={14} className="text-gray-500" />
                        Product
                      </span>
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <Tag size={14} className="text-gray-500" />
                        Category
                      </span>
                    </th>
                    <th className="px-4 py-3 font-semibold hidden md:table-cell">
                      <span className="flex items-center gap-1">
                        <DollarSign size={14} className="text-gray-500" />
                        Price
                      </span>
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <Layers size={14} className="text-gray-500" />
                        Stock
                      </span>
                    </th>
                    <th className="px-4 py-3 font-semibold">Availability</th>
                    <th className="px-4 py-3 font-semibold">
                      <span className="flex items-center gap-1">
                        <Settings size={14} className="text-gray-500" />
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                  <tbody className="text-sm text-gray-600">
                    {products.map((product) => (
                    <tr key={product._id} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg border border-gray-200 p-2">
                            <img
                              src={getImageUrl(product.image?.[0], "product")}
                              alt={product.name}
                              className="h-14 w-14 object-cover"
                              onError={(event) => {
                                event.currentTarget.src = getImageFallback("product");
                              }}
                            />
                          </div>
                          <span className="font-medium text-gray-800">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{product.category}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {currency}
                        {product.offerPrice ?? product.price}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            Number(product.countInStock || 0) <= 5
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {product.countInStock ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <label
                          className="relative inline-flex cursor-pointer items-center gap-3"
                          aria-label={`Toggle stock for ${product.name}`}
                        >
                          <input
                            type="checkbox"
                            checked={product.inStock}
                            readOnly
                            onClick={() => toggleStock(product._id, !product.inStock)}
                            className="peer sr-only"
                          />
                          <div className="h-7 w-12 rounded-full bg-slate-300 transition-colors duration-200 peer-checked:bg-emerald-600" />
                          <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-5">
                            {product.inStock ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <X size={12} className="text-gray-500" />
                            )}
                          </div>
                        </label>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => onEditOpen(product)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-dull"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {editingProduct && editForm ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onClick={onEditClose}
        >
          <form
            onSubmit={onEditSubmit}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Edit product</h3>
              </div>
              <button
                type="button"
                onClick={onEditClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Package size={14} />
                  Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(event) => onEditChange("name", event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag size={14} />
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(event) => onEditChange("category", event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                  disabled={categoriesLoading || categories === null}
                >
                  {categoryList.map((category) => (
                    <option key={category.slug} value={category.path}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <Layers size={14} />
                  Stock quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.countInStock}
                  onChange={(event) =>
                    onEditChange("countInStock", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign size={14} />
                  Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(event) => onEditChange("price", event.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <AlertTriangle size={14} />
                  Offer price
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.offerPrice}
                  onChange={(event) =>
                    onEditChange("offerPrice", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(event) =>
                    onEditChange("description", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={editForm.inStock}
                  onChange={(event) => onEditChange("inStock", event.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="flex items-center gap-2">
                  {editForm.inStock ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <XCircle size={14} className="text-gray-400" />
                  )}
                  Mark as in stock
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onEditClose}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dull disabled:opacity-60"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
};

export default AdminProducts;
