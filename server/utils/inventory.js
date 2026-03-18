import mongoose from "mongoose";
import Product from "../models/Product.js";

const isValidQuantity = (value) => Number.isInteger(value) && value > 0;

export const isProductAvailable = (product) =>
  Boolean(product?.inStock) && Number(product?.countInStock || 0) > 0;

export const normalizeLineItems = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      valid: false,
      message: "Order must include at least one item",
      items: [],
    };
  }

  const mergedItems = new Map();

  for (const item of items) {
    const productId = String(item?.productId || item?.product || "").trim();
    const quantity = Number(item?.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return {
        valid: false,
        message: "Order contains an invalid product id",
        items: [],
      };
    }

    if (!isValidQuantity(quantity)) {
      return {
        valid: false,
        message: "Order contains an invalid quantity",
        items: [],
      };
    }

    mergedItems.set(productId, (mergedItems.get(productId) || 0) + quantity);
  }

  return {
    valid: true,
    items: Array.from(mergedItems.entries()).map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  };
};

export const buildAvailabilitySnapshot = (products = []) => {
  const snapshot = new Map();
  for (const product of products) {
    snapshot.set(String(product._id), isProductAvailable(product));
  }
  return snapshot;
};

export const getRestockedProductIds = (beforeSnapshot, afterProducts = []) =>
  afterProducts
    .filter((product) => {
      const id = String(product._id);
      const wasAvailable = beforeSnapshot.get(id) === true;
      return !wasAvailable && isProductAvailable(product);
    })
    .map((product) => String(product._id));

/**
 * Decreases stock for a list of items within a session.
 */
export const decreaseStockForItems = async (lineItems, session) => {
  const updatedProducts = [];

  for (const item of lineItems) {
    const updated = await Product.findOneAndUpdate(
      {
        _id: item.productId,
        inStock: true,
        countInStock: { $gte: item.quantity },
      },
      [
        {
          $set: {
            countInStock: { $subtract: ["$countInStock", item.quantity] },
          },
        },
        {
          $set: {
            inStock: { $gt: [{ $subtract: ["$countInStock", item.quantity] }, 0] },
          },
        },
      ],
      {
        new: true,
        session,
      }
    );

    if (!updated) {
      return {
        success: false,
        failedProductId: item.productId,
        updatedProducts,
      };
    }

    updatedProducts.push(updated);
  }

  return {
    success: true,
    updatedProducts,
  };
};

/**
 * Increases stock for a list of items (e.g. on return or cancellation).
 */
export const increaseStockForItems = async (lineItems, session) => {
  const updatedProducts = [];

  for (const item of lineItems) {
    const updated = await Product.findByIdAndUpdate(
      item.productId,
      [
        {
          $set: {
            countInStock: { $add: ["$countInStock", item.quantity] },
          },
        },
        {
          $set: {
            inStock: { $gt: [{ $add: ["$countInStock", item.quantity] }, 0] },
          },
        },
      ],
      {
        new: true,
        session,
      }
    );

    if (updated) {
      updatedProducts.push(updated);
    }
  }

  return updatedProducts;
};
