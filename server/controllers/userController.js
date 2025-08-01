import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import PendingUser from "../models/PendingUser.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

// Token generator utility
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Initiating User
export const initiateUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    }

    email = email.toLowerCase();

    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    // Check if pending user exists with valid OTP
    const existingPending = await PendingUser.findOne({ email });
    if (existingPending && existingPending.otpExpires > new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP already sent. Please check your email.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Upsert pending user
    await PendingUser.findOneAndUpdate(
      { email },
      { name, email, hashedPassword, otp, otpExpires },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Send OTP email
    await sendEmail(
      email,
      "Verify your account",
      `Your OTP is: ${otp}. It expires in 5 minutes.`,
      `<p>Your OTP code is: <b>${otp}</b></p><p>This code expires in 5 minutes.</p>`
    );

    res.status(200).json({ success: true, message: "OTP sent to your email." });
  } catch (error) {
    console.error("Error in initiateUser:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Initiating User
export const verifyUser = async (req, res) => {
  try {
    let { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }
    email = email.toLowerCase();
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res
        .status(400)
        .json({ success: false, message: "No pending registration found" });
    }
    if (pendingUser.otp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
    if (pendingUser.otpExpires < new Date()) {
      await PendingUser.deleteOne({ email });
      return res.status(400).json({ success: false, message: "OTP expired" });
    }
    // Create user
    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.hashedPassword,
    });

    // Remove from pending users
    await PendingUser.deleteOne({ email });

    // Generate JWT token and set cookie (adjust your cookie options)
    const token = generateToken(newUser);
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin || false,
      },
    });
  } catch (error) {
    console.error("Error in verifyOtp:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

//resend otp
export const resendOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    email = email.toLowerCase();
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
      return res
        .status(400)
        .json({ success: false, message: "No pending registration" });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    pendingUser.otp = otp;
    pendingUser.otpExpires = otpExpires;
    await pendingUser.save();

    await sendEmail(
      email,
      "Your OTP Code",
      `Your OTP is: ${otp}. It expires in 5 minutes.`,
      `<p>Your OTP code is: <b>${otp}</b></p><p>This code expires in 5 minutes.</p>`
    );

    return res
      .status(200)
      .json({ success: true, message: "OTP re-sent successfully" });
  } catch (error) {
    console.error("Error in resendOtp:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Login User
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    }

    email = email.toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Logout User
export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", cookieOptions);
    return res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// userController.js
export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error in checkAuth:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// This code defines a user controller for handling user authentication in a Node.js application. It includes functions for registering, logging in, logging out, and checking authentication status. The functions use bcrypt for password hashing and JWT for token generation. The code also includes error handling and validation for user input.
