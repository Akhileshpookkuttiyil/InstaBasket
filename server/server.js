import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import connectDB from "./configs/db.js";
import cloudinaryConfig from "./configs/cloudinary.js";
import { stripeWebhook } from "./controllers/webhookController.js";
import errorHandler from "./middlewares/errorHandler.js";
import { allowedOrigins } from "./config/env.js";
import { apiLimiter, applySecurityHeaders } from "./middlewares/security.js";
import userRouter from "./routes/UserRoute.js";
import sellerRouter from "./routes/SellerRoute.js";
import productRouter from "./routes/ProductRoute.js";
import cartRouter from "./routes/cartRoute.js";
import addressRouter from "./routes/addressRoute.js";
import orderRouter from "./routes/orderRoutes.js";
import ratingRouter from "./routes/ratingRoute.js";
import notificationRouter from "./routes/notificationRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

await connectDB();
await cloudinaryConfig();

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(applySecurityHeaders);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
    credentials: true,
  })
);

app.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(cookieParser());
app.use("/api", apiLimiter);

app.get("/", (req, res) => {
  res.send("InstaBasket API is running");
});

app.use("/api/user", userRouter);
app.use("/api/seller", sellerRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/address", addressRouter);
app.use("/api/order", orderRouter);
app.use("/api/ratings", ratingRouter);
app.use("/api/notifications", notificationRouter);

// Unmatched routes handler (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
