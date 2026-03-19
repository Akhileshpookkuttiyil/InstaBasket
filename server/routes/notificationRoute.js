import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  deleteAllNotifications,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/user", authUser, getUserNotifications);
notificationRouter.patch("/read-all", authUser, markAllNotificationsRead);
notificationRouter.delete("/clear-all", authUser, deleteAllNotifications);
notificationRouter.patch("/:id/read", authUser, markNotificationRead);
notificationRouter.delete("/:id", authUser, deleteNotification);

export default notificationRouter;
