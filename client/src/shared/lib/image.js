const createSvgFallback = (label, background, foreground = "#475569") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <rect width="640" height="480" fill="${background}" rx="24" ry="24"/>
      <circle cx="320" cy="180" r="48" fill="${foreground}" fill-opacity="0.12"/>
      <path d="M205 315c32-53 72-79 115-79 33 0 62 15 87 43 12 13 26 31 42 54H205z" fill="${foreground}" fill-opacity="0.18"/>
      <text x="320" y="390" text-anchor="middle" font-size="28" font-family="Arial, sans-serif" fill="${foreground}" fill-opacity="0.85">${label}</text>
    </svg>`
  )}`;

const FALLBACKS = {
  product: createSvgFallback("Product Image", "#F8FAFC"),
  category: createSvgFallback("Category Image", "#FEF3C7"),
  marketing: createSvgFallback("InstaBasket", "#ECFCCB", "#365314"),
  avatar: createSvgFallback("Avatar", "#E2E8F0"),
};

export const getImageUrl = (entity, fallbackType = "marketing") => {
  if (typeof entity === "string" && entity.trim()) {
    return entity;
  }

  if (entity?.url) {
    return entity.url;
  }

  return FALLBACKS[fallbackType] || FALLBACKS.marketing;
};

export const getImageFallback = (fallbackType = "marketing") =>
  FALLBACKS[fallbackType] || FALLBACKS.marketing;
