// middleware/socketMiddleware.js
import jwt from 'jsonwebtoken';
import ErrorResponse from '../utils/errorResponse.js';
import * as AuthService from '../services/auth.service.js';

export const socketAuthMiddleware = async (socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    console.warn(`[Socket Auth] Failed: No token provided for socket ID ${socket.id}.`);
    return next(new ErrorResponse('Authentication error: Token missing', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Delegate the complex logic of fetching the user and their projects to the service layer.
    const user = await AuthService.findUserWithProjects(decoded.id);

    // Attach the complete user data to the socket object.
    socket.user = user;
    
    console.log(`[Socket Auth] Authentication successful for user ${socket.user.id}, socket ID ${socket.id}.`);
    next();

  } catch (error) {
    console.error(`[Socket Auth] Authentication FAILED for socket ID ${socket.id}. Error:`, error);
    
    let clientError;
    if (error instanceof jwt.JsonWebTokenError) {
      clientError = new ErrorResponse('Authentication error: Invalid token', 401);
    } else if (error instanceof ErrorResponse) {
      // Catch errors thrown by the service layer
      clientError = error;
    } else {
      clientError = new ErrorResponse('Authentication error: Server processing failed', 500);
    }

    const authError = new Error(clientError.message);
    authError.data = { status: clientError.statusCode, reason: clientError.name };
    
    return next(authError);
  }
};

export const socketRateLimiter = () => {
  // To complete: Implement rate limiting logic here
};
