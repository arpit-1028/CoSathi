const {
  Booking,
  User,
  ServiceCategory,
  Cooperative,
  Bill,
  Dispute,
} = require('../models');

const {
  BOOKING_STATES,
  verifyBookingAccess,
  validateTransition,
  checkCustomerDoubleBooking,
  checkWorkerDoubleBooking,
  transitionBooking,
  normalizeStatus,
} = require('../services/bookingStateMachine');

const { findBestWorkerMatch } = require('../services/fairMatchingEngine');
const {
  dispatchBookingOffer,
  handleWorkerAcceptOffer,
  handleWorkerDeclineOffer,
  broadcastBookingStatus,
} = require('../services/socketDispatchService');
const {
  calculateInitialEstimate,
  generateFinalBill,
} = require('../services/pricingService');
const { processPaymentSplitAndLedger } = require('../services/financeService');
const { createDispute } = require('../services/disputeService');

/**
 * Generate human-readable booking sequence number
 */
const generateBookingNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CS-${dateStr}-${randomSuffix}`;
};

/**
 * POST /api/bookings
 * Create a new customer booking with double-booking check & state initialization
 */
const createBooking = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const {
      serviceCategory,
      tasks = [],
      voiceTranscript = '',
      initialEstimate,
      scheduledStart = new Date(),
      scheduledEnd,
      address,
      location,
      status: requestedStatus = 'MATCHING',
    } = req.body;

    if (!serviceCategory) {
      return res.status(400).json({ success: false, message: 'serviceCategory is required.' });
    }

    if (!address || !address.addressLine) {
      return res.status(400).json({ success: false, message: 'addressLine is required.' });
    }

    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid GeoJSON location.coordinates [longitude, latitude] are required.',
      });
    }

    // Rate Card Authoritative Initial Estimate & Price Tampering Guard
    let authoritativeEstimate = 199;
    if (tasks && tasks.length > 0) {
      const rateCardCalc = await calculateInitialEstimate(tasks);
      authoritativeEstimate = rateCardCalc.baseEstimate;

      const hasKnownRateCardItems = rateCardCalc.items.some((it) => !it.needsReview);
      if (initialEstimate !== undefined && initialEstimate !== null) {
        const clientEstimate = Number(initialEstimate);
        if (hasKnownRateCardItems && (isNaN(clientEstimate) || Math.abs(clientEstimate - authoritativeEstimate) > 5)) {
          return res.status(400).json({
            success: false,
            message: `Frontend price manipulation rejected: Client supplied initialEstimate (₹${clientEstimate}) does not match authoritative cooperative rate card estimate (₹${authoritativeEstimate}).`,
            authoritativeEstimate,
          });
        }
        if (!hasKnownRateCardItems && !isNaN(clientEstimate) && clientEstimate > 0) {
          authoritativeEstimate = clientEstimate;
        }
      }
    } else {
      const estimateNum = Number(initialEstimate);
      if (isNaN(estimateNum) || estimateNum <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Valid positive initialEstimate amount is required.',
        });
      }
      authoritativeEstimate = estimateNum;
    }

    const startDate = scheduledStart
      ? new Date(scheduledStart)
      : new Date(Date.now() + 3600000);
    const endDate = scheduledEnd
      ? new Date(scheduledEnd)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    // 1. Prevent Customer Double-Booking for overlapping slot
    const existingConflict = await checkCustomerDoubleBooking(customerId, startDate, endDate);
    if (existingConflict) {
      const pendingStatuses = [
        BOOKING_STATES.MATCHING,
        BOOKING_STATES.OFFERED,
        BOOKING_STATES.DRAFT,
        BOOKING_STATES.UNFULFILLED,
      ];
      if (pendingStatuses.includes(existingConflict.status)) {
        // Auto-supersede stale pending/unaccepted booking request so customer is never locked out
        try {
          existingConflict.status = BOOKING_STATES.CANCELLED;
          existingConflict.cancellationReason = 'Superseded by new booking request';
          existingConflict.cancelledBy = customerId;
          await existingConflict.save();
        } catch (e) {
          console.warn('Notice: auto-cancelling pending conflict booking:', e.message);
        }
      } else {
        return res.status(409).json({
          success: false,
          message: `Double booking prevented: You already have an active service booking (${existingConflict.bookingNumber}) in progress.`,
          conflictBookingId: existingConflict._id,
          conflictBookingNumber: existingConflict.bookingNumber,
        });
      }
    }

    // 2. Resolve Service Category
    let categoryDoc;
    if (serviceCategory.match(/^[0-9a-fA-F]{24}$/)) {
      categoryDoc = await ServiceCategory.findById(serviceCategory);
    } else {
      categoryDoc = await ServiceCategory.findOne({
        $or: [{ slug: serviceCategory.toLowerCase() }, { 'name.en': new RegExp(serviceCategory, 'i') }],
      });
    }

    if (!categoryDoc) {
      return res.status(404).json({ success: false, message: 'ServiceCategory not found.' });
    }

    // 3. Resolve active cooperative society
    const coop = await Cooperative.findOne({ status: 'active' });

    // 4. Determine initial state (DRAFT or MATCHING)
    const initialStatus = requestedStatus.toUpperCase() === 'DRAFT' ? BOOKING_STATES.DRAFT : BOOKING_STATES.MATCHING;

    // 5. Create Booking document
    const booking = new Booking({
      bookingNumber: generateBookingNumber(),
      customerId,
      customer: customerId,
      serviceCategory: categoryDoc._id,
      category: categoryDoc._id,
      cooperative: coop?._id,
      tasks: tasks.map((t) => ({
        title: t.title || 'General Repair',
        serviceCode: t.serviceCode || 'GEN-001',
        quantity: t.quantity || 1,
        rate: t.rate || authoritativeEstimate,
        estimatedPrice: t.estimatedPrice || (t.rate || authoritativeEstimate) * (t.quantity || 1),
        unit: t.unit || 'service',
      })),
      voiceTranscript,
      requirementInput: {
        rawText: voiceTranscript,
        audioTranscript: voiceTranscript,
        inputType: voiceTranscript ? 'voice' : 'text',
        parsedTasks: tasks.map((t) => ({
          taskCode: t.serviceCode || 'GEN-001',
          title: t.title,
          estimatedUnits: t.quantity || 1,
          estimatedPrice: t.estimatedPrice || authoritativeEstimate,
        })),
      },
      initialEstimate: authoritativeEstimate,
      finalPrice: authoritativeEstimate,
      workerId: null,
      assignedWorker: null,
      scheduledStart: startDate,
      scheduledEnd: endDate,
      address: {
        addressLine: address.addressLine,
        landmark: address.landmark || '',
        city: address.city || 'Delhi',
        pincode: address.pincode || '110024',
        fullAddress: `${address.addressLine}, ${address.city || 'Delhi'} ${address.pincode || '110024'}`,
      },
      location: {
        addressLine: address.addressLine,
        city: address.city || 'Delhi',
        pincode: address.pincode || '110024',
        type: 'Point',
        coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])],
      },
      status: initialStatus,
      matchingMetadata: {
        attempts: 0,
        candidateWorkerIds: [],
        rejectedWorkerIds: [],
        dispatchedAt: initialStatus === BOOKING_STATES.MATCHING ? new Date() : null,
        timeoutSeconds: 60,
      },
      timeline: [
        {
          status: initialStatus,
          changedBy: customerId,
          timestamp: new Date(),
          note: `Booking created in state ${initialStatus}`,
        },
      ],
    });

    await booking.save();

    // Emit booking:created event to customer and booking rooms
    broadcastBookingStatus(booking, 'booking:created', {
      message: 'Booking request created and registered in cooperative pool.',
    });

    // Trigger real-time fair matching and dispatch immediately if in MATCHING state
    if (booking.status === BOOKING_STATES.MATCHING) {
      dispatchBookingOffer(booking._id).catch((err) => {
        console.error('[Dispatch] Error in auto dispatch:', err.message);
      });
    }

    res.status(201).json({
      success: true,
      message: `Booking ${booking.bookingNumber} created successfully in state ${booking.status}.`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/my
 * View customer's bookings
 */
const getMyBookings = async (req, res, next) => {
  try {
    const customerId = req.user._id;
    const bookings = await Booking.find({
      $or: [{ customerId }, { customer: customerId }],
    })
      .sort({ createdAt: -1 })
      .populate('category', 'name slug icon')
      .populate('assignedWorker', 'name phone avatarUrl')
      .populate('billId');

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id
 * View specific booking with strict access check
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('customer', 'name phone email')
      .populate('assignedWorker', 'name phone avatarUrl')
      .populate('category', 'name slug icon baseInspectionFee')
      .populate('billId');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Verify role and user access
    verifyBookingAccess(booking, req.user);

    res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/cancel
 * Customer or Admin cancellation with reason
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Customer requested cancellation' } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    verifyBookingAccess(booking, req.user);

    await transitionBooking(booking, BOOKING_STATES.CANCELLED, req.user, {
      reason,
      note: `Booking cancelled: ${reason}`,
    });

    broadcastBookingStatus(booking, 'booking:cancelled', { reason });

    res.status(200).json({
      success: true,
      message: `Booking ${booking.bookingNumber} successfully cancelled.`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/worker/bookings
 * Worker: view bookings assigned to or candidate offered for worker
 */
const getWorkerBookings = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const bookings = await Booking.find({
      $or: [
        { workerId },
        { assignedWorker: workerId },
        {
          status: BOOKING_STATES.OFFERED,
          'matchingMetadata.candidateWorkerIds': workerId,
        },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('customer', 'name phone')
      .populate('category', 'name slug icon');

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/worker/bookings/active
 * Worker: view currently active ongoing booking
 */
const getWorkerActiveBooking = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const activeBooking = await Booking.findOne({
      $or: [{ workerId }, { assignedWorker: workerId }],
      status: {
        $in: [
          BOOKING_STATES.ACCEPTED,
          BOOKING_STATES.ON_THE_WAY,
          BOOKING_STATES.ARRIVED,
          BOOKING_STATES.IN_PROGRESS,
          BOOKING_STATES.WORK_SUBMITTED,
        ],
      },
    })
      .populate('customer', 'name phone')
      .populate('category', 'name slug icon');

    if (activeBooking) {
      return res.status(200).json({
        success: true,
        hasActiveBooking: true,
        hasPendingOffer: false,
        booking: activeBooking,
      });
    }

    // Check if there is an incoming offered/matching booking waiting for this worker
    const pendingOffer = await Booking.findOne({
      $or: [
        { assignedWorker: workerId, status: { $in: [BOOKING_STATES.OFFERED, BOOKING_STATES.MATCHING] } },
        { workerId, status: { $in: [BOOKING_STATES.OFFERED, BOOKING_STATES.MATCHING] } },
        { 'matchingMetadata.candidateWorkerIds': workerId, status: BOOKING_STATES.OFFERED },
      ],
    })
      .populate('customer', 'name phone')
      .populate('category', 'name slug icon');

    if (pendingOffer) {
      return res.status(200).json({
        success: true,
        hasActiveBooking: false,
        hasPendingOffer: true,
        offer: {
          bookingId: pendingOffer._id,
          bookingNumber: pendingOffer.bookingNumber,
          customerName: pendingOffer.customer?.name || 'Customer',
          category: pendingOffer.category?.name?.en || pendingOffer.serviceCategory || 'Service',
          serviceCategory: pendingOffer.serviceCategory,
          rawText: pendingOffer.voiceTranscript,
          address: pendingOffer.address?.addressLine || pendingOffer.address?.city || 'Local Zone',
          floorPayout: pendingOffer.initialEstimate || 250,
          tasks: pendingOffer.tasks,
          timeoutSeconds: 120,
        },
      });
    }

    res.status(200).json({
      success: true,
      hasActiveBooking: false,
      hasPendingOffer: false,
      booking: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/accept
 * Worker accepts dispatched or assigned offer with double booking guard
 */
const acceptBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await handleWorkerAcceptOffer(id, req.user);
    res.status(200).json({
      success: true,
      message: `Booking ${result.booking.bookingNumber} accepted by worker.`,
      booking: result.booking,
      worker: result.worker,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/decline
 * Worker declines offered job -> routes back to matching and tries next candidate
 */
const declineBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason = 'Worker declined' } = req.body;
    const result = await handleWorkerDeclineOffer(id, req.user, reason);
    res.status(200).json({
      success: true,
      message: `Offer declined. Booking returned to MATCHING pool.`,
      booking: result.booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/on-the-way
 * Worker starts transit to customer address
 */
const startEnRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    await transitionBooking(booking, BOOKING_STATES.ON_THE_WAY, req.user, {
      note: 'Worker is on the way to customer doorstep',
    });

    broadcastBookingStatus(booking, 'booking:worker_arriving');

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/arrived
 * Worker arrived at location
 */
const reportArrived = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    await transitionBooking(booking, BOOKING_STATES.ARRIVED, req.user, {
      note: 'Worker arrived at customer doorstep',
    });

    broadcastBookingStatus(booking, 'booking:worker_arriving');

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/start-work
 * Worker begins physical service
 */
const startWork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    await transitionBooking(booking, BOOKING_STATES.IN_PROGRESS, req.user, {
      note: 'Worker started diagnostic and repair work',
    });

    broadcastBookingStatus(booking, 'booking:started');

    res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/worker/bookings/:id/submit-work
 * Worker submits completion report (voice transcript + completed tasks)
 * Strictly reconciled by pricingService against MongoDB RateCard.
 * Any client-supplied grossAmount, prices, or share distribution are strictly ignored!
 */
const submitWorkReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { voiceTranscript, tasks = [], completedTasks = [] } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    if (voiceTranscript) {
      booking.voiceTranscript = voiceTranscript;
      await booking.save();
    }

    const candidateTasks = (completedTasks && completedTasks.length > 0) ? completedTasks : tasks;

    // Generate authoritative bill and snapshot via pricingService
    const result = await generateFinalBill({
      bookingId: id,
      completedTasks: candidateTasks,
      actor: req.user,
    });

    res.status(200).json({
      success: true,
      message: 'Work report and bill successfully reconciled against cooperative rate card.',
      booking: result.booking,
      bill: result.bill,
      workerShare: result.workerShare,
      cooperativeShare: result.cooperativeShare,
      rateCardVersion: result.rateCardVersion,
      explanation: result.explanation,
      uiMessage: result.uiMessage,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/estimate
 * Calculate deterministic estimate range from tasks
 */
const getBookingEstimate = async (req, res, next) => {
  try {
    const { tasks = [] } = req.body;
    const estimate = await calculateInitialEstimate(tasks);
    res.status(200).json({
      success: true,
      estimate,
      uiMessage: 'AI identifies the work. The cooperative rate card determines the price.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/customer/bookings/:id/pay
 * Customer approves bill and pays
 */
const approveAndPay = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      paymentMethod = 'mock_upi',
      transactionId = `TXN-${Date.now()}`,
      amount,
      paymentAmount,
    } = req.body;

    const booking = await Booking.findById(id).populate('billId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    // Payment Amount Manipulation Guard: Reject if frontend attempts to alter payable sum
    const suppliedAmount = amount !== undefined ? amount : paymentAmount;
    if (suppliedAmount !== undefined && Number(suppliedAmount) !== booking.finalPrice) {
      return res.status(400).json({
        success: false,
        message: `Payment manipulation rejected: Supplied payment amount (₹${suppliedAmount}) does not match authoritative bill total (₹${booking.finalPrice}).`,
      });
    }

    // Transition to PAID
    await transitionBooking(booking, BOOKING_STATES.PAID, req.user, {
      note: `Customer paid ₹${booking.finalPrice} via ${paymentMethod} (Txn: ${transactionId}).`,
    });

    // Execute 90/10 Split, Transaction Ledger & 5-Bucket Fund Allocation
    const financeResult = await processPaymentSplitAndLedger(
      booking._id,
      { paymentMethod, transactionId },
      req.user
    );

    // Conclude to COMPLETED
    await transitionBooking(booking, BOOKING_STATES.COMPLETED, req.user, {
      note: 'Service booking lifecycle concluded successfully.',
    });

    if (booking.billId) {
      await Bill.findByIdAndUpdate(booking.billId, {
        billStatus: 'settled',
        paidAt: new Date(),
        paymentMethod,
        transactionId,
      });
    }

    broadcastBookingStatus(booking, 'booking:completed', {
      paymentMethod,
      transactionId,
      finalPrice: booking.finalPrice,
      splits: financeResult.splits,
    });

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully. Booking marked as COMPLETED.',
      booking,
      finance: financeResult,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/dispute
 * Raise dispute on booking
 */
const raiseDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await createDispute(id, req.user, req.body);

    res.status(200).json({
      success: true,
      message: 'Dispute opened. Cooperative arbitration committee notified.',
      dispute: result.dispute,
      aiEvidenceSummary: result.aiEvidenceSummary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/transition (Admin or General Transition API)
 * Strictly validated state transition endpoint
 */
const performTransition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, note, reason, workerId, billId, finalPrice } = req.body;

    if (!targetStatus) {
      return res.status(400).json({ success: false, message: 'targetStatus is required.' });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    await transitionBooking(booking, targetStatus, req.user, {
      note,
      reason,
      workerId,
      billId,
      finalPrice,
    });

    // If transitioned to PAID, execute 90/10 split and ledger
    if (targetStatus === BOOKING_STATES.PAID) {
      await processPaymentSplitAndLedger(booking._id, {}, req.user);
    }

    res.status(200).json({
      success: true,
      message: `Booking state transitioned to ${booking.status}.`,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/match
 * Execute Fair Opportunity Worker Matching Algorithm for booking
 */
const matchBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('category');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

    verifyBookingAccess(booking, req.user);

    const matchResult = await findBestWorkerMatch(booking);

    if (!matchResult.success || !matchResult.matchedWorker) {
      booking.matchingMetadata.attempts = (booking.matchingMetadata.attempts || 0) + 1;
      if (booking.matchingMetadata.attempts >= 3 && booking.status === BOOKING_STATES.MATCHING) {
        await transitionBooking(booking, BOOKING_STATES.UNFULFILLED, req.user, {
          reason: 'No available certified workers in area after 3 attempts.',
        });
      } else {
        await booking.save();
      }

      return res.status(200).json({
        success: false,
        message: matchResult.message || 'No available worker found.',
        booking,
      });
    }

    const selectedWorker = matchResult.matchedWorker;

    // Transition MATCHING -> OFFERED
    if (booking.status === BOOKING_STATES.MATCHING || booking.status === BOOKING_STATES.DRAFT) {
      if (booking.status === BOOKING_STATES.DRAFT) {
        await transitionBooking(booking, BOOKING_STATES.MATCHING, req.user);
      }
      await transitionBooking(booking, BOOKING_STATES.OFFERED, req.user, {
        workerId: selectedWorker.workerId,
        note: `Fair matching selected ${selectedWorker.workerName} (Score: ${selectedWorker.scores.finalScore}). ${selectedWorker.explanations[4]}`,
      });
    }

    booking.matchingMetadata.scoreBreakdown = selectedWorker.scores;
    booking.matchingMetadata.explanation = selectedWorker.explanations;
    booking.matchingMetadata.candidatesEvaluatedCount = matchResult.candidatesCount;
    booking.matchingMetadata.rankedCandidates = matchResult.candidatesRanked.map((c) => ({
      workerId: c.workerId,
      name: c.workerName,
      finalScore: c.scores.finalScore,
      distanceKm: c.distanceKm,
    }));
    await booking.save();

    res.status(200).json({
      success: true,
      message: `Fair matching algorithm selected ${selectedWorker.workerName} with score ${selectedWorker.scores.finalScore}/100.`,
      matchedWorker: selectedWorker,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getWorkerBookings,
  getWorkerActiveBooking,
  acceptBooking,
  declineBooking,
  startEnRoute,
  reportArrived,
  startWork,
  submitWorkReport,
  approveAndPay,
  raiseDispute,
  performTransition,
  matchBooking,
  getBookingEstimate,
};
