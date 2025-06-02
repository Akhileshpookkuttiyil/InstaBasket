import React, { useState } from "react";
import { assets, categories } from "../../assets/assets";
import { useAppContext } from "../../Context/AppContext";
import toast from "react-hot-toast";

const initialFormData = {
  name: "",
  description: "",
  category: "",
  price: "",
  offerPrice: "",
  countInStock: "",
};

const AddProducts = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [files, setFiles] = useState([]);
  const { axios } = useAppContext();

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
    const { name, description, category, price, offerPrice, countInStock } =
      formData;

    if (!name || !description || !category || !price || countInStock === "") {
      toast.error("Please fill out all required fields.");
      return false;
    }

    if (Number(offerPrice) > Number(price)) {
      toast.error("Offer price cannot be greater than product price.");
      return false;
    }

    if (Number(countInStock) < 0) {
      toast.error("Stock count cannot be negative.");
      return false;
    }

    if (files.length === 0 || files.some((file) => !file)) {
      toast.error("Please upload all product images.");
      return false;
    }

    return true;
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        description: formData.description.split("\n"),
      };

      const form = new FormData();
      form.append("productData", JSON.stringify(payload));
      files.forEach((file) => form.append("images", file));

      const { data } = await axios.post("/api/products/add", form);

      if (data.success) {
        toast.success(data.message || "Product added successfully");
        setFormData(initialFormData);
        setFiles([]);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error.message || "Server error"
      );
    }
  };

  return (
    <div className="no-scrollbar flex-1 h-[95vh] overflow-y-scroll flex flex-col justify-between">
      <form
        onSubmit={onSubmitHandler}
        className="md:p-10 p-4 space-y-5 max-w-lg"
      >
        {/* Product Images */}
        <div>
          <p className="text-base font-medium">Product Images</p>
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
                    src={
                      files[index]
                        ? URL.createObjectURL(files[index])
                        : assets.upload_area
                    }
                    alt="Upload"
                    className="max-w-24 cursor-pointer border border-gray-200 rounded shadow-sm"
                  />
                </label>
              ))}
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-medium">
            Product Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Enter product name"
            className="outline-none py-2 px-3 border border-gray-200 rounded"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="font-medium">
            Product Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Enter product description"
            className="outline-none py-2 px-3 border border-gray-200 rounded resize-none"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="font-medium">
            Category
          </label>
          <select
            id="category"
            className="outline-none py-2 px-3 border border-gray-200 rounded"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">Select Category</option>
            {categories.map((category, index) => (
              <option key={index} value={category.path}>
                {category.path}
              </option>
            ))}
          </select>
        </div>

        {/* Price, Offer Price, and Stock */}
        <div className="flex flex-wrap gap-5">
          <div className="flex-1 flex flex-col gap-1">
            <label htmlFor="price" className="font-medium">
              Product Price
            </label>
            <input
              id="price"
              type="number"
              placeholder="0"
              className="outline-none py-2 px-3 border border-gray-200 rounded"
              value={formData.price}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label htmlFor="offerPrice" className="font-medium">
              Offer Price
            </label>
            <input
              id="offerPrice"
              type="number"
              placeholder="0"
              className="outline-none py-2 px-3 border border-gray-200 rounded"
              value={formData.offerPrice}
              onChange={handleInputChange}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1">
            <label htmlFor="countInStock" className="font-medium">
              Stock Quantity
            </label>
            <input
              id="countInStock"
              type="number"
              placeholder="0"
              className="outline-none py-2 px-3 border border-gray-200 rounded"
              value={formData.countInStock}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-primary text-white font-semibold py-2.5 px-8 rounded hover:bg-primary-dark transition"
        >
          ADD PRODUCT
        </button>
      </form>
    </div>
  );
};

export default AddProducts;
