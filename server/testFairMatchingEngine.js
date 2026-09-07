const {
  DEFAULT_WEIGHTS,
  computeSkillScore,
  computeDistanceScore,
  computeQualityScore,
  computeReliabilityScore,
  computeFairnessScore,
  scoreCandidateWorker,
} = require('./src/services/fairMatchingEngine');

console.log('===========================================================');
console.log('⭐ COSATHI FAIR WORKER MATCHING ENGINE TEST SUITE ⭐');
console.log('===========================================================');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

// -------------------------------------------------------------------
// TEST 1: Bayesian Quality Rating (5.0 with 2 reviews vs 4.8 with 150 reviews)
// -------------------------------------------------------------------
console.log('\n--- 1. Testing Bayesian Quality Rating Algorithm ---');
const fewReviewsWorker = computeQualityScore({
  averageRating: 5.0,
  totalRatingsCount: 2,
  lifetimeJobsCompleted: 2,
});

const veteranWorker = computeQualityScore({
  averageRating: 4.8,
  totalRatingsCount: 150,
  lifetimeJobsCompleted: 150,
});

console.log(`Few Reviews Worker (5.0 ★, 2 reviews)   -> Bayesian Rating: ${fewReviewsWorker.bayesianRating} ★, Quality Score: ${fewReviewsWorker.score}`);
console.log(`Veteran Worker     (4.8 ★, 150 reviews) -> Bayesian Rating: ${veteranWorker.bayesianRating} ★, Quality Score: ${veteranWorker.score}`);

assert(
  veteranWorker.bayesianRating > fewReviewsWorker.bayesianRating,
  'Veteran worker (4.8 with 150 reviews) has higher Bayesian confidence rating than 5.0 with 2 reviews'
);
assert(
  veteranWorker.score > fewReviewsWorker.score,
  'Veteran worker has higher overall quality score than new worker with 2 reviews'
);

// -------------------------------------------------------------------
// TEST 2: Distance Score Normalization
// -------------------------------------------------------------------
console.log('\n--- 2. Testing Distance Normalization & Decay ---');
const dist05 = computeDistanceScore(0.5, 10);
const dist2 = computeDistanceScore(2.0, 10);
const dist5 = computeDistanceScore(5.0, 10);
const dist10 = computeDistanceScore(10.0, 10);
const dist15 = computeDistanceScore(15.0, 10);

console.log(`Distance 0.5 km -> Score: ${dist05}`);
console.log(`Distance 2.0 km -> Score: ${dist2}`);
console.log(`Distance 5.0 km -> Score: ${dist5}`);
console.log(`Distance 10.0 km -> Score: ${dist10}`);
console.log(`Distance 15.0 km (outside radius) -> Score: ${dist15}`);

assert(dist05 === 100, 'Inside 1.0 km receives full 100 points');
assert(dist2 > dist5 && dist5 > dist10, 'Closer worker receives strictly higher score with linear decay');
assert(dist15 === 0, 'Worker outside 10 km max radius receives 0 points');

// -------------------------------------------------------------------
// TEST 3: Skill Matching Algorithm
// -------------------------------------------------------------------
console.log('\n--- 3. Testing Skill Match Scoring ---');
const primaryMatch = computeSkillScore('Electrical Works', 'electrical-works', {
  primarySkill: 'Electrical',
  skills: [],
});
const secondaryMatch = computeSkillScore('Electrical Works', 'electrical-works', {
  primarySkill: 'Plumbing',
  skills: [{ category: 'Electrical Works' }],
});
const crossTradeMatch = computeSkillScore('Electrical Works', 'electrical-works', {
  primarySkill: 'Appliance Repair',
  skills: [],
});
const noMatch = computeSkillScore('Electrical Works', 'electrical-works', {
  primarySkill: 'Painting',
  skills: [],
});

assert(primaryMatch.score === 100, 'Primary trade match receives 100 points');
assert(secondaryMatch.score === 80, 'Secondary certified trade receives 80 points');
assert(crossTradeMatch.score === 65, 'Cross-compatible trade receives 65 points');
assert(noMatch.score === 0, 'Unrelated trade receives 0 points');

