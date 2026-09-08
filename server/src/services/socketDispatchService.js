const {
  Booking,
  User,
  WorkerProfile,
  WorkerPerformance,
  WorkerAvailability,
} = require('../models');

const {
  BOOKING_STATES,
  transitionBooking,
  checkWorkerDoubleBooking,
} = require('./bookingStateMachine');

const { findBestWorkerMatch } = require('./fairMatchingEngine');

// Active Offer Timers Map: bookingId -> NodeJS.Timeout
const activeOfferTimers = new Map();

// Map of Online Worker Sockets: workerIdString -> Set<socketId>
const onlineWorkerSockets = new Map();

let socketIO = null;

const setSocketIO = (io) => {
  socketIO = io;
};

const getSocketIO = () => {
  if (!socketIO) {
    // Attempt fallback from socket module
    try {
      const { getIO } = require('../socket');
      socketIO = getIO();
    } catch (e) {
      // Return dummy interface if not initialized
    }
  }
  return socketIO;
};

/**
 * Register worker socket as online
 */
const registerWorkerSocket = (workerId, socketId) => {
  const idStr = workerId.toString();
  if (!onlineWorkerSockets.has(idStr)) {
    onlineWorkerSockets.set(idStr, new Set());
  }
  onlineWorkerSockets.get(idStr).add(socketId);
};

/**
 * Unregister worker socket on disconnect
 */
const unregisterWorkerSocket = (workerId, socketId) => {
  const idStr = workerId.toString();
  if (onlineWorkerSockets.has(idStr)) {
    const sockets = onlineWorkerSockets.get(idStr);
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineWorkerSockets.delete(idStr);
    }
  }
};

/**
 * Check if a worker has an active socket connection
 */
const isWorkerOnline = (workerId) => {
  const idStr = workerId.toString();
  return onlineWorkerSockets.has(idStr) && onlineWorkerSockets.get(idStr).size > 0;
};

/**
 * Core Real-Time Dispatch Engine:
 * Finds the fairest worker, emits `booking:offer` with 60s countdown,
 * and automatically retries next candidates on timeout or decline.
 */
