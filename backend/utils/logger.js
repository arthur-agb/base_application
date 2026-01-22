// utils/logger.js
import { logger } from '../middleware/loggingMiddleware.js';

/**
 * Utility wrapper around winston logger for application-wide use
 */
class Logger {
  static info(message) {
    logger.info(message);
  }
  
  static error(message, error = null) {
    if (error) {
      logger.error(`${message}: ${error.message}\n${error.stack}`);
    } else {
      logger.error(message);
    }
  }
  
  static warn(message) {
    logger.warn(message);
  }
  
  static debug(message) {
    logger.debug(message);
  }
  
  static http(message) {
    logger.http(message);
  }
}

export default Logger;
