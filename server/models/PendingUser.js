import mongoose from "mongoose";

const pendingUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    hashedPassword: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
  },
  { timestamps: true }
);

// Optional: TTL index to auto-delete expired documents (MongoDB will remove documents after otpExpires)
pendingUserSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

const PendingUser =
  mongoose.models.PendingUser ||
  mongoose.model("PendingUser", pendingUserSchema);
export default PendingUser;
