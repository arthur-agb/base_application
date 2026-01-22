// src/server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import path from 'path';
import helmet from 'helmet';
import compression from 'compression';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import utilities
import Logger from './utils/logger.js';
import SocketHandlers from './utils/socketHandlers.js';
import redisClient from './utils/redisClient.js';
import prisma from './utils/prismaClient.js';
import { initializeGlobals } from './utils/globalsInitializer.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorMiddleware.js';
import { createApiLimiter, createAuthLimiter } from './middleware/rateLimitMiddleware.js';
import { requestLogger, errorLogger } from './middleware/loggingMiddleware.js';
import { socketAuthMiddleware, socketRateLimiter } from './middleware/socketMiddleware.js';
import { handleUploadErrors } from './middleware/uploadMiddleware.js';
import { validate } from './middleware/validationMiddleware.js';
import { protect } from './middleware/authMiddleware.js';
import tenantContext from './middleware/tenantContext.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import userRoutes from './routes/userRoutes.js';
import attachmentRoutes from './routes/attachmentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import adminRoutes from './routes/adminRoutes.js';



// Create directories
const logsDir = path.join(__dirname, 'logs');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Init Express app
const app = express();
const server = http.createServer(app);

// Simplified and robust CORS origin validation
const corsOptions = {
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin: (origin, callback) => {
    // Allow server-to-server requests, REST clients, etc. (where origin is undefined)
    if (!origin) {
      return callback(null, true);
    }

    const rootDomain = process.env.ROOT_DOMAIN;

    if (!rootDomain) {
      Logger.error('CORS Error: ROOT_DOMAIN is not defined in environment variables.');
      return callback(new Error('Internal server configuration error regarding CORS.'));
    }

    const allowedOriginRegex = new RegExp(`^https?://(.+\\.)?${rootDomain.replace(/\./g, '\\.')}$`);

    if (allowedOriginRegex.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`The origin '${origin}' is not allowed by CORS.`));
  }
};


// Set up Socket.io
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket'],
});

// Socket.io middleware and handlers
io.use(socketAuthMiddleware);
io.use(socketRateLimiter());
SocketHandlers.initialize(io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}, Reason: ${reason}`);
  });
});

// Make io accessible to route handlers
app.set('io', io);

// Security middleware - must be first
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

// Request logging
app.use(requestLogger);

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Parse JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Apply the tenant context middleware
app.use(tenantContext);

// Compress responses
app.use(compression());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/admin', adminRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime())
  });
});

// --- START OpenAPI Conditional Setup ---
if (process.env.NODE_ENV !== 'production') {
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Momentum Manager Back End API (Development)',
        version: '1.0.0',
        description: 'API documentation for the Momentum Manager application. This API allows for user authentication, issue creation, management, and drag-and-drop functionality for board management.',
        contact: {
          name: 'Arthur Britnell',
          email: 'arthur@agbintegration.com',
        },
      },
      servers: [
        {
          //url: `http://localhost:${process.env.PORT || 5000}/api`,
          url: `https://${process.env.ROOT_DOMAIN}/api`,
          description: 'Development Backend Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter the JWT token obtained from login. Example: "Bearer <token>"',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                description: 'Error message',
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: [
      path.join(__dirname, './routes/*.js'),
    ],
  };

  const swaggerDocs = swaggerJsdoc(swaggerOptions);
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, { explorer: true }));

  console.log(`API Docs available at https://${process.env.ROOT_DOMAIN}/api/docs`);
} else {
  app.get('/api/docs', (req, res) => {
    res.status(403).send('API documentation is not available in production environment.');
  });
  console.log('API Docs are disabled in production environment.');
}
// --- END OpenAPI Conditional Setup ---

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error logging - must be before error handler but after routes
app.use(errorLogger);

app.use((req, res, next) => {
  console.log(`[Request Debug] Method: ${req.method}, URL: ${req.originalUrl}`);
  next();
});

// 404 handler - must be after routes
app.use(notFound);

// Error handling middleware - must be last
app.use(errorHandler);

// Start the server
const startServer = async () => {
  try {
    await redisClient.connect();
    Logger.info('Redis connection established');

    const connectedRedisClient = redisClient.getClient();

    const apiLimiterInstance = createApiLimiter(connectedRedisClient);
    const authLimiterInstance = createAuthLimiter(connectedRedisClient);

    app.use('/api', apiLimiterInstance);
    app.use('/api/auth', authLimiterInstance);

    await prisma.$connect();
    Logger.info('PostgreSQL connection pool initialised via Prisma');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      Logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    // Initialize Role Descriptions
    const { initializeRoleDescriptions } = await import('./utils/roleDescriptionInitializer.js');
    await initializeRoleDescriptions();

    // Initialize Plans
    const { initializePlans } = await import('./utils/planInitializer.js');
    await initializePlans();

    // Initialize global variables
    const globalsInitialized = await initializeGlobals();
    if (!globalsInitialized) {
      Logger.error('Failed to initialize global variables. Exiting application.');
      // This is a critical failure, so we should exit.
      process.exit(1);
    }



  } catch (error) {
    Logger.error('Server startup error', error);
    await prisma.$disconnect().catch(err => Logger.error('Prisma disconnect failed on startup error', err));
    await redisClient.disconnect().catch(err => Logger.error('Redis disconnect failed on startup error', err));
    process.exit(1);
  }





};

// Graceful shutdown handlers
const shutdown = async (signal) => {
  Logger.info(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    Logger.info('HTTP server closed');
    await prisma.$disconnect().catch(err => Logger.error('Prisma disconnect failed on shutdown', err));
    await redisClient.disconnect().catch(err => Logger.error('Redis disconnect failed on shutdown', err));
    Logger.info('Database and Redis connections closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', async (err) => {
  Logger.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', async (err) => {
  Logger.error('Uncaught Exception:', err);
});

console.log('--- DATABASE CONNECTION CHECK ---');
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const url = new URL(dbUrl);
    console.log(`[DB_CHECK] Runtime DATABASE_URL - Host: ${url.hostname}, Port: ${url.port}, User: ${url.username}, DB Name: ${url.pathname}`);
  } catch (e) {
    console.error('[DB_CHECK] Runtime DATABASE_URL is invalid or cannot be parsed:', dbUrl);
  }
} else {
  console.log('[DB_CHECK] Runtime DATABASE_URL is NOT SET.');
}
console.log('---------------------------------');

// Start the server
startServer();
