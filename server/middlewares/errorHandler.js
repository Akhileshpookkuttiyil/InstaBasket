const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log error for developers
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
