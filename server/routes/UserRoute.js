// userRoute.js
import express from "express";
import {
  checkAuth,
  initiateUser,
  loginUser,
  logoutUser,
  resendOtp,
  verifyUser,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import rateLimit from "express-rate-limit";

const otpLimiter = rateLimit({
  windowMs: 60 * 5000, // 5 minute
  max: 3, //3 OTP
});

const userRouter = express.Router();

//desc    Register a new user
userRouter.post("/register/initiate", otpLimiter, initiateUser);
userRouter.post("/register/verify", verifyUser);
userRouter.post("/register/resend", otpLimiter, resendOtp);

//desc    Log in an existing user
userRouter.post("/login", loginUser);

//desc    Log out the user
userRouter.get("/logout", authUser, logoutUser);

//desc    Check if the user is authenticated
//access  Private
userRouter.get("/auth", authUser, checkAuth);

userRouter.get("/test", (req, res) => {
  res.send("User router is working!");
});

export default userRouter;
