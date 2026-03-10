import Address from "../models/Address.js";
import asyncHandler from "../utils/asyncHandler.js";

// add address : POST /api/address/add
export const addAddress = asyncHandler(async (req, res) => {
  const { address } = req.body;
  const userId = req.user.id;
  const existingCount = await Address.countDocuments({ userId });

  const createdAddress = await Address.create({
    firstName: address.firstName,
    lastName: address.lastName,
    email: address.email,
    street: address.street,
    city: address.city,
    state: address.state,
    zipcode: address.zipCode,
    country: address.country,
    phone: address.phone,
    isDefault: existingCount === 0,
    userId,
  });

  res.status(201).json({
    success: true,
    message: "Shipping address saved",
    address: createdAddress,
  });
});

// get all address : GET /api/address/get
export const getAllAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const addresses = await Address.find({ userId }).sort({
    isDefault: -1,
    createdAt: -1,
  });
  
  res.status(200).json({
    success: true,
    addresses,
  });
});

// update address : PATCH /api/address/:id
export const updateAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const { address } = req.body;

  const updatedAddress = await Address.findOneAndUpdate(
    { _id: id, userId },
    {
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      street: address.street,
      city: address.city,
      state: address.state,
      zipcode: address.zipCode,
      country: address.country,
      phone: address.phone,
    },
    { new: true, runValidators: true }
  );

  if (!updatedAddress) {
    return res.status(404).json({
      success: false,
      message: "Address not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    address: updatedAddress,
  });
});

// delete address : DELETE /api/address/:id
export const deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const deletedAddress = await Address.findOneAndDelete({ _id: id, userId });
  if (!deletedAddress) {
    return res.status(404).json({
      success: false,
      message: "Address not found",
    });
  }

  if (deletedAddress.isDefault) {
    const fallbackAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
    if (fallbackAddress) {
      fallbackAddress.isDefault = true;
      await fallbackAddress.save();
    }
  }

  res.status(200).json({
    success: true,
    message: "Address removed successfully",
  });
});

// set default address : PATCH /api/address/:id/default
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  const address = await Address.findOne({ _id: id, userId });
  if (!address) {
    return res.status(404).json({
      success: false,
      message: "Address not found",
    });
  }

  await Address.updateMany({ userId }, { $set: { isDefault: false } });
  address.isDefault = true;
  await address.save();

  res.status(200).json({
    success: true,
    message: "Default address updated",
    address,
  });
});
