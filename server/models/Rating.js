import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "product",
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating can be at most 5"],
    },
    review: {
      type: String,
      trim: true,
      maxlength: [800, "Review cannot exceed 800 characters"],
      default: "",
    },
    isVerifiedBuyer: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

ratingSchema.index({ userId: 1, productId: 1 }, { unique: true });
ratingSchema.index({ productId: 1, createdAt: -1 });

const Rating = mongoose.models.Rating || mongoose.model("Rating", ratingSchema);

export default Rating;
