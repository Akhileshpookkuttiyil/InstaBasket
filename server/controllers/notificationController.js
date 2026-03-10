import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get notifications for current user: GET /api/notifications/user
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);

  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    Notification.countDocuments({ userId, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
  });
});

// Mark one notification as read: PATCH /api/notifications/:id/read
export const markNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification id",
    });
  }

  const updated = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    notification: updated,
  });
});

// Mark all as read: PATCH /api/notifications/read-all
export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await Notification.updateMany({ userId, isRead: false }, { isRead: true });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});
