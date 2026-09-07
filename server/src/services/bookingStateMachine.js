const { Booking, WorkerAvailability } = require('../models');

const BOOKING_STATES = {
  DRAFT: 'DRAFT',
  MATCHING: 'MATCHING',
  OFFERED: 'OFFERED',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  ON_THE_WAY: 'ON_THE_WAY',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  WORK_SUBMITTED: 'WORK_SUBMITTED',
  BILL_GENERATED: 'BILL_GENERATED',
  CUSTOMER_APPROVAL: 'CUSTOMER_APPROVAL',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  UNFULFILLED: 'UNFULFILLED',
  DISPUTED: 'DISPUTED',
};

const ALLOWED_TRANSITIONS = {
  [BOOKING_STATES.DRAFT]: [
    BOOKING_STATES.MATCHING,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.MATCHING]: [
    BOOKING_STATES.OFFERED,
    BOOKING_STATES.ASSIGNED,
    BOOKING_STATES.UNFULFILLED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.OFFERED]: [
    BOOKING_STATES.ACCEPTED,
    BOOKING_STATES.MATCHING,
    BOOKING_STATES.UNFULFILLED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.ASSIGNED]: [
    BOOKING_STATES.ACCEPTED,
    BOOKING_STATES.OFFERED,
    BOOKING_STATES.MATCHING,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.ACCEPTED]: [
    BOOKING_STATES.ON_THE_WAY,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.ON_THE_WAY]: [
    BOOKING_STATES.ARRIVED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.ARRIVED]: [
    BOOKING_STATES.IN_PROGRESS,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.IN_PROGRESS]: [
    BOOKING_STATES.WORK_SUBMITTED,
    BOOKING_STATES.DISPUTED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.WORK_SUBMITTED]: [
    BOOKING_STATES.BILL_GENERATED,
    BOOKING_STATES.CUSTOMER_APPROVAL,
    BOOKING_STATES.DISPUTED,
  ],
  [BOOKING_STATES.BILL_GENERATED]: [
    BOOKING_STATES.CUSTOMER_APPROVAL,
    BOOKING_STATES.PAID,
    BOOKING_STATES.DISPUTED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.CUSTOMER_APPROVAL]: [
    BOOKING_STATES.PAID,
    BOOKING_STATES.DISPUTED,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.PAID]: [
    BOOKING_STATES.COMPLETED,
    BOOKING_STATES.DISPUTED,
  ],
  [BOOKING_STATES.COMPLETED]: [
    BOOKING_STATES.DISPUTED,
  ],
  [BOOKING_STATES.CANCELLED]: [],
  [BOOKING_STATES.UNFULFILLED]: [
    BOOKING_STATES.MATCHING,
    BOOKING_STATES.CANCELLED,
  ],
  [BOOKING_STATES.DISPUTED]: [
    BOOKING_STATES.COMPLETED,
    BOOKING_STATES.CANCELLED,
    BOOKING_STATES.PAID,
  ],
};

// Active in-progress states where worker or customer has committed active time
const ACTIVE_EXECUTION_STATES = [
  BOOKING_STATES.ACCEPTED,
  BOOKING_STATES.ON_THE_WAY,
  BOOKING_STATES.ARRIVED,
  BOOKING_STATES.IN_PROGRESS,
];

// In-flight active states for customer scheduling
const ACTIVE_BOOKING_STATES = [
  BOOKING_STATES.MATCHING,
  BOOKING_STATES.OFFERED,
  BOOKING_STATES.ASSIGNED,
  BOOKING_STATES.ACCEPTED,
  BOOKING_STATES.ON_THE_WAY,
  BOOKING_STATES.ARRIVED,
  BOOKING_STATES.IN_PROGRESS,
  BOOKING_STATES.WORK_SUBMITTED,
  BOOKING_STATES.BILL_GENERATED,
  BOOKING_STATES.CUSTOMER_APPROVAL,
];

/**
 * Validate whether a role is authorized to invoke a transition
 */
