import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import stripe from "stripe";

const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhook = async (req, res) => {
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

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { orderId, userId } = session.metadata;

        await Order.findByIdAndUpdate(orderId, {
          isPaid: true,
          orderStatus: "order placed",
        });

        const order = await Order.findById(orderId);
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity },
          });
        }

        await User.findByIdAndUpdate(userId, {
          $set: { cartItems: [] },
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
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
        console.warn(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Error handling webhook:", err.message);
    res.status(500).json({ error: "Internal webhook handling error." });
  }
};
