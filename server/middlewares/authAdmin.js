import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const authAdmin = async (req, res, next) => {
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

    const user = await User.findById(decoded.id).select("_id isActive isAdmin email name");
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

    if (user.isAdmin !== true) {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isAdmin: true,
    };

    next();
  } catch (error) {
    logger.warn("authAdmin token verification failed", { error: error.message });
    res.clearCookie("token");
    return res.status(401).json({
      success: false,
      message: "Unauthorized. Invalid or expired token.",
    });
  }
};

export default authAdmin;
