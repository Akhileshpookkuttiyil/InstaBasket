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
        priceAtPurchase: {
          type: Number,
          required: true,
        },
        returnStatus: {
          type: String,
          enum: ["NONE", "REQUESTED", "RETURNED", "REJECTED"],
          default: "NONE",
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // Logistical Status (The Physical Flow)
    orderStatus: {
      type: String,
      default: "PENDING",
      enum: [
        "PENDING",
        "CONFIRMED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURN_REQUESTED",
        "RETURNED",
      ],
    },

    // Financial Status (The Money Flow)
    paymentStatus: {
      type: String,
      default: "PENDING",
      enum: ["PENDING", "PAID", "UNPAID", "REFUND_PENDING", "REFUNDED", "REFUND_FAILED"],
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["COD", "Online"],
    },

    // Tracking for Refunds
    refundedAmount: {
      type: Number,
      default: 0,
    },
    
    // Audit log for admin overrides
    adminActions: [
      {
        action: String,
        adminEmail: String,
        timestamp: { type: Date, default: Date.now },
        reason: String,
      }
    ],

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    inventoryApplied: {
      type: Boolean,
      default: false,
    },
    
    paymentId: String, // Reference to Stripe/Razorpay session or intent
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
