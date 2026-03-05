import express from "express";
import {
  checkAuthSeller,
  sellerLogin,
  sellerLogout,
} from "../controllers/sellerController.js";
import authSeller from "../middlewares/authSeller.js";
import validate from "../middlewares/validate.js";
import { loginSchema } from "../schemas/authSchema.js";

const sellerRouter = express.Router();

sellerRouter.post("/login", validate(loginSchema), sellerLogin);
sellerRouter.get("/auth", authSeller, checkAuthSeller);
sellerRouter.get("/logout", sellerLogout);

export default sellerRouter;
