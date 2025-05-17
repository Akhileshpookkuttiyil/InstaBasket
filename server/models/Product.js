import mongoose from "mongoose";

// Define a simplified Product schema
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true, // Trim leading/trailing spaces
    },
    image: {
      type: [String], // Array of image URLs
      required: true,
    },
    category: {
      type: [String], // Array for multiple categories (e.g., 'fruits', 'dairy')
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be a positive number"], // Ensure price is positive
    },
    offerPrice: {
      type: Number,
      min: [0, "Offer price must be a positive number"],
      validate: {
        validator: function (v) {
          return v < this.price || v === undefined; // Ensure offerPrice is less than original price
        },
        message: "Offer price cannot be greater than the original price.",
      },
    },
    countInStock: {
      type: Number,
      required: true,
      min: [0, "Stock count cannot be negative"], // Ensure non-negative stock count
    },
    expiryDate: {
      type: Date, // Expiry date for perishable products (optional)
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Add a virtual field `inStock` to check if the product is in stock
productSchema.virtual("inStock").get(function () {
  return this.countInStock > 0;
});

// Virtual field to check if the product is expired (for perishable goods)
productSchema.virtual("isExpired").get(function () {
  if (this.expiryDate) {
    return new Date() > this.expiryDate;
  }
  return false; // If no expiry date, consider it not expired
});

// Create the model only if it doesn't exist
const Product =
  mongoose.models.product || mongoose.model("product", productSchema);

export default Product;
// This code defines a Mongoose schema for a Product model in a Node.js application. The schema includes fields for name, image, brand, category, price, offer price, stock count, and an optional expiry date. It also includes virtual fields to check if the product is in stock and if it is expired. The model is exported for use in other parts of the application.
