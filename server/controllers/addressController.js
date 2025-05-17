// add address : POST /api/address/add

import Address from "../models/Address.js";

export const addAddress = async (req, res) => {
  try {
    const { userId, address } = req.body;
    await Address.create({
      ...address,
      userId,
    });
    res.status(201).json({
      success: true,
      message: "Address added successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// get all address : GET /api/address/get
export const getAllAddress = async (req, res) => {
  try {
    const { userId } = req.body;
    const addresses = await Address.find({ userId });
    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};
