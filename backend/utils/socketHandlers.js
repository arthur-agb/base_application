// utils/socketHandlers.js
import Logger from './logger.js'; // Assuming logger.js is also an ES module

class SocketHandlers {
    static io = null;

    static initialize(ioInstance) {
      if (this.io) {
        Logger.warn("SocketHandlers.initialize called more than once.");
        return;
      }
      if (!ioInstance) {
          Logger.error("SocketHandlers.initialize requires a valid Socket.IO instance.");
          return;
      }

      this.io = ioInstance;
      Logger.info("SocketHandlers initialized with Socket.IO instance.");

      this.io.on('connection', (socket) => {
        const userId = socket.user?.id || 'Unknown User';
        const socketId = socket.id;
        Logger.info(`[Socket.IO] Client connected: UserID='${userId}', SocketID='${socketId}'`);

        socket.on('join_board_room', (roomName) => {
            if (roomName && typeof roomName === 'string' && roomName.startsWith('board_')) {
                Logger.info(`[Socket.IO] User '${userId}' (${socketId}) joining room: '${roomName}'`);
                socket.join(roomName);
            } else {
                 Logger.warn(`[Socket.IO] User '${userId}' (${socketId}) attempted to join invalid room: '${roomName}'`);
            }
        });

        socket.on('leave_board_room', (roomName) => {
             if (roomName && typeof roomName === 'string' && roomName.startsWith('board_')) {
                Logger.info(`[Socket.IO] User '${userId}' (${socketId}) leaving room: '${roomName}'`);
                socket.leave(roomName);
             } else {
                 Logger.warn(`[Socket.IO] User '${userId}' (${socketId}) attempted to leave invalid room: '${roomName}'`);
             }
        });

        socket.on('disconnect', (reason) => {
          Logger.info(`[Socket.IO] Client disconnected: UserID='${userId}', SocketID='${socketId}', Reason: ${reason}`);
        });
      });
    }

    static emitToRoom(roomName, eventName, payload) {
        if (!this.io) {
            Logger.error(`Socket Emit FAILED: SocketHandlers not initialized (io instance missing). Cannot emit '${eventName}'.`);
            return;
        }
         if (!roomName || !eventName) {
            Logger.warn(`Socket Emit SKIPPED: Missing roomName ('${roomName}') or eventName ('${eventName}').`);
            return;
        }
        try {
            this.io.to(roomName).emit(eventName, payload);
            Logger.info(`Socket Emit SUCCESS: Event='${eventName}', Room='${roomName}'`);
        } catch (error) {
            Logger.error(`Socket Emit FAILED: Event='${eventName}', Room='${roomName}'. Error: ${error.message}`, error);
        }
    }

    static emitIssueCreated(issue) {
      Logger.warn("Deprecated SocketHandler 'emitIssueCreated' called. Use 'emitToRoom'.");
    }
    static emitIssueUpdated(issue) {
       Logger.warn("Deprecated SocketHandler 'emitIssueUpdated' called. Use 'emitToRoom'.");
    }
    static emitIssueDeleted(issueId, projectId) {
       Logger.warn("Deprecated SocketHandler 'emitIssueDeleted' called. Use 'emitToRoom'.");
    }
    static emitIssueMoved(data) {
       Logger.warn("Deprecated SocketHandler 'emitIssueMoved' called. Use 'emitToRoom'.");
    }
    static emitCommentAdded(issueId, comment, projectId) {
       Logger.warn("Deprecated SocketHandler 'emitCommentAdded' called. Consider specific 'comment_added' event via 'emitToRoom'.");
    }
  }

export default SocketHandlers;
