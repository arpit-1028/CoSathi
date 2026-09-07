const mongoose = require('mongoose');

const workerLocationSchema = new mongoose.Schema(
  {
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    heading: Number,
    speed: Number,
    batteryLevel: Number,
    serviceRadiusKm: {
      type: Number,
      default: 12,
    },
    isTrackingActive: {
      type: Boolean,
      default: true,
    },
    lastAddressText: String,
  },
  {
    timestamps: true,
  }
);

workerLocationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('WorkerLocation', workerLocationSchema);
