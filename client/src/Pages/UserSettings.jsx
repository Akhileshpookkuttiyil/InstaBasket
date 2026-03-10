import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import apiClient from "../shared/lib/apiClient";
import useAuthStore from "../store/useAuthStore";

const defaultSettings = {
  marketingEmails: true,
  orderUpdates: true,
  darkMode: false,
  language: "en",
};

const UserSettings = () => {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to view settings");
      navigate("/");
      return;
    }

    if (!user) return;

    const fetchSettings = async () => {
      try {
        const { data } = await apiClient.get("/api/user/settings");
        if (data.success) {
          setSettings({ ...defaultSettings, ...(data.settings || {}) });
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [authLoading, navigate, user]);

  const onToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const { data } = await apiClient.patch("/api/user/settings", settings);
      if (data.success) {
        toast.success("Settings updated");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="mt-16 text-center text-gray-500">Loading settings...</p>;
  }

  return (
    <div className="mt-16 max-w-2xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Control notifications and account preferences.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 md:p-7 space-y-5 shadow-sm">
        <ToggleRow
          label="Marketing Emails"
          description="Receive offers, deals and product announcements."
          checked={settings.marketingEmails}
          onChange={() => onToggle("marketingEmails")}
        />

        <ToggleRow
          label="Order Updates"
          description="Get notified for shipping and delivery updates."
          checked={settings.orderUpdates}
          onChange={() => onToggle("orderUpdates")}
        />

        <ToggleRow
          label="Dark Mode"
          description="Keep your preferred theme for future sessions."
          checked={settings.darkMode}
          onChange={() => onToggle("darkMode")}
        />

        <div>
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            value={settings.language}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, language: event.target.value }))
            }
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary bg-white"
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </div>

        <button
          onClick={onSave}
          disabled={saving}
          className={`w-full rounded py-3 font-medium transition ${
            saving
              ? "bg-primary/70 text-white cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dull"
          }`}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between gap-4 border border-gray-100 rounded p-3.5">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default UserSettings;
