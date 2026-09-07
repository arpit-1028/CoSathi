const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const {
  setSocketIO,
  registerWorkerSocket,
  unregisterWorkerSocket,
  handleWorkerAcceptOffer,
  handleWorkerDeclineOffer,
} = require('../services/socketDispatchService');

let ioInstance = null;

const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Provide io instance to dispatch service
  setSocketIO(ioInstance);

  // Authenticate socket connections using JWT
  ioInstance.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        // Allow unauthenticated guest connections for public telemetry, but mark unauthenticated
        socket.user = null;
        return next();
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'cosathi_sih2026_super_secure_jwt_secret_key_998877'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User no longer exists'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn('[Socket.io] Auth handshake warning:', err.message);
      // Fallback: connect without authenticated role
      socket.user = null;
      next();
    }
  });

  ioInstance.on('connection', (socket) => {
    const user = socket.user;
    console.log(`[Socket.io] Client connected: ${socket.id} (User: ${user ? `${user.name} [${user.role}]` : 'Guest'})`);

    // Auto-join user to their designated role room
    if (user) {
      const uId = user._id.toString();

      if (user.role === 'customer') {
        const customerRoom = `customer:${uId}`;
        socket.join(customerRoom);
        console.log(`[Socket.io] Joined room ${customerRoom}`);
      }

      if (user.role === 'worker') {
        const workerRoom = `worker:${uId}`;
        socket.join(workerRoom);
        registerWorkerSocket(uId, socket.id);
        console.log(`[Socket.io] Joined room ${workerRoom} (Worker Online)`);
      }

      if (user.role === 'cooperative_admin') {
        socket.join('cooperative:admin');
      }
    }

    // Explicit room subscription for specific booking lifecycle
    socket.on('join:booking', ({ bookingId }) => {
      if (bookingId) {
        const roomName = `booking:${bookingId}`;
        socket.join(roomName);
        console.log(`[Socket.io] Socket ${socket.id} joined ${roomName}`);
        socket.emit('joined:booking', { bookingId, status: 'subscribed' });
      }
    });

    socket.on('leave:booking', ({ bookingId }) => {
      if (bookingId) {
        socket.leave(`booking:${bookingId}`);
      }
    });

    // Real-time worker acceptance via socket
    socket.on('worker:accept_offer', async ({ bookingId }, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'worker') {
          return callback && callback({ success: false, message: 'Worker authentication required' });
        }
        const result = await handleWorkerAcceptOffer(bookingId, socket.user);
        if (callback) callback(result);
      } catch (err) {
        console.error('[Socket.io] Error in worker:accept_offer:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Real-time worker decline via socket
    socket.on('worker:decline_offer', async ({ bookingId, reason }, callback) => {
      try {
        if (!socket.user || socket.user.role !== 'worker') {
          return callback && callback({ success: false, message: 'Worker authentication required' });
        }
        const result = await handleWorkerDeclineOffer(bookingId, socket.user, reason);
        if (callback) callback(result);
      } catch (err) {
        console.error('[Socket.io] Error in worker:decline_offer:', err.message);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Real-time worker location broadcast via socket
    socket.on('worker:update_location', async ({ coordinates, activeBookingId, speed, heading }) => {
      try {
        if (!socket.user || socket.user.role !== 'worker') return;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const { WorkerLocation, Booking } = require('../models');
        const { sanitizeLocationForCustomer, getDistanceAndDuration } = require('../services/geoService');

        await WorkerLocation.findOneAndUpdate(
          { worker: socket.user._id },
          {
            $set: {
              location: { type: 'Point', coordinates },
              speed: speed || 0,
              heading: heading || 0,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );

        if (activeBookingId) {
          const booking = await Booking.findById(activeBookingId);
          if (booking && ['ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS'].includes(booking.status)) {
            const dest = booking.location?.coordinates || [77.2433, 28.5700];
            const distInfo = await getDistanceAndDuration(coordinates, dest);

            const payload = {
              bookingId: booking._id,
              workerLocation: sanitizeLocationForCustomer(coordinates),
              distanceKm: distInfo.distanceKm,
              durationMinutes: distInfo.durationMinutes,
              status: booking.status,
              timestamp: Date.now(),
            };

            ioInstance.to(`booking:${booking._id}`).emit('booking:worker_location', payload);
            const custId = (booking.customerId || booking.customer)?.toString();
            if (custId) {
              ioInstance.to(`customer:${custId}`).emit('booking:worker_location', payload);
            }
          }
        }
      } catch (locErr) {
        console.warn('[Socket.io] Error in worker:update_location:', locErr.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      if (user && user.role === 'worker') {
        unregisterWorkerSocket(user._id.toString(), socket.id);
      }
    });
  });

  return ioInstance;
};

const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io not initialized!');
  }
  return ioInstance;
};

module.exports = { initSocket, getIO };
