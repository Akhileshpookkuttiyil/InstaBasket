import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const upsertRatingSchema = z.object({
  body: z.object({
    productId: z.string().regex(objectIdRegex, "Invalid product id"),
    rating: z.number().int().min(1).max(5),
    review: z.string().trim().max(800).optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    productId: z.string().regex(objectIdRegex, "Invalid product id"),
  }),
});

export const ratingListQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a number")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a number")
      .optional(),
  }),
});
