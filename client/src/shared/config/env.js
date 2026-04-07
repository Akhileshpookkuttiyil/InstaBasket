const getEnvValue = (key, fallback = "") => {
  const value = import.meta.env[key];
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return value;
};

export const env = {
  baseUrl: getEnvValue("VITE_BASE_URL", ""),
  currency: getEnvValue("VITE_CURRENCY", "$"),
  googleClientId: getEnvValue("VITE_GOOGLE_CLIENT_ID", ""),
  demoUserEmail: getEnvValue("VITE_DEMO_USER_EMAIL", "demo@instamania.com"),
  demoUserPassword: getEnvValue("VITE_DEMO_USER_PASSWORD", "password"),
};
