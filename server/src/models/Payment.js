const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['mock_upi', 'cash', 'card', 'wallet'],
      default: 'mock_upi',
    },
    paymentStatus: {
      type: String,
      enum: ['initiated', 'success', 'failed', 'refunded'],
      default: 'initiated',
      index: true,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ customer: 1, paymentStatus: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
