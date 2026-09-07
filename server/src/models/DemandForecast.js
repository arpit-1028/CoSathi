const mongoose = require('mongoose');

const demandForecastSchema = new mongoose.Schema(
  {
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    zone: {
      type: String,
      required: true,
      index: true,
    },
    serviceCategory: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    },
    forecastDate: {
      type: Date,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: String,
      enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    predictedDemand: {
      type: Number,
      required: true,
    },
    predictedBookingVolume: {
      type: Number, // alias for backwards compatibility
    },
    availableCapacity: {
      type: Number,
      required: true,
      default: 0,
    },
    capacityGap: {
      type: Number,
      required: true,
      default: 0,
    },
    growthTrendPercent: {
      type: Number,
      default: 0,
    },
    recommendation: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
    },
    confidenceScore: {
      type: Number,
      default: 0.88,
    },
    methodology: {
      type: String,
      default: 'WMA_3_WEEKS_PLUS_DOW_AND_RECENT_TREND',
    },
    modelLabel: {
      type: String,
      default: 'AI-assisted demand forecast',
    },
    factors: {
      historicalAverage: Number,
      weightedMovingAverage: Number,
      dayOfWeekMultiplier: Number,
      recentTrendRate: Number,
      workerSupplyAvailable: Number,
      season: String,
    },
  },
  {
    timestamps: true,
  }
);

demandForecastSchema.index({ zone: 1, serviceCategory: 1, forecastDate: 1 });

module.exports = mongoose.model('DemandForecast', demandForecastSchema);
