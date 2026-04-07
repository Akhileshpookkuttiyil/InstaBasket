import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PendingUser from "../models/PendingUser.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";
import { cookieOptions } from "../config/env.js";
import { v2 as cloudinary } from "cloudinary";

// Token generator utility
const generateToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

const toAuthUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || "",
  googleImage: user.googleImage || "",
  provider: user.provider || "local",
  isAdmin: user.isAdmin || false,
  cartItems: user.cartItems || {},
});

const respondWithAuth = (res, user, message, statusCode = 200) => {
  const token = generateToken(user);
  res.cookie("token", token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    user: toAuthUser(user),
  });
};

const authenticatePasswordUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user || user.provider === "google") {
    return {
      success: false,
      statusCode: 401,
      message: "Invalid credentials or login method",
    };
  }

  if (user.isActive === false) {
    return {
      success: false,
      statusCode: 403,
      message: "Your account is inactive. Please contact support.",
    };
  }

  const isMatch = await bcrypt.compare(password, user.password || "");
  if (!isMatch) {
    return {
      success: false,
      statusCode: 401,
      message: "Secure authentication failed",
    };
  }

  return { success: true, user };
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
// Upload profile image: POST /api/user/profile/image
export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image uploaded" });
  }

  const result = await cloudinary.uploader.upload(req.file.path, {
    resource_type: "image",
    folder: "instabasket/profiles",
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" },
    ],
  });

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage: result.secure_url },
    { new: true, select: "name email profileImage googleImage provider" }
  ).lean();

  if (!user) {
    return res.status(404).json({ success: false, message: "Account not found" });
  }

  res.status(200).json({
    success: true,
    message: "Profile image updated",
    profileImage: user.profileImage,
    user,
  });
});

// Remove profile image: DELETE /api/user/profile/image
export const removeProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profileImage: "" },
    { new: true, select: "name email profileImage googleImage provider" }
  ).lean();

  if (!user) {
    return res.status(404).json({ success: false, message: "Account not found" });
  }

  res.status(200).json({
    success: true,
    message: "Profile image removed",
    user,
  });
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
      profileImage: newUser.profileImage || "",
      googleImage: newUser.googleImage || "",
      provider: newUser.provider || "local",
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
      googleImage: picture,
      provider: "google",
    });
  } else if (!user.googleId) {
    // Existing local user linking their Google account
    user.googleId = googleId;
    user.provider = "google";
    if (!user.googleImage) user.googleImage = picture;
    await user.save();
  } else {
    // Returning Google user — refresh Google photo if it changed
    if (picture && user.googleImage !== picture) {
      user.googleImage = picture;
      await user.save();
    }
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
    user: toAuthUser(user),
  });
});

// Login User : POST /api/user/login
export const loginUser = asyncHandler(async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase();

  const authResult = await authenticatePasswordUser({ email, password });
  if (!authResult.success) {
    return res.status(authResult.statusCode).json({
      success: false,
      message: authResult.message,
    });
  }

  return respondWithAuth(res, authResult.user, "Welcome back!");
});

// Logout User : GET /api/user/logout
export const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.status(200).json({ success: true, message: "Logout successful" });
});

// Get profile: GET /api/user/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "name email phone profileImage googleImage provider settings createdAt updatedAt"
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found",
    });
  }

  res.status(200).json({
    success: true,
    profile: user,
  });
});

// Update profile: PATCH /api/user/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found",
    });
  }

  if (typeof name === "string") {
    user.name = name.trim();
  }
  if (typeof phone === "string") {
    user.phone = phone.trim();
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      profileImage: user.profileImage,
      googleImage: user.googleImage,
      provider: user.provider,
      settings: user.settings || {},
      updatedAt: user.updatedAt,
    },
  });
});

// Get settings: GET /api/user/settings
export const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("settings");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found",
    });
  }

  res.status(200).json({
    success: true,
    settings: user.settings || {},
  });
});

// Update settings: PATCH /api/user/settings
export const updateSettings = asyncHandler(async (req, res) => {
  const allowedKeys = ["marketingEmails", "orderUpdates", "darkMode", "language"];
  const updatePayload = {};

  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(req.body, key)) {
      updatePayload[`settings.${key}`] = req.body[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updatePayload },
    { new: true }
  ).select("settings");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Account not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Settings updated successfully",
    settings: user.settings || {},
  });
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



