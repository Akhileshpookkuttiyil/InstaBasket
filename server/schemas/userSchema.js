import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name is too long")
      .optional(),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9+\-()\s]{7,20}$/, "Phone number format is invalid")
      .optional()
      .or(z.literal("")),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    marketingEmails: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    darkMode: z.boolean().optional(),
    language: z.enum(["en", "hi"]).optional(),
  }),
});
