import express from "express";
import { upload } from "../configs/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import validate from "../middlewares/validate.js";
import { loginSchema } from "../schemas/authSchema.js";
import { loginAdmin, logoutUser } from "../controllers/userController.js";
import {
  createCategory,
  deleteCategory,
  getAdminAuthStatus,
  listAdminCategories,
  upsertHomeSiteContent,
  updateCategory,
} from "../controllers/contentController.js";

const adminRouter = express.Router();

adminRouter.post("/login", validate(loginSchema), loginAdmin);
adminRouter.get("/logout", authAdmin, logoutUser);
adminRouter.get("/auth", authAdmin, getAdminAuthStatus);

adminRouter.get("/categories", authAdmin, listAdminCategories);
adminRouter.post("/categories", authAdmin, upload.single("image"), createCategory);
adminRouter.put("/categories/:id", authAdmin, upload.single("image"), updateCategory);
adminRouter.delete("/categories/:id", authAdmin, deleteCategory);

adminRouter.put(
  "/site-content/home",
  authAdmin,
  upload.fields([
    { name: "heroDesktopImage", maxCount: 1 },
    { name: "heroMobileImage", maxCount: 1 },
    { name: "bottomDesktopImage", maxCount: 1 },
    { name: "bottomMobileImage", maxCount: 1 },
    { name: "addressIllustration", maxCount: 1 },
    { name: "featureIcon_0", maxCount: 1 },
    { name: "featureIcon_1", maxCount: 1 },
    { name: "featureIcon_2", maxCount: 1 },
    { name: "featureIcon_3", maxCount: 1 },
    { name: "featureIcon_4", maxCount: 1 },
    { name: "featureIcon_5", maxCount: 1 },
  ]),
  upsertHomeSiteContent
);

export default adminRouter;
