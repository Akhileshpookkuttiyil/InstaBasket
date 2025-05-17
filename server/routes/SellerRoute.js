import express from "express";
import {
  checkAuthSeller,
  sellerLogin,
  sellerLogout,
} from "../controllers/sellerController.js";
import authSeller from "../middilewares/authSeller.js";

const sellerRouter = express.Router();

sellerRouter.post("/login", sellerLogin);
sellerRouter.get("/auth", authSeller, checkAuthSeller);
sellerRouter.get("/logout", sellerLogout);

export default sellerRouter;
