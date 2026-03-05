import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";

// update User cartData : POST /api/cart/update
export const updateCart = asyncHandler(async (req, res) => {
  const { cartData } = req.body;
  const userId = req.user.id;

  const user = await User.findByIdAndUpdate(
    userId,
    { cartItems: cartData },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Cart items synced",
    cartItems: user.cartItems, 
  });
});
