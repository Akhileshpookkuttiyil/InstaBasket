import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const authSeller = (req, res, next) => {
  const sellerToken = req.cookies?.sellerToken;
  if (!sellerToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. No token provided.",
    });
  }
  try {
    const decoded = jwt.verify(sellerToken, process.env.JWT_SECRET);
    if (decoded.email !== process.env.SELLER_EMAIL) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Invalid token.",
      });
    }
    next();
  } catch (error) {
    logger.warn("authSeller token verification failed", { error: error.message });
    res.clearCookie("sellerToken");
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export default authSeller;