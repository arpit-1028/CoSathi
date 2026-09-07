const mongoose = require('mongoose');

const bookingAssignmentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    offeredAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    responseStatus: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending',
      index: true,
    },
    responseTimestamp: Date,
    fairScoreAtOffer: {
      type: Number,
      default: 1.0,
    },
    distanceKm: Number,
    declineReason: String,
  },
  {
    timestamps: true,
  }
);

bookingAssignmentSchema.index({ booking: 1, worker: 1 });

module.exports = mongoose.model('BookingAssignment', bookingAssignmentSchema);
