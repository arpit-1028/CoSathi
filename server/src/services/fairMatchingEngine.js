const {
  User,
  WorkerProfile,
  WorkerPerformance,
  WorkerAvailability,
  WorkerLocation,
  Booking,
  ServiceCategory,
} = require('../models');

const { checkWorkerDoubleBooking } = require('./bookingStateMachine');

// Minimum Acceptable Quality Floor: Fairness cannot override minimum quality standard
const MIN_QUALITY_SCORE_FLOOR = 35;

// Default Configurable Weights (Must sum to 1.0)
const DEFAULT_WEIGHTS = {
  skill: 0.25,        // 25%
  availability: 0.15, // 15%
  distance: 0.15,     // 15%
  quality: 0.15,      // 15%
  fairness: 0.25,     // 25% (Key Cooperative Differentiator)
  reliability: 0.05,  // 5%
};

// Bayesian Quality Priors
const BAYESIAN_PRIOR = {
  GLOBAL_AVERAGE_RATING: 4.5,
  CONFIDENCE_THRESHOLD_COUNT: 20, // Requires 20 reviews for full confidence
};

/**
 * Haversine formula to compute great-circle distance between two coordinates in km
 */
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return 3.0; // Sensible local default if coordinates missing
  }
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Compute normalized Distance Score (0 - 100)
 * Inside 1 km receives 100. Linear decay up to maxRadiusKm.
 */
const computeDistanceScore = (distanceKm, maxRadiusKm = 10) => {
  if (distanceKm > maxRadiusKm) return 0;
  if (distanceKm <= 1.0) return 100;
  const score = 100 * (1 - (distanceKm - 1.0) / (maxRadiusKm - 1.0));
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
};

/**
 * Compute Skill Match Score (0 - 100)
 * Exact trade: 100, secondary certified skill: 80, cross-compatible: 65, no match: 0
 */
const computeSkillScore = (requiredCategoryName, requiredCategorySlug, workerProfile) => {
  if (!workerProfile) return { score: 0, reason: 'No profile' };

  const pSkill = (workerProfile.primarySkill || '').toLowerCase().trim();
  const reqName = (requiredCategoryName || '').toLowerCase().trim();
  const reqSlug = (requiredCategorySlug || '').toLowerCase().trim();

  // Normalize trade tokens — covers all 10 CoSathi service categories
  const tradeEquivalents = {
    electrical: ['electrical', 'electrician', 'appliance repair', 'electric'],
    plumbing: ['plumbing', 'plumber', 'sanitary', 'pipe'],
    cleaning: ['cleaning', 'deep cleaning', 'sanitization', 'domestic help', 'domestic-help', 'domestic'],
    carpentry: ['carpentry', 'carpenter', 'furniture', 'wood'],
    painting: ['painting', 'painter', 'whitewash', 'paint'],
    gardening: ['gardening', 'gardener', 'garden', 'horticulture'],
    driver: ['driver', 'driving', 'chauffeur', 'taxi', 'cab'],
    caregiver: ['caregiver', 'care', 'nursing', 'elder care', 'health'],
    'appliance-repair': ['appliance repair', 'appliance', 'electrical', 'electrician'],
    'domestic-help': ['domestic help', 'domestic', 'cleaning', 'housekeeping', 'maid'],
  };

  const isExactPrimary =
    pSkill === reqName ||
    pSkill === reqSlug ||
    pSkill.includes(reqName) ||
    reqName.includes(pSkill);

  if (isExactPrimary) {
    return { score: 100, reason: `Exact primary trade match for ${workerProfile.primarySkill}` };
  }

  // Check secondary certified skills array
  const secondarySkills = (workerProfile.skills || []).map((s) => (s.category || '').toLowerCase());
  const isSecondary = secondarySkills.some((s) => s.includes(reqName) || reqName.includes(s));
  if (isSecondary) {
    return { score: 80, reason: `Certified secondary skill match in ${reqName}` };
  }

  // Check cross-compatible trades
  for (const [key, aliases] of Object.entries(tradeEquivalents)) {
    if (aliases.some((a) => reqName.includes(a) || reqSlug.includes(a))) {
      if (aliases.some((a) => pSkill.includes(a))) {
        return { score: 65, reason: `Cross-compatible trade match (${pSkill} for ${reqName})` };
      }
    }
  }

  return { score: 0, reason: 'No matching skill for requested service category' };
};

