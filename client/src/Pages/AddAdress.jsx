import React, { useState } from "react";
import { assets } from "../assets/assets";

// Reusable input field component
const InputField = ({
  type,
  placeholder,
  name,
  handleChange,
  address,
  ...props
}) => (
  <input
    id={name}
    aria-label={placeholder}
    className="w-full px-2 py-2.5 border border-gray-500/30 rounded outline-none text-gray-500 focus:border-primary transition"
    type={type}
    placeholder={placeholder}
    onChange={handleChange}
    name={name}
    value={address[name]}
    {...props}
    required
  />
);

const AddAddress = () => {
  // State for form values and UI feedback
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prevAddress) => ({
      ...prevAddress,
      [name]: value,
    }));
  };

  // Handle form submission
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMessage("Address saved successfully!");
    }, 1000);
  };

  // Reset the form
  const onResetHandler = () => {
    setAddress({
      firstName: "",
      lastName: "",
      email: "",
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      phone: "",
    });
  };

  return (
    <div className="mt-16 pb-16">
      {/* Header Section */}
      <div className="text-2xl md:text-3xl text-gray-500">
        Add Shipping <span className="font-semibold text-primary">Address</span>
      </div>
      <div className="flex flex-col-reverse md:flex-row justify-between mt-10">
        {/* Form Section */}
        <div className="flex-1 max-w-md">
          {successMessage && (
            <p className="text-green-500 text-center mb-4">{successMessage}</p>
          )}
          <form onSubmit={onSubmitHandler} className="space-y-3 mt-6 text-sm">
            {/* Name Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="firstName"
                type="text"
                placeholder="First Name"
              />
              <InputField
                handleChange={handleChange}
                address={address}
                name="lastName"
                type="text"
                placeholder="Last Name"
              />
            </div>
            {/* Other Inputs */}
            <InputField
              handleChange={handleChange}
              address={address}
              name="email"
              type="email"
              placeholder="Email"
            />
            <InputField
              handleChange={handleChange}
              address={address}
              name="street"
              type="text"
              placeholder="Street Address"
            />
            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="city"
                type="text"
                placeholder="City"
              />
              <InputField
                handleChange={handleChange}
                address={address}
                name="state"
                type="text"
                placeholder="State"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                handleChange={handleChange}
                address={address}
                name="zipCode"
                type="number"
                placeholder="Zip Code"
              />
              <InputField
                handleChange={handleChange}
                address={address}
                name="country"
                type="text"
                placeholder="Country"
              />
            </div>
            <InputField
              handleChange={handleChange}
              address={address}
              name="phone"
              type="tel"
              placeholder="Phone Number"
            />
            {/* Buttons */}
            <button
              disabled={isSubmitting}
              className={`w-full mt-6 bg-primary text-white py-3 transition cursor-pointer uppercase ${
                isSubmitting
                  ? "bg-primary/60 cursor-not-allowed"
                  : "hover:bg-primary-dull"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Address"}
            </button>
            <button
              onClick={onResetHandler}
              type="button"
              className="w-full mt-2 bg-gray-100 text-gray-600 py-3 hover:bg-gray-200 transition cursor-pointer uppercase"
            >
              Reset Form
            </button>
          </form>
        </div>
        {/* Image Section */}
        <img
          className="md:mr-16 mb-16 md:mt-0"
          src={assets.add_address_iamge}
          alt="Add Address"
        />
      </div>
    </div>
  );
};

export default AddAddress;
