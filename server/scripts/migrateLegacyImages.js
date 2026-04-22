import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "../configs/db.js";
import cloudinaryConfig from "../configs/cloudinary.js";
import Category from "../models/Category.js";
import SiteContent from "../models/SiteContent.js";
import { uploadAssetToCloudinary } from "../utils/cloudinaryAssets.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const clientAssetsDir = path.join(repoRoot, "client", "src", "assets");

const imagePath = (fileName) => path.join(clientAssetsDir, fileName);

const legacyCategories = [
  {
    name: "Organic veggies",
    slug: "vegetables",
    imageFile: "organic_vegitable_image.png",
    bgColor: "#FEF6DA",
    sortOrder: 1,
  },
  {
    name: "Fresh Fruits",
    slug: "fruits",
    imageFile: "fresh_fruits_image.png",
    bgColor: "#FEE0E0",
    sortOrder: 2,
  },
  {
    name: "Cold Drinks",
    slug: "drinks",
    imageFile: "bottles_image.png",
    bgColor: "#F0F5DE",
    sortOrder: 3,
  },
  {
    name: "Instant Food",
    slug: "instant",
    imageFile: "maggi_image.png",
    bgColor: "#E1F5EC",
    sortOrder: 4,
  },
  {
    name: "Dairy Products",
    slug: "dairy",
    imageFile: "dairy_product_image.png",
    bgColor: "#FEE6CD",
    sortOrder: 5,
  },
  {
    name: "Bakery & Breads",
    slug: "bakery",
    imageFile: "bakery_image.png",
    bgColor: "#E0F6FE",
    sortOrder: 6,
  },
  {
    name: "Grains & Cereals",
    slug: "grains",
    imageFile: "grain_image.png",
    bgColor: "#F1E3F9",
    sortOrder: 7,
  },
];

const legacyFeatures = [
  {
    title: "Fastest Delivery",
    description: "Groceries delivered in under 30 minutes.",
    iconFile: "delivery_truck_icon.svg",
  },
  {
    title: "Freshness Guaranteed",
    description: "Fresh produce straight from the source.",
    iconFile: "leaf_icon.svg",
  },
  {
    title: "Affordable Prices",
    description: "Quality groceries at unbeatable prices.",
    iconFile: "coin_icon.svg",
  },
  {
    title: "Trusted by Thousands",
    description: "Loved by 10,000+ happy customers.",
    iconFile: "trust_icon.svg",
  },
];

const uploadLegacyAsset = async ({ fileName, folder, publicId }) =>
  uploadAssetToCloudinary({
    filePath: imagePath(fileName),
    folder,
    publicId,
  });

const migrateCategories = async () => {
  for (const category of legacyCategories) {
    const image = await uploadLegacyAsset({
      fileName: category.imageFile,
      folder: "instabasket/categories",
      publicId: category.slug,
    });

    await Category.findOneAndUpdate(
      { slug: category.slug },
      {
        name: category.name,
        slug: category.slug,
        image,
        bgColor: category.bgColor,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
};

const migrateSiteContent = async () => {
  const heroDesktopImage = await uploadLegacyAsset({
    fileName: "main_banner_bg.png",
    folder: "instabasket/site-content/hero",
    publicId: "home-desktop",
  });
  const heroMobileImage = await uploadLegacyAsset({
    fileName: "main_banner_bg_sm.png",
    folder: "instabasket/site-content/hero",
    publicId: "home-mobile",
  });
  const bottomDesktopImage = await uploadLegacyAsset({
    fileName: "bottom_banner_image.png",
    folder: "instabasket/site-content/bottom-banner",
    publicId: "home-bottom-desktop",
  });
  const bottomMobileImage = await uploadLegacyAsset({
    fileName: "bottom_banner_image_sm.png",
    folder: "instabasket/site-content/bottom-banner",
    publicId: "home-bottom-mobile",
  });
  const addressIllustration = await uploadLegacyAsset({
    fileName: "add_address_image.svg",
    folder: "instabasket/site-content/illustrations",
    publicId: "address-illustration",
  });

  const features = await Promise.all(
    legacyFeatures.map(async (feature, index) => ({
      title: feature.title,
      description: feature.description,
      icon: await uploadLegacyAsset({
        fileName: feature.iconFile,
        folder: "instabasket/site-content/features",
        publicId: `feature-${index + 1}`,
      }),
    }))
  );

  await SiteContent.findOneAndUpdate(
    { key: "home" },
    {
      key: "home",
      heroBanner: {
        desktopImage: heroDesktopImage,
        mobileImage: heroMobileImage,
        title: "Discover Exclusive Deals!",
        subtitle:
          "Shop the best products at unbeatable prices, tailored just for you.",
        cta: {
          label: "Start Shopping",
          href: "/products",
        },
        secondaryCta: {
          label: "Explore Now",
          href: "/products",
        },
      },
      bottomBanner: {
        desktopImage: bottomDesktopImage,
        mobileImage: bottomMobileImage,
        title: "Why We Are The Best",
        text: "Trusted delivery, freshness, and value built for everyday grocery shopping.",
      },
      features,
      illustrations: {
        address: addressIllustration,
      },
    },
    { upsert: true, new: true, runValidators: true }
  );
};

const run = async () => {
  try {
    await connectDB();
    await cloudinaryConfig();
    await migrateCategories();
    await migrateSiteContent();
    console.log("Legacy image migration completed successfully.");
  } catch (error) {
    console.error("Legacy image migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => {});
  }
};

run();
