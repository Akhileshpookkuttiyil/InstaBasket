import React, { useState } from "react";
import { assets } from "../assets/assets";
import { getAvatarUrl } from "../shared/lib/getAvatarUrl";

/**
 * Reusable Avatar component with error handling and priority logic.
 */
const Avatar = ({ user, size = "w-8 h-8", className = "", alt = "User avatar" }) => {
  const [imgError, setImgError] = useState(false);
  
  // If image fails to load, fallback to default static icon
  const src = imgError ? assets.profile_icon : getAvatarUrl(user, assets.profile_icon);

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded-full object-cover shrink-0 ${size} ${className}`}
      onError={() => setImgError(true)}
    />
  );
};

export default Avatar;
