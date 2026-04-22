import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "../configs/db.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

const ADMIN_NAME = process.env.DUMMY_ADMIN_NAME || "Demo Admin";
const ADMIN_EMAIL = process.env.DUMMY_ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = process.env.DUMMY_ADMIN_PASSWORD;

const assertSeedConfig = () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "DUMMY_ADMIN_EMAIL and DUMMY_ADMIN_PASSWORD must be provided to seed an admin account."
    );
  }
};

const createOrUpdateDummyAdmin = async () => {
  assertSeedConfig();
  await connectDB();

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const adminUser = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        provider: "local",
        googleId: null,
        isAdmin: true,
        isActive: true,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).select("name email isAdmin isActive provider");

  logger.info("Dummy admin account is ready", {
    email: adminUser.email,
    isAdmin: adminUser.isAdmin,
    provider: adminUser.provider,
  });

  process.stdout.write("\nDummy admin credentials\n");
  process.stdout.write(`Email: ${ADMIN_EMAIL}\n`);
  process.stdout.write("Password: [provided via DUMMY_ADMIN_PASSWORD]\n\n");
};

try {
  await createOrUpdateDummyAdmin();
} catch (error) {
  logger.error("Failed to create dummy admin", { error: error.message });
  process.exitCode = 1;
} finally {
  await mongoose.connection.close().catch(() => {});
}
