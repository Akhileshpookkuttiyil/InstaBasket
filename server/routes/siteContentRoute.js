import express from "express";
import {
  getHomeSiteContent,
} from "../controllers/contentController.js";

const siteContentRouter = express.Router();

siteContentRouter.get("/home", getHomeSiteContent);

export default siteContentRouter;
