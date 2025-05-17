import express from "express";
import { addAddress, getAllAddress } from "../controllers/addressController.js";
import authUser from "../middlewares/authUser.js";

const addressRouter = express.Router();

addressRouter.post("/add", authUser, addAddress);
addressRouter.get("/get", authUser, getAllAddress);

export default addressRouter;
