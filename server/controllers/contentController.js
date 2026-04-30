import Category from "../models/Category.js";
import SiteContent from "../models/SiteContent.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  deleteCloudinaryAsset,
  uploadMulterFileToCloudinary,
} from "../utils/cloudinaryAssets.js";
import {
  categoryPayloadSchema,
  categoryUpdateSchema,
  siteContentPayloadSchema,
} from "../schemas/contentSchema.js";

const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseJsonField = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
};

const validateOrRespond = (schema, payload, res) => {
  const result = schema.safeParse(payload);
  if (result.success) {
    return result.data;
  }

  res.status(400).json({
    success: false,
    message: "Validation Error",
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
  return null;
};

const buildImagePayload = async ({
  existingImage,
  file,
  folder,
  publicId,
  bodyImage,
}) => {
  if (file) {
    return uploadMulterFileToCloudinary({
      file,
      folder,
      publicId,
    });
  }

  if (bodyImage?.url && bodyImage?.publicId) {
    return {
      url: bodyImage.url,
      publicId: bodyImage.publicId,
    };
  }

  return existingImage || null;
};

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    sortOrder: 1,
    name: 1,
  });

  res.status(200).json({
    success: true,
    categories,
  });
});

export const listAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.find({}).sort({
    sortOrder: 1,
    name: 1,
  });

  res.status(200).json({
    success: true,
    categories,
  });
});

export const getAdminAuthStatus = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      isAdmin: true,
    },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const parsedBody = validateOrRespond(categoryPayloadSchema, req.body, res);
  if (!parsedBody) return;

  const { name, slug, bgColor, sortOrder, isActive } = parsedBody;
  const normalizedSlug = slugify(slug || name);

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Category image is required",
    });
  }

  const image = await uploadMulterFileToCloudinary({
    file: req.file,
    folder: "instabasket/categories",
    publicId: normalizedSlug,
  });

  const category = await Category.create({
    name: name.trim(),
    slug: normalizedSlug,
    image,
    bgColor: bgColor || "#F5F5F5",
    sortOrder: Number(sortOrder || 0),
    isActive: isActive === undefined ? true : String(isActive) !== "false",
  });

  res.status(201).json({
    success: true,
    category,
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const parsedRequest = validateOrRespond(
    categoryUpdateSchema,
    {
      params: req.params,
      body: {
        ...req.body,
        image: parseJsonField(req.body.image, undefined),
      },
    },
    res
  );

  if (!parsedRequest) return;

  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  const nextName = parsedRequest.body.name?.trim() || category.name;
  const nextSlug = slugify(parsedRequest.body.slug || nextName || category.slug);
  const previousPublicId = category.image?.publicId;

  const image = await buildImagePayload({
    existingImage: category.image,
    file: req.file,
    folder: "instabasket/categories",
    publicId: nextSlug,
    bodyImage: parsedRequest.body.image || null,
  });

  if (!image?.url || !image?.publicId) {
    return res.status(400).json({
      success: false,
      message: "A valid category image is required",
    });
  }

  category.name = nextName;
  category.slug = nextSlug;
  category.image = image;
  category.bgColor = parsedRequest.body.bgColor || category.bgColor;
  category.sortOrder =
    parsedRequest.body.sortOrder === undefined
      ? category.sortOrder
      : Number(parsedRequest.body.sortOrder || 0);
  if (parsedRequest.body.isActive !== undefined) {
    category.isActive = Boolean(parsedRequest.body.isActive);
  }

  await category.save();

  if (req.file && previousPublicId && previousPublicId !== image.publicId) {
    await deleteCloudinaryAsset(previousPublicId).catch(() => {});
  }

  res.status(200).json({
    success: true,
    category,
  });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findById(id);

  if (!category) {
    return res.status(404).json({
      success: false,
      message: "Category not found",
    });
  }

  const publicId = category.image?.publicId;
  await category.deleteOne();

  if (publicId) {
    await deleteCloudinaryAsset(publicId).catch(() => {});
  }

  res.status(200).json({
    success: true,
    message: "Category deleted successfully",
  });
});

export const getHomeSiteContent = asyncHandler(async (_req, res) => {
  const content = await SiteContent.findOne({ key: "home" }).lean();

  res.status(200).json({
    success: true,
    content,
  });
});

