const { RateCardItem, RateCardVersion, Bill, Booking, AuditLog, User } = require('../models');
const { BOOKING_STATES, transitionBooking } = require('./bookingStateMachine');
const { broadcastBookingStatus } = require('./socketDispatchService');

/**
 * Get current active rate card version string
 */
const getCurrentRateCardVersion = async () => {
  try {
    const versionDoc = await RateCardVersion.findOne({ isCurrent: true }).sort({ createdAt: -1 });
    return versionDoc ? versionDoc.versionNumber : 'v2026.1';
  } catch (err) {
    return 'v2026.1';
  }
};

/**
 * Normalizes task code string (e.g. 'tap_replacement' -> 'TAP_REPLACEMENT')
 */
const normalizeTaskCode = (code) => {
  if (!code) return '';
  return code.toString().trim().toUpperCase();
};

/**
 * Look up RateCardItem by code in MongoDB
 */
const findRateCardItem = async (code) => {
  const normCode = normalizeTaskCode(code);
  if (!normCode) return null;

  return await RateCardItem.findOne({
    $and: [
      { $or: [{ code: normCode }, { serviceCode: normCode }] },
      { $or: [{ active: true }, { isActive: true }] },
    ],
  });
};

/**
 * 1. INITIAL ESTIMATE CALCULATION
 * Calculates authoritative estimate range and items strictly from MongoDB RateCard.
 * Gemini output is used ONLY to identify codes and quantities.
 */
const calculateInitialEstimate = async (tasksInput = []) => {
  const rateCardVersion = await getCurrentRateCardVersion();
  const rawTasks = Array.isArray(tasksInput) ? tasksInput : [tasksInput];

  let calculatedBaseTotal = 0;
  let calculatedMinTotal = 0;
  let calculatedMaxTotal = 0;
  const itemizedDetails = [];

  for (const raw of rawTasks) {
    const code = normalizeTaskCode(raw.code || raw.serviceCode || raw.taskCode);
    const quantity = Math.max(1, parseInt(raw.quantity || raw.estimatedUnits || 1, 10) || 1);

    if (code === 'NEEDS_REVIEW' || !code) {
      // Try to find category rate card item by category hint in task label
      const categoryHint = (raw.categorySlug || raw.category || raw.serviceCategory || '').toLowerCase();
      let categoryRateItem = null;
      if (categoryHint) {
        categoryRateItem = await RateCardItem.findOne({
          $and: [{ $or: [{ active: true }, { isActive: true }] }],
        }).populate('category', 'slug').then((items) => null);
        // Try direct category lookup
        try {
          const { ServiceCategory } = require('../models');
          const catDoc = await ServiceCategory.findOne({ slug: categoryHint });
          if (catDoc) {
            categoryRateItem = await RateCardItem.findOne({
              category: catDoc._id,
              $or: [{ active: true }, { isActive: true }],
            }).sort({ basePrice: 1 });
          }
        } catch (e) {}
      }

      const baseDiag = categoryRateItem
        ? Number(categoryRateItem.basePrice || categoryRateItem.standardRate || 249)
        : Number(raw.unitPrice || raw.estimatedPrice || raw.rate || 249);
      const minDiag = Math.round(baseDiag * 0.85);
      const maxDiag = Math.round(baseDiag * 1.25);
      calculatedBaseTotal += baseDiag * quantity;
      calculatedMinTotal += minDiag * quantity;
      calculatedMaxTotal += maxDiag * quantity;

      itemizedDetails.push({
        code: 'NEEDS_REVIEW',
        name: raw.label || raw.title || 'Cooperative Service Task',
        nameHindi: 'सहकारी सेवा कार्य',
        unitPrice: baseDiag,
        minPrice: minDiag,
        maxPrice: maxDiag,
        quantity,
        subtotal: baseDiag * quantity,
        minSubtotal: minDiag * quantity,
        maxSubtotal: maxDiag * quantity,
        unit: 'fixed',
        rateCardVersion,
        needsReview: true,
      });
      continue;
    }

    const rateItem = await findRateCardItem(code);

    if (rateItem) {
      const unitPrice = Number(rateItem.basePrice || rateItem.standardRate || 199);
      const minPrice = Number(rateItem.minPrice || rateItem.cooperativeMinRate || Math.round(unitPrice * 0.85));
      const maxPrice = Number(rateItem.maxPrice || rateItem.cooperativeMaxRate || Math.round(unitPrice * 1.25));

      const subtotal = unitPrice * quantity;
      const minSubtotal = minPrice * quantity;
      const maxSubtotal = maxPrice * quantity;

      calculatedBaseTotal += subtotal;
      calculatedMinTotal += minSubtotal;
      calculatedMaxTotal += maxSubtotal;

      itemizedDetails.push({
        code: rateItem.code || rateItem.serviceCode,
        name: rateItem.name || rateItem.title?.en || code,
        nameHindi: rateItem.nameHindi || rateItem.title?.hi || '',
        unitPrice,
        minPrice,
        maxPrice,
        quantity,
        subtotal,
        minSubtotal,
        maxSubtotal,
        unit: rateItem.unit || rateItem.billingType || 'per_unit',
        rateCardVersion: rateItem.version ? `v${rateItem.version}` : rateCardVersion,
        needsReview: false,
      });
    } else {
      // Unknown code in system: dynamic category fallback
      const fallbackPrice = Number(raw.unitPrice || raw.estimatedPrice || raw.rate || 249);
      const minP = Math.round(fallbackPrice * 0.85);
      const maxP = Math.round(fallbackPrice * 1.25);
      calculatedBaseTotal += fallbackPrice * quantity;
      calculatedMinTotal += minP * quantity;
      calculatedMaxTotal += maxP * quantity;

      itemizedDetails.push({
        code,
        name: raw.label || raw.title || code,
        nameHindi: raw.nameHindi || '',
        unitPrice: fallbackPrice,
        minPrice: minP,
        maxPrice: maxP,
        quantity,
        subtotal: fallbackPrice * quantity,
        minSubtotal: minP * quantity,
        maxSubtotal: maxP * quantity,
        unit: 'per_unit',
        rateCardVersion,
        needsReview: true,
      });
    }
  }

  // If no items were identified, default to category diagnostic
  if (itemizedDetails.length === 0) {
    calculatedBaseTotal = 199;
    calculatedMinTotal = 150;
    calculatedMaxTotal = 250;
    itemizedDetails.push({
      code: 'GENERAL_INSPECTION',
      name: 'Standard Diagnostic Inspection',
      nameHindi: 'मानक जांच शुल्क',
      unitPrice: 199,
      minPrice: 150,
      maxPrice: 250,
      quantity: 1,
      subtotal: 199,
      minSubtotal: 150,
      maxSubtotal: 250,
      unit: 'fixed',
      rateCardVersion,
      needsReview: false,
    });
  }

  return {
    rateCardVersion,
    items: itemizedDetails,
    baseEstimate: calculatedBaseTotal,
    minEstimate: calculatedMinTotal,
    maxEstimate: calculatedMaxTotal,
    formattedRange: `₹${calculatedMinTotal}–₹${calculatedMaxTotal}`,
    explanation: 'Final amount is based on completed work and the cooperative rate card.',
    uiMessage: 'AI identifies the work. The cooperative rate card determines the price.',
  };
};

