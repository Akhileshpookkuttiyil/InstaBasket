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
      required: true,
    },
    cartItems: {
      type: Object,
      default: {},
    },
    isAdmin: {
      type: Boolean,
      default: false,
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
