import { z } from "zod";

export const addProductSchema = z.object({
  body: z.object({
    productData: z.object({
      name: z.string().min(3, "Name must be at least 3 characters"),
      description: z.array(z.string()).or(z.string()), // Controller splits it if string
      category: z.string().min(1, "Category is required"),
      price: z.preprocess((val) => Number(val), z.number().positive("Price must be positive")),
      offerPrice: z.preprocess((val) => Number(val), z.number().min(0)).optional(),
      countInStock: z.preprocess((val) => Number(val), z.number().int().min(0, "Stock cannot be negative")),
    })
  })
});

export const changeStockSchema = z.object({
  body: z.object({
    id: z.string().min(1, "Product ID is required"),
    inStock: z.boolean(),
  })
});