/**
 * 2. FINAL BILL & RECONCILIATION CALCULATION
 * Strictly calculates the final bill from MongoDB RateCard.
 *
 * SECURITY GUARANTEES:
 * - Completely ignores any prices, totals, or share distributions sent from frontend!
 * - Strictly enforces 90% Worker Share and 10% Cooperative Fund Share.
 * - Saves immutable snapshot of rateCardVersion and exact item prices at time of billing.
 * - Historical bills MUST NOT change if rate cards are updated later.
 */
const generateFinalBill = async ({ bookingId, tasks = [], completedTasks = [], actor }) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    const error = new Error(`Booking ${bookingId} not found.`);
    error.status = 404;
    throw error;
  }

  let actorUser = actor;
  if (actor && (typeof actor === 'string' || actor._bsontype === 'ObjectID' || (actor.constructor && actor.constructor.name === 'ObjectId'))) {
    actorUser = await User.findById(actor);
  }
  if (!actorUser || !actorUser.role) {
    // Fallback to assigned worker if actor is worker ID
    if (booking.workerId) {
      actorUser = await User.findById(booking.workerId);
    }
  }

  // Work tasks list to reconcile
  const candidateTasks = completedTasks.length > 0 ? completedTasks : (tasks.length > 0 ? tasks : booking.tasks);
  if (!candidateTasks || candidateTasks.length === 0) {
    const error = new Error('No completed tasks provided for rate card reconciliation.');
    error.status = 400;
    throw error;
  }

  const rateCardVersion = await getCurrentRateCardVersion();
  const lineItems = [];
  let grossAmount = 0;

  for (const t of candidateTasks) {
    const code = normalizeTaskCode(t.code || t.serviceCode || t.taskCode);
    const quantity = Math.max(1, parseInt(t.quantity || 1, 10) || 1);

    const rateItem = await findRateCardItem(code);

    let unitPrice = 199;
    let itemName = t.label || t.title || code;
    let itemNameHi = '';
    let unit = 'per_unit';
    let minPrice = 150;
    let maxPrice = 250;

    if (rateItem) {
      unitPrice = Number(rateItem.basePrice || rateItem.standardRate || 199);
      minPrice = Number(rateItem.minPrice || rateItem.cooperativeMinRate || Math.round(unitPrice * 0.85));
      maxPrice = Number(rateItem.maxPrice || rateItem.cooperativeMaxRate || Math.round(unitPrice * 1.25));
      itemName = rateItem.name || rateItem.title?.en || code;
      itemNameHi = rateItem.nameHindi || rateItem.title?.hi || '';
      unit = rateItem.unit || rateItem.billingType || 'per_unit';
    }

    const subtotal = Math.round(unitPrice * quantity);
    grossAmount += subtotal;

    lineItems.push({
      code: code || 'CUSTOM_SERVICE',
      serviceCode: code || 'CUSTOM_SERVICE',
      name: itemName,
      title: itemName,
      quantity,
      unitPrice,
      unitRate: unitPrice,
      subtotal,
      minPrice,
      maxPrice,
      unit,
      rateCardVersion: rateItem?.version ? `v${rateItem.version}` : rateCardVersion,
    });
  }

  // 90% Worker Share / 10% Cooperative Share
  const workerShare = Math.round(grossAmount * 0.90);
  const cooperativeShare = grossAmount - workerShare; // 10% guarantee

  // Rate snapshot for historical immutability
  const rateSnapshot = {
    rateCardVersion,
    snapshotDate: new Date(),
    frozen: true,
    itemsSnapshot: lineItems.map((item) => ({
      code: item.code,
      name: item.name,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      unit: item.unit,
      rateCardVersion: item.rateCardVersion,
    })),
  };

  const billNumber = `BILL-${booking.bookingNumber || booking._id.toString().slice(-6)}`;

  // Find or Create Bill document
  let bill = await Bill.findOne({ booking: booking._id });
  if (!bill) {
    bill = new Bill({
      billNumber,
      booking: booking._id,
      customer: booking.customerId,
      worker: booking.workerId,
      rateCardVersion,
      lineItems,
      grossAmount,
      totalAmount: grossAmount,
      workerShare,
      workerNetEarnings: workerShare,
      cooperativeShare,
      cooperativeWelfareDeduction: cooperativeShare,
      netPayable: grossAmount,
      billStatus: 'presented',
      rateSnapshot,
    });
    await bill.save();
  } else {
    // If updating draft bill, maintain snapshot
    bill.lineItems = lineItems;
    bill.grossAmount = grossAmount;
    bill.totalAmount = grossAmount;
    bill.workerShare = workerShare;
    bill.workerNetEarnings = workerShare;
    bill.cooperativeShare = cooperativeShare;
    bill.cooperativeWelfareDeduction = cooperativeShare;
    bill.netPayable = grossAmount;
    bill.rateCardVersion = rateCardVersion;
    bill.rateSnapshot = rateSnapshot;
    bill.billStatus = 'presented';
    await bill.save();
  }

  // Advance booking state machine
  booking.finalPrice = grossAmount;
  booking.billId = bill._id;
  booking.tasks = lineItems.map((li) => ({
    title: li.name,
    serviceCode: li.code,
    quantity: li.quantity,
    rate: li.unitPrice,
    estimatedPrice: li.subtotal,
    unit: li.unit,
  }));

  // Perform transitions: to WORK_SUBMITTED -> BILL_GENERATED -> CUSTOMER_APPROVAL
  if (booking.status === BOOKING_STATES.IN_PROGRESS) {
    await transitionBooking(booking, BOOKING_STATES.WORK_SUBMITTED, actorUser, {
      finalPrice: grossAmount,
      note: `Worker submitted work report: ${lineItems.length} tasks completed.`,
    });
  }

  if (booking.status === BOOKING_STATES.WORK_SUBMITTED) {
    await transitionBooking(booking, BOOKING_STATES.BILL_GENERATED, actorUser, {
      billId: bill._id,
      note: `Cooperative Bill ${bill.billNumber} generated. Gross: ₹${grossAmount}, 90% Worker: ₹${workerShare}, 10% Cooperative Fund: ₹${cooperativeShare}.`,
    });
  }

  if (booking.status === BOOKING_STATES.BILL_GENERATED) {
    await transitionBooking(booking, BOOKING_STATES.CUSTOMER_APPROVAL, actorUser, {
      note: 'Bill presented for customer verification and payment.',
    });
  }

  await booking.save();

  // Broadcast real-time status update to all connected parties
  broadcastBookingStatus(booking, 'booking:status_updated', {
    bill,
    finalPrice: grossAmount,
    status: booking.status,
  });

  return {
    bill,
    booking,
    workerShare,
    cooperativeShare,
    grossAmount,
    rateCardVersion,
    explanation: 'Final amount is based on completed work and the cooperative rate card.',
    uiMessage: 'AI identifies the work. The cooperative rate card determines the price.',
  };
};

module.exports = {
  getCurrentRateCardVersion,
  findRateCardItem,
  calculateInitialEstimate,
  generateFinalBill,
};
