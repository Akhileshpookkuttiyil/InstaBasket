import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const addressBodySchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.string().trim().email("Email is invalid"),
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zipCode: z
    .string()
    .trim()
    .min(4, "Zip code is required")
    .max(12, "Zip code is invalid"),
  country: z.string().trim().min(1, "Country is required"),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-()\s]{7,20}$/, "Phone number is invalid"),
});

export const addAddressSchema = z.object({
  body: z.object({
    address: addressBodySchema,
  }),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid address id"),
  }),
  body: z.object({
    address: addressBodySchema,
  }),
});

export const addressIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid address id"),
  }),
});
