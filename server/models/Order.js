import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: "product",
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, "Quantity must be at least 1"],
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    shippingAddress: {
      type: String,
      required: true,
      ref: "Address",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "Online"],
    },

    orderStatus: {
      type: String,
      default: "order placed",
      enum: [
        "order initiated",
        "order placed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
