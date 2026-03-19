import User from "../models/User.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";

const sanitizeCartData = async (cartData = {}) => {
  const requestedItems = Object.entries(cartData)
    .map(([productId, quantity]) => ({
      productId: String(productId).trim(),
      quantity: Number(quantity),
    }))
    .filter(
      (item) =>
        mongoose.Types.ObjectId.isValid(item.productId) &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0
    );

  const productIds = requestedItems.map((item) => item.productId);
  const products = productIds.length
    ? await Product.find({ _id: { $in: productIds } }).select(
        "_id inStock countInStock"
      )
    : [];
  const productMap = new Map(products.map((product) => [String(product._id), product]));

  const safeCart = {};
  for (const item of requestedItems) {
    const product = productMap.get(item.productId);
    if (!product || !product.inStock || Number(product.countInStock || 0) <= 0) {
      continue;
    }

    const safeQuantity = Math.min(item.quantity, Number(product.countInStock || 0));
    if (safeQuantity > 0) {
      safeCart[item.productId] = safeQuantity;
    }
  }

  return safeCart;
};

const areCartsEqual = (first = {}, second = {}) => {
  const firstKeys = Object.keys(first);
  const secondKeys = Object.keys(second);

  if (firstKeys.length !== secondKeys.length) return false;

  for (const key of firstKeys) {
    if (Number(first[key]) !== Number(second[key])) return false;
  }

  return true;
};

// update User cartData : POST /api/cart/update
export const updateCart = asyncHandler(async (req, res) => {
  const { cartData } = req.body;
  const userId = req.user.id;

  if (!cartData || typeof cartData !== "object" || Array.isArray(cartData)) {
    return res.status(400).json({
      success: false,
      message: "cartData must be an object",
    });
  }

  const safeCart = await sanitizeCartData(cartData);

  const user = await User.findByIdAndUpdate(
    userId,
    { cartItems: safeCart },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Cart items synced",
    cartItems: user.cartItems,
  });
});

// get User cartData : GET /api/cart/get
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("cartItems");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const existingCart = user.cartItems || {};
  const safeCart = await sanitizeCartData(existingCart);

  if (!areCartsEqual(existingCart, safeCart)) {
    user.cartItems = safeCart;
    await user.save();
  }

  return res.status(200).json({
    success: true,
    cartItems: safeCart,
  });
});
