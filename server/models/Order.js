import mongoose from "mongoose";

// Define the Order schema
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: "user",
    },
    items: [
      {
        product: {
          type: String,
          required: true,
          ref: "product",
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipcode: { type: String, required: true },
      country: { type: String, required: true },
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false, // False by default, set to true once payment is successful
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    orderStatus: {
      type: String,
      default: "order placed", // Can be 'order placed', 'shipped', 'delivered', etc.
    },
  },
  { timestamps: true }
);

// Create or fetch the model from the cache
const Order = mongoose.models.order || mongoose.model("order", orderSchema);

// Export the Order model
export default Order;
// This code defines a Mongoose schema for an Order model in a Node.js application. The schema includes fields for user ID, items, total amount, shipping address, payment status, payment method, and order status. It also sets timestamps for when the document is created and updated. The model is exported for use in other parts of the application.
