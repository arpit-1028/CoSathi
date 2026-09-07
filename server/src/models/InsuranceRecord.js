const mongoose = require('mongoose');

const insuranceRecordSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      default: 'Pradhan Mantri Suraksha Bima Yojana (PMSBY)',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'expired', 'claimed'],
      default: 'active',
      index: true,
    },
    coverageType: {
      type: String,
      default: 'Accidental Death & Disability Cover',
    },
    coverageAmount: {
      type: Number,
      required: true,
      default: 200000, // ₹2 Lakh coverage
    },
    annualPremium: {
      type: Number,
      required: true,
      default: 436, // ₹436/yr
    },
    subsidizedByCooperative: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    nominee: {
      name: String,
      relationship: String,
      phone: String,
    },
    claimsHistory: [
      {
        claimNumber: String,
        amount: Number,
        reason: String,
        status: {
          type: String,
          enum: ['filed', 'investigating', 'approved', 'rejected'],
          default: 'filed',
        },
        filedAt: {
          type: Date,
          default: Date.now,
        },
        resolvedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

insuranceRecordSchema.index({ worker: 1, status: 1 });

module.exports = mongoose.model('InsuranceRecord', insuranceRecordSchema);
