import express from "express";
import authUser from "../middlewares/authUser.js";
import { getCart, updateCart } from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.get("/get", authUser, getCart);
cartRouter.post("/update", authUser, updateCart);

export default cartRouter;
