import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const stripeInstance = stripe(STRIPE_SECRET_KEY);
const TAX_RATE = 0.02;

export const placeOrderStripe = async (req, res) => {
  try {
    const { userId, items, shippingAddress, paymentMethod } = req.body;
    const { origin } = req.headers;

    if (
      !userId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress ||
      !paymentMethod
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields (userId, items, shippingAddress, paymentMethod).",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const productData = [];
    let subtotal = 0;

    for (const item of items) {
      if (
        !item.productId ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid item structure: each item must have productId and positive quantity.",
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" exceeds available stock (${product.stock}).`,
        });
      }

      productData.push({
        productId: product._id,
        name: product.name,
        price: product.offerPrice,
        quantity: item.quantity,
      });

      subtotal += product.offerPrice * item.quantity;
    }

    const tax = subtotal * TAX_RATE;
    const totalAmount = Math.round(subtotal + tax);

    const order = await Order.create({
      userId,
      items: productData.map((p) => ({
        product: p.productId,
        quantity: p.quantity,
      })),
      shippingAddress,
      paymentMethod,
      totalAmount,
      isPaid: false,
    });

    const customer = await stripeInstance.customers.create({
      name: user.name || "Unnamed",
      email: user.email,
      address: {
        line1: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country: "IN",
      },
    });

    const line_items = productData.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * (1 + TAX_RATE) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: customer.id,
      line_items,
      billing_address_collection: "auto",
      success_url: `${origin}/loader?next=my-orders`,
      cancel_url: `${origin}/cart`,
      metadata: {
        orderId: order._id.toString(),
        userId: userId.toString(),
      },
    });

    res.status(201).json({
      success: true,
      message: "Stripe session created successfully.",
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe order error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Place order with Cash on Delivery (COD) : POST /api/order/placeordercod
export const placeOrderCOD = async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    if (
      !userId ||
      !Array.isArray(items) ||
      items.length === 0 ||
      !shippingAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing or invalid required fields (userId, items, shippingAddress).",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    let totalAmount = 0;
    const formattedItems = [];

    for (const item of items) {
      if (
        !item.productId ||
        typeof item.quantity !== "number" ||
        item.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid item structure: each item must have productId and positive quantity.",
        });
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with ID ${item.productId} not found.`,
        });
      }

      if (item.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.name}" exceeds available stock (${product.stock}).`,
        });
      }

      totalAmount += product.offerPrice * item.quantity;
      formattedItems.push({ product: product._id, quantity: item.quantity });
    }

    // Add 2% tax and round
    totalAmount = Math.round(totalAmount * (1 + TAX_RATE));

    const order = await Order.create({
      userId,
      items: formattedItems,
      shippingAddress,
      totalAmount,
      paymentMethod: "COD",
      isPaid: false,
      orderStatus: "order placed",
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      orderId: order._id,
    });
  } catch (error) {
    console.error("COD order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error.",
    });
  }
};

// Get orders by userId : GET /api/order/getuserorders
export const getUserOrders = async (req, res) => {
  console.log("Fetching user orders...");

  try {
    // Check if req.user and req.user.id exist
    if (!req.user || !req.user.id) {
      console.warn("Unauthorized access attempt - no user ID found.");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated.",
      });
    }

    const userId = req.user.id;
    console.log("User ID:", userId);

    // Fetch orders using a filtered query
    const orders = await Order.find({
      userId,
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product") // Populate product info
      .sort({ createdAt: -1 })
      .lean(); // Return plain JavaScript objects

    if (!orders || orders.length === 0) {
      console.info(`No orders found for user: ${userId}`);
      return res.status(200).json({
        success: true,
        message: "No orders found.",
        orders: [],
      });
    }

    // Sanitize or transform orders if needed
    const safeOrders = orders.map((order) => ({
      id: order._id,
      totalAmount: order.totalAmount,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      isPaid: order.isPaid,
      createdAt: order.createdAt,
      items: (order.items || []).map((item) => ({
        quantity: item.quantity,
        product: item.product
          ? {
              id: item.product._id,
              name: item.product.name,
              image: item.product.image,
              category: item.product.category,
              offerPrice: item.product.offerPrice,
            }
          : null,
      })),
    }));

    console.log(`Fetched ${safeOrders.length} orders for user ${userId}`);

    return res.status(200).json({
      success: true,
      orders: safeOrders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching orders.",
      error: error.message,
    });
  }
};

// GET /api/order/getallorders
export const getAllOrders = async (req, res) => {
  console.log("Fetching all orders...");

  try {
    const orders = await Order.find({
      $or: [{ paymentMethod: "COD" }, { isPaid: true }],
    })
      .populate("items.product")
      .populate("shippingAddress")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
      error: error.message,
    });
  }
};
