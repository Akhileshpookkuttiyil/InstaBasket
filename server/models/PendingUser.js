// models/PendingUser.js
import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    hashedPassword: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpires: {
      type: Date,
      required: true,
      index: { expires: 0 }, 
    },
  },
  { timestamps: true }
);

const PendingUser =
  mongoose.models.PendingUser ||
  mongoose.model("PendingUser", pendingUserSchema);

export default PendingUser;