export const upsertHomeSiteContent = asyncHandler(async (req, res) => {
  const existingContent = await SiteContent.findOne({ key: "home" });
  const parsedPayload = validateOrRespond(
    siteContentPayloadSchema,
    {
      heroBanner: parseJsonField(req.body.heroBanner, {}),
      bottomBanner: parseJsonField(req.body.bottomBanner, {}),
      features: parseJsonField(req.body.features, []),
      illustrations: parseJsonField(req.body.illustrations, {}),
      mobile: parseJsonField(req.body.mobile, undefined),
      tablet: parseJsonField(req.body.tablet, undefined),
      desktop: parseJsonField(req.body.desktop, undefined),
    },
    res
  );

  if (!parsedPayload) return;

  const heroBanner = parsedPayload.heroBanner || {};
  const bottomBanner = parsedPayload.bottomBanner || {};
  const features = parsedPayload.features || [];
  const illustrations = parsedPayload.illustrations || {};
  const files = req.files || {};
  const buildBreakpointPayload = (breakpoint) => ({
    heroBanner: {
      title: breakpoint?.heroBanner?.title || heroBanner.title,
      subtitle: breakpoint?.heroBanner?.subtitle || heroBanner.subtitle,
      position: breakpoint?.heroBanner?.position || heroBanner.position,
      cta: breakpoint?.heroBanner?.cta || heroBanner.cta,
      secondaryCta:
        breakpoint?.heroBanner?.secondaryCta || heroBanner.secondaryCta,
    },
    bottomBanner: {
      title: breakpoint?.bottomBanner?.title || bottomBanner.title,
      position: breakpoint?.bottomBanner?.position || bottomBanner.position,
      text: breakpoint?.bottomBanner?.text || bottomBanner.text,
    },
  });

  const previousHeroDesktopPublicId = existingContent?.heroBanner?.desktopImage?.publicId;
  const previousHeroMobilePublicId = existingContent?.heroBanner?.mobileImage?.publicId;
  const previousBottomDesktopPublicId = existingContent?.bottomBanner?.desktopImage?.publicId;
  const previousBottomMobilePublicId = existingContent?.bottomBanner?.mobileImage?.publicId;
  const previousAddressPublicId = existingContent?.illustrations?.address?.publicId;

  const heroDesktopImage = await buildImagePayload({
    existingImage: existingContent?.heroBanner?.desktopImage || null,
    file: files.heroDesktopImage?.[0],
    folder: "instabasket/site-content/hero",
    publicId: "home-desktop",
    bodyImage: heroBanner.desktopImage,
  });

  const heroMobileImage = await buildImagePayload({
    existingImage: existingContent?.heroBanner?.mobileImage || null,
    file: files.heroMobileImage?.[0],
    folder: "instabasket/site-content/hero",
    publicId: "home-mobile",
    bodyImage: heroBanner.mobileImage,
  });

  const bottomDesktopImage = await buildImagePayload({
    existingImage: existingContent?.bottomBanner?.desktopImage || null,
    file: files.bottomDesktopImage?.[0],
    folder: "instabasket/site-content/bottom-banner",
    publicId: "home-bottom-desktop",
    bodyImage: bottomBanner.desktopImage,
  });

  const bottomMobileImage = await buildImagePayload({
    existingImage: existingContent?.bottomBanner?.mobileImage || null,
    file: files.bottomMobileImage?.[0],
    folder: "instabasket/site-content/bottom-banner",
    publicId: "home-bottom-mobile",
    bodyImage: bottomBanner.mobileImage,
  });

  const addressIllustration = await buildImagePayload({
    existingImage: existingContent?.illustrations?.address || null,
    file: files.addressIllustration?.[0],
    folder: "instabasket/site-content/illustrations",
    publicId: "address-illustration",
    bodyImage: illustrations.address,
  });

  const normalizedFeatures = await Promise.all(
    (Array.isArray(features) ? features : []).map(async (feature, index) => {
      const previousFeaturePublicId =
        existingContent?.features?.[index]?.icon?.publicId || null;
      const uploadedIcon = await buildImagePayload({
        existingImage: existingContent?.features?.[index]?.icon || null,
        file: files[`featureIcon_${index}`]?.[0],
        folder: "instabasket/site-content/features",
        publicId: `feature-${index + 1}`,
        bodyImage: feature.icon,
      });

      return {
        icon: uploadedIcon,
        title: feature.title,
        description: feature.description,
        _previousPublicId: previousFeaturePublicId,
      };
    })
  );

  if (!heroDesktopImage || !heroMobileImage || !bottomDesktopImage) {
    return res.status(400).json({
      success: false,
      message: "Hero and bottom banner images are required",
    });
  }

  const payload = {
    key: "home",
    heroBanner: {
      desktopImage: heroDesktopImage,
      mobileImage: heroMobileImage,
      title:
        heroBanner.title ||
        existingContent?.heroBanner?.title ||
        "Discover Exclusive Deals!",
      subtitle:
        heroBanner.subtitle ||
        existingContent?.heroBanner?.subtitle ||
        "Shop the best products at unbeatable prices, tailored just for you.",
      position:
        heroBanner.position ||
        existingContent?.heroBanner?.position ||
        "center-left",
      cta:
        heroBanner.cta ||
        existingContent?.heroBanner?.cta || {
          label: "Start Shopping",
          href: "/products",
        },
      secondaryCta:
        heroBanner.secondaryCta ||
        existingContent?.heroBanner?.secondaryCta || {
          label: "Explore Now",
          href: "/products",
        },
    },
    bottomBanner: {
      desktopImage: bottomDesktopImage,
      mobileImage: bottomMobileImage || bottomDesktopImage,
      title:
        bottomBanner.title ||
        existingContent?.bottomBanner?.title ||
        "Why We Are The Best",
      position:
        bottomBanner.position ||
        existingContent?.bottomBanner?.position ||
        "center-right",
      text:
        bottomBanner.text ||
        existingContent?.bottomBanner?.text ||
        "Trusted delivery, fresh products, and value every day.",
    },
    features: normalizedFeatures.length
      ? normalizedFeatures.map(({ _previousPublicId, ...feature }) => feature)
      : existingContent?.features || [],
    illustrations: {
      address:
        addressIllustration || existingContent?.illustrations?.address || null,
    },
    // Store independent breakpoint overrides while preserving legacy root
    // fields as the desktop fallback for old frontend/admin consumers.
    mobile:
      parsedPayload.mobile ||
      existingContent?.mobile ||
      buildBreakpointPayload(parsedPayload.desktop || {}),
    tablet:
      parsedPayload.tablet ||
      existingContent?.tablet ||
      buildBreakpointPayload(parsedPayload.desktop || {}),
    desktop:
      parsedPayload.desktop ||
      existingContent?.desktop ||
      buildBreakpointPayload(parsedPayload.desktop || {}),
  };

  const content = await SiteContent.findOneAndUpdate(
    { key: "home" },
    payload,
    { new: true, upsert: true, runValidators: true }
  );

  if (
    files.heroDesktopImage?.[0] &&
    previousHeroDesktopPublicId &&
    previousHeroDesktopPublicId !== heroDesktopImage.publicId
  ) {
    await deleteCloudinaryAsset(previousHeroDesktopPublicId).catch(() => {});
  }

  if (
    files.heroMobileImage?.[0] &&
    previousHeroMobilePublicId &&
    previousHeroMobilePublicId !== heroMobileImage.publicId
  ) {
    await deleteCloudinaryAsset(previousHeroMobilePublicId).catch(() => {});
  }

  if (
    files.bottomDesktopImage?.[0] &&
    previousBottomDesktopPublicId &&
    previousBottomDesktopPublicId !== bottomDesktopImage.publicId
  ) {
    await deleteCloudinaryAsset(previousBottomDesktopPublicId).catch(() => {});
  }

  if (
    files.bottomMobileImage?.[0] &&
    previousBottomMobilePublicId &&
    previousBottomMobilePublicId !== (bottomMobileImage || bottomDesktopImage).publicId
  ) {
    await deleteCloudinaryAsset(previousBottomMobilePublicId).catch(() => {});
  }

  if (
    files.addressIllustration?.[0] &&
    previousAddressPublicId &&
    previousAddressPublicId !== addressIllustration?.publicId
  ) {
    await deleteCloudinaryAsset(previousAddressPublicId).catch(() => {});
  }

  for (const [index, feature] of normalizedFeatures.entries()) {
    const previousFeaturePublicId = feature._previousPublicId;
    const nextFeaturePublicId = feature.icon?.publicId;
    if (
      files[`featureIcon_${index}`]?.[0] &&
      previousFeaturePublicId &&
      previousFeaturePublicId !== nextFeaturePublicId
    ) {
      await deleteCloudinaryAsset(previousFeaturePublicId).catch(() => {});
    }
  }

  res.status(200).json({
    success: true,
    content,
  });
});
