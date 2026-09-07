const mongoose = require('mongoose');

const cooperativeFundSchema = new mongoose.Schema(
  {
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      unique: true,
      index: true,
    },
    totalFundBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    buckets: {
      insurance: {
        type: Number,
        default: 0,
        min: 0,
      },
      emergencyWelfare: {
        type: Number,
        default: 0,
        min: 0,
      },
      skillsTraining: {
        type: Number,
        default: 0,
        min: 0,
      },
      platformOperations: {
        type: Number,
        default: 0,
        min: 0,
      },
      reserve: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    allocationPercentages: {
      insurance: { type: Number, default: 30 }, // 30%
      emergencyWelfare: { type: Number, default: 25 }, // 25%
      skillsTraining: { type: Number, default: 20 }, // 20%
      platformOperations: { type: Number, default: 15 }, // 15%
      reserve: { type: Number, default: 10 }, // 10%
    },
    totalDisbursedToDate: {
      type: Number,
      default: 0,
    },
    lastAllocatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CooperativeFund', cooperativeFundSchema);
