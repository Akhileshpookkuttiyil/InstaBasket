/**
 * Returns the best available avatar URL for a user.
 * 
 * Priority:
 *  1. Custom uploaded image  (user.profileImage)
 *  2. Google profile photo   (user.googleImage)
 *  3. Default static icon    (fallback)
 * 
 * @param {object|null} user - user object from auth store
 * @param {string} fallback  - URL of the default avatar asset
 * @returns {string}
 */
export function getAvatarUrl(user, fallback) {
  if (!user) return fallback;
  if (user.profileImage) return user.profileImage;
  if (user.googleImage)  return user.googleImage;
  return fallback;
}