// -------------------------------------------------------------------
// TEST 4: Anti-Gaming Safeguards on Declines
// -------------------------------------------------------------------
console.log('\n--- 4. Testing Anti-Gaming Safeguards (Excessive Declines) ---');
const normalWorkerFairness = computeFairnessScore({
  jobsCompletedLast7Days: 2,
  consecutiveDeclines: 0,
  declinedOffersCount: 0,
});
const gamingWorkerFairness = computeFairnessScore({
  jobsCompletedLast7Days: 2,
  consecutiveDeclines: 4,
  declinedOffersCount: 5,
  totalOffersCount: 7,
});

console.log(`Normal Worker (2 jobs, 0 declines) -> Fairness Score: ${normalWorkerFairness.score}`);
console.log(`Gaming Worker (2 jobs, 4 declines) -> Fairness Score: ${gamingWorkerFairness.score} (Deduction: -${gamingWorkerFairness.antiGamingDeduction})`);

assert(
  gamingWorkerFairness.score < normalWorkerFairness.score,
  'Anti-gaming safeguard penalizes worker who repeatedly declines offers'
);

// -------------------------------------------------------------------
// TEST 5: MANDATED THREE DEMO WORKER COMPETITION TEST ⭐
// -------------------------------------------------------------------
console.log('\n===========================================================');
console.log('⭐ 5. MANDATED THREE DEMO WORKERS COMPETITION TEST ⭐');
console.log('===========================================================');
console.log('Candidate Profiles:');
console.log('  Worker A: 4.9 ★, 200 jobs completed, 12 recent bookings (Overloaded)');
console.log('  Worker B: 4.6 ★,  90 jobs completed,  3 recent bookings (High fairness need)');
console.log('  Worker C: 4.8 ★, 150 jobs completed,  6 recent bookings (Moderate workload)');

const bookingFixture = {
  category: { name: { en: 'Electrical Works' }, slug: 'electrical-works' },
  location: { coordinates: [77.24, 28.57] }, // Customer in Lajpat Nagar
  scheduledStart: new Date(),
  scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000),
};

const candidateA = {
  user: { _id: 'worker_A_id', name: 'Ramesh Kumar (Worker A)', phone: '9810010001' },
  profile: {
    primarySkill: 'Electrical',
    skills: [],
    homeBaseLocation: { coordinates: [77.245, 28.572] }, // ~0.8 km away
    maxServiceRadiusKm: 10,
  },
  performance: {
    averageRating: 4.9,
    totalRatingsCount: 200,
    lifetimeJobsCompleted: 200,
    jobsCompletedLast7Days: 12,
    earningsLast7Days: 2400,
    utilizationLast7Days: 0.75,
    lastAssignedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4h ago
    completionRatePercent: 98,
    acceptanceRatePercent: 96,
  },
  availability: { isOnDuty: true, currentStatus: 'idle' },
};

const candidateB = {
  user: { _id: 'worker_B_id', name: 'Mohan Lal (Worker B)', phone: '9810010002' },
  profile: {
    primarySkill: 'Electrical',
    skills: [],
    homeBaseLocation: { coordinates: [77.248, 28.575] }, // ~1.2 km away
    maxServiceRadiusKm: 10,
  },
  performance: {
    averageRating: 4.6,
    totalRatingsCount: 90,
    lifetimeJobsCompleted: 90,
    jobsCompletedLast7Days: 3,
    earningsLast7Days: 600,
    utilizationLast7Days: 0.20,
    lastAssignedAt: new Date(Date.now() - 52 * 60 * 60 * 1000), // 52h ago
    completionRatePercent: 98,
    acceptanceRatePercent: 95,
  },
  availability: { isOnDuty: true, currentStatus: 'idle' },
};

const candidateC = {
  user: { _id: 'worker_C_id', name: 'Suresh Yadav (Worker C)', phone: '9810010003' },
  profile: {
    primarySkill: 'Electrical',
    skills: [],
    homeBaseLocation: { coordinates: [77.246, 28.573] }, // ~1.0 km away
    maxServiceRadiusKm: 10,
  },
  performance: {
    averageRating: 4.8,
    totalRatingsCount: 150,
    lifetimeJobsCompleted: 150,
    jobsCompletedLast7Days: 6,
    earningsLast7Days: 1200,
    utilizationLast7Days: 0.40,
    lastAssignedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h ago
    completionRatePercent: 98,
    acceptanceRatePercent: 95,
  },
  availability: { isOnDuty: true, currentStatus: 'idle' },
};