/**
 * Compute Availability Score (0 - 100)
 */
const computeAvailabilityScore = (workerAvailability) => {
  // No availability doc means worker never explicitly set off-duty — treat as available
  if (!workerAvailability) {
    return { score: 80, reason: 'No duty status set — treated as available (cooperative default)' };
  }
  if (!workerAvailability.isOnDuty) {
    return { score: 0, reason: 'Worker is off-duty' };
  }

  const status = workerAvailability.currentStatus || 'idle';
  if (status === 'idle' || status === 'available') {
    return { score: 100, reason: 'On duty and available for immediate dispatch' };
  }

  if (status === 'offered') {
    return { score: 50, reason: 'Worker currently considering another offer' };
  }

  return { score: 0, reason: `Worker is currently busy (${status})` };
};

/**
 * Bayesian-Style Quality Rating (0 - 100)
 * Prevents 5.0 (from 2 reviews) beating 4.8 (from 150 reviews)
 */
const computeQualityScore = (performance = {}) => {
  const rawRating = Number(performance.averageRating) || 5.0;
  const reviewsCount = Number(performance.totalRatingsCount) || 0;
  const completedJobs = Number(performance.lifetimeJobsCompleted) || 0;
  const complaints = Number(performance.complaintsCount) || 0;

  const C = BAYESIAN_PRIOR.CONFIDENCE_THRESHOLD_COUNT;
  const m = BAYESIAN_PRIOR.GLOBAL_AVERAGE_RATING;

  // Bayesian Weighted Average Formula
  const bayesianRating = (C * m + reviewsCount * rawRating) / (C + reviewsCount);

  // Normalize 1.0 - 5.0 rating to 0 - 100 scale
  const baseQuality = ((bayesianRating - 1.0) / 4.0) * 100;

  // Modest experience bonus capped at +8 pts
  const experienceBonus = Math.min(8, Math.sqrt(completedJobs) / 2);

  // Complaints penalty: -5 pts per complaint
  const complaintPenalty = complaints * 5;

  const finalQuality = Math.max(0, Math.min(100, baseQuality + experienceBonus - complaintPenalty));

  return {
    score: Math.round(finalQuality * 10) / 10,
    bayesianRating: Math.round(bayesianRating * 100) / 100,
    rawRating,
    reviewsCount,
    reason: `Bayesian rating ${Math.round(bayesianRating * 100) / 100} ★ (${reviewsCount} reviews, ${completedJobs} jobs completed)`,
  };
};

/**
 * Reliability Score (0 - 100)
 */
const computeReliabilityScore = (performance = {}) => {
  const completionRate = performance.completionRatePercent !== undefined ? performance.completionRatePercent : 98;
  const acceptanceRate = performance.acceptanceRatePercent !== undefined ? performance.acceptanceRatePercent : 95;
  const noShows = performance.noShowCount || 0;
  const cancellations = performance.cancellationRatePercent || 0;

  let score = 0.5 * completionRate + 0.5 * acceptanceRate;
  score -= noShows * 15; // Heavy penalty for no-shows
  score -= cancellations * 0.5;

  score = Math.max(0, Math.min(100, Math.round(score * 10) / 10));

  return {
    score,
    completionRate,
    acceptanceRate,
    reason: `Reliability: ${completionRate}% completion, ${acceptanceRate}% acceptance`,
  };
};

/**
 * Fairness Opportunity Score (0 - 100) ⭐
 * Core cooperative algorithm distributing livelihood evenly across certified members.
 */
