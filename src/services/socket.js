import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (userId) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(import.meta.env.VITE_API_URL ?? '/', {
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    if (userId) {
      socket.emit('join:user', userId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinProject = (projectId) => {
  if (socket) {
    socket.emit('join:project', projectId);
  }
};

export const onGenerationStatus = (callback) => {
  if (socket) {
    socket.on('generation:status', callback);
  }
};

export const onGenerationComplete = (callback) => {
  if (socket) {
    socket.on('generation:complete', callback);
  }
};

export const onGenerationError = (callback) => {
  if (socket) {
    socket.on('generation:error', callback);
  }
};

export const removeGenerationListeners = () => {
  if (socket) {
    socket.off('generation:status');
    socket.off('generation:complete');
    socket.off('generation:error');
  }
};
