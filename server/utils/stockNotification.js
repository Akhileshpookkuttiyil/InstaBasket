import Product from "../models/Product.js";
import { createUserNotification } from "./notification.js";

export const notifyAndClearStockSubscribers = async ({
  productId,
  productName,
  productCategory,
}) => {
  const productWithSubscribers = await Product.findOneAndUpdate(
    {
      _id: productId,
      inStock: true,
      countInStock: { $gt: 0 },
      stockSubscribers: { $exists: true, $ne: [] },
    },
    {
      $set: { stockSubscribers: [] },
    },
    {
      new: false,
      select: "name stockSubscribers",
    }
  ).lean();

  if (!productWithSubscribers) {
    return 0;
  }

  const subscribers = Array.from(
    new Set((productWithSubscribers.stockSubscribers || []).map(String))
  );

  if (subscribers.length === 0) {
    return 0;
  }

  const safeProductName = productName || productWithSubscribers.name || "Product";

  await Promise.all(
    subscribers.map((userId) =>
      createUserNotification({
        userId,
        type: "SYSTEM",
        title: "Product back in stock",
        message: `${safeProductName} is available again. You can order it now.`,
        meta: {
          status: "restocked",
          orderId: productId,
          category: productCategory,
        },
      })
    )
  );

  return subscribers.length;
};
