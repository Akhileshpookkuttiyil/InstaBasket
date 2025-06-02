// update User cartData : /api/cart/update

import User from "../models/User.js";

export const updateCart = async (req, res) => {
  try {
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
      message: "Cart updated successfully",
      cartItems: user.cartItems, 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
