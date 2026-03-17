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

// The minimize option is set to false to ensure that empty objects are stored as-is in the database.

const User = mongoose.models.user || mongoose.model("user", userSchema);
// The model is created only if it doesn't already exist in the mongoose models cache.
export default User;
// This code defines a Mongoose schema for a User model in a Node.js application. The schema includes fields for name, email, password, cart items, and an admin status. It also sets timestamps for when the document is created and updated. The model is exported for use in other parts of the application.
