// userRoute.js
import express from "express";
import {
  checkAuth,
  getProfile,
  getSettings,
  googleLogin,
  initiateUser,
  loginUser,
  logoutUser,
  resendOtp,
  updateProfile,
  updateSettings,
  verifyUser,
  uploadProfileImage,
  removeProfileImage,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import validate from "../middlewares/validate.js";
import { upload } from "../configs/multer.js";
import { registerSchema, loginSchema, otpSchema, emailSchema } from "../schemas/authSchema.js";
import { updateProfileSchema, updateSettingsSchema } from "../schemas/userSchema.js";
import rateLimit from "express-rate-limit";

const otpLimiter = rateLimit({
  windowMs: 60 * 5000, // 5 minute
  max: 3, //3 OTP
});

const userRouter = express.Router();

//desc    Register a new user
userRouter.post("/register/initiate", otpLimiter, validate(registerSchema), initiateUser);
userRouter.post("/register/verify", validate(otpSchema), verifyUser);
userRouter.post("/register/resend", otpLimiter, validate(emailSchema), resendOtp);

//desc    Log in an existing user
userRouter.post("/login", validate(loginSchema), loginUser);

userRouter.post("/google-login", googleLogin);

//desc    Log out the user
userRouter.get("/logout", authUser, logoutUser);

//desc    Check if the user is authenticated
//access  Private
userRouter.get("/auth", authUser, checkAuth);
userRouter.get("/profile", authUser, getProfile);
userRouter.patch("/profile", authUser, validate(updateProfileSchema), updateProfile);
userRouter.get("/settings", authUser, getSettings);
userRouter.patch("/settings", authUser, validate(updateSettingsSchema), updateSettings);

userRouter.post(
  "/profile/image",
  authUser,
  upload.single("profileImage"),
  uploadProfileImage
);
userRouter.delete("/profile/image", authUser, removeProfileImage);

userRouter.get("/test", (req, res) => {
  res.send("User router is working!");
});

export default userRouter;
