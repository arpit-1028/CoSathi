const {
  Review,
  Booking,
  User,
  WorkerPerformance,
  WorkerProfile,
  Cooperative,
} = require('../models');

const TAG_FIELD_MAP = {
  'On time': 'onTime',
  'Professional': 'professional',
  'Good quality': 'goodQuality',
  'Fair pricing': 'fairPricing',
  'Clean work': 'cleanWork',
};

const ISSUE_FIELD_MAP = {
  'Overcharged': 'overcharged',
  'Incomplete': 'incomplete',
  'Late': 'late',
  'Poor quality': 'poorQuality',
  'Other': 'other',
};

/**
 * Submit a customer review after booking completion & payment
 */
const submitBookingReview = async (bookingId, customerUser, reviewData) => {
  const {
    rating,
    punctualityRating,
    qualityRating,
    behaviorRating,
    comment = '',
    tags = [],
    issues = [],
  } = reviewData;

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    const error = new Error('Rating must be an integer between 1 and 5 stars.');
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId).populate('assignedWorker');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Verification: User must be customer of this booking
  const bookingCustId = (booking.customerId || booking.customer)?.toString();
  if (bookingCustId !== customerUser._id.toString()) {
    const error = new Error('Unauthorized: Only the customer who made this booking can submit a review.');
    error.statusCode = 403;
    throw error;
  }

  // Verification: Booking must be in COMPLETED or PAID state
  if (!['PAID', 'COMPLETED'].includes(booking.status)) {
    const error = new Error(`Reviews can only be submitted for completed or paid bookings (current status: ${booking.status}).`);
    error.statusCode = 400;
    throw error;
  }

  // Verification: One review per booking
  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) {
    const error = new Error('Review has already been submitted for this booking.');
    error.statusCode = 409;
    throw error;
  }

  const workerId = booking.workerId || booking.assignedWorker?._id;
  if (!workerId) {
    const error = new Error('No worker assigned to this booking.');
    error.statusCode = 400;
    throw error;
  }

  // Create Review Record
  const newReview = await Review.create({
    booking: booking._id,
    customer: customerUser._id,
    worker: workerId,
    rating: numRating,
    punctualityRating: Number(punctualityRating) || numRating,
    qualityRating: Number(qualityRating) || numRating,
    behaviorRating: Number(behaviorRating) || numRating,
    comment,
    tags: Array.isArray(tags) ? tags : [],
    issues: Array.isArray(issues) ? issues : [],
    serviceCategory: booking.serviceCategory || booking.category,
  });

  // Update Worker Performance Metrics
  const updatedPerformance = await updateWorkerPerformanceAfterReview(workerId, newReview);

  return {
    review: newReview,
    performance: updatedPerformance,
  };
};

/**
 * Re-calculate worker performance metrics following review submission
 */
