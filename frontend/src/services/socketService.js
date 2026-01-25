// src/services/socketService.js
import { io } from 'socket.io-client';
import queryClient from '../config/queryClient';

let socket = null;
let joinQueue = [];
let isConnecting = false;

let _dispatch = null;
let _handleBoardUpdateAction = null;

export const configureSocketService = (storeDispatch, handleBoardUpdateActionCreator) => {
  _dispatch = storeDispatch;
  _handleBoardUpdateAction = handleBoardUpdateActionCreator;
  console.log(`[${new Date().toLocaleTimeString()}] SocketService configured with dispatch and action.`);
};

const initSocket = () => {
  if (socket?.connected || isConnecting) {
    console.log(`[${new Date().toLocaleTimeString()}] initSocket: Socket already connected or connection in progress.`);
    return socket;
  }

  const token = localStorage.getItem('token');
  console.log(`[${new Date().toLocaleTimeString()}] initSocket: Using token starting with:`, token ? token.substring(0, 20) + '...' : 'No Token');

  if (!token) {
    console.warn('No token found, socket connection aborted');
    return null;
  }

  if (socket) {
    console.log(`[${new Date().toLocaleTimeString()}] initSocket: Disconnecting previous socket instance.`);
    socket.disconnect();
    socket = null;
  }

  console.log(`[${new Date().toLocaleTimeString()}] initSocket: Creating new socket connection to the current domain.`);
  isConnecting = true;

  // CHANGED: The `io()` function is now called without a URL.
  // It will default to the current domain (e.g., https://acme.momentum.local).
  // We provide the `path` option to ensure it connects to the correct endpoint
  // that Caddy is proxying to the backend.
  socket = io({
    path: '/socket.io', // This path must match your Caddy and backend configuration
    auth: { token },
    reconnection: true,
    reconnectionDelay: 3000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  socket.off('connect');
  socket.off('connect_error');
  socket.off('disconnect');
  socket.off('board_updated');
  socket.offAny();

  socket.on('connect', () => {
    isConnecting = false;
    console.log(`[${new Date().toLocaleTimeString()}] Socket connected: ${socket.id}`);
    console.log(`[${new Date().toLocaleTimeString()}] Socket: Processing join queue (${joinQueue.length} items)`);
    joinQueue.forEach(boardId => {
      if (socket?.connected) {
        console.log(`[${new Date().toLocaleTimeString()}] Socket: Emitting queued join_board_room for board_${boardId}`);
        socket.emit('join_board_room', `board_${boardId}`);
      } else {
        console.warn(`[${new Date().toLocaleTimeString()}] Socket: Cannot process queued join for board_${boardId}, socket disconnected.`);
      }
    });
    joinQueue = [];
  });

  socket.on('connect_error', (err) => {
    isConnecting = false;
    console.error(`[${new Date().toLocaleTimeString()}] Socket connection error:`, err.message, err.cause || '');
    joinQueue = [];
  });

  socket.on('disconnect', (reason) => {
    isConnecting = false;
    console.log(`[${new Date().toLocaleTimeString()}] Socket disconnected: ${reason}`);
    joinQueue = [];
  });

  socket.on('board_updated', (data) => {
    // Prevent "flicker" by ignoring updates triggered by the current user.
    // The optimistic update in React Query handles the UI state immediately.
    // If we re-fetch now, we risk overwriting the optimistic state with slightly stale or racing data.
    const token = localStorage.getItem('token');
    let currentUserId = null;
    if (token) {
      try {
        // Simple JWT decode to get ID (payload is the second part)
        const payload = JSON.parse(atob(token.split('.')[1]));
        currentUserId = payload.id || payload.userId || payload.sub; // Adjust based on your JWT structure
      } catch (e) {
        console.error("SocketService: Failed to parse user ID from token", e);
      }
    }

    if (currentUserId && data.actorId && String(data.actorId) === String(currentUserId)) {
      return;
    }

    const boardId = data?.boardId;
    const incomingVersion = data?.optimisticVersion;

    if (boardId) {
      // CRITICAL: Check if there's an active mutation in progress for this board
      // This is the key guard that prevents flicker - we don't invalidate queries
      // while the user is actively moving an issue (local state is authoritative)
      const isMutating = queryClient.isMutating({
        mutationKey: ['moveIssue', boardId]
      }) > 0;

      if (isMutating) {
        return;
      }

      // Check if there's an optimistic update in progress for this board
      const queryState = queryClient.getQueryState(['board', boardId]);
      const currentOptimisticVersion = queryState?.data?.optimisticVersion;

      if (incomingVersion !== undefined && currentOptimisticVersion !== undefined) {
        if (incomingVersion <= currentOptimisticVersion) {
          return;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['board', boardId] });
    } else {
      console.warn(`[${new Date().toLocaleTimeString()}] WebSocket: 'board_updated' event received without boardId.`);
    }
  });

  return socket;
};

const joinBoardRoom = (boardId) => {
  if (!boardId) return;
  if (socket?.connected) {
    console.log(`[${new Date().toLocaleTimeString()}] Socket: Emitting join_board_room for board_${boardId}`);
    socket.emit('join_board_room', `board_${boardId}`);
  } else {
    console.warn(`[${new Date().toLocaleTimeString()}] Socket: Not connected. Queuing join request for board_${boardId}.`);
    if (!joinQueue.includes(boardId)) { joinQueue.push(boardId); }
    if (!isConnecting && !socket?.connecting) {
      console.log(`[${new Date().toLocaleTimeString()}] Socket: Triggering initSocket from joinBoardRoom.`);
      initSocket();
    }
  }
};

const leaveBoardRoom = (boardId) => {
  if (!boardId) return;
  joinQueue = joinQueue.filter(id => id !== boardId);
  if (socket?.connected) {
    console.log(`[${new Date().toLocaleTimeString()}] Socket: Emitting leave_board_room for board_${boardId}`);
    socket.emit('leave_board_room', `board_${boardId}`);
  } else {
    console.warn(`[${new Date().toLocaleTimeString()}] Socket: Cannot leave room board_${boardId}, socket not connected.`);
  }
};

const disconnectSocket = () => {
  if (socket) {
    console.log(`[${new Date().toLocaleTimeString()}] Socket: Disconnecting manually.`);
    socket.disconnect();
    socket = null;
    joinQueue = [];
    isConnecting = false;
  }
};

const socketService = {
  initSocket,
  joinBoardRoom,
  leaveBoardRoom,
  disconnectSocket,
  getSocket: () => socket,
  configureSocketService
};

export default socketService;