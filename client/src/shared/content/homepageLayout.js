export const HOMEPAGE_TEXT_POSITION_OPTIONS = [
  { value: "top-left", label: "Top left" },
  { value: "center-left", label: "Center left" },
  { value: "center", label: "Center" },
  { value: "center-right", label: "Center right" },
  { value: "bottom-right", label: "Bottom right" },
];

export const HOMEPAGE_BREAKPOINTS = ["mobile", "tablet", "desktop"];

const overlayPositionClasses = {
  "top-left": "items-start justify-start text-left",
  "center-left": "items-start justify-center text-left",
  center: "items-center justify-center text-center",
  "center-right": "items-end justify-center text-right",
  "bottom-right": "items-end justify-end text-right",
};

const blockAlignmentClasses = {
  "top-left": "items-start text-left",
  "center-left": "items-start text-left",
  center: "items-center text-center",
  "center-right": "items-end text-right",
  "bottom-right": "items-end text-right",
};

export const getHomepageOverlayClasses = (position = "center") =>
  overlayPositionClasses[position] || overlayPositionClasses.center;

export const getHomepageBlockClasses = (position = "center") =>
  blockAlignmentClasses[position] || blockAlignmentClasses.center;

export const getHomepageBreakpointKey = (mode = "desktop") => {
  if (mode === "web") return "desktop";
  return HOMEPAGE_BREAKPOINTS.includes(mode) ? mode : "desktop";
};

const compactObject = (value = {}) =>
  Object.fromEntries(
    Object.entries(value || {}).filter(([, entryValue]) => entryValue != null)
  );

const mergeBannerContent = (base = {}, override = {}) => {
  const compactOverride = compactObject(override);

  return {
    ...base,
    ...compactOverride,
    // Breakpoint overrides are for layout/copy. Keep root image assets unless
    // a valid breakpoint image object/string is intentionally provided.
    desktopImage: compactOverride.desktopImage || base?.desktopImage,
    mobileImage: compactOverride.mobileImage || base?.mobileImage,
    cta: {
      ...(base?.cta || {}),
      ...(compactOverride?.cta || {}),
    },
    secondaryCta: {
      ...(base?.secondaryCta || {}),
      ...(compactOverride?.secondaryCta || {}),
    },
  };
};

export const getHomepageBreakpointContent = (content = {}, mode = "desktop") => {
  const breakpoint = getHomepageBreakpointKey(mode);
  const breakpointContent = content?.[breakpoint] || {};

  return {
    ...content,
    heroBanner: mergeBannerContent(
      content?.heroBanner,
      breakpointContent?.heroBanner
    ),
    bottomBanner: mergeBannerContent(
      content?.bottomBanner,
      breakpointContent?.bottomBanner
    ),
  };
};
