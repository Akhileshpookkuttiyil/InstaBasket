import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../shared/lib/apiClient";
import useAuthStore from "../store/useAuthStore";

const UserProfile = () => {
  const { user, loading: authLoading, setUser } = useAuthStore();
  const navigate = useNavigate();
  const userId = user?._id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !userId) {
      toast.error("Please login to view profile");
      navigate("/");
      return;
    }

    if (!userId) return;

    const fetchProfile = async () => {
      try {
        const { data } = await apiClient.get("/api/user/profile");
        if (data.success) {
          setFormData({
            name: data.profile?.name || "",
            email: data.profile?.email || "",
            phone: data.profile?.phone || "",
          });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, navigate, userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setSaving(true);
    try {
      const { data } = await apiClient.patch("/api/user/profile", {
        name: formData.name,
        phone: formData.phone,
      });

      if (data.success) {
        toast.success("Profile updated");
        setUser((prev) => ({
          ...(prev || {}),
          name: data.profile?.name || formData.name,
          phone: data.profile?.phone || formData.phone,
        }));
        setFormData((prev) => ({
          ...prev,
          name: data.profile?.name || prev.name,
          phone: data.profile?.phone || prev.phone,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="mt-16 text-center text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="mt-16 max-w-2xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update your account details used for orders and delivery.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-xl border border-gray-200 bg-white p-5 md:p-7 space-y-5 shadow-sm"
      >
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            value={formData.email}
            className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-600"
            disabled
          />
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
            placeholder="Enter your phone number"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`w-full rounded py-3 font-medium transition ${
            saving
              ? "bg-primary/70 text-white cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dull"
          }`}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
