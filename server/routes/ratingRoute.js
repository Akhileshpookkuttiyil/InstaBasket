import express from "express";
import authUser from "../middlewares/authUser.js";
import validate from "../middlewares/validate.js";
import {
  deleteMyRating,
  getMyRatingForProduct,
  getMyRatings,
  getProductRatings,
  getRatingEligibility,
  upsertRating,
} from "../controllers/ratingController.js";
import {
  productIdParamSchema,
  ratingListQuerySchema,
  upsertRatingSchema,
} from "../schemas/ratingSchema.js";

const ratingRouter = express.Router();

ratingRouter.post("/", authUser, validate(upsertRatingSchema), upsertRating);
ratingRouter.get(
  "/product/:productId",
  validate(productIdParamSchema),
  validate(ratingListQuerySchema),
  getProductRatings
);
ratingRouter.get(
  "/product/:productId/my",
  authUser,
  validate(productIdParamSchema),
  getMyRatingForProduct
);
ratingRouter.get(
  "/product/:productId/eligibility",
  authUser,
  validate(productIdParamSchema),
  getRatingEligibility
);
ratingRouter.delete(
  "/product/:productId",
  authUser,
  validate(productIdParamSchema),
  deleteMyRating
);
ratingRouter.get("/my", authUser, getMyRatings);

export default ratingRouter;
