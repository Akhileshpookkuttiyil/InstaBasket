import { z } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    // Some routes might have JSON sent as a string within FormData (like Multer fields)
    const safeBody = req.body || {};
    let dataToValidate = safeBody;
    
    // Check if we need to parse productData (common in this app)
    if (safeBody.productData && typeof safeBody.productData === "string") {
      try {
        dataToValidate = {
          ...safeBody,
          productData: JSON.parse(safeBody.productData),
        };
      } catch (e) {
        // Fallback or leave as is if not JSON
      }
    }

    schema.parse({
      body: dataToValidate,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      });
    }
    next(error);
  }
};

export default validate;
