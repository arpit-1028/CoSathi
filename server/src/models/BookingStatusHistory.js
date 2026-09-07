const mongoose = require('mongoose');

const bookingStatusHistorySchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    fromStatus: String,
    toStatus: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reason: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

bookingStatusHistorySchema.index({ booking: 1, timestamp: -1 });

module.exports = mongoose.model('BookingStatusHistory', bookingStatusHistorySchema);
