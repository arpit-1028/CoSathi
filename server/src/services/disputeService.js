const {
  Dispute,
  Booking,
  Bill,
  Review,
  RateCardItem,
  User,
  WorkerProfile,
  AuditLog,
} = require('../models');

const { processRefund } = require('./financeService');
const { transitionBooking, BOOKING_STATES } = require('./bookingStateMachine');

/**
 * AI Evidence Organizer (Strictly Synthesizes Evidence for Human Arbitrators - NEVER Decides)
 */
const synthesizeEvidenceWithAi = async ({ category, description, voiceTranscript, tasks, bill, review }) => {
  const facts = [];
  const discrepancies = [];

  // Fact compilation
  if (voiceTranscript) {
    facts.push(`Worker audio transcript logged: "${voiceTranscript.slice(0, 150)}..."`);
  }
  if (tasks && tasks.length > 0) {
    facts.push(`AI interpreted ${tasks.length} task(s) on file: ${tasks.map((t) => t.title || t.code).join(', ')}.`);
  }
  if (bill) {
    facts.push(`Generated bill total: ₹${bill.grossAmount || bill.totalAmount} (${bill.lineItems?.length || 0} line items).`);
  }
  if (review) {
    facts.push(`Customer gave ${review.rating}★ rating with ${review.issues?.length || 0} flagged issue(s).`);
  }

  // Identify discrepancies based on dispute category
  const normCategory = (category || '').toLowerCase();
  if (normCategory.includes('billing') || normCategory.includes('pricing')) {
    if (bill && bill.grossAmount > 0) {
      discrepancies.push(
        `Customer disputes bill amount of ₹${bill.grossAmount}. Rate card snapshot indicates base rates were applied.`
      );
    }
    if (tasks && bill && bill.lineItems && bill.lineItems.length !== tasks.length) {
      discrepancies.push(
        `Count mismatch: ${tasks.length} tasks recorded vs ${bill.lineItems.length} billed line items.`
      );
    }
  } else if (normCategory.includes('incomplete')) {
    discrepancies.push(
      'Customer reports partial work remaining, whereas worker submitted work completion status.'
    );
  } else if (normCategory.includes('quality') || normCategory.includes('behavior')) {
    if (review && review.issues && review.issues.length > 0) {
      discrepancies.push(`Customer reported tags: ${review.issues.join(', ')}.`);
    }
  }

  const summaryText = `Customer lodged '${category}' dispute: "${description}". The service record contains ${facts.length} verified data points.`;

  return {
    summary: summaryText,
    keyFacts: facts.length > 0 ? facts : ['Booking completed through verified lifecycle.'],
    discrepancies: discrepancies.length > 0 ? discrepancies : ['Specific variance under human arbitrator review.'],
    disclaimer:
      'AI organizes and synthesizes evidence strictly for human arbitrator assistance. AI does not and must not make the final decision.',
    analyzedAt: new Date(),
  };
};

/**
 * Customer creates a dispute for a service booking
 */