const dispatchBookingOffer = async (bookingId, options = {}) => {
  const io = getSocketIO();
  const timeoutDurationSec = options.timeoutSeconds || 60;

  // Clear existing timer if any
  const bIdStr = bookingId.toString();
  if (activeOfferTimers.has(bIdStr)) {
    clearTimeout(activeOfferTimers.get(bIdStr));
    activeOfferTimers.delete(bIdStr);
  }

  const booking = await Booking.findById(bookingId).populate('category').populate('customer');
  if (!booking) {
    console.error(`[Dispatch] Booking ${bookingId} not found`);
    return { success: false, message: 'Booking not found' };
  }

  // Ensure booking is still in a dispatchable state
  if (booking.status !== BOOKING_STATES.MATCHING && booking.status !== BOOKING_STATES.DRAFT) {
    return {
      success: false,
      message: `Booking is in state ${booking.status}, skipping dispatch.`,
    };
  }

  // Notify customer that matching is underway
  const customerIdStr = (booking.customerId || booking.customer)?._id?.toString() || (booking.customerId || booking.customer)?.toString();
  if (io && customerIdStr) {
    io.to(`customer:${customerIdStr}`).emit('booking:matching', {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      status: BOOKING_STATES.MATCHING,
      message: 'Searching for the best verified cooperative worker in your area...',
    });
    io.to(`booking:${bIdStr}`).emit('booking:status_updated', {
      bookingId: booking._id,
      status: BOOKING_STATES.MATCHING,
    });
  }

  // Run Fair Matching Engine
  const matchResult = await findBestWorkerMatch(booking, options);

  if (!matchResult.success || !matchResult.matchedWorker) {
    console.log(`[Dispatch] No available worker found for ${booking.bookingNumber}`);
    booking.matchingMetadata.attempts = (booking.matchingMetadata.attempts || 0) + 1;

    if (booking.matchingMetadata.attempts >= 4) {
      booking.status = BOOKING_STATES.UNFULFILLED;
      booking.timeline.push({
        status: BOOKING_STATES.UNFULFILLED,
        timestamp: new Date(),
        note: 'No available certified workers responded after repeated attempts.',
      });
      await booking.save();

      if (io && customerIdStr) {
        io.to(`customer:${customerIdStr}`).emit('booking:unfulfilled', {
          bookingId: booking._id,
          bookingNumber: booking.bookingNumber,
          message: 'All certified workers in your area are currently busy. You may reschedule or try again shortly.',
        });
      }
    } else {
      await booking.save();
    }

    return {
      success: false,
      message: matchResult.message || 'No available worker found.',
      attempts: booking.matchingMetadata.attempts,
    };
  }

  const candidate = matchResult.matchedWorker;
  const workerIdStr = candidate.workerId.toString();

  // Only skip offline workers if there ARE other online workers to route to.
  // If NOBODY is online (common in demo/dev), still assign to the best candidate
  // so they can see it via polling on the worker dashboard.
  const someoneElseIsOnline = [...onlineWorkerSockets.keys()].some((id) => id !== workerIdStr);
  const shouldSkipOffline = options.skipOffline !== false && someoneElseIsOnline && !isWorkerOnline(candidate.workerId);
  if (shouldSkipOffline) {
    console.log(`[Dispatch] Worker ${candidate.workerName} (${workerIdStr}) is offline, routing to next online worker...`);
    if (!booking.matchingMetadata.rejectedWorkerIds) {
      booking.matchingMetadata.rejectedWorkerIds = [];
    }
    booking.matchingMetadata.rejectedWorkerIds.push(candidate.workerId);
    booking.markModified('matchingMetadata');
    await booking.save();
    return dispatchBookingOffer(bookingId, {
      ...options,
      excludedWorkerIds: [...(options.excludedWorkerIds || []), workerIdStr],
    });
  }

  // Set booking state to OFFERED
  booking.status = BOOKING_STATES.OFFERED;
  booking.workerId = candidate.workerId;
  booking.assignedWorker = candidate.workerId;
  booking.matchingMetadata.attempts = (booking.matchingMetadata.attempts || 0) + 1;
  booking.matchingMetadata.dispatchedAt = new Date();
  booking.matchingMetadata.timeoutSeconds = timeoutDurationSec;
  booking.matchingMetadata.scoreBreakdown = candidate.scores;
  booking.matchingMetadata.explanation = candidate.explanations;
  if (!booking.matchingMetadata.candidateWorkerIds) {
    booking.matchingMetadata.candidateWorkerIds = [];
  }
  if (!booking.matchingMetadata.candidateWorkerIds.map((x) => x.toString()).includes(workerIdStr)) {
    booking.matchingMetadata.candidateWorkerIds.push(candidate.workerId);
  }

  booking.timeline.push({
    status: BOOKING_STATES.OFFERED,
    timestamp: new Date(),
    note: `Dispatched offer to ${candidate.workerName} (Score: ${candidate.scores.finalScore}/100, ${timeoutDurationSec}s timer).`,
  });

  await booking.save();

  const offerPayload = {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerName: booking.customer?.name || 'Customer',
    category: booking.category?.name?.en || 'Home Service',
    serviceTitle: booking.tasks?.[0]?.title || 'Service Requirement',
    rawText: booking.voiceTranscript || booking.requirementInput?.rawText || 'Customer requirement',
    address: booking.address?.addressLine || 'New Delhi',
    distance: `${candidate.distanceKm} km`,
    floorPayout: Math.round((booking.initialEstimate || 199) * 0.95),
    initialEstimate: booking.initialEstimate || 199,
    timeoutSeconds: timeoutDurationSec,
    expiresAt: Date.now() + timeoutDurationSec * 1000,
  };

  console.log(`[Dispatch] Emitting booking:offer to worker:${workerIdStr} for ${booking.bookingNumber}`);

  // Emit offer to worker's private room
  if (io) {
    io.to(`worker:${workerIdStr}`).emit('booking:offer', offerPayload);
    // Broadcast status to booking room and customer room
    io.to(`booking:${bIdStr}`).emit('booking:status_updated', {
      bookingId: booking._id,
      status: BOOKING_STATES.OFFERED,
      workerName: candidate.workerName,
    });
    if (customerIdStr) {
      io.to(`customer:${customerIdStr}`).emit('booking:status_updated', {
        bookingId: booking._id,
        status: BOOKING_STATES.OFFERED,
        message: 'Offer sent to certified worker, waiting for acceptance...',
      });
    }
  }

  // -------------------------------------------------------------
  // Set Server-Side 60-Second Countdown Timer
  // -------------------------------------------------------------
  const timer = setTimeout(async () => {
    try {
      console.log(`[Dispatch] Timeout expired (${timeoutDurationSec}s) for worker ${candidate.workerName} on booking ${booking.bookingNumber}`);

      const currentBooking = await Booking.findById(bookingId);
      if (!currentBooking || currentBooking.status !== BOOKING_STATES.OFFERED) {
        return; // Job was accepted, cancelled, or handled
      }

      // Record unresponsive worker in rejected list so next candidate is chosen
      if (!currentBooking.matchingMetadata.rejectedWorkerIds) {
        currentBooking.matchingMetadata.rejectedWorkerIds = [];
      }
      currentBooking.matchingMetadata.rejectedWorkerIds.push(candidate.workerId);
      currentBooking.markModified('matchingMetadata');

      // Increment worker's declined counter for anti-gaming tracking
      await WorkerPerformance.findOneAndUpdate(
        { worker: candidate.workerId },
        { $inc: { declinedOffersCount: 1, consecutiveDeclines: 1 } }
      );

      // Notify worker of timeout
      if (io) {
        io.to(`worker:${workerIdStr}`).emit('booking:offer_timeout', {
          bookingId: currentBooking._id,
          bookingNumber: currentBooking.bookingNumber,
          message: 'Acceptance window expired (60s). Offer routed to another cooperative member.',
        });
      }

      currentBooking.status = BOOKING_STATES.MATCHING;
      currentBooking.timeline.push({
        status: BOOKING_STATES.MATCHING,
        timestamp: new Date(),
        note: `Worker ${candidate.workerName} timed out after ${timeoutDurationSec}s. Automatically re-routing to next candidate.`,
      });
      await currentBooking.save();

      // Automatically dispatch to next candidate worker!
      dispatchBookingOffer(bookingId, {
        ...options,
        excludedWorkerIds: (currentBooking.matchingMetadata.rejectedWorkerIds || []).map((id) => id.toString()),
      });
    } catch (err) {
      console.error('[Dispatch] Error in offer timeout handler:', err);
    }
  }, timeoutDurationSec * 1000);

  activeOfferTimers.set(bIdStr, timer);

  return {
    success: true,
    matchedWorker: candidate,
    booking,
  };
};

