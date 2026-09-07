const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
    },
    message: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
    },
    type: {
      type: String,
      enum: [
        'booking_offer',
        'booking_status',
        'payment_received',
        'welfare_credit',
        'dispute_update',
        'system',
      ],
      required: true,
      index: true,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
