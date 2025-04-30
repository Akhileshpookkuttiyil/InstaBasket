import React, { useState } from "react";
import { assets, categories } from "../../assets/assets";

const AddProducts = () => {
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    offerPrice: "",
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFileChange = (index, file) => {
    const updatedFiles = [...files];
    updatedFiles[index] = file;
    setFiles(updatedFiles);
  };

  const validateForm = () => {
    if (formData.offerPrice > formData.price) {
      alert("Offer price cannot be greater than product price.");
      return false;
    }
    return true;
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (validateForm()) {
      console.log("Form submitted:", { ...formData, files });
      // Add API call or further processing here
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <form
        onSubmit={onSubmitHandler}
        className="md:p-10 p-4 space-y-5 max-w-lg"
      >
        {/* Product Image Upload */}
        <div>
          <p className="text-base font-medium">Product Image</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {Array(4)
              .fill("")
              .map((_, index) => (
                <label key={index} htmlFor={`image${index}`}>
                  <input
                    type="file"
                    id={`image${index}`}
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFileChange(index, e.target.files[0])}
                  />
                  <img
                    className="max-w-24 cursor-pointer"
                    src={
                      files[index]
                        ? URL.createObjectURL(files[index])
                        : assets.upload_area
                    }
                    alt="uploadArea"
                    width={100}
                    height={100}
                  />
                </label>
              ))}
          </div>
        </div>

        {/* Product Name */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="name">
            Product Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col gap-1 max-w-md">
          <label className="text-base font-medium" htmlFor="description">
            Product Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Type here"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40 resize-none"
            value={formData.description}
            onChange={handleInputChange}
          ></textarea>
        </div>

        {/* Category Selection */}
        <div className="w-full flex flex-col gap-1">
          <label className="text-base font-medium" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="">Select Category</option>
            {categories.map((category, index) => (
              <option key={index} value={category.path}>
                {category.path}
              </option>
            ))}
          </select>
        </div>

        {/* Product Price and Offer Price */}
        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex-1 flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="price">
              Product Price
            </label>
            <input
              id="price"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex-1 flex flex-col gap-1 w-32">
            <label className="text-base font-medium" htmlFor="offerPrice">
              Offer Price
            </label>
            <input
              id="offerPrice"
              type="number"
              placeholder="0"
              className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500/40"
              value={formData.offerPrice}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="px-8 py-2.5 bg-primary text-white font-medium rounded"
        >
          ADD
        </button>
      </form>
    </div>
  );
};

export default AddProducts;
