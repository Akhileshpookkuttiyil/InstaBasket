import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/user", authUser, getUserNotifications);
notificationRouter.patch("/read-all", authUser, markAllNotificationsRead);
notificationRouter.patch("/:id/read", authUser, markNotificationRead);

export default notificationRouter;
