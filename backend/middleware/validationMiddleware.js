// middleware/validationMiddleware.js
import { validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(
      errors.array().map(error => error.msg).join(', ')
    );
  }
  next();
};