const createDispute = async (bookingId, customerUser, disputeData = {}) => {
  const booking = await Booking.findById(bookingId)
    .populate('billId')
    .populate('assignedWorker');

  if (!booking) {
    throw new Error('Booking not found for dispute filing');
  }

  // Enforce customer ownership
  const customerIdStr = (booking.customerId || booking.customer)?._id?.toString() || (booking.customerId || booking.customer)?.toString();
  if (customerUser.role === 'customer' && customerIdStr !== customerUser._id.toString()) {
    const err = new Error('Unauthorized: You can only file a dispute on your own booking.');
    err.statusCode = 403;
    throw err;
  }

  const workerUserId = booking.workerId || booking.assignedWorker?._id;
  if (!workerUserId) {
    throw new Error('Cannot file dispute: No worker was assigned to this booking.');
  }

  const category = disputeData.disputeCategory || disputeData.category || 'billing';
  const description = disputeData.description || disputeData.reason || 'Service dispute filed by customer';

  // Gather complete evidence pack
  const [bill, review] = await Promise.all([
    booking.billId ? Bill.findById(booking.billId._id || booking.billId) : Bill.findOne({ booking: booking._id }),
    Review.findOne({ booking: booking._id }),
  ]);

  const evidencePack = {
    voiceTranscript: booking.voiceTranscript || '',
    aiExtractedWork: booking.tasks || [],
    rateCardSnapshot: bill?.rateCardVersion || { version: 'v2026.1' },
    bill: bill?._id || null,
    photos: disputeData.photos || disputeData.evidenceUrls || [],
    review: review?._id || null,
  };

  // AI organizes evidence with strict human-in-the-loop disclaimer
  const aiSummary = await synthesizeEvidenceWithAi({
    category,
    description,
    voiceTranscript: evidencePack.voiceTranscript,
    tasks: evidencePack.aiExtractedWork,
    bill,
    review,
  });

  const disputeTicketNumber = `DSP-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  const dispute = await Dispute.create({
    disputeTicketNumber,
    booking: booking._id,
    raisedBy: customerUser._id,
    againstUser: workerUserId,
    disputeCategory: category,
    description,
    evidence: evidencePack,
    evidenceUrls: evidencePack.photos,
    aiEvidenceSummary: aiSummary,
    status: 'under_cooperative_review',
  });

  // Transition booking to DISPUTED if allowed
  try {
    await transitionBooking(booking, BOOKING_STATES.DISPUTED, customerUser, {
      reason: `Dispute ${disputeTicketNumber} opened: ${description}`,
    });
  } catch (err) {
    // If already completed or in-progress, preserve state
    console.warn('[Dispute] State transition note:', err.message);
  }

  return {
    success: true,
    dispute,
    aiEvidenceSummary: aiSummary,
  };
};

/**
 * Cooperative Admin Executes Arbitration Decision with AuditLog & Side Effects
 * Decisions: 'no_action' | 'partial_refund' | 'full_refund' | 'rework' | 'warning' | 'suspend'
 */
const resolveDisputeByAdmin = async (disputeId, decisionData = {}, adminUser) => {
  const dispute = await Dispute.findById(disputeId)
    .populate('booking')
    .populate('againstUser')
    .populate('raisedBy');

  if (!dispute) {
    throw new Error('Dispute record not found');
  }

  const rawAction = (decisionData.action || decisionData.decision || '').toLowerCase().trim();
  const validActions = ['no_action', 'partial_refund', 'full_refund', 'rework', 'warning', 'suspend'];

  if (!validActions.includes(rawAction)) {
    throw new Error(
      `Invalid arbitration decision '${rawAction}'. Must be one of: ${validActions.join(', ')}`
    );
  }

  const notes = decisionData.notes || decisionData.resolutionNotes || `Arbitration decision executed: ${rawAction}`;
  const refundAmount = Number(decisionData.refundAmount || 0);

  const beforeState = {
    status: dispute.status,
    adminDecision: dispute.adminDecision,
  };

  let refundResult = null;
  let workerStatusUpdated = null;

  // 1. Execute Decision-Specific Side Effects
  if (rawAction === 'partial_refund' || rawAction === 'full_refund') {
    const finalRefund =
      rawAction === 'full_refund'
        ? dispute.booking?.finalPrice || 650
        : refundAmount > 0
        ? refundAmount
        : Math.round((dispute.booking?.finalPrice || 650) * 0.5);

    refundResult = await processRefund({
      bookingId: dispute.booking._id,
      disputeId: dispute._id,
      refundAmount: finalRefund,
      reason: `Arbitration decision: ${rawAction}. Notes: ${notes}`,
      adminUser,
    });
  } else if (rawAction === 'suspend') {
    // Suspend worker user & profile
    const workerUserId = dispute.againstUser?._id || dispute.againstUser;
    await Promise.all([
      User.findByIdAndUpdate(workerUserId, { status: 'suspended' }),
      WorkerProfile.findOneAndUpdate({ user: workerUserId }, { verificationStatus: 'suspended' }),
    ]);
    workerStatusUpdated = 'suspended';
  } else if (rawAction === 'warning') {
    // Record warning on worker profile
    const workerUserId = dispute.againstUser?._id || dispute.againstUser;
    await WorkerProfile.findOneAndUpdate(
      { user: workerUserId },
      {
        $push: {
          welfareNotes: `Official warning issued on ${new Date().toLocaleDateString('en-IN')}: ${notes}`,
        },
      }
    );
    workerStatusUpdated = 'warning_recorded';
  }

  // 2. Create AuditLog Record
  const auditLog = await AuditLog.create({
    actor: adminUser._id,
    action: 'DISPUTE_ARBITRATION_DECISION',
    targetModel: 'Dispute',
    targetId: dispute._id,
    changes: {
      before: beforeState,
      after: {
        action: rawAction,
        notes,
        refundAmount: refundResult ? refundResult.refundTxn?.amount : 0,
        workerStatusUpdated,
      },
    },
    metadata: {
      disputeTicketNumber: dispute.disputeTicketNumber,
      decision: rawAction,
      arbitratorName: adminUser.name,
      bookingId: dispute.booking?._id,
    },
    timestamp: new Date(),
  });

  // 3. Update Dispute Document
  dispute.status = rawAction === 'no_action' ? 'resolved_dismissed' : 'resolved_settlement';
  dispute.adminDecision = {
    action: rawAction,
    notes,
    refundAmount: refundResult ? refundResult.refundTxn?.amount : 0,
    warningReason: rawAction === 'warning' ? notes : undefined,
    decidedBy: adminUser._id,
    decidedAt: new Date(),
    auditLogId: auditLog._id,
  };
  dispute.resolutionNotes = notes;
  dispute.resolvedByAdmin = adminUser._id;
  dispute.resolvedAt = new Date();
  dispute.refundAmount = refundResult ? refundResult.refundTxn?.amount : 0;

  await dispute.save();

  return {
    success: true,
    message: `Dispute ${dispute.disputeTicketNumber} resolved with decision: ${rawAction}. AuditLog created.`,
    dispute,
    auditLog,
    refundResult,
    workerStatusUpdated,
  };
};

/**
 * List disputes for cooperative admin
 */
const listDisputes = async (filter = {}) => {
  const query = {};
  if (filter.status) query.status = filter.status;
  if (filter.category) query.disputeCategory = filter.category;

  const disputes = await Dispute.find(query)
    .sort({ createdAt: -1 })
    .populate('raisedBy', 'name phone email role')
    .populate('againstUser', 'name phone role')
    .populate('booking')
    .populate('evidence.bill')
    .populate('evidence.review');

  return disputes;
};

/**
 * Get detailed dispute record with evidence pack
 */
const getDisputeDetails = async (disputeId) => {
  const dispute = await Dispute.findById(disputeId)
    .populate('raisedBy', 'name phone email')
    .populate('againstUser', 'name phone email')
    .populate('booking')
    .populate('evidence.bill')
    .populate('evidence.review')
    .populate('adminDecision.decidedBy', 'name email');

  if (!dispute) {
    throw new Error('Dispute not found');
  }

  return dispute;
};

module.exports = {
  createDispute,
  resolveDisputeByAdmin,
  listDisputes,
  getDisputeDetails,
  synthesizeEvidenceWithAi,
};
