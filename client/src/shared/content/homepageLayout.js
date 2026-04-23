export const HOMEPAGE_TEXT_POSITION_OPTIONS = [
  { value: "top-left", label: "Top left" },
  { value: "center-left", label: "Center left" },
  { value: "center", label: "Center" },
  { value: "center-right", label: "Center right" },
  { value: "bottom-right", label: "Bottom right" },
];

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
