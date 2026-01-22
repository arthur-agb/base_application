// middleware/errorMiddleware.js
/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log error for server-side debugging
  console.error(`Error: ${err.message}`);
  console.error(err.stack);

  // Set status code
  // Use custom statusCode if set by ErrorResponse, otherwise use existing logic
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  if (err.statusCode) {
    statusCode = err.statusCode;
  }

  // Set the response status
  res.status(statusCode);

  // Send response
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

/**
 * Not Found middleware
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export {
  errorHandler,
  notFound
};