const updateWorkerPerformanceAfterReview = async (workerId, review) => {
  // Find or initialize WorkerPerformance
  let perf = await WorkerPerformance.findOne({ worker: workerId });
  if (!perf) {
    const profile = await WorkerProfile.findOne({ user: workerId });
    perf = await WorkerPerformance.create({
      worker: workerId,
      cooperative: profile?.cooperative || (await Cooperative.findOne({ status: 'active' }))?._id,
    });
  }

  // Fetch all reviews for worker to calculate exact weighted average
  const allReviews = await Review.find({ worker: workerId });
  const totalReviews = allReviews.length;
  const ratingSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Math.round((ratingSum / totalReviews) * 100) / 100 : 5.0;

  // Calculate Rating Distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allReviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    distribution[star] = (distribution[star] || 0) + 1;
  });

  // Tag Counts & Issue Counts
  const tagCounts = { onTime: 0, professional: 0, goodQuality: 0, fairPricing: 0, cleanWork: 0 };
  const issueCounts = { overcharged: 0, incomplete: 0, late: 0, poorQuality: 0, other: 0 };

  let totalComplaints = 0;
  allReviews.forEach((r) => {
    (r.tags || []).forEach((t) => {
      const key = TAG_FIELD_MAP[t];
      if (key) tagCounts[key] = (tagCounts[key] || 0) + 1;
    });

    (r.issues || []).forEach((iss) => {
      const key = ISSUE_FIELD_MAP[iss];
      if (key) {
        issueCounts[key] = (issueCounts[key] || 0) + 1;
        totalComplaints++;
      }
    });
  });

  // Calculate Rates
  // Fetch completed bookings count for worker
  const completedBookingsCount = await Booking.countDocuments({
    $or: [{ workerId }, { assignedWorker: workerId }],
    status: 'COMPLETED',
  });

  const totalAssignedOrAccepted = await Booking.countDocuments({
    $or: [{ workerId }, { assignedWorker: workerId }],
    status: { $in: ['ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'WORK_SUBMITTED', 'BILL_GENERATED', 'CUSTOMER_APPROVAL', 'PAID', 'COMPLETED', 'CANCELLED'] },
  });

  const cancelledCount = await Booking.countDocuments({
    $or: [{ workerId }, { assignedWorker: workerId }],
    status: 'CANCELLED',
    cancelledBy: workerId,
  });

  const completionRatePercent = totalAssignedOrAccepted > 0
    ? Math.round((completedBookingsCount / totalAssignedOrAccepted) * 100)
    : 98;

  const cancellationRatePercent = totalAssignedOrAccepted > 0
    ? Math.round((cancelledCount / totalAssignedOrAccepted) * 100)
    : 0;

  const offersCount = perf.totalOffersCount || Math.max(1, completedBookingsCount + (perf.declinedOffersCount || 0));
  const declinedCount = perf.declinedOffersCount || 0;
  const acceptanceRatePercent = offersCount > 0
    ? Math.max(0, Math.round(((offersCount - declinedCount) / offersCount) * 100))
    : 95;

  const noShows = perf.noShowCount || 0;
  const noShowRatePercent = totalAssignedOrAccepted > 0
    ? Math.round((noShows / totalAssignedOrAccepted) * 100)
    : 0;

  // Append entry to performance history for trend tracking
  const historyEntry = {
    timestamp: new Date(),
    averageRating,
    jobsCompleted: completedBookingsCount,
    complaintsCount: totalComplaints,
    fairnessScore: perf.fairDistributionScore || 1.0,
    reason: `Review submitted: ${review.rating}★`,
  };

  // Update document
  perf.averageRating = averageRating;
  perf.totalRatingsCount = totalReviews;
  perf.lifetimeJobsCompleted = completedBookingsCount;
  perf.ratingDistribution = distribution;
  perf.tagCounts = tagCounts;
  perf.issueCounts = issueCounts;
  perf.complaintsCount = totalComplaints;
  perf.completionRatePercent = completionRatePercent;
  perf.cancellationRatePercent = cancellationRatePercent;
  perf.acceptanceRatePercent = acceptanceRatePercent;
  perf.noShowRatePercent = noShowRatePercent;

  if (!perf.performanceHistory) perf.performanceHistory = [];
  perf.performanceHistory.push(historyEntry);

  await perf.save();
  return perf;
};

/**
 * Get aggregated performance profile and rating trends for worker or admin
 */
const getWorkerPerformanceDetails = async (workerId) => {
  const [user, profile, performance, reviews] = await Promise.all([
    User.findById(workerId).select('-password'),
    WorkerProfile.findOne({ user: workerId }),
    WorkerPerformance.findOne({ worker: workerId }),
    Review.find({ worker: workerId }).sort({ createdAt: -1 }).populate('customer', 'name avatarUrl').limit(20),
  ]);

  if (!user) {
    const error = new Error('Worker user not found');
    error.statusCode = 404;
    throw error;
  }

  return {
    worker: {
      id: user._id,
      name: user.name,
      phone: user.phone,
      primarySkill: profile?.primarySkill || 'General',
      verificationStatus: profile?.verificationStatus || 'approved',
      memberId: profile?.memberId || 'COS-DL-2026-000',
    },
    performance: {
      averageRating: performance?.averageRating || 5.0,
      totalRatingsCount: performance?.totalRatingsCount || 0,
      lifetimeJobsCompleted: performance?.lifetimeJobsCompleted || 0,
      jobsCompletedLast7Days: performance?.jobsCompletedLast7Days || 0,
      completionRatePercent: performance?.completionRatePercent || 98,
      acceptanceRatePercent: performance?.acceptanceRatePercent || 95,
      cancellationRatePercent: performance?.cancellationRatePercent || 0,
      noShowRatePercent: performance?.noShowRatePercent || 0,
      complaintsCount: performance?.complaintsCount || 0,
      fairDistributionScore: performance?.fairDistributionScore || 1.0,
      ratingDistribution: performance?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      tagCounts: performance?.tagCounts || {},
      issueCounts: performance?.issueCounts || {},
      performanceHistory: performance?.performanceHistory || [],
    },
    recentReviews: reviews,
  };
};

module.exports = {
  submitBookingReview,
  updateWorkerPerformanceAfterReview,
  getWorkerPerformanceDetails,
};
