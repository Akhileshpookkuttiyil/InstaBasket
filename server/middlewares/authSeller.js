import jwt from "jsonwebtoken";

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
    console.error("authSeller error:", error.message);
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export default authSeller;
// This middleware function checks for a JWT token in the request cookies. If the token is not present or invalid, it sends a 401 Unauthorized response. If the token is valid, it allows the request to proceed to the next middleware or route handler.
