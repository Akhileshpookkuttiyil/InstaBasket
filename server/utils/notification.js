import Notification from "../models/Notification.js";

export const createUserNotification = async ({
  userId,
  title,
  message,
  type = "order",
  meta = {},
}) => {
  if (!userId || !title || !message) return null;

  return Notification.create({
    userId,
    type,
    title,
    message,
    meta,
  });
};
