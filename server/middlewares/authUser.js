import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const authUser = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Invalid token payload.",
      });
    }

    const user = await User.findById(decoded.id).select("_id isActive");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Contact support.",
      });
    }

    req.user = { id: user._id.toString() };
    next();
  } catch (error) {
    logger.warn("authUser token verification failed", { error: error.message });
    res.clearCookie("token");
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid or expired token.",
    });
  }
};

export default authUser;

