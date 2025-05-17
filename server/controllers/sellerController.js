// sellerController.js
import jwt from "jsonwebtoken";

// Login Seller : POST /api/seller/login

export const sellerLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    if (email === process.env.SELLER_EMAIL) {
      const isPasswordMatch = password === process.env.SELLER_PASSWORD;

      if (isPasswordMatch) {
        const sellerToken = jwt.sign({ email }, process.env.JWT_SECRET, {
          expiresIn: "7d",
        });
        res.cookie("sellerToken", sellerToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
          success: true,
          message: "Login successful",
          sellerToken,
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Check Auth Seller : GET /api/seller/auth

export const checkAuthSeller = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout Seller : GET /api/seller/logout

export const sellerLogout = async (req, res) => {
  try {
    res.clearCookie("sellerToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "strict",
    });
    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
