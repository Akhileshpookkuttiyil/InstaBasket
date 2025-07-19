import React, { useState } from "react";

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 mt-10 py-12 px-6 sm:px-8">
      <div className="max-w-4xl w-full bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-center text-[#94dc1c] mb-6">
          Contact InstaBasket
        </h1>
        <p className="text-center text-gray-600 mb-8">
          We're here to help! Let us know if you have any questions or need
          assistance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Contact Info Section */}
          <div className="space-y-6 text-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Address
              </h2>
              <p>123 Fresh Market Street</p>
              <p>GreenVille, NY 10001</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Phone
              </h2>
              <p>+1 (555) 123-4567</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Email
              </h2>
              <p>support@instabasket.com</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                Support Hours
              </h2>
              <p>Mon - Sat: 8:00 AM – 8:00 PM</p>
            </div>
          </div>

          {/* Contact Form Section */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitted && (
              <div className="bg-green-100 text-[#94dc1c] p-3 rounded text-sm">
                Thank you! We’ll get back to you soon.
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#94dc1c]"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#94dc1c]"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="4"
                required
                value={formData.message}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#94dc1c]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-[#94dc1c] hover:bg-[#80c71b] text-white font-semibold py-2 rounded-lg transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
