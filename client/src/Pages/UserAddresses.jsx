import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Pencil, Trash2, CheckCircle2, PlusCircle } from "lucide-react";
import apiClient from "../shared/lib/apiClient";
import useAuthStore from "../store/useAuthStore";

const emptyAddress = {
  firstName: "",
  lastName: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
  phone: "",
};

const UserAddresses = () => {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyAddress);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to manage addresses");
      navigate("/");
      return;
    }

    if (!user) return;
    fetchAddresses();
  }, [authLoading, navigate, user]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/api/address/get");
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyAddress);
    setEditingId(null);
  };

  const handleEdit = (address) => {
    setEditingId(address._id);
    setFormData({
      firstName: address.firstName || "",
      lastName: address.lastName || "",
      email: address.email || "",
      street: address.street || "",
      city: address.city || "",
      state: address.state || "",
      zipCode: address.zipcode || "",
      country: address.country || "",
      phone: address.phone || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Delete this address?");
    if (!confirmDelete) return;

    try {
      const { data } = await apiClient.delete(`/api/address/${id}`);
      if (data.success) {
        toast.success(data.message || "Address removed");
        fetchAddresses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const { data } = await apiClient.patch(`/api/address/${id}/default`);
      if (data.success) {
        toast.success("Default address updated");
        fetchAddresses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update default address");
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = { address: formData };

    try {
      const { data } = isEditing
        ? await apiClient.patch(`/api/address/${editingId}`, payload)
        : await apiClient.post("/api/address/add", payload);

      if (data.success) {
        toast.success(data.message || (isEditing ? "Address updated" : "Address added"));
        resetForm();
        fetchAddresses();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-16 pb-16 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">My Addresses</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add and manage delivery addresses for faster checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm h-max"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <PlusCircle size={18} className="text-primary" />
            {isEditing ? "Edit Address" : "Add New Address"}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <TextInput label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
            <TextInput label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
          </div>
          <TextInput label="Email" name="email" value={formData.email} onChange={handleChange} type="email" />
          <TextInput label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
          <TextInput label="Street" name="street" value={formData.street} onChange={handleChange} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="City" name="city" value={formData.city} onChange={handleChange} />
            <TextInput label="State" name="state" value={formData.state} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
            <TextInput label="Country" name="country" value={formData.country} onChange={handleChange} />
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 rounded py-2.5 font-medium transition ${
                saving ? "bg-primary/70 text-white cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dull"
              }`}
            >
              {saving ? "Saving..." : isEditing ? "Update Address" : "Save Address"}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-gray-300 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading addresses...</p>
          ) : addresses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-gray-500">
              No addresses saved yet.
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address._id}
                className={`rounded-xl border p-4 bg-white shadow-sm ${
                  address.isDefault ? "border-primary/50" : "border-gray-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {address.street}, {address.city}, {address.state} - {address.zipcode}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.country} | {address.phone}
                    </p>
                    <p className="text-sm text-gray-500">{address.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 rounded border border-gray-200 hover:bg-gray-50"
                      aria-label="Edit address"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(address._id)}
                      className="p-2 rounded border border-red-200 text-red-500 hover:bg-red-50"
                      aria-label="Delete address"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
                      <CheckCircle2 size={14} />
                      Default Address
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="text-xs text-primary hover:underline"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const TextInput = ({ label, name, value, onChange, type = "text" }) => {
  return (
    <div className="mt-3">
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
      />
    </div>
  );
};

export default UserAddresses;
