import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["order", "account", "system"],
      default: "order",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, "Title is too long"],
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, "Message is too long"],
    },
    meta: {
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
      status: {
        type: String,
        default: "",
      },
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

export default Notification;
