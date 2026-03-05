import { z } from "zod";

const validate = (schema) => (req, res, next) => {
  try {
    // Some routes might have JSON sent as a string within FormData (like Multer fields)
    let dataToValidate = req.body;
    
    // Check if we need to parse productData (common in this app)
    if (req.body.productData && typeof req.body.productData === 'string') {
      try {
        dataToValidate = {
          ...req.body,
          productData: JSON.parse(req.body.productData)
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
