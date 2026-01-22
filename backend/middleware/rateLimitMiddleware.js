// middleware/rateLimitMiddleware.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Logger from '../utils/logger.js';

// Helper function to create a limiter with optional RedisStore
const createLimiter = (options, client) => {
  let store = null; // Default to null (will use MemoryStore)

  if (client) {
    // Only try to create RedisStore if a client was provided
    try {
      store = new RedisStore({
        // Pass the sendCommand function from the node-redis client instance
        sendCommand: (...args) => client.sendCommand(args),
      });
      Logger.info(`[RateLimit] Configured with RedisStore for window ${options.windowMs}ms.`);
    } catch (err) {
      Logger.error('[RateLimit] Failed to create RedisStore. Falling back to MemoryStore.', err);
      // store remains null, rate-limit will use MemoryStore
    }
  } else {
    // This case will now only happen if connect failed before this point
    Logger.warn('[RateLimit] Redis client not available. Rate limiter will use MemoryStore.');
  }

  // Create the rate limiter instance
  return rateLimit({
    ...options, // Spread the specific limiter options (windowMs, max, message etc.)
    // Conditionally add the store property ONLY if store was successfully created
    ...(store && { store: store }), // If store is null/undefined, this adds nothing, rate-limit defaults to MemoryStore
  });
};

// Function to create the API rate limiter
export const createApiLimiter = (client) => createLimiter(
  { // Options specific to API limiter
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  },
  client // Pass the connected client instance (or null if connection failed)
);

// Function to create the Authentication rate limiter
export const createAuthLimiter = (client) => createLimiter(
  { // Options specific to Auth limiter
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // More restrictive
    message: 'Too many login attempts, please try again after 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
  },
  client // Pass the connected client instance (or null if connection failed)
);
