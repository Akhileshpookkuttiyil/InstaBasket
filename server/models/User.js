import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        // password required only if not using Google auth
        return !this.googleId;
      },
      select: false, // don’t send password by default in queries
    },
    googleId: {
      type: String,
      default: null, // only set when registered via Google
    },
    profileImage: {
      type: String,
      default: "", // custom uploaded image (highest priority)
    },
    googleImage: {
      type: String,
      default: "", // photo pulled from Google OAuth
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    cartItems: {
      type: Object,
      default: {},
    },
    settings: {
      marketingEmails: {
        type: Boolean,
        default: true,
      },
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      darkMode: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        enum: ["en", "hi"],
        default: "en",
      },
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

const User = mongoose.models.user || mongoose.model("user", userSchema);
export default User;
