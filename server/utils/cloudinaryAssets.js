import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

export const uploadAssetToCloudinary = async ({
  filePath,
  folder,
  publicId,
  overwrite = true,
  transformation,
}) => {
  const uploadResult = await cloudinary.uploader.upload(filePath, {
    resource_type: "image",
    folder,
    public_id: publicId,
    overwrite,
    transformation,
  });

  return {
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
  };
};

export const uploadMulterFileToCloudinary = async ({
  file,
  folder,
  publicId,
  overwrite = true,
  transformation,
}) => {
  if (!file?.path) {
    throw new Error("Image file path is required for upload");
  }

  try {
    return await uploadAssetToCloudinary({
      filePath: file.path,
      folder,
      publicId,
      overwrite,
      transformation,
    });
  } finally {
    await fs.unlink(file.path).catch(() => {});
  }
};

export const deleteCloudinaryAsset = async (publicId) => {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });
};
