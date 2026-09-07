const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const {
  Booking,
  WorkerProfile,
  WorkerAvailability,
  DemandForecast,
  Cooperative,
  ServiceCategory,
  User,
} = require('./src/models');

const {
  computeStatisticalForecast,
  analyzeHistoricalBookings,
  getAvailableWorkerCapacity,
  seedHistoricalBookingsIfSparse,
} = require('./src/services/forecastService');

async function runDemandForecastTests() {
  console.log('===============================================================');
  console.log('       PHASE 14: AI-BASED DEMAND FORECASTING TEST SUITE        ');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS ${total}] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL ${total}] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const { connectDB } = require('./src/config/db');
  console.log('Connecting to database via connectDB()...');
  await connectDB();

  try {
    // 1. Seed Historical Data Verification
    console.log('\n--- 1. Historical Booking Data Analysis ---');
    const seedResult = await seedHistoricalBookingsIfSparse();
    const bookingCount = await Booking.countDocuments({});
    assert(bookingCount >= 30, `Historical bookings available in MongoDB (Count: ${bookingCount})`);

    const analysis = await analyzeHistoricalBookings(30);
    assert(analysis.totalSampled > 0, `Analyzed ${analysis.totalSampled} bookings across 30-day window`);
    assert(analysis.tradeStats.plumbing !== undefined, 'Trade breakdown computed for Plumbing');
    assert(analysis.tradeStats.electrical !== undefined, 'Trade breakdown computed for Electrical');
    assert(analysis.tradeStats.cleaning !== undefined, 'Trade breakdown computed for Cleaning');
    assert(Object.keys(analysis.overallDowCounts).length === 7, 'Day-of-week distribution tracks all 7 days');

    // 2. Capacity Lookup Verification
    console.log('\n--- 2. On-Duty Worker Capacity Matrix ---');
    const capacity = await getAvailableWorkerCapacity();
    assert(typeof capacity === 'object', 'Worker capacity matrix generated');
    assert(capacity['Indirapuram'] !== undefined, 'Zone Indirapuram capacity present');
    assert(capacity['Indirapuram']['plumbing'] > 0, `Indirapuram Plumbing capacity: ${capacity['Indirapuram']['plumbing']}`);
    assert(capacity['Lajpat Nagar']['electrical'] > 0, `Lajpat Nagar Electrical capacity: ${capacity['Lajpat Nagar']['electrical']}`);

    // 3. Statistical Forecast Engine Execution
    console.log('\n--- 3. Statistical Forecast Calculation (WMA + DOW + Trend) ---');
    const forecast = await computeStatisticalForecast();

    assert(forecast.success === true, 'Forecast computation returned success');
    assert(forecast.modelLabel === 'AI-assisted demand forecast', 'Model strictly labeled as "AI-assisted demand forecast"');
    assert(forecast.tradeGrowthTrends.length === 3, 'Returns 3 trade growth momentum metrics');

    const plumbingTrend = forecast.tradeGrowthTrends.find((t) => t.categorySlug === 'plumbing');
    const electricalTrend = forecast.tradeGrowthTrends.find((t) => t.categorySlug === 'electrical');
    const cleaningTrend = forecast.tradeGrowthTrends.find((t) => t.categorySlug === 'cleaning');

    assert(plumbingTrend && plumbingTrend.growthPercent > 0, `Plumbing growth trend: +${plumbingTrend.growthPercent}%`);
    assert(electricalTrend && electricalTrend.growthPercent > 0, `Electrical growth trend: +${electricalTrend.growthPercent}%`);
    assert(cleaningTrend && cleaningTrend.growthPercent > 0, `Cleaning growth trend: +${cleaningTrend.growthPercent}%`);

    // 4. 7-Day Horizon Projections Verification
    console.log('\n--- 4. 7-Day Horizon Projections ---');
    assert(Array.isArray(forecast.horizonProjections), 'Horizon projections is an array');
    assert(forecast.horizonProjections.length === 7, `Horizon includes exact 7-day projection timeline (${forecast.horizonProjections.length} days)`);

    const day1 = forecast.horizonProjections[0];
    assert(day1.date !== undefined && day1.dayOfWeek !== undefined, `Day 1 structured correctly (${day1.date} - ${day1.dayOfWeek})`);
    assert(day1.projections.length > 0, `Day 1 contains ${day1.projections.length} zone-trade projections`);

    // Check specific projection factors
    const sampleProj = day1.projections[0];
    assert(sampleProj.predictedDemand > 0, `Predicted demand is positive (${sampleProj.predictedDemand})`);
    assert(sampleProj.factors.weightedMovingAverage !== undefined, 'Factors include explainable Weighted Moving Average');
    assert(sampleProj.factors.dayOfWeekMultiplier !== undefined, 'Factors include explainable Day-of-Week multiplier');
    assert(sampleProj.factors.recentTrendRate !== undefined, 'Factors include explainable recent trend momentum');

    // 5. Capacity Gap & Allocation Recommendation (Indirapuram Plumbing Gap = 5)
    console.log('\n--- 5. Capacity Gap & Workforce Allocation Logic ---');
    const sampleGap = forecast.sampleGapHighlight;
    assert(sampleGap.zone === 'Indirapuram', 'Sample gap highlight zone is Indirapuram');
    assert(sampleGap.trade === 'Plumbing', 'Sample gap highlight trade is Plumbing');
    assert(sampleGap.expectedDemand === 13, `Expected demand matches benchmark: ${sampleGap.expectedDemand}`);
    assert(sampleGap.availableCapacity === 8, `Available capacity matches benchmark: ${sampleGap.availableCapacity}`);
    assert(sampleGap.capacityGap === 5, `Capacity gap matches formula (13 - 8 = 5): ${sampleGap.capacityGap}`);
    assert(sampleGap.recommendation.includes('5 additional plumbers may be required'), `Recommendation formatted correctly: "${sampleGap.recommendation}"`);

    // 6. Natural Language Operational Briefing (Gemini / Structured)
    console.log('\n--- 6. Natural Language Briefing & Non-Hallucination Disclaimer ---');
    assert(forecast.aiBriefing !== undefined, 'AI Briefing object is present');
    assert(typeof forecast.aiBriefing.text === 'string' && forecast.aiBriefing.text.length > 20, 'AI Briefing contains substantive operational summary');
    assert(forecast.aiBriefing.text.includes('Plumbing') || forecast.aiBriefing.text.includes('surge'), 'Briefing refers to calculated trade surges');
    assert(forecast.aiBriefing.text.includes('Admin makes all final shift assignments') || forecast.aiBriefing.text.includes('Admin'), 'Briefing clarifies cooperative admin retains decision authority');

    // 7. Database Persistence
    console.log('\n--- 7. DemandForecast MongoDB Collection Records ---');
    const savedRecords = await DemandForecast.countDocuments({});
    assert(savedRecords > 0, `Persisted ${savedRecords} DemandForecast documents into MongoDB`);

    const sampleDbRecord = await DemandForecast.findOne({ zone: 'Indirapuram', serviceCategory: 'plumbing' }).sort({ forecastDate: 1 });
    assert(sampleDbRecord !== null, 'Found persisted Indirapuram plumbing forecast record in MongoDB');
    assert(sampleDbRecord.capacityGap !== undefined, `Persisted capacityGap: ${sampleDbRecord.capacityGap}`);
    assert(sampleDbRecord.modelLabel === 'AI-assisted demand forecast', `Persisted modelLabel: "${sampleDbRecord.modelLabel}"`);

    console.log('\n===============================================================');
    console.log(`       ALL ${passed}/${total} PHASE 14 FORECASTING TESTS PASSED!       `);
    console.log('===============================================================\n');
  } finally {
    await mongoose.disconnect();
  }
}

runDemandForecastTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
