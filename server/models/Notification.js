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
      enum: ["ORDER_UPDATE", "PAYMENT_UPDATE", "REFUND_UPDATE", "ACCOUNT", "SYSTEM"],
      default: "ORDER_UPDATE",
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
      status: String,
      amount: Number,
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
