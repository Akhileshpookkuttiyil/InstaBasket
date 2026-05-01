import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isProductAvailable } from "../utils/inventory.js";
import { notifyAndClearStockSubscribers } from "../utils/stockNotification.js";

const parseDescription = (description) =>
  Array.isArray(description)
    ? description
    : String(description || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

// add product : POST /api/products/add
export const addProduct = asyncHandler(async (req, res) => {
  const productData = typeof req.body.productData === "string"
    ? JSON.parse(req.body.productData)
    : req.body.productData;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No images uploaded",
    });
  }

  const productImages = req.files.map((file) => file.path);

  const imagesUrls = await Promise.all(
    productImages.map(async (image) => {
      const result = await cloudinary.uploader.upload(image, {
        resource_type: "image",
      });
      return result.secure_url;
    })
  );

  const numericStock = Number(productData.countInStock || 0);
  const nextInStock =
    numericStock > 0 &&
    (typeof productData.inStock === "boolean" ? productData.inStock : true);

  const newProduct = await Product.create({
    ...productData,
    countInStock: numericStock,
    inStock: nextInStock,
    description: parseDescription(productData.description),
    image: imagesUrls,
  });

  res.status(201).json({
    success: true,
    message: "Product launched successfully!",
    product: newProduct,
  });
});

// get all products : GET /api/products/all
export const getAllProducts = asyncHandler(async (req, res) => {
  const { q, category, inStock } = req.query;

  const query = {};
  if (category && category !== "all") {
    query.category = category;
  }

  if (q && q.trim()) {
    query.name = { $regex: q.trim(), $options: "i" };
  }

  if (inStock !== undefined) {
    if (inStock === "true") {
      query.inStock = true;
      query.countInStock = { $gt: 0 };
    } else {
      query.$or = [{ inStock: false }, { countInStock: { $lte: 0 } }];
    }
  }

  const products = await Product.find(query)
    .select("-stockSubscribers")
    .sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    products,
  });
});

export const subscribeStockNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const product = await Product.findById(id).select(
    "name countInStock inStock stockSubscribers"
  );
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (isProductAvailable(product)) {
    return res.status(200).json({
      success: true,
      message: "Product is already available",
    });
  }

  const alreadySubscribed = (product.stockSubscribers || []).some(
    (subscriberId) => String(subscriberId) === String(userId)
  );

  if (alreadySubscribed) {
    return res.status(200).json({
      success: true,
      message: "You are already subscribed for restock alerts",
    });
  }

  await Product.findByIdAndUpdate(id, {
    $addToSet: { stockSubscribers: userId },
  });

  res.status(200).json({
    success: true,
    message: "You will be notified when this product is back in stock",
  });
});

// get single product : GET /api/products/:id
export const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id).select("-stockSubscribers");

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// update stock : POST /api/products/stock
export const changeStock = asyncHandler(async (req, res) => {
  const { id, inStock } = req.body;

  const product = await Product.findById(id).select(
    "name category countInStock inStock"
  );
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (inStock && Number(product.countInStock || 0) <= 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot mark product as in stock when quantity is 0",
    });
  }

  const wasAvailable = isProductAvailable(product);
  product.inStock = Boolean(inStock) && Number(product.countInStock || 0) > 0;
  await product.save();

  let notifiedUsers = 0;
  if (!wasAvailable && isProductAvailable(product)) {
    notifiedUsers = await notifyAndClearStockSubscribers({
      productId: product._id,
      productName: product.name,
      productCategory: product.category,
    });
  }

  res.status(200).json({
    success: true,
    message: `Product is now ${product.inStock ? "In Stock" : "Out of Stock"}`,
    notifiedUsers,
    product,
  });
});

// update product : PATCH /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    category,
    price,
    offerPrice,
    countInStock,
    inStock,
  } = req.body;

  const numericPrice = Number(price);
  const numericOfferPrice = Number(offerPrice);
  const numericStock = Number(countInStock);

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return res.status(400).json({
      success: false,
      message: "Price must be a positive number",
    });
  }

  if (Number.isFinite(numericOfferPrice) && numericOfferPrice > numericPrice) {
    return res.status(400).json({
      success: false,
      message: "Offer price cannot be greater than product price",
    });
  }

  if (!Number.isInteger(numericStock) || numericStock < 0) {
    return res.status(400).json({
      success: false,
      message: "Stock count cannot be negative",
    });
  }

  const existingProduct = await Product.findById(id).select(
    "name countInStock inStock"
  );
  if (!existingProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  const wasAvailable = isProductAvailable(existingProduct);
  const nextInStock =
    numericStock > 0 &&
    (typeof inStock === "boolean" ? Boolean(inStock) : true);

  const updatePayload = {
    name,
    category,
    description: parseDescription(description),
    price: numericPrice,
    offerPrice: Number.isFinite(numericOfferPrice)
      ? numericOfferPrice
      : undefined,
    countInStock: numericStock,
    inStock: nextInStock,
  };

  const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
    select: "-stockSubscribers",
  });

  if (!updatedProduct) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  let notifiedUsers = 0;
  if (!wasAvailable && isProductAvailable(updatedProduct)) {
    notifiedUsers = await notifyAndClearStockSubscribers({
      productId: updatedProduct._id,
      productName: updatedProduct.name,
      productCategory: updatedProduct.category,
    });
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    notifiedUsers,
    product: updatedProduct,
  });
});
