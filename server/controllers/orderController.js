import Order from "../models/Order.js";
import Product from "../models/Product.js";

// Place order COD : POST /api/order/cod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    // Validate the input data
    if (!items || !shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Initialize total amount
    let amount = 0;

    // Calculate total amount using async loop
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.product} not found`,
        });
      }
      // Add product price * quantity to the total amount
      amount += product.offerPrice * item.quantity;
    }

    // Add tax charge (2%) and round to 2 decimal places
    amount += parseFloat((amount * 0.02).toFixed(2));

    // Create the order
    const newOrder = await Order.create({
      userId,
      items,
      shippingAddress,
      amount,
      paymentMethod: "COD", // Cash on Delivery
      isPaid: false, // Payment is not done yet
      orderStatus: "order placed", // Initial status
    });

    // Send success response
    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId: newOrder._id, // Return orderId instead of the whole order object
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get orders by userId : GET /api/order/getuserorders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id; // Get userId from the authenticated user in the JWT or session

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing or invalid",
      });
    }

    // Fetch orders for the user
    const orders = await Order.find({
      userId,
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product address") // Populate product and address references
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders, // Return the orders found
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders : GET /api/order/getallorders
export const getAllOrders = async (req, res) => {
  try {
    // Fetch all orders (for admin or superuser)
    const orders = await Order.find({
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product address") // Populate product and address references
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      orders, // Return all orders found
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
