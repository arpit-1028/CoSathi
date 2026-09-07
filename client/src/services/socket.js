import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');

let socket = null;

/**
 * Initialize or retrieve the Socket.io client instance
 * @param {string} token - Optional JWT token for authenticated rooms
 */
export const getSocket = (token = null) => {
  const authToken = token || localStorage.getItem('cosathi_token');

  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected to CoSathi Real-Time Server (${socket.id})`);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Disconnected: ${reason}`);
    });
  }

  return socket;
};

/**
 * Re-authenticate socket with a new token (e.g. on login)
 */
export const updateSocketAuth = (token) => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  return getSocket(token);
};

/**
 * Disconnect socket cleanly (e.g. on logout)
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Join a specific booking room to receive real-time updates
 */
export const joinBookingRoom = (bookingId) => {
  const s = getSocket();
  if (s && bookingId) {
    s.emit('join:booking', { bookingId });
  }
};

/**
 * Leave a specific booking room
 */
export const leaveBookingRoom = (bookingId) => {
  const s = getSocket();
  if (s && bookingId) {
    s.emit('leave:booking', { bookingId });
  }
};

export default {
  getSocket,
  updateSocketAuth,
  disconnectSocket,
  joinBookingRoom,
  leaveBookingRoom,
};
