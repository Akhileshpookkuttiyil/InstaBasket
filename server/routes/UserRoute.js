// userRoute.js
// Routes related to user authentication (register, login, logout, auth check)

import express from "express";
import {
  checkAuth,
  initiateUser,
  loginUser,
  logoutUser,
  verifyUser,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";

const userRouter = express.Router();

//route   POST /register
//desc    Register a new user
userRouter.post("/register/initiate", initiateUser);
userRouter.post("/register/verify", verifyUser);

//route   POST /login
//desc    Log in an existing user
userRouter.post("/login", loginUser);

//route   POST /logout
//desc    Log out the user
userRouter.get("/logout", authUser, logoutUser);

//route   GET /auth
//desc    Check if the user is authenticated
//access  Private
userRouter.get("/auth", authUser, checkAuth);

userRouter.get("/test", (req, res) => {
  res.send("User router is working!");
});

export default userRouter;
