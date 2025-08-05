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
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoutes.js";
import { stripeWebhook } from "./controllers/webhookController.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();
await cloudinaryConfig(); // Initialize Cloudinary configuration

const allowedOrigins = [
  "http://localhost:5173",
  "https://insta-basket.vercel.app",
];

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// This code sets up an Express server that connects to a MongoDB database using Mongoose. It uses middleware for JSON parsing, cookie parsing, and CORS handling. The server listens on a specified port and responds with "Hello, World!" when the root URL is accessed.
