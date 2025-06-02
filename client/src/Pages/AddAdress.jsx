import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { useAppContext } from "../Context/AppContext";
import toast from "react-hot-toast";

// Controlled reusable input field
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
    value={address[name] || ""}
    {...props}
    required
  />
);

const AddAddress = () => {
  const { axios, user, navigate, loading } = useAppContext();

  const initialAddressState = {
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
  };

  const [address, setAddress] = useState(initialAddressState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "street",
      "city",
      "state",
      "zipCode",
      "country",
      "phone",
    ];
    for (let field of requiredFields) {
      if (!address[field].trim()) {
        toast.error(`Please fill out the "${field}" field.`);
        return false;
      }
    }
    return true;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const { data } = await axios.post("/api/address/add", { address });
      if (data.success) {
        toast.success(data.message || "Address saved!");
        navigate("/cart");
      } else {
        toast.error(data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save address."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      toast.error("Please log in to add an address.");
      navigate("/login");
    }
  }, [user, loading, navigate]);

  const onResetHandler = () => {
    setAddress(initialAddressState);
  };

  return (
    <div className="mt-16 pb-16 px-4">
      <div className="text-2xl md:text-3xl text-gray-500">
        Add Shipping <span className="font-semibold text-primary">Address</span>
      </div>

      <div className="flex flex-col-reverse md:flex-row justify-between mt-10 gap-8">
        {/* Form Section */}
        <div className="flex-1 max-w-md">
          <form onSubmit={onSubmitHandler} className="space-y-3 mt-6 text-sm">
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
                type="text"
                placeholder="Zip Code"
                pattern="\d{4,10}"
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
              pattern="^[0-9 ]{7,15}$"
            />

            {/* Submit Button */}
            <button
              disabled={isSubmitting}
              className={`w-full mt-6 bg-primary text-white py-3 transition uppercase ${
                isSubmitting
                  ? "bg-primary/60 cursor-not-allowed"
                  : "hover:bg-primary-dull"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save Address"}
            </button>

            {/* Reset Button */}
            <button
              onClick={onResetHandler}
              type="button"
              disabled={isSubmitting}
              className={`w-full mt-2 bg-gray-100 text-gray-600 py-3 transition uppercase ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-200"
              }`}
            >
              Reset Form
            </button>
          </form>
        </div>

        {/* Image Section */}
        <img
          className="md:mr-8 mb-12 md:mt-0 max-w-sm w-full object-contain"
          src={assets.add_address_iamge || "/fallback-image.jpg"}
          alt="Add Address"
          onError={(e) => (e.currentTarget.src = "/fallback-image.jpg")}
        />
      </div>
    </div>
  );
};

export default AddAddress;