/**
 * Handle Worker Acceptance
 */
const handleWorkerAcceptOffer = async (bookingId, workerUser) => {
  const io = getSocketIO();
  const bIdStr = bookingId.toString();

  // Cancel timeout timer immediately
  if (activeOfferTimers.has(bIdStr)) {
    clearTimeout(activeOfferTimers.get(bIdStr));
    activeOfferTimers.delete(bIdStr);
  }

  const booking = await Booking.findById(bookingId).populate('category').populate('customer');
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Prevent double booking
  const conflict = await checkWorkerDoubleBooking(
    workerUser._id,
    booking.scheduledStart,
    booking.scheduledEnd,
    booking._id
  );
  if (conflict) {
    const conflictAgeMs = Date.now() - new Date(conflict.createdAt).getTime();
    if (conflictAgeMs > 2 * 60 * 60 * 1000) {
      conflict.status = BOOKING_STATES.COMPLETED;
      await conflict.save();
    } else {
      const error = new Error(`Cannot accept job: You are already actively engaged on booking ${conflict.bookingNumber}.`);
      error.statusCode = 409;
      throw error;
    }
  }

  const workerProfile = await WorkerProfile.findOne({ user: workerUser._id });
  const workerPerf = await WorkerPerformance.findOne({ worker: workerUser._id });

  // Transition state to ACCEPTED
  booking.status = BOOKING_STATES.ACCEPTED;
  booking.workerId = workerUser._id;
  booking.assignedWorker = workerUser._id;

  booking.timeline.push({
    status: BOOKING_STATES.ACCEPTED,
    changedBy: workerUser._id,
    timestamp: new Date(),
    note: `Worker ${workerUser.name} accepted the booking offer.`,
  });

  await booking.save();

  // Reset consecutive declines on successful accept
  if (workerPerf) {
    workerPerf.consecutiveDeclines = 0;
    await workerPerf.save();
  }

  const workerInfo = {
    id: workerUser._id,
    name: workerUser.name,
    phone: workerUser.phone,
    avatarUrl: workerUser.avatarUrl,
    memberId: workerProfile?.memberId || 'COS-DL-2026-101',
    trade: workerProfile?.primarySkill || 'Certified Cooperative Member',
    rating: workerPerf?.averageRating || 4.8,
    jobsCompleted: workerPerf?.lifetimeJobsCompleted || 100,
    aadhaarMasked: workerProfile?.aadhaarVerification?.maskedNumber || 'XXXX-XXXX-1234',
    etaMinutes: '15 mins',
  };

  const customerIdStr = (booking.customerId || booking.customer)?._id?.toString() || (booking.customerId || booking.customer)?.toString();

  // Real-time broadcast to Customer and Booking Rooms
  if (io) {
    const payload = {
      bookingId: booking._id,
      bookingNumber: booking.bookingNumber,
      status: BOOKING_STATES.ACCEPTED,
      worker: workerInfo,
      message: `${workerUser.name} accepted your booking and is preparing for dispatch.`,
    };

    console.log(`[Dispatch] Emitting booking:accepted to customer:${customerIdStr}`);
    if (customerIdStr) {
      io.to(`customer:${customerIdStr}`).emit('booking:accepted', payload);
      io.to(`customer:${customerIdStr}`).emit('booking:assigned', payload);
    }
    io.to(`booking:${bIdStr}`).emit('booking:accepted', payload);
    io.to(`booking:${bIdStr}`).emit('booking:status_updated', payload);
  }

  return { success: true, booking, worker: workerInfo };
};

