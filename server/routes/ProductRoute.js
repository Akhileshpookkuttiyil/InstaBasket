import express from "express";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import {
  addProduct,
  changeStock,
  getAllProducts,
  getSingleProduct,
  updateProduct,
} from "../controllers/productController.js";
import validate from "../middlewares/validate.js";
import {
  addProductSchema,
  changeStockSchema,
  updateProductSchema,
} from "../schemas/productSchema.js";

const productRouter = express.Router();

// POST route to add a product
productRouter.post(
  "/add",
  upload.array("images"),
  authSeller,
  validate(addProductSchema),
  addProduct
);

productRouter.get("/all", getAllProducts);

productRouter.get("/:id", authSeller, getSingleProduct);

productRouter.post(
  "/stock",
  authSeller,
  validate(changeStockSchema),
  changeStock
);

productRouter.patch("/:id", authSeller, validate(updateProductSchema), updateProduct);

export default productRouter;
