import express from "express";
import authUser from "../middlewares/authUser.js";
import {
  getAllOrders,
  getUserOrders,
  placeOrderCOD,
  placeOrderStripe,
  updateOrderStatus,
} from "../controllers/orderController.js";
import authSeller from "../middlewares/authSeller.js";
import validate from "../middlewares/validate.js";
import {
  sellerOrderFiltersSchema,
  updateOrderStatusSchema,
} from "../schemas/orderSchema.js";

const orderRouter = express.Router();

orderRouter.post("/cod", authUser, placeOrderCOD);
orderRouter.get("/user", authUser, getUserOrders);
orderRouter.get("/seller", authSeller, validate(sellerOrderFiltersSchema), getAllOrders);
orderRouter.patch(
  "/seller/:id/status",
  authSeller,
  validate(updateOrderStatusSchema),
  updateOrderStatus
);
orderRouter.post("/stripe", authUser, placeOrderStripe);

export default orderRouter;
