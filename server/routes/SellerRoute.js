import express from "express";
import {
  checkAuthSeller,
  getSellerSummary,
  getSellerUsers,
  sellerLogin,
  sellerLogout,
  updateUserStatus,
} from "../controllers/sellerController.js";
import {
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import {
  addProduct,
  getAllProducts,
  changeStock,
  updateProduct,
} from "../controllers/productController.js";
import { upload } from "../configs/multer.js";
import authSeller from "../middlewares/authSeller.js";
import validate from "../middlewares/validate.js";
import { loginSchema } from "../schemas/authSchema.js";
import {
  addProductSchema,
  updateProductSchema,
  changeStockSchema,
} from "../schemas/productSchema.js";
import {
  sellerOrderFiltersSchema,
  updateOrderStatusSchema,
} from "../schemas/orderSchema.js";
import {
  sellerUsersQuerySchema,
  updateSellerUserStatusSchema,
} from "../schemas/sellerSchema.js";

const sellerRouter = express.Router();

sellerRouter.post("/login", validate(loginSchema), sellerLogin);
sellerRouter.get("/auth", authSeller, checkAuthSeller);
sellerRouter.get("/logout", sellerLogout);

// Dashboard & Summary
sellerRouter.get("/summary", authSeller, getSellerSummary);
sellerRouter.get("/dashboard", authSeller, getSellerSummary);

// User Management
sellerRouter.get("/users", authSeller, validate(sellerUsersQuerySchema), getSellerUsers);
sellerRouter.patch(
  "/users/:id/status",
  authSeller,
  validate(updateSellerUserStatusSchema),
  updateUserStatus
);

// Order Management
sellerRouter.get("/orders", authSeller, validate(sellerOrderFiltersSchema), getAllOrders);
sellerRouter.patch(
  "/orders/:id/status",
  authSeller,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

// Product Management
sellerRouter.get("/products", authSeller, getAllProducts);
sellerRouter.post(
  "/products/add",
  upload.array("images"),
  authSeller,
  validate(addProductSchema),
  addProduct
);
sellerRouter.post("/products/stock", authSeller, validate(changeStockSchema), changeStock);
sellerRouter.patch("/products/:id", authSeller, validate(updateProductSchema), updateProduct);

export default sellerRouter;
