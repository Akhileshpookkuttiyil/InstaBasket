// app.js
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js"; // Corrected import path
import "dotenv/config"; // Load environment variables from .env file
import userRouter from "./routes/UserRoute.js";
import sellerRouter from "./routes/SellerRoute.js";
import cloudinaryConfig from "./configs/cloudinary.js";
import productRouter from "./routes/ProductRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();
await cloudinaryConfig(); // Initialize Cloudinary configuration

const allowOrigin = ["http://localhost:5173"];

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowOrigin, credentials: true }));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter); // Assuming you have a sellerRouter
app.use("/api/products", productRouter); // Assuming you have a productRouter

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// This code sets up an Express server that connects to a MongoDB database using Mongoose. It uses middleware for JSON parsing, cookie parsing, and CORS handling. The server listens on a specified port and responds with "Hello, World!" when the root URL is accessed.