const computeFairnessScore = (performance = {}, poolContext = {}) => {
  const jobs7d = performance.jobsCompletedLast7Days !== undefined ? performance.jobsCompletedLast7Days : 0;
  const earnings7d = performance.earningsLast7Days !== undefined ? performance.earningsLast7Days : jobs7d * 200;
  const utilizationRate = performance.utilizationLast7Days !== undefined ? performance.utilizationLast7Days : Math.min(1.0, (jobs7d * 2.5) / 40);

  // Hours since last assignment
  let hoursSinceLastJob = 48;
  if (performance.lastAssignedAt) {
    const elapsedMs = Date.now() - new Date(performance.lastAssignedAt).getTime();
    hoursSinceLastJob = Math.max(0, Math.min(168, elapsedMs / (1000 * 60 * 60)));
  } else {
    hoursSinceLastJob = 72; // New/idle worker bonus
  }

  // Normalization baselines relative to current candidate pool
  const maxPoolJobs = poolContext.maxJobs7Days ? Math.max(poolContext.maxJobs7Days, 10) : Math.max(jobs7d, 10);
  const maxPoolEarnings = poolContext.maxEarnings7Days ? Math.max(poolContext.maxEarnings7Days, 2500) : Math.max(earnings7d, 2500);

  // 1. Inverse Recent Bookings (0 - 100)
  const inverseRecentBookings = Math.max(0, 100 * (1 - jobs7d / maxPoolJobs));

  // 2. Inverse Utilization (0 - 100)
  const inverseUtilization = Math.max(0, 100 * (1 - Math.min(1.0, utilizationRate)));

  // 3. Inverse Recent Earnings (0 - 100)
  const inverseRecentEarnings = Math.max(0, 100 * (1 - earnings7d / maxPoolEarnings));

  // 4. Time Since Last Assignment Score (0 - 100)
  const timeSinceLastAssignmentScore = Math.min(100, (hoursSinceLastJob / 48) * 100);

  // Combined Recommended Formula:
  // 0.40 * inverseBookings + 0.25 * inverseUtil + 0.20 * inverseEarnings + 0.15 * timeScore
  let fairnessScore =
    0.40 * inverseRecentBookings +
    0.25 * inverseUtilization +
    0.20 * inverseRecentEarnings +
    0.15 * timeSinceLastAssignmentScore;

  // Anti-Gaming Safeguard:
  // Repeated declines should NOT pump fairness score indefinitely
  const consecutiveDeclines = performance.consecutiveDeclines || 0;
  const declinedOffers = performance.declinedOffersCount || 0;
  const totalOffers = performance.totalOffersCount || (declinedOffers + jobs7d);
  const declineRate = totalOffers > 0 ? declinedOffers / totalOffers : 0;

  let antiGamingDeduction = 0;
  if (consecutiveDeclines >= 3 || declineRate > 0.35) {
    antiGamingDeduction = Math.min(30, consecutiveDeclines * 8 + declineRate * 20);
    fairnessScore = Math.max(10, fairnessScore - antiGamingDeduction);
  }

  fairnessScore = Math.max(0, Math.min(100, Math.round(fairnessScore * 10) / 10));

  return {
    score: fairnessScore,
    jobs7Days: jobs7d,
    earnings7Days: earnings7d,
    utilizationRate,
    hoursSinceLastJob: Math.round(hoursSinceLastJob * 10) / 10,
    antiGamingDeduction: Math.round(antiGamingDeduction),
    reason: `Fairness priority: ${jobs7d} jobs in last 7 days, idle ${Math.round(hoursSinceLastJob)}h since last dispatch`,
  };
};

/**
 * Evaluate and Score a single candidate worker for a booking
 */