const isRoleAuthorizedForTransition = (currentStatus, targetStatus, role) => {
  if (role === 'cooperative_admin' || role === 'system') return true;

  if (role === 'customer') {
    if (targetStatus === BOOKING_STATES.CANCELLED) {
      // Customer can cancel in early or pre-execution states
      return [
        BOOKING_STATES.DRAFT,
        BOOKING_STATES.MATCHING,
        BOOKING_STATES.OFFERED,
        BOOKING_STATES.ASSIGNED,
        BOOKING_STATES.ACCEPTED,
        BOOKING_STATES.UNFULFILLED,
      ].includes(currentStatus);
    }
    if (currentStatus === BOOKING_STATES.DRAFT && targetStatus === BOOKING_STATES.MATCHING) {
      return true;
    }
    if (
      currentStatus === BOOKING_STATES.MATCHING &&
      (targetStatus === BOOKING_STATES.OFFERED || targetStatus === BOOKING_STATES.UNFULFILLED)
    ) {
      return true;
    }
    if (
      (currentStatus === BOOKING_STATES.CUSTOMER_APPROVAL || currentStatus === BOOKING_STATES.BILL_GENERATED) &&
      targetStatus === BOOKING_STATES.PAID
    ) {
      return true;
    }
    if (targetStatus === BOOKING_STATES.COMPLETED && currentStatus === BOOKING_STATES.PAID) {
      return true;
    }
    if (targetStatus === BOOKING_STATES.DISPUTED) {
      return [
        BOOKING_STATES.IN_PROGRESS,
        BOOKING_STATES.WORK_SUBMITTED,
        BOOKING_STATES.BILL_GENERATED,
        BOOKING_STATES.CUSTOMER_APPROVAL,
        BOOKING_STATES.PAID,
        BOOKING_STATES.COMPLETED,
      ].includes(currentStatus);
    }
    return false;
  }

  if (role === 'worker') {
    if (
      (currentStatus === BOOKING_STATES.OFFERED || currentStatus === BOOKING_STATES.ASSIGNED) &&
      targetStatus === BOOKING_STATES.ACCEPTED
    ) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.OFFERED && targetStatus === BOOKING_STATES.MATCHING) {
      // Worker declined offer
      return true;
    }
    if (currentStatus === BOOKING_STATES.ACCEPTED && targetStatus === BOOKING_STATES.ON_THE_WAY) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.ON_THE_WAY && targetStatus === BOOKING_STATES.ARRIVED) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.ARRIVED && targetStatus === BOOKING_STATES.IN_PROGRESS) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.IN_PROGRESS && targetStatus === BOOKING_STATES.WORK_SUBMITTED) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.WORK_SUBMITTED && targetStatus === BOOKING_STATES.BILL_GENERATED) {
      return true;
    }
    if (currentStatus === BOOKING_STATES.BILL_GENERATED && targetStatus === BOOKING_STATES.CUSTOMER_APPROVAL) {
      return true;
    }
    if (targetStatus === BOOKING_STATES.DISPUTED) {
      return [BOOKING_STATES.IN_PROGRESS, BOOKING_STATES.WORK_SUBMITTED].includes(currentStatus);
    }
    return false;
  }

  return false;
};

/**
 * Normalize status strings to uppercase state enum
 */
const normalizeStatus = (status) => {
  if (!status) return null;
  const s = status.toString().trim().toUpperCase();
  // Map legacy lowercase
  const legacyMap = {
    CREATED: BOOKING_STATES.DRAFT,
    EN_ROUTE: BOOKING_STATES.ON_THE_WAY,
    WORK_REPORTED: BOOKING_STATES.WORK_SUBMITTED,
    PRICED: BOOKING_STATES.BILL_GENERATED,
    PAYMENT_PENDING: BOOKING_STATES.CUSTOMER_APPROVAL,
  };
  return legacyMap[s] || s;
};

/**
 * Verify user's read/write ownership access to this specific booking
 */
const verifyBookingAccess = (booking, user) => {
  if (!user) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }

  // Cooperative Admins have platform-wide oversight
  if (user.role === 'cooperative_admin') {
    return true;
  }

  const userIdStr = user._id.toString();
  const customerIdStr = (booking.customerId || booking.customer)?._id?.toString() || (booking.customerId || booking.customer)?.toString();

  if (user.role === 'customer') {
    if (customerIdStr !== userIdStr) {
      const error = new Error('Unauthorized: You can only view and manage your own customer bookings.');
      error.statusCode = 403;
      throw error;
    }
    return true;
  }

  if (user.role === 'worker') {
    const workerIdStr = (booking.workerId || booking.assignedWorker)?._id?.toString() || (booking.workerId || booking.assignedWorker)?.toString();
    const candidateIds = (booking.matchingMetadata?.candidateWorkerIds || []).map((id) => id.toString());

    const isAssigned = workerIdStr === userIdStr;
    const isCandidate = candidateIds.includes(userIdStr);

    if (!isAssigned && !isCandidate) {
      const error = new Error('Unauthorized: You do not have access to this service booking.');
      error.statusCode = 403;
      throw error;
    }
    return true;
  }

  const error = new Error('Unauthorized role');
  error.statusCode = 403;
  throw error;
};

/**
 * Validate whether a transition is allowed from current status to target status
 */
