import Address from "../models/Address.js";
import asyncHandler from "../utils/asyncHandler.js";

// add address : POST /api/address/add
export const addAddress = asyncHandler(async (req, res) => {
  const { address } = req.body;
  const userId = req.user.id;

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
  const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    addresses,
  });
});
