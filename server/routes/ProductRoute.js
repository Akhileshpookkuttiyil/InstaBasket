import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  getAllProducts,
  getSingleProduct,
} from "../controllers/productController.js";

const productRouter = express.Router();

// POST route to add a product
productRouter.post("/add", upload.array("images"), authSeller, addProduct); // 'images' is the field name for the uploaded files
productRouter.get("/all", authSeller, getAllProducts); // Added route to get all products
productRouter.get("/:id", authSeller, getSingleProduct); // Added route to get a single product by ID
productRouter.post("/stock", authSeller, changeStock); // Added route to update a product by ID

export default productRouter;