const poolContext = {
  maxJobs7Days: 12,
  maxEarnings7Days: 2400,
  totalCandidates: 3,
};

const scoredA = scoreCandidateWorker(candidateA, bookingFixture, poolContext, DEFAULT_WEIGHTS);
const scoredB = scoreCandidateWorker(candidateB, bookingFixture, poolContext, DEFAULT_WEIGHTS);
const scoredC = scoreCandidateWorker(candidateC, bookingFixture, poolContext, DEFAULT_WEIGHTS);

console.log('\n--- DETAILED SCORE COMPARISON TABLE ---');
console.log('Metric                  | Worker A      | Worker B      | Worker C      | Weight');
console.log('------------------------|---------------|---------------|---------------|-------');
console.log(`Skill Match (0-100)     | ${scoredA.scores.skillScore.toString().padEnd(13)} | ${scoredB.scores.skillScore.toString().padEnd(13)} | ${scoredC.scores.skillScore.toString().padEnd(13)} | 25%`);
console.log(`Availability (0-100)    | ${scoredA.scores.availabilityScore.toString().padEnd(13)} | ${scoredB.scores.availabilityScore.toString().padEnd(13)} | ${scoredC.scores.availabilityScore.toString().padEnd(13)} | 15%`);
console.log(`Distance Score (0-100)  | ${scoredA.scores.distanceScore.toString().padEnd(13)} | ${scoredB.scores.distanceScore.toString().padEnd(13)} | ${scoredC.scores.distanceScore.toString().padEnd(13)} | 15%`);
console.log(`Quality Score (0-100)   | ${scoredA.scores.qualityScore.toString().padEnd(13)} | ${scoredB.scores.qualityScore.toString().padEnd(13)} | ${scoredC.scores.qualityScore.toString().padEnd(13)} | 15%`);
console.log(`Fairness Score (0-100)  | ${scoredA.scores.fairnessScore.toString().padEnd(13)} | ${scoredB.scores.fairnessScore.toString().padEnd(13)} | ${scoredC.scores.fairnessScore.toString().padEnd(13)} | 25%`);
console.log(`Reliability (0-100)     | ${scoredA.scores.reliabilityScore.toString().padEnd(13)} | ${scoredB.scores.reliabilityScore.toString().padEnd(13)} | ${scoredC.scores.reliabilityScore.toString().padEnd(13)} |  5%`);
console.log('------------------------|---------------|---------------|---------------|-------');
console.log(`FINAL WEIGHTED SCORE    | ${scoredA.scores.finalScore.toString().padEnd(13)} | ${scoredB.scores.finalScore.toString().padEnd(13)} | ${scoredC.scores.finalScore.toString().padEnd(13)} | 100%`);

// Sort by finalScore descending
const rankings = [scoredA, scoredB, scoredC].sort((a, b) => b.scores.finalScore - a.scores.finalScore);
console.log(`\n🏆 WINNER DETERMINED BY ALGORITHM: ${rankings[0].workerName} with Final Score ${rankings[0].scores.finalScore}/100!`);
console.log('Audit Explanations:');
rankings[0].explanations.forEach((exp) => console.log(`  • ${exp}`));

assert(
  rankings[0].workerId === 'worker_B_id',
  'Worker B wins the match because fairness opportunity properly balances quality and recent workload!'
);
assert(
  scoredB.scores.fairnessScore > scoredA.scores.fairnessScore,
  'Worker B fairness score (3 recent jobs) is significantly higher than Worker A (12 recent jobs)'
);
assert(
  scoredB.scores.finalScore > scoredC.scores.finalScore && scoredC.scores.finalScore > scoredA.scores.finalScore,
  'Final rankings follow B > C > A reflecting healthy cooperative opportunity distribution'
);

console.log('\n===========================================================');
console.log(`SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
console.log('===========================================================');
