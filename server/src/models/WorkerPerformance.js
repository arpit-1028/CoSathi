const mongoose = require('mongoose');

const workerPerformanceSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    lifetimeJobsCompleted: {
      type: Number,
      default: 0,
    },
    jobsCompletedLast7Days: {
      type: Number,
      default: 0,
      index: true,
    },
    jobsCompletedLast30Days: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    totalRatingsCount: {
      type: Number,
      default: 0,
    },
    acceptanceRatePercent: {
      type: Number,
      default: 100,
    },
    cancellationRatePercent: {
      type: Number,
      default: 0,
    },
    fairDistributionScore: {
      type: Number,
      default: 1.0,
      index: true,
    },
    totalEarningsLifetime: {
      type: Number,
      default: 0,
    },
    earningsLast7Days: {
      type: Number,
      default: 0,
    },
    utilizationLast7Days: {
      type: Number,
      default: 0.4,
    },
    totalOffersCount: {
      type: Number,
      default: 0,
    },
    declinedOffersCount: {
      type: Number,
      default: 0,
    },
    consecutiveDeclines: {
      type: Number,
      default: 0,
    },
    completionRatePercent: {
      type: Number,
      default: 98,
    },
    complaintsCount: {
      type: Number,
      default: 0,
    },
    noShowCount: {
      type: Number,
      default: 0,
    },
    noShowRatePercent: {
      type: Number,
      default: 0,
    },
    ratingDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    tagCounts: {
      onTime: { type: Number, default: 0 },
      professional: { type: Number, default: 0 },
      goodQuality: { type: Number, default: 0 },
      fairPricing: { type: Number, default: 0 },
      cleanWork: { type: Number, default: 0 },
    },
    issueCounts: {
      overcharged: { type: Number, default: 0 },
      incomplete: { type: Number, default: 0 },
      late: { type: Number, default: 0 },
      poorQuality: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
    performanceHistory: [
      {
        timestamp: { type: Date, default: Date.now },
        averageRating: Number,
        jobsCompleted: Number,
        complaintsCount: Number,
        fairnessScore: Number,
        reason: String,
      },
    ],
    lastAssignedAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

workerPerformanceSchema.index({ cooperative: 1, fairDistributionScore: -1 });

module.exports = mongoose.model('WorkerPerformance', workerPerformanceSchema);
