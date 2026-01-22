/**
 * Frontend Logger Utility
 *
 * Provides a simple wrapper around the browser's console methods
 * with level control based on NODE_ENV.
 *
 * Matches the basic interface of the backend Logger class.
 */
class Logger {
    /**
     * Logs informational messages.
     * @param {string} message - The main message to log.
     * @param {...any} optionalParams - Additional parameters to log (objects, values).
     */
    static info(message, ...optionalParams) {
      console.info(`[INFO] ${message}`, ...optionalParams);
    }
  
    /**
     * Logs warning messages.
     * @param {string} message - The main message to log.
     * @param {...any} optionalParams - Additional parameters to log.
     */
    static warn(message, ...optionalParams) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  
    /**
     * Logs error messages. Handles optional error objects.
     * @param {string} message - The main message to log.
     * @param {Error | null} [error=null] - An optional Error object.
     * @param {...any} optionalParams - Additional parameters to log.
     */
    static error(message, error = null, ...optionalParams) {
      if (error instanceof Error) {
        // Log the main message, the error message, the stack trace, and any optional params
        console.error(`[ERROR] ${message}: ${error.message}\n${error.stack}`, ...optionalParams);
        // Optionally log the error object itself for inspection
        // console.error("Error object:", error);
      } else if (error) {
        // If 'error' is not null but not an Error instance, log it directly
        console.error(`[ERROR] ${message}`, error, ...optionalParams);
      }
       else {
        // Just log the message and any optional params
        console.error(`[ERROR] ${message}`, ...optionalParams);
      }
    }
  
    /**
     * Logs debug messages.
     * These logs will ONLY appear in development builds (when process.env.NODE_ENV !== 'production').
     * @param {string} message - The main message to log.
     * @param {...any} optionalParams - Additional parameters to log.
     */
    static debug(message, ...optionalParams) {
      // It will be 'production' for production builds, 'development' otherwise.
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[DEBUG] ${message}`, ...optionalParams);
      }
    }
  
    // Note: There isn't a direct equivalent for `logger.http` in the standard console API.
    // You could use `info` or `debug` for network-related logs.
    // static http(message, ...optionalParams) {
    //   if (process.env.NODE_ENV !== 'production') {
    //      console.debug(`[HTTP] ${message}`, ...optionalParams);
    //   }
    // }
  }
  
  export default Logger;
  