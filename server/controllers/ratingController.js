import mongoose from "mongoose";
import Rating from "../models/Rating.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

const ensureObjectId = (id) => new mongoose.Types.ObjectId(id);

const refreshProductRatingStats = async (productId) => {
  const [stats] = await Rating.aggregate([
    {
      $match: {
        productId: ensureObjectId(productId),
      },
    },
    {
      $group: {
        _id: "$productId",
        rating: { $avg: "$rating" },
        ratingCount: { $sum: 1 },
      },
    },
  ]);

  const rating = stats?.rating ? Number(stats.rating.toFixed(1)) : 0;
  const ratingCount = stats?.ratingCount || 0;

  await Product.findByIdAndUpdate(productId, { rating, ratingCount });
};

const findDeliveredOrderForProduct = async (userId, productId) => {
  return Order.findOne({
    userId,
    orderStatus: "delivered",
    "items.product": productId,
  }).select("_id orderStatus createdAt");
};

export const upsertRating = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId, rating, review = "" } = req.body;

  const product = await Product.findById(productId).select("_id name");
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const verifiedOrder = await findDeliveredOrderForProduct(userId, productId);
  if (!verifiedOrder) {
    return res.status(403).json({
      success: false,
      message: "Only certified buyers can rate this product",
    });
  }

  let ratingDoc = await Rating.findOne({ userId, productId });
  const isEdit = Boolean(ratingDoc);

  if (ratingDoc) {
    ratingDoc.rating = rating;
    ratingDoc.review = review;
    ratingDoc.orderId = verifiedOrder._id;
    await ratingDoc.save();
  } else {
    ratingDoc = await Rating.create({
      userId,
      productId,
      orderId: verifiedOrder._id,
      rating,
      review,
      isVerifiedBuyer: true,
    });
  }

  await refreshProductRatingStats(productId);

  const populatedRating = await Rating.findById(ratingDoc._id)
    .populate("userId", "name email")
    .populate("productId", "name image category")
    .lean();

  res.status(200).json({
    success: true,
    message: isEdit ? "Review updated successfully" : "Review submitted successfully",
    rating: populatedRating,
  });
});

export const getProductRatings = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid product id",
    });
  }

  const productObjectId = ensureObjectId(productId);
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
  const skip = (page - 1) * limit;

  const [ratings, total, aggregatedStarCounts] = await Promise.all([
    Rating.find({ productId: productObjectId, isVerifiedBuyer: true })
      .populate("userId", "name")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Rating.countDocuments({ productId: productObjectId, isVerifiedBuyer: true }),
    Rating.aggregate([
      {
        $match: { productId: productObjectId, isVerifiedBuyer: true },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const product = await Product.findById(productObjectId).select("rating ratingCount");
  const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  aggregatedStarCounts.forEach(({ _id, count }) => {
    if (starCounts[_id] !== undefined) {
      starCounts[_id] = count;
    }
  });

  const starDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = starCounts[stars];
    return {
      stars,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });
  const weightedTotal = starDistribution.reduce(
    (sum, bucket) => sum + bucket.stars * bucket.count,
    0
  );
  const averageFromRatings = total > 0 ? Number((weightedTotal / total).toFixed(1)) : 0;
  const averageRating = product?.rating || averageFromRatings;

  res.status(200).json({
    success: true,
    ratings,
    summary: {
      averageRating,
      totalRatings: total,
      distribution: starDistribution,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

export const getMyRatings = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const ratings = await Rating.find({ userId })
    .populate("productId", "name image category")
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    ratings,
  });
});

export const getMyRatingForProduct = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const rating = await Rating.findOne({ userId, productId }).lean();

  res.status(200).json({
    success: true,
    rating,
  });
});

export const getRatingEligibility = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const productExists = await Product.exists({ _id: productId });
  if (!productExists) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const verifiedOrder = await findDeliveredOrderForProduct(userId, productId);
  const existingRating = await Rating.exists({ userId, productId });

  res.status(200).json({
    success: true,
    eligibility: {
      canRate: Boolean(verifiedOrder),
      canEdit: Boolean(existingRating),
      reason: verifiedOrder ? "" : "You can rate this product after a delivered purchase.",
    },
  });
});

export const deleteMyRating = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productId } = req.params;

  const deleted = await Rating.findOneAndDelete({ userId, productId });

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Rating not found",
    });
  }

  await refreshProductRatingStats(productId);

  res.status(200).json({
    success: true,
    message: "Rating deleted successfully",
  });
});
