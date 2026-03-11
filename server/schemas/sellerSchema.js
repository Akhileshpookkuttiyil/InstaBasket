import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const sellerUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().max(100, "Search query is too long").optional(),
  }),
});

export const updateSellerUserStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid user id"),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});
