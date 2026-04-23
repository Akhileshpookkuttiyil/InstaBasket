export const defaultHomeContent = {
  heroBanner: {
    desktopImage: null,
    mobileImage: null,
    position: "center-left",
    title: "Storefront content not configured yet",
    subtitle:
      "Upload homepage visuals and copy from the admin console to publish your storefront.",
    cta: {
      label: "Browse Products",
      href: "/products",
    },
    secondaryCta: {
      label: "Contact Support",
      href: "/contact",
    },
  },
  bottomBanner: {
    desktopImage: null,
    mobileImage: null,
    position: "center-right",
    title: "Fresh content starts here",
    text: "Categories, banners, and promotional assets will appear once they are published from the admin panel.",
  },
  features: [],
  illustrations: {
    address: null,
  },
};

const toDisplayPath = (category = {}) => {
  if (category.path) {
    return String(category.path).trim();
  }

  if (category.slug) {
    return String(category.slug)
      .trim()
      .split("-")
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  return String(category.name || "").trim();
};

export const normalizeCategory = (category = {}, index = 0) => ({
  ...category,
  name: String(category.name || "").trim(),
  slug: String(category.slug || "").trim().toLowerCase(),
  text: String(category.name || category.text || "").trim(),
  path: toDisplayPath(category),
  sortOrder: category.sortOrder ?? index,
});

export const normalizeCategories = (categories = []) =>
  Array.isArray(categories)
    ? categories
        .map((category, index) => normalizeCategory(category, index))
        .filter((category) => category.slug && category.name)
    : [];
