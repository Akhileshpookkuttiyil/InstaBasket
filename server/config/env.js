import "dotenv/config";

const requiredVars = [
  "MONGODB_URI",
  "JWT_SECRET",
  "SELLER_EMAIL",
  "SELLER_PASSWORD",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

for (const key of requiredVars) {
  if (!process.env[key]) {
    console.warn(`[env] Missing required variable: ${key}`);
  }
}

export const isProduction = process.env.NODE_ENV === "production";

export const allowedOrigins = (
  process.env.CORS_ALLOWED_ORIGINS ||
  "http://localhost:5173,https://insta-basket.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