/**
 * Handle Worker Decline
 */
const handleWorkerDeclineOffer = async (bookingId, workerUser, reason = 'Worker declined') => {
  const io = getSocketIO();
  const bIdStr = bookingId.toString();

  // Cancel timeout timer
  if (activeOfferTimers.has(bIdStr)) {
    clearTimeout(activeOfferTimers.get(bIdStr));
    activeOfferTimers.delete(bIdStr);
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  // Record decline
  if (!booking.matchingMetadata.rejectedWorkerIds) {
    booking.matchingMetadata.rejectedWorkerIds = [];
  }
  booking.matchingMetadata.rejectedWorkerIds.push(workerUser._id);
  booking.markModified('matchingMetadata');

  booking.status = BOOKING_STATES.MATCHING;
  booking.timeline.push({
    status: BOOKING_STATES.MATCHING,
    changedBy: workerUser._id,
    timestamp: new Date(),
    note: `Worker ${workerUser.name} declined offer: ${reason}. Auto-routing to next candidate.`,
  });

  await booking.save();

  // Track decline metrics
  await WorkerPerformance.findOneAndUpdate(
    { worker: workerUser._id },
    { $inc: { declinedOffersCount: 1, consecutiveDeclines: 1 } }
  );

  // Acknowledge decline to worker
  if (io) {
    io.to(`worker:${workerUser._id}`).emit('booking:declined', {
      bookingId: booking._id,
      message: 'Offer declined. Thank you for notifying the cooperative.',
    });
  }

  // Automatically dispatch to next candidate immediately!
  console.log(`[Dispatch] Auto-routing booking ${booking.bookingNumber} to next candidate after decline...`);
  const rejectedList = (booking.matchingMetadata.rejectedWorkerIds || []).map((id) => id.toString());
  try {
    await dispatchBookingOffer(bookingId, { excludedWorkerIds: rejectedList });
  } catch (err) {
    console.warn('[Dispatch] Error auto-routing to next candidate:', err.message);
  }

  return { success: true, booking };
};

/**
 * Broadcast generic booking status transition to rooms
 */
const broadcastBookingStatus = (booking, eventName, customPayload = {}) => {
  const io = getSocketIO();
  if (!io || !booking) return;

  const bIdStr = booking._id.toString();
  const customerIdStr = (booking.customerId || booking.customer)?._id?.toString() || (booking.customerId || booking.customer)?.toString();
  const workerIdStr = (booking.workerId || booking.assignedWorker)?._id?.toString() || (booking.workerId || booking.assignedWorker)?.toString();

  const payload = {
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    timestamp: new Date(),
    ...customPayload,
  };

  // Emit specific event
  if (eventName) {
    if (customerIdStr) io.to(`customer:${customerIdStr}`).emit(eventName, payload);
    if (workerIdStr) io.to(`worker:${workerIdStr}`).emit(eventName, payload);
    io.to(`booking:${bIdStr}`).emit(eventName, payload);
  }

  // Always emit generic status_updated
  if (customerIdStr) io.to(`customer:${customerIdStr}`).emit('booking:status_updated', payload);
  if (workerIdStr) io.to(`worker:${workerIdStr}`).emit('booking:status_updated', payload);
  io.to(`booking:${bIdStr}`).emit('booking:status_updated', payload);
};

/**
 * Clear all pending countdown timers
 */
const clearAllOfferTimers = () => {
  for (const [key, timer] of activeOfferTimers.entries()) {
    clearTimeout(timer);
  }
  activeOfferTimers.clear();
};

module.exports = {
  setSocketIO,
  getSocketIO,
  registerWorkerSocket,
  unregisterWorkerSocket,
  isWorkerOnline,
  dispatchBookingOffer,
  handleWorkerAcceptOffer,
  handleWorkerDeclineOffer,
  broadcastBookingStatus,
  clearAllOfferTimers,
};
