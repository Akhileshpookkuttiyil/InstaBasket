import mongoose from "mongoose";

const ORDER_STATUS_VALUES = [
  "pending",
  "processing",
  "delivered",
  "completed",
  "cancelled",
];

const PAYMENT_METHOD_VALUES = ["stripe", "cod"];
const PAYMENT_STATUS_VALUES = ["unpaid", "paid", "refunded"];

const LEGACY_ORDER_STATUS_MAP = {
  PENDING: "pending",
  CONFIRMED: "processing",
  SHIPPED: "processing",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
  RETURN_REQUESTED: "delivered",
  RETURNED: "completed",
  "order initiated": "pending",
  "order placed": "processing",
  shipped: "processing",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "completed",
  pending: "pending",
  processing: "processing",
  completed: "completed",
};

const LEGACY_PAYMENT_METHOD_MAP = {
  COD: "cod",
  cod: "cod",
  Online: "stripe",
  online: "stripe",
  stripe: "stripe",
};

const LEGACY_PAYMENT_STATUS_MAP = {
  pending: "unpaid",
  unpaid: "unpaid",
  failed: "unpaid",
  paid: "paid",
  refunded: "refunded",
  PENDING: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded",
  REFUND_FAILED: "unpaid",
};

const normalizeOrderStatus = (value) => {
  if (!value) return "pending";
  return LEGACY_ORDER_STATUS_MAP[value] || "pending";
};

const normalizePaymentMethod = (value) => {
  if (!value) return "cod";
  return LEGACY_PAYMENT_METHOD_MAP[value] || "cod";
};

const normalizePaymentStatus = (value, isPaid) => {
  if (value) return LEGACY_PAYMENT_STATUS_MAP[value] || "unpaid";
  if (typeof isPaid === "boolean") return isPaid ? "paid" : "unpaid";
  return "unpaid";
};

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
        // Legacy compatibility fields (present on old orders)
        price: {
          type: Number,
        },
        offerPrice: {
          type: Number,
        },
        productName: {
          type: String,
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

    subtotalAmount: {
      type: Number,
      default: 0,
      min: [0, "Subtotal cannot be negative"],
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },

    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUS_VALUES,
      default: "pending",
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: PAYMENT_METHOD_VALUES,
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUS_VALUES,
      default: "unpaid",
    },

    stripeSessionId: {
      type: String,
    },

    stripePaymentIntentId: {
      type: String,
    },

    paymentFailureReason: {
      type: String,
      default: "",
    },

    refundedAmount: {
      type: Number,
      default: 0,
    },
    
    adminActions: [
      {
        action: String,
        adminEmail: String,
        timestamp: { type: Date, default: Date.now },
        reason: String,
      },
    ],

    paymentAuditLog: [
      {
        action: {
          type: String,
          enum: [
            "manual_mark_paid",
            "manual_mark_unpaid",
            "refund_initiated",
            "refund_completed",
            "refund_failed",
          ],
        },
        actor: String,
        reason: String,
        meta: mongoose.Schema.Types.Mixed,
        createdAt: { type: Date, default: Date.now },
      },
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
    
    paidAt: {
      type: Date,
    },
    
    paymentId: {
      type: String, // Stripe Payment Intent ID or Session ID
    },

    processedWebhookEvents: [
      {
        type: String,
      },
    ],

    checkoutFingerprint: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

orderSchema.pre("validate", function normalizeLegacyOrderFields(next) {
  this.orderStatus = normalizeOrderStatus(this.orderStatus);
  this.paymentMethod = normalizePaymentMethod(this.paymentMethod);
  this.paymentStatus = normalizePaymentStatus(this.paymentStatus, this.isPaid);
  this.isPaid = this.paymentStatus === "paid" || this.paymentStatus === "refunded";

  // Backfill legacy orders that were stored with `price`/`offerPrice` but no `priceAtPurchase`.
  if (Array.isArray(this.items)) {
    for (const item of this.items) {
      if (item.priceAtPurchase == null) {
        const legacyPrice = Number(item.offerPrice ?? item.price);
        item.priceAtPurchase = Number.isFinite(legacyPrice) && legacyPrice >= 0 ? legacyPrice : 0;
      }
    }
  }

  next();
});

orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });
orderSchema.index({ stripePaymentIntentId: 1 }, { unique: true, sparse: true });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
