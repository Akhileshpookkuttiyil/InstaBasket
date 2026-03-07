import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import apiClient from "../../shared/lib/apiClient";
import {
  Users as UsersIcon,
  UserCheck,
  UserX,
  Search,
  Calendar,
  DollarSign,
  ShoppingBag
} from "lucide-react";

const Users = () => {
  const currency = import.meta.env.VITE_CURRENCY || "$";
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/api/seller/users", {
        params: { q: search || undefined },
      });
      if (data.success) {
        setUsers(data.users);
      } else {
        toast.error(data.message || "Failed to load users");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleUserStatus = async (user) => {
    try {
      setUpdatingUserId(user._id);
      const { data } = await apiClient.patch(`/api/seller/users/${user._id}/status`, {
        isActive: !user.isActive,
      });
      if (data.success) {
        setUsers((prev) =>
          prev.map((item) =>
            item._id === user._id ? { ...item, isActive: !item.isActive } : item
          )
        );
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to update user");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to update user");
    } finally {
      setUpdatingUserId("");
    }
  };

  const totals = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.isActive) {
          acc.active += 1;
        } else {
          acc.inactive += 1;
        }
        return acc;
      },
      { total: 0, active: 0, inactive: 0 }
    );
  }, [users]);

  return (
    <div className="no-scrollbar h-[95vh] overflow-y-scroll p-4 md:p-8">
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <UsersIcon size={24} className="text-primary" />
          <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          Search users, track spending, and activate/deactivate accounts.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500">Total Users</p>
              <p className="text-xl font-semibold text-gray-800">{totals.total}</p>
            </div>
            <UsersIcon size={24} className="text-gray-400/50" />
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500">Active</p>
              <p className="text-xl font-semibold text-emerald-600">{totals.active}</p>
            </div>
            <UserCheck size={24} className="text-emerald-500/50" />
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm flex items-center justify-between">
            <div>
              <p className="text-gray-500">Inactive</p>
              <p className="text-xl font-semibold text-red-500">{totals.inactive}</p>
            </div>
            <UserX size={24} className="text-red-500/50" />
          </div>
        </div>

        <div className="mt-4 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email"
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Revenue</th>
                  <th className="px-4 py-3 font-semibold">Joined</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{user.ordersCount || 0}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {currency}
                      {Number(user.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleUserStatus(user)}
                        disabled={updatingUserId === user._id}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium text-white ${
                          user.isActive ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"
                        } ${updatingUserId === user._id ? "cursor-not-allowed opacity-60" : ""}`}
                      >
                        {updatingUserId === user._id
                          ? "Updating..."
                          : user.isActive
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
