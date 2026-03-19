import express from "express";
import authUser from "../middlewares/authUser.js";
import authSeller from "../middlewares/authSeller.js";
import validate from "../middlewares/validate.js";
import {
  getAllOrders,
  getUserOrders,
  placeOrderCOD,
  placeOrderStripe,
  updateOrderStatus,
  payExistingOrderStripe,
  verifyPayment,
} from "../controllers/orderController.js";
import {
  sellerOrderFiltersSchema,
  updateOrderStatusSchema,
} from "../schemas/orderSchema.js";

const orderRouter = express.Router();

// User Endpoints
orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.post("/:id/pay", authUser, payExistingOrderStripe);
orderRouter.get("/verify-payment", authUser, verifyPayment);

// Seller Endpoints
orderRouter.get("/seller", authSeller, validate(sellerOrderFiltersSchema), getAllOrders);
orderRouter.patch(
  "/seller/:id/status",
  authSeller,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);

export default orderRouter;
