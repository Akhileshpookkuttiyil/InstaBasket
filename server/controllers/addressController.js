// add address : POST /api/address/add

import Address from "../models/Address.js";

export const addAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access.",
      });
    }

    if (!address || !address.firstName || !address.street || !address.zipCode) {
      return res.status(400).json({
        success: false,
        message: "Missing required address fields.",
      });
    }

    const newAddress = {
      firstName: address.firstName,
      lastName: address.lastName,
      email: address.email,
      street: address.street,
      city: address.city,
      state: address.state,
      zipcode: address.zipCode,
      country: address.country,
      phone: address.phone,
      userId: req.user.id,
    };

    const createdAddress = await Address.create(newAddress);

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: createdAddress,
    });
  } catch (error) {
    console.error(error); // log full error for debugging
    res.status(500).json({ message: error.message });
  }
};


// get all address : GET /api/address/get
export const getAllAddress = async (req, res) => {
  console.log("getallAddress")
  try {
    const  userId  = req.user.id;
    const addresses = await Address.find({ userId });
    console.log("Fetched addresses server:", addresses);
    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};
