// middleware/loggingMiddleware.js
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define Winston format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      format
    ),
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(__dirname, '..', 'logs', 'error.log'),
    level: 'error',
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(__dirname, '..', 'logs', 'all.log'),
  }),
];

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || level(),
  levels,
  format,
  transports,
});

/**
 * HTTP request logger middleware
 */
const requestLogger = (req, res, next) => {
  // Log request details
  logger.http(
    `${req.method} ${req.originalUrl} - ${req.ip}`
  );
  next();
};

/**
 * Error logger middleware
 */
const errorLogger = (err, req, res, next) => {
  // Log error details
  logger.error(
    `${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`
  );
  next(err);
};

export {
  logger,
  requestLogger,
  errorLogger
};
