import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";

// Login Seller : POST /api/seller/login
export const sellerLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (email === process.env.SELLER_EMAIL) {
    const isPasswordMatch = password === process.env.SELLER_PASSWORD;

    if (isPasswordMatch) {
      const sellerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("sellerToken", sellerToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Welcome back, Admin",
        sellerToken,
      });
    }
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized access credentials",
  });
});

// Check Auth Seller : GET /api/seller/auth
export const checkAuthSeller = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
  });
});

// Logout Seller : GET /api/seller/logout
export const sellerLogout = asyncHandler(async (req, res) => {
  res.clearCookie("sellerToken", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  });

  res.status(200).json({
    success: true,
    message: "Session ended successfully",
  });
});
