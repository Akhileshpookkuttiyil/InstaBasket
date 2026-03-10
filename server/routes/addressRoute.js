import express from "express";
import {
  addAddress,
  deleteAddress,
  getAllAddress,
  setDefaultAddress,
  updateAddress,
} from "../controllers/addressController.js";
import authUser from "../middlewares/authUser.js";
import validate from "../middlewares/validate.js";
import {
  addAddressSchema,
  addressIdParamSchema,
  updateAddressSchema,
} from "../schemas/addressSchema.js";

const addressRouter = express.Router();

addressRouter.post("/add", authUser, validate(addAddressSchema), addAddress);
addressRouter.get("/get", authUser, getAllAddress);
addressRouter.patch("/:id", authUser, validate(updateAddressSchema), updateAddress);
addressRouter.delete("/:id", authUser, validate(addressIdParamSchema), deleteAddress);
addressRouter.patch(
  "/:id/default",
  authUser,
  validate(addressIdParamSchema),
  setDefaultAddress
);

export default addressRouter;
