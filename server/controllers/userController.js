import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PendingUser from "../models/PendingUser.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";
import { cookieOptions } from "../config/env.js";

// Token generator utility
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Initiating User (OTP) : POST /api/user/register/initiate
export const initiateUser = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;
  email = email.toLowerCase();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: "Identification already exists" });
  }

  const existingPending = await PendingUser.findOne({ email });
  if (existingPending && existingPending.otpExpires > new Date()) {
    return res.status(400).json({
      success: false,
      message: "Security code already sent. Check your inbox.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  await PendingUser.findOneAndUpdate(
    { email },
    { name, email, hashedPassword, otp, otpExpires },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendEmail(
    email,
    "Verify your InstaBasket account",
    `Your verification code is: ${otp}`,
    `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #94dc1c;">InstaBasket Verification</h2>
      <p>Hello, please use the following code to verify your account:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">${otp}</div>
      <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
    </div>`
  );

  res.status(200).json({ success: true, message: "Verification code sent!" });
});


// Verify User OTP : POST /api/user/register/verify
export const verifyUser = asyncHandler(async (req, res) => {
  let { email, otp } = req.body;
  email = email.toLowerCase();
  
  const pendingUser = await PendingUser.findOne({ email });

  if (!pendingUser) {
    return res.status(400).json({ success: false, message: "No active registration found for this email" });
  }

  if (pendingUser.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid verification code" });
  }

  if (pendingUser.otpExpires < new Date()) {
    await PendingUser.deleteOne({ email });
    return res.status(400).json({ success: false, message: "Verification code expired" });
  }

  const newUser = await User.create({
    name: pendingUser.name,
    email: pendingUser.email,
    password: pendingUser.hashedPassword,
  });

  await PendingUser.deleteOne({ email });

  const token = generateToken(newUser);
  res.cookie("token", token, cookieOptions);

  res.status(201).json({
    success: true,
    message: "Elite account created successfully!",
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isAdmin: newUser.isAdmin || false,
    },
  });
});

// Resend OTP : POST /api/user/register/resend
export const resendOtp = asyncHandler(async (req, res) => {
  let { email } = req.body;
  email = email.toLowerCase();

  const pendingUser = await PendingUser.findOne({ email });
  if (!pendingUser) {
    return res.status(400).json({ success: false, message: "No active registration found" });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  pendingUser.otp = otp;
  pendingUser.otpExpires = otpExpires;
  await pendingUser.save();

  await sendEmail(
    email,
    "New verification code - InstaBasket",
    `Your new code is: ${otp}`,
    `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #94dc1c;">InstaBasket Refresh</h2>
      <p>Your new verification code is here:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0;">${otp}</div>
      <p style="color: #666; font-size: 14px;">This code will expire in 5 minutes.</p>
    </div>`
  );

  res.status(200).json({ success: true, message: "Fresh code sent to your inbox!" });
});

// Google Login : POST /api/user/google-login
export const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const googleRes = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${token}`
  );

  const { id: googleId, email, name, picture } = googleRes.data;

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      profileImage: picture,
      provider: "google",
    });
  } else if (!user.googleId) {
    user.googleId = googleId;
    user.profileImage = user.profileImage || picture;
    await user.save();
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact support.",
    });
  }

  const jwtToken = generateToken(user);
  res.cookie("token", jwtToken, cookieOptions);

  res.status(200).json({
    success: true,
    message: "Google authentication successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin || false,
    },
  });
});

// Login User : POST /api/user/login
export const loginUser = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();

  const user = await User.findOne({ email });
  if (!user || user.provider === 'google') {
    return res.status(401).json({ success: false, message: "Invalid credentials or login method" });
  }

  if (user.isActive === false) {
    return res.status(403).json({
      success: false,
      message: "Your account is inactive. Please contact support.",
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Secure authentication failed" });
  }

  const token = generateToken(user);
  res.cookie("token", token, cookieOptions);

  res.status(200).json({
    success: true,
    message: "Welcome back!",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin || false,
    },
  });
});

// Logout User : GET /api/user/logout
export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ success: true, message: "Logout successful" });
});

// Check Auth Status : GET /api/user/auth
export const checkAuth = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    return res.status(404).json({ success: false, message: "Account not found" });
  }

  res.status(200).json({
    success: true,
    user,
  });
});



