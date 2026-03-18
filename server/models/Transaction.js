import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Order",
    },
    transactionType: {
      type: String,
      required: true,
      enum: ["PAYMENT", "REFUND", "REVERSAL"],
    },
    paymentId: {
      type: String,
    },
    refundId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "COMPLETED", "FAILED"],
    },
    method: {
      type: String,
      required: true,
      // Supporting Manual and Cash overrides for admin audits
      enum: ["COD", "Online", "Manual Override", "Cash"],
    },
    reason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ orderId: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, status: 1 });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
export default Transaction;
