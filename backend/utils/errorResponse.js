// utils/errorResponse.js

class ErrorResponse extends Error {
  /**
   * Create a new ErrorResponse instance
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorResponse;
