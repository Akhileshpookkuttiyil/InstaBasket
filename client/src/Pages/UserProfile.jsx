import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../shared/lib/apiClient";
import useAuthStore from "../store/useAuthStore";
import Avatar from "../Components/Avatar";
import { Camera, Trash2 } from "lucide-react";

const UserProfile = () => {
  const { user, loading: authLoading, setUser } = useAuthStore();
  const navigate = useNavigate();
  const userId = user?._id;
  const fileInputRef = useRef(null);

  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [preview, setPreview]       = useState(null);
  const [formData, setFormData]     = useState({ name: "", email: "", phone: "" });

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
            name:  data.profile?.name  || "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
          name:  data.profile?.name  || formData.name,
          phone: data.profile?.phone || formData.phone,
        }));
        setFormData((prev) => ({
          ...prev,
          name:  data.profile?.name  || prev.name,
          phone: data.profile?.phone || prev.phone,
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setPreview(URL.createObjectURL(file));
    handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    const form = new FormData();
    form.append("profileImage", file);
    try {
      const { data } = await apiClient.post("/api/user/profile/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success) {
        toast.success("Profile photo updated!");
        setUser((prev) => ({ ...(prev || {}), profileImage: data.profileImage }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    setUploading(true);
    try {
      const { data } = await apiClient.delete("/api/user/profile/image");
      if (data.success) {
        toast.success("Profile photo removed");
        setPreview(null);
        setUser((prev) => ({ ...(prev || {}), profileImage: "" }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove photo");
    } finally {
      setUploading(false);
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

      {/* Avatar Section */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm flex items-center gap-5">
        <div className="relative shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <Avatar user={user} size="w-20 h-20" className="ring-2 ring-primary/30" />
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Profile Photo</p>
          <p className="text-xs text-gray-400">JPG, PNG or WebP — max 5 MB</p>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-primary text-primary hover:bg-primary/5 transition disabled:opacity-50"
            >
              <Camera size={13} /> Change Photo
            </button>
            {user?.profileImage && (
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-red-300 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-gray-200 bg-white p-5 md:p-7 space-y-5 shadow-sm"
      >
        <div>
          <label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</label>
          <input
            id="name" name="name" value={formData.name} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
            placeholder="Enter your name" required
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
          <input
            id="email" name="email" value={formData.email}
            className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-600"
            disabled
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</label>
          <input
            id="phone" name="phone" value={formData.phone} onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary"
            placeholder="Enter your phone number"
          />
        </div>
        <button
          type="submit" disabled={saving}
          className={`w-full rounded py-3 font-medium transition ${saving ? "bg-primary/70 text-white cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dull"}`}
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>
    </div>
  );
};

export default UserProfile;
