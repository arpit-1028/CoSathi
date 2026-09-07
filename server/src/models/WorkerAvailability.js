const mongoose = require('mongoose');

const workerAvailabilitySchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    isOnDuty: {
      type: Boolean,
      default: false,
      index: true,
    },
    currentStatus: {
      type: String,
      enum: ['idle', 'offered', 'en_route', 'busy_on_job', 'offline'],
      default: 'offline',
      index: true,
    },
    activeBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    lastStatusChange: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

workerAvailabilitySchema.index({ isOnDuty: 1, currentStatus: 1 });

module.exports = mongoose.model('WorkerAvailability', workerAvailabilitySchema);
