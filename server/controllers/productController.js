import { json } from "express";
import { v2 as cloudinary } from "cloudinary";
import Product from "../models/Product.js";

// add product : POST /api/products
export const addProduct = async (req, res) => {
  try {
    // Ensure you're using express.json() middleware in your app
    const productData = JSON.parse(req.body.productData); // Parse the incoming JSON data

    // Ensure files are present before accessing
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    // Get the uploaded image files
    const productImages = req.files.map((file) => file.path);

    // Upload images to Cloudinary and retrieve the URLs
    let imagesUrls = await Promise.all(
      productImages.map(async (image) => {
        const result = await cloudinary.uploader.upload(image, {
          resource_type: "image", // Image upload setting
        });

        // Return the public_id and secure_url for each image uploaded
        return {
          public_id: result.public_id,
          url: result.secure_url,
        };
      })
    );

    // Use Product.create() to create and save the product in one step
    const newProduct = await Product.create({
      ...productData, // Spread the product data (e.g., name, price, etc.)
      image: imagesUrls.map((img) => img.url), // Save the image URLs
    });

    // Send the response back to the client with the saved product
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// get all products : GET /api/products
export const getAllProducts = async (req, res) => {
  try {
    
    const products = await Product.find();
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// get single product : GET /api/products/:id
export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params; // Corrected: Use `req.params.id` to get the product ID
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// update stock : PUT /api/products/stock
export const changeStock = async (req, res) => {
  try {
    const { id, inStock } = req.body;

    // Find the product by ID and update the stock
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
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