const scoreCandidateWorker = (candidate, booking, poolContext = {}, customWeights = {}) => {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  const { user, profile, performance, availability } = candidate;

  // 1. Skill Score
  const catName = booking.category?.name?.en || booking.category?.name || booking.categorySlug || 'General';
  const catSlug = booking.category?.slug || '';
  const skillRes = computeSkillScore(catName, catSlug, profile);

  // 2. Availability Score
  const availRes = computeAvailabilityScore(availability);

  // 3. Distance Score
  const custCoords = booking.location?.coordinates || [77.209, 28.6139]; // [lng, lat]
  const wrkCoords =
    candidate.location?.location?.coordinates ||
    profile.currentLocation?.coordinates ||
    profile.homeBaseLocation?.coordinates ||
    [77.21, 28.62];

  const distanceKm = calculateDistanceKm(custCoords[1], custCoords[0], wrkCoords[1], wrkCoords[0]);
  const effectiveRadius = candidate.location?.serviceRadiusKm || profile.maxServiceRadiusKm || 12;
  const distanceScore = computeDistanceScore(distanceKm, effectiveRadius);

  // 4. Quality Score
  const qualityRes = computeQualityScore(performance);

  // 5. Fairness Score ⭐
  const fairnessRes = computeFairnessScore(performance, poolContext);

  // 6. Reliability Score
  const reliabilityRes = computeReliabilityScore(performance);

  // Final Weighted Score (0 - 100)
  const finalScore =
    skillRes.score * weights.skill +
    availRes.score * weights.availability +
    distanceScore * weights.distance +
    qualityRes.score * weights.quality +
    fairnessRes.score * weights.fairness +
    reliabilityRes.score * weights.reliability;

  const roundedFinal = Math.round(finalScore * 10) / 10;

  const explanations = [
    skillRes.reason,
    availRes.reason,
    `Distance: ${distanceKm} km away (${distanceScore} pts)`,
    qualityRes.reason,
    fairnessRes.reason,
    reliabilityRes.reason,
  ];

  return {
    workerId: user._id,
    workerName: user.name,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    distanceKm,
    scores: {
      skillScore: skillRes.score,
      availabilityScore: availRes.score,
      distanceScore,
      qualityScore: qualityRes.score,
      fairnessScore: fairnessRes.score,
      reliabilityScore: reliabilityRes.score,
      finalScore: roundedFinal,
    },
    weights,
    explanations,
  };
};

/**
 * Main Allocation Entry Point:
 * Find and rank eligible workers using Fair Opportunity Matching
 */
