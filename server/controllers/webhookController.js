import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";
import asyncHandler from "../utils/asyncHandler.js";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;

  switch (type) {
    case "checkout.session.completed": {
      const session = data.object;
      const { orderId, userId } = session.metadata;

      const order = await Order.findByIdAndUpdate(
        orderId,
        { isPaid: true, orderStatus: "order placed" },
        { new: true }
      );

      if (order) {
        // Stock deduction
        await Promise.all(
          order.items.map((item) =>
            Product.findByIdAndUpdate(item.product, {
              $inc: { stock: -item.quantity },
            })
          )
        );

        // Clear cart
        await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = data.object;
      const sessionList = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntent.id,
      });

      const session = sessionList.data[0];
      if (session?.metadata?.orderId) {
        await Order.findByIdAndDelete(session.metadata.orderId);
      }
      break;
    }

    default:
      console.warn(`Unhandled Stripe event: ${type}`);
  }

  res.json({ received: true });
});
