const mongoose = require('mongoose');

const welfareRecordSchema = new mongoose.Schema(
  {
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    type: {
      type: String,
      enum: [
        'contribution_deduction',
        'payout_medical',
        'payout_education',
        'payout_emergency',
        'interest_credit',
      ],
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    runningWelfareBalance: {
      type: Number,
    },
    approvedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

welfareRecordSchema.index({ worker: 1, date: -1 });

module.exports = mongoose.model('WelfareRecord', welfareRecordSchema);