const findBestWorkerMatch = async (bookingIdOrDoc, options = {}) => {
  let booking;
  if (typeof bookingIdOrDoc === 'string' || bookingIdOrDoc instanceof String || (bookingIdOrDoc && bookingIdOrDoc._bsontype === 'ObjectID') || (bookingIdOrDoc && bookingIdOrDoc.constructor && bookingIdOrDoc.constructor.name === 'ObjectId')) {
    booking = await Booking.findById(bookingIdOrDoc).populate('category').populate('serviceCategory');
  } else {
    booking = bookingIdOrDoc;
  }

  if (!booking) {
    throw new Error('Booking not found for worker matching');
  }

  if (!booking.category && booking.serviceCategory) {
    booking.category = booking.serviceCategory;
  }

  // 1. Query all potentially eligible workers
  // Criteria: Active User, Approved/Provisional Profile, Not Suspended
  const eligibleProfiles = await WorkerProfile.find({
    verificationStatus: { $in: ['approved', 'provisional'] },
  }).populate('user');

  const activeWorkerProfiles = eligibleProfiles.filter(
    (p) => p.user && p.user.status === 'active'
  );

  const workerIds = activeWorkerProfiles.map((p) => p.user._id);

  // Fetch parallel datasets
  const [performances, availabilities, liveLocations] = await Promise.all([
    WorkerPerformance.find({ worker: { $in: workerIds } }),
    WorkerAvailability.find({ worker: { $in: workerIds } }),
    WorkerLocation.find({ worker: { $in: workerIds } }),
  ]);

  const perfMap = {};
  performances.forEach((p) => {
    perfMap[p.worker.toString()] = p;
  });

  const availMap = {};
  availabilities.forEach((a) => {
    availMap[a.worker.toString()] = a;
  });

  const locationMap = {};
  liveLocations.forEach((l) => {
    locationMap[l.worker.toString()] = l;
  });

  // Exclude workers who already declined this specific booking or are excluded
  const rejectedWorkerIds = [
    ...(booking.matchingMetadata?.rejectedWorkerIds || []),
    ...(options.excludedWorkerIds || []),
  ].map((id) => id.toString());

  // Filter candidates who pass hard eligibility constraints
  const eligibleCandidates = [];

  for (const profile of activeWorkerProfiles) {
    const uId = profile.user._id.toString();

    // Skip if worker already declined this booking
    if (rejectedWorkerIds.includes(uId)) continue;

    const availability = availMap[uId];
    // Treat workers with no availability doc (never set status) as on-duty in demo mode
    // Only hard-exclude if explicitly set off-duty
    if (availability && availability.isOnDuty === false) continue;

    // Check double-booking conflicts
    const conflict = await checkWorkerDoubleBooking(
      profile.user._id,
      booking.scheduledStart,
      booking.scheduledEnd,
      booking._id
    );
    if (conflict) continue;

    // Check distance ceiling (max radius)
    const custCoords = booking.location?.coordinates || [77.209, 28.6139];
    const liveLoc = locationMap[uId];
    const wrkCoords =
      liveLoc?.location?.coordinates ||
      profile.currentLocation?.coordinates ||
      profile.homeBaseLocation?.coordinates ||
      [77.21, 28.62];

    const distKm = calculateDistanceKm(custCoords[1], custCoords[0], wrkCoords[1], wrkCoords[0]);
    // Priority: liveLoc.serviceRadiusKm -> profile.maxServiceRadiusKm -> 12km default
    const maxRadius = liveLoc?.serviceRadiusKm || profile.maxServiceRadiusKm || 12;
    if (distKm > maxRadius) continue;

    const performance = perfMap[uId] || {};

    eligibleCandidates.push({
      user: profile.user,
      profile,
      performance,
      availability,
      location: liveLoc,
    });
  }

  if (eligibleCandidates.length === 0) {
    return {
      success: false,
      message: 'No eligible verified workers currently available in this radius.',
      matchedWorker: null,
      candidatesCount: 0,
      candidatesRanked: [],
    };
  }

  // 2. Build candidate pool context for relative fairness normalization
  const maxJobs7Days = Math.max(
    ...eligibleCandidates.map((c) => c.performance.jobsCompletedLast7Days || 0),
    10
  );
  const maxEarnings7Days = Math.max(
    ...eligibleCandidates.map((c) => c.performance.earningsLast7Days || (c.performance.jobsCompletedLast7Days || 0) * 200),
    2500
  );

  const poolContext = {
    maxJobs7Days,
    maxEarnings7Days,
    totalCandidates: eligibleCandidates.length,
  };

  // 3. Score each eligible candidate
  const allScoredCandidates = eligibleCandidates
    .map((candidate) => scoreCandidateWorker(candidate, booking, poolContext, options.weights));

  // Prefer workers with skill match. If none found, include all eligible workers as fallback.
  const skilledCandidates = allScoredCandidates.filter((c) => c.scores.skillScore > 0);
  const scoredCandidates = skilledCandidates.length > 0 ? skilledCandidates : allScoredCandidates;

  if (scoredCandidates.length === 0) {
    return {
      success: false,
      message: 'No on-duty workers with the requested skill found.',
      matchedWorker: null,
      candidatesCount: 0,
      candidatesRanked: [],
    };
  }

  // 4. Quality Floor Enforcement: Fairness cannot override minimum quality standard
  const minQualityFloor = options.minQualityFloor !== undefined ? options.minQualityFloor : MIN_QUALITY_SCORE_FLOOR;
  const acceptableCandidates = scoredCandidates.filter((c) => c.scores.qualityScore >= minQualityFloor);

  // If there are candidates meeting acceptable standards, only rank them; otherwise disqualify all
  const candidatesToRank = acceptableCandidates.length > 0 ? acceptableCandidates : [];

  if (candidatesToRank.length === 0) {
    return {
      success: false,
      message: 'No candidates meet the cooperative minimum quality standard.',
      matchedWorker: null,
      candidatesCount: 0,
      candidatesRanked: scoredCandidates,
    };
  }

  // 5. Rank by finalScore descending
  candidatesToRank.sort((a, b) => b.scores.finalScore - a.scores.finalScore);

  const bestMatch = candidatesToRank[0];

  return {
    success: true,
    matchedWorker: bestMatch,
    candidatesCount: candidatesToRank.length,
    candidatesRanked: candidatesToRank,
    explanation: bestMatch.explanations,
    scoreBreakdown: bestMatch.scores,
  };
};

module.exports = {
  DEFAULT_WEIGHTS,
  MIN_QUALITY_SCORE_FLOOR,
  BAYESIAN_PRIOR,
  calculateDistanceKm,
  computeDistanceScore,
  computeSkillScore,
  computeAvailabilityScore,
  computeQualityScore,
  computeReliabilityScore,
  computeFairnessScore,
  scoreCandidateWorker,
  findBestWorkerMatch,
};
