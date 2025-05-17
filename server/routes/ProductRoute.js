import express from "express";
import { upload } from "../configs/multer";
import authSeller from "../middlewares/authSeller"; // Fixed typo: 'middilewares' -> 'middlewares'
import { addProduct, changeStock } from "../controllers/productController.js";

const productRouter = express.Router();

// POST route to add a product
productRouter.post("/add", upload.array("images"), authSeller, addProduct); // 'images' is the field name for the uploaded files
productRouter.get("/all", authSeller, getAllProducts); // Added route to get all products
productRouter.get("/:id", authSeller, getSingleProduct); // Added route to get a single product by ID
productRouter.post("/stock", authSeller, changeStock); // Added route to update a product by ID

export default productRouter;
