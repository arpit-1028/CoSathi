const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    punctualityRating: { type: Number, min: 1, max: 5, default: 5 },
    qualityRating: { type: Number, min: 1, max: 5, default: 5 },
    behaviorRating: { type: Number, min: 1, max: 5, default: 5 },
    comment: String,
    tags: [
      {
        type: String,
        enum: ['On time', 'Professional', 'Good quality', 'Fair pricing', 'Clean work'],
      },
    ],
    issues: [
      {
        type: String,
        enum: ['Overcharged', 'Incomplete', 'Late', 'Poor quality', 'Other'],
      },
    ],
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
    },
    cooperativeBadge: String,
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ worker: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
