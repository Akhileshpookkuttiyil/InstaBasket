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

const positionEnum = [
  "top-left",
  "center-left",
  "center",
  "center-right",
  "bottom-right",
];

const responsiveHeroBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: positionEnum,
    },
    cta: {
      type: linkSchema,
      default: null,
    },
    secondaryCta: {
      type: linkSchema,
      default: null,
    },
  },
  { _id: false }
);

const responsiveBottomBannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    position: {
      type: String,
      enum: positionEnum,
    },
    text: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const breakpointContentSchema = new mongoose.Schema(
  {
    heroBanner: {
      type: responsiveHeroBannerSchema,
      default: null,
    },
    bottomBanner: {
      type: responsiveBottomBannerSchema,
      default: null,
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
      position: {
        type: String,
        enum: positionEnum,
        default: "center-left",
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
      position: {
        type: String,
        enum: positionEnum,
        default: "center-right",
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
    // Optional breakpoint-specific overrides. Root banners stay as the
    // desktop/backward-compatible fallback for existing storefront data.
    mobile: {
      type: breakpointContentSchema,
      default: null,
    },
    tablet: {
      type: breakpointContentSchema,
      default: null,
    },
    desktop: {
      type: breakpointContentSchema,
      default: null,
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
