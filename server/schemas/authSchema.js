import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  })
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is too short"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  })
});

export const otpSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    otp: z.string().length(6, "OTP must be 6 digits"),
  })
});

export const emailSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
  })
});