const validateTransition = (booking, targetStatusInput, user) => {
  const current = normalizeStatus(booking.status);
  const target = normalizeStatus(targetStatusInput);

  if (!BOOKING_STATES[target]) {
    return {
      valid: false,
      error: `Invalid target status '${targetStatusInput}'. Must be one of: ${Object.keys(BOOKING_STATES).join(', ')}`,
      statusCode: 400,
    };
  }

  if (current === target) {
    return {
      valid: false,
      error: `Booking is already in state '${current}'.`,
      statusCode: 400,
    };
  }

  const allowedNext = ALLOWED_TRANSITIONS[current] || [];
  if (!allowedNext.includes(target)) {
    return {
      valid: false,
      error: `Illegal state transition from '${current}' to '${target}'. Allowed next transitions: [${allowedNext.join(', ')}]`,
      statusCode: 400,
    };
  }

  if (user && !isRoleAuthorizedForTransition(current, target, user.role)) {
    return {
      valid: false,
      error: `Role '${user.role}' is not authorized to transition booking from '${current}' to '${target}'.`,
      statusCode: 403,
    };
  }

  return { valid: true, current, target };
};

/**
 * Check if customer has an existing overlapping booking
 */
const checkCustomerDoubleBooking = async (customerId, scheduledStart, scheduledEnd, excludeBookingId = null) => {
  let start = new Date(scheduledStart);
  if (isNaN(start.getTime())) {
    start = new Date();
  }
  let end = scheduledEnd ? new Date(scheduledEnd) : null;
  if (!end || isNaN(end.getTime())) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  const query = {
    $or: [{ customerId }, { customer: customerId }],
    status: { $in: ACTIVE_BOOKING_STATES },
    scheduledStart: { $lt: end },
    scheduledEnd: { $gt: start },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return conflict;
};

/**
 * Check if worker already has an active overlapping commitment
 */
const checkWorkerDoubleBooking = async (workerId, scheduledStart, scheduledEnd, excludeBookingId = null) => {
  let start = new Date(scheduledStart);
  if (isNaN(start.getTime())) {
    start = new Date();
  }
  let end = scheduledEnd ? new Date(scheduledEnd) : null;
  if (!end || isNaN(end.getTime())) {
    end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }

  const query = {
    $or: [{ workerId }, { assignedWorker: workerId }],
    status: { $in: ACTIVE_EXECUTION_STATES },
    scheduledStart: { $lt: end },
    scheduledEnd: { $gt: start },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflict = await Booking.findOne(query);
  return conflict;
};

/**
 * Apply state transition with audit log timeline
 */
const transitionBooking = async (bookingInput, targetStatusInput, user, options = {}) => {
  let booking = bookingInput;
  if (typeof bookingInput === 'string' || (bookingInput && bookingInput._bsontype === 'ObjectID') || (bookingInput && bookingInput.constructor && bookingInput.constructor.name === 'ObjectId')) {
    booking = await Booking.findById(bookingInput);
    if (!booking) {
      const error = new Error('Booking not found for transition');
      error.statusCode = 404;
      throw error;
    }
  }

  const validation = validateTransition(booking, targetStatusInput, user);
  if (!validation.valid) {
    const error = new Error(validation.error);
    error.statusCode = validation.statusCode || 400;
    throw error;
  }

  const target = validation.target;
  const previousStatus = booking.status;
  booking.status = target;

  // Set side effects based on target status
  if (options.workerId) {
    booking.workerId = options.workerId;
    booking.assignedWorker = options.workerId;
    if (!booking.matchingMetadata) booking.matchingMetadata = {};
    if (!booking.matchingMetadata.candidateWorkerIds) booking.matchingMetadata.candidateWorkerIds = [];
    const idStr = options.workerId.toString();
    if (!booking.matchingMetadata.candidateWorkerIds.some((x) => x.toString() === idStr)) {
      booking.matchingMetadata.candidateWorkerIds.push(options.workerId);
    }
  }

  if (target === BOOKING_STATES.CANCELLED) {
    booking.cancellationReason = options.reason || 'Cancelled by user request';
    booking.cancelledBy = user?._id;
  }

  if (target === BOOKING_STATES.DISPUTED) {
    booking.disputeReason = options.reason || 'Dispute lodged for cooperative committee review';
  }

  if (target === BOOKING_STATES.BILL_GENERATED && options.billId) {
    booking.billId = options.billId;
  }

  if (options.finalPrice !== undefined) {
    booking.finalPrice = options.finalPrice;
  }

  // Push to timeline audit trail
  booking.timeline.push({
    status: target,
    changedBy: user?._id,
    timestamp: new Date(),
    note: options.note || `Status transitioned from ${previousStatus} to ${target}`,
  });

  await booking.save();
  return booking;
};

module.exports = {
  BOOKING_STATES,
  ALLOWED_TRANSITIONS,
  ACTIVE_EXECUTION_STATES,
  ACTIVE_BOOKING_STATES,
  normalizeStatus,
  verifyBookingAccess,
  validateTransition,
  checkCustomerDoubleBooking,
  checkWorkerDoubleBooking,
  transitionBooking,
};
