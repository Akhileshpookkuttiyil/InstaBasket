import mongoose from "mongoose";

const cloudinaryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const linkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    href: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const featureSchema = new mongoose.Schema(
  {
    icon: {
      type: cloudinaryImageSchema,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const siteContentSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      default: "home",
    },
    heroBanner: {
      desktopImage: {
        type: cloudinaryImageSchema,
        required: true,
      },
      mobileImage: {
        type: cloudinaryImageSchema,
        required: true,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      subtitle: {
        type: String,
        required: true,
        trim: true,
      },
      cta: {
        type: linkSchema,
        required: true,
      },
      secondaryCta: {
        type: linkSchema,
        default: null,
      },
    },
    bottomBanner: {
      desktopImage: {
        type: cloudinaryImageSchema,
        required: true,
      },
      mobileImage: {
        type: cloudinaryImageSchema,
        default: null,
      },
      title: {
        type: String,
        required: true,
        trim: true,
      },
      text: {
        type: String,
        default: "",
        trim: true,
      },
    },
    features: {
      type: [featureSchema],
      default: [],
    },
    illustrations: {
      address: {
        type: cloudinaryImageSchema,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const SiteContent =
  mongoose.models.sitecontent ||
  mongoose.model("sitecontent", siteContentSchema);

export default SiteContent;
