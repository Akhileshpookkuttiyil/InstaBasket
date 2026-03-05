import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";

// add product : POST /api/products/add
export const addProduct = asyncHandler(async (req, res) => {
  const productData = typeof req.body.productData === 'string' 
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

  const newProduct = await Product.create({
    ...productData,
    description: Array.isArray(productData.description) ? productData.description : productData.description.split("\n"),
    image: imagesUrls,
  });

  res.status(201).json({
    success: true,
    message: "Product launched successfully!",
    product: newProduct,
  });
});

// get all products : GET /api/products
export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    products,
  });
});

// get single product : GET /api/products/:id
export const getSingleProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  
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

  const product = await Product.findByIdAndUpdate(
    id,
    { inStock },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.status(200).json({
    success: true,
    message: `Product is now ${inStock ? 'In Stock' : 'Out of Stock'}`,
    product,
  });
});
