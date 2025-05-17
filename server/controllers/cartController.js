// update User cartData : /api/cart/update

import User from "../models/User.js";

export const updateCart = async (req, res) => {
  try {
    const { userId, cartData } = req.body;

    // Find the user by ID and update the cart
    const user = await User.findByIdAndUpdate(
      userId,
      { cart: cartData },
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
      message: "Cart updated successfully",
      cart: user.cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
