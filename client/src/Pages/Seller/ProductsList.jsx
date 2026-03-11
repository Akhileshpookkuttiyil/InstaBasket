import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { categories } from "../../assets/assets";
import apiClient from "../../shared/lib/apiClient";
import {
  Search,
  Filter,
  Package,
  Edit,
  X,
  Save,
  Tag,
  DollarSign,
  Layers,
  Check,
  XCircle,
  AlertTriangle,
  Image,
  Settings,
} from "lucide-react";

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

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const currency = import.meta.env.VITE_CURRENCY || "$";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");

  const fetchSellerProducts = async (params = {}) => {
    try {
      const { data } = await apiClient.get("/api/seller/products", { params });
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load products");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSellerProducts({
        q: search || undefined,
        category: selectedCategory,
        inStock: stockStatus === "all" ? undefined : stockStatus === "instock",
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, stockStatus]);

  const toggleStock = async (id, inStock) => {
    try {
      const { data } = await apiClient.post("/api/seller/products/stock", { id, inStock });
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === id ? { ...p, inStock } : p))
        );
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
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
        `/api/seller/products/${editingProduct._id}`,
        payload
      );
      if (data.success) {
        toast.success("Product updated successfully");
        await fetchSellerProducts({
          q: search || undefined,
          category: selectedCategory,
          inStock: stockStatus === "all" ? undefined : stockStatus === "instock",
        });
        onEditClose();
      } else {
        toast.error(data.message || "Failed to update product");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <div className="w-full md:p-10 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6">
          <div className="flex items-center gap-2">
            <Package size={24} className="text-primary" />
            <h2 className="text-xl font-semibold text-gray-800">Products Management</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary min-w-[200px]"
              />
            </div>
            <div className="relative">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary appearance-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.path} value={cat.path}>
                    {cat.path}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Layers size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value)}
                className="rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary appearance-none"
              >
                <option value="all">All Items</option>
                <option value="instock">In Stock</option>
                <option value="outofstock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {isInitialLoading ? (
          <div className="text-center py-10 text-gray-500">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No products found.</div>
        ) : (
          <div className="flex flex-col items-center max-w-6xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
            <table className="md:table-auto table-fixed w-full">
              <thead className="text-gray-900 text-sm text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold truncate"><span className="flex items-center gap-1"><Package size={14} className="text-gray-500"/> Product</span></th>
                  <th className="px-4 py-3 font-semibold truncate"><span className="flex items-center gap-1"><Tag size={14} className="text-gray-500"/> Category</span></th>
                  <th className="px-4 py-3 font-semibold truncate hidden md:table-cell">
                    <span className="flex items-center gap-1"><DollarSign size={14} className="text-gray-500"/> Selling Price</span>
                  </th>
                  <th className="px-4 py-3 font-semibold truncate"><span className="flex items-center gap-1"><Layers size={14} className="text-gray-500"/> Stock</span></th>
                  <th className="px-4 py-3 font-semibold truncate"><span className="flex items-center gap-1"><Check size={14} className="text-gray-500"/> In Stock</span></th>
                  <th className="px-4 py-3 font-semibold truncate"><span className="flex items-center gap-1"><Settings size={14} className="text-gray-500"/> Actions</span></th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-500">
                {products.map((product) => (
                  <tr key={product._id} className="border-t border-gray-500/20">
                    <td className="md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3 truncate">
                      <div className="border border-gray-300 rounded p-2">
                        <img
                          src={product.image[0]}
                          alt={`Image of ${product.name}`}
                          className="w-16"
                          loading="lazy"
                        />
                      </div>
                      <span className="truncate max-sm:hidden w-full">{product.name}</span>
                    </td>

                    <td className="px-4 py-3">{product.category}</td>

                    <td className="px-4 py-3 max-sm:hidden">
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
                        className="relative inline-flex items-center cursor-pointer gap-3"
                        aria-label={`Toggle stock for ${product.name}`}
                      >
                        <input
                          onClick={() => toggleStock(product._id, !product.inStock)}
                          checked={product.inStock}
                          type="checkbox"
                          className="sr-only peer"
                          readOnly
                        />
                        <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-emerald-600 transition-colors duration-200" />
                        <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full flex items-center justify-center transition-transform duration-200 peer-checked:translate-x-5">
                          {product.inStock ? (
                            <Check size={12} className="text-white" />
                          ) : (
                            <X size={12} className="text-gray-500" />
                          )}
                        </div>
                      </label>
                    </td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => onEditOpen(product)}
                        className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dull"
                      >
                        <Edit size={14} />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingProduct && editForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4"
          onClick={onEditClose}
        >
          <form
            onSubmit={onEditSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit size={20} className="text-primary" />
                <h3 className="text-lg font-semibold text-gray-800">Edit Product</h3>
              </div>
              <button
                type="button"
                onClick={onEditClose}
                className="flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Package size={14} />
                  Name
                </label>
                <input
                  value={editForm.name}
                  onChange={(e) => onEditChange("name", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Tag size={14} />
                  Category
                </label>
                <select
                  value={editForm.category}
                  onChange={(e) => onEditChange("category", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                >
                  {categories.map((item) => (
                    <option key={item.path} value={item.path}>
                      {item.path}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Layers size={14} />
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.countInStock}
                  onChange={(e) => onEditChange("countInStock", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <DollarSign size={14} />
                  Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => onEditChange("price", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <AlertTriangle size={14} />
                  Offer Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={editForm.offerPrice}
                  onChange={(e) => onEditChange("offerPrice", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-600 flex items-center gap-2">
                  <Image size={14} />
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => onEditChange("description", e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                <input
                  type="checkbox"
                  checked={editForm.inStock}
                  onChange={(e) => onEditChange("inStock", e.target.checked)}
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
                className="flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                <X size={14} />
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dull disabled:opacity-60"
                disabled={saving}
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
