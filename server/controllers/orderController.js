import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
const TAX_RATE = 0.02;

// Place order with Stripe : POST /api/order/placeorderstripe
export const placeOrderStripe = asyncHandler(async (req, res) => {
  const { userId, items, shippingAddress, paymentMethod } = req.body;
  const { origin } = req.headers;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "Identification failed: User not found" });
  }

  const productData = [];
  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} unavailable` });
    }

    if (item.quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
    }

    productData.push({
      productId: product._id,
      name: product.name,
      price: product.offerPrice,
      quantity: item.quantity,
    });

    subtotal += product.offerPrice * item.quantity;
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: productData.map((p) => ({ product: p.productId, quantity: p.quantity })),
    shippingAddress,
    paymentMethod,
    totalAmount,
    isPaid: false,
  });

  const customer = await stripeInstance.customers.create({
    name: user.name,
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
    success_url: `${origin}/loader?next=my-orders`,
    cancel_url: `${origin}/cart`,
    metadata: {
      orderId: order._id.toString(),
      userId: userId.toString(),
    },
  });

  res.status(201).json({
    success: true,
    message: "Secure checkout initialized",
    url: session.url,
  });
});

// Place order with COD : POST /api/order/placeordercod
export const placeOrderCOD = asyncHandler(async (req, res) => {
  const { userId, items, shippingAddress } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  let subtotal = 0;
  const formattedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${item.productId} unavailable` });
    }

    if (item.quantity > product.stock) {
      return res.status(400).json({ success: false, message: `Stock limit reached for ${product.name}` });
    }

    subtotal += product.offerPrice * item.quantity;
    formattedItems.push({ product: product._id, quantity: item.quantity });
  }

  const totalAmount = Math.round(subtotal * (1 + TAX_RATE));

  const order = await Order.create({
    userId,
    items: formattedItems,
    shippingAddress,
    totalAmount,
    paymentMethod: "COD",
    isPaid: false,
    orderStatus: "order placed",
  });

  res.status(201).json({
    success: true,
    message: "Order placed successfully via COD",
    orderId: order._id,
  });
});

// Get User Orders : GET /api/order/getuserorders
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const orders = await Order.find({
    userId,
    $or: [{ paymentMethod: "COD" }, { isPaid: true }],
  })
    .populate("items.product")
    .sort({ createdAt: -1 })
    .lean();

  const safeOrders = (orders || []).map((order) => ({
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
            offerPrice: item.product.offerPrice,
          }
        : null,
    })),
  }));

  res.status(200).json({
    success: true,
    orders: safeOrders,
  });
});

// Get All Orders (Admin) : GET /api/order/getallorders
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    $or: [{ paymentMethod: "COD" }, { isPaid: true }],
  })
    .populate("items.product")
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    orders,
  });
});
