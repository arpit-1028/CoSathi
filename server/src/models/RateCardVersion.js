const mongoose = require('mongoose');

const rateCardVersionSchema = new mongoose.Schema(
  {
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    versionNumber: {
      type: String,
      required: true,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveUntil: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

rateCardVersionSchema.index({ cooperative: 1, versionNumber: 1 }, { unique: true });

module.exports = mongoose.model('RateCardVersion', rateCardVersionSchema);
