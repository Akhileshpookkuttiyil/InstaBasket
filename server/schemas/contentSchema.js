import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
});

const linkSchema = z.object({
  label: z.string().trim().min(1).max(80),
  href: z.string().trim().min(1).max(300),
});

const positionSchema = z.enum([
  "top-left",
  "center-left",
  "center",
  "center-right",
  "bottom-right",
]);

const responsiveHeroBannerSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  subtitle: z.string().trim().min(3).max(280).optional(),
  position: positionSchema.optional(),
  cta: linkSchema.optional(),
  secondaryCta: linkSchema.optional(),
}).optional();

const responsiveBottomBannerSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  position: positionSchema.optional(),
  text: z.string().trim().min(3).max(400).optional(),
}).optional();

const breakpointContentSchema = z.object({
  heroBanner: responsiveHeroBannerSchema,
  bottomBanner: responsiveBottomBannerSchema,
}).optional();

export const categoryPayloadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(120).optional(),
  bgColor: z.string().trim().min(4).max(20).optional(),
  sortOrder: z.preprocess((value) => Number(value), z.number().int().min(0)).optional(),
  isActive: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => {
      if (typeof value === "boolean") return value;
      if (value === undefined) return undefined;
      return value !== "false";
    }),
  image: imageSchema.optional(),
});

export const categoryUpdateSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid category id"),
  }),
  body: categoryPayloadSchema.partial().refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required"
  ),
});

export const siteContentPayloadSchema = z.object({
  heroBanner: z.object({
    desktopImage: imageSchema.optional(),
    mobileImage: imageSchema.optional(),
    title: z.string().trim().min(3).max(160).optional(),
    subtitle: z.string().trim().min(3).max(280).optional(),
    position: positionSchema.optional(),
    cta: linkSchema.optional(),
    secondaryCta: linkSchema.optional(),
  }).optional(),
  bottomBanner: z.object({
    desktopImage: imageSchema.optional(),
    mobileImage: imageSchema.optional(),
    title: z.string().trim().min(3).max(160).optional(),
    position: positionSchema.optional(),
    text: z.string().trim().min(3).max(400).optional(),
  }).optional(),
  illustrations: z.object({
    address: imageSchema.optional(),
  }).optional(),
  // Breakpoint overrides are optional so older admin payloads and existing DB
  // documents continue to validate as desktop-only homepage content.
  mobile: breakpointContentSchema,
  tablet: breakpointContentSchema,
  desktop: breakpointContentSchema,
  features: z.array(
    z.object({
      icon: imageSchema.optional(),
      title: z.string().trim().min(2).max(120),
      description: z.string().trim().min(2).max(240),
    })
  ).max(6).optional(),
});
