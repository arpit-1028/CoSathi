const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  serviceCode: { type: String },
  quantity: { type: Number, default: 1 },
  rate: { type: Number, default: 0 },
  estimatedPrice: { type: Number, default: 0 },
  unit: { type: String, default: 'item' },
});

const timelineItemSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  note: { type: String },
});

const bookingSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Core Customer Reference
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Compatibility alias
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Assigned Worker Reference
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Compatibility alias
    assignedWorker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Cooperative Category Reference
    serviceCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: true,
      index: true,
    },
    // Compatibility alias
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      index: true,
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      index: true,
    },
    // Explicit Tasks & Voice Transcript
    tasks: [taskItemSchema],
    voiceTranscript: {
      type: String,
    },
    requirementInput: {
      rawText: String,
      audioTranscript: String,
      languageDetected: { type: String, default: 'en' },
      inputType: {
        type: String,
        enum: ['text', 'voice'],
        default: 'text',
      },
      parsedTasks: [
        {
          taskCode: String,
          title: String,
          estimatedUnits: { type: Number, default: 1 },
          estimatedPrice: Number,
        },
      ],
    },
    initialEstimate: {
      type: Number,
      required: true,
    },
    finalPrice: {
      type: Number,
    },
    scheduledStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    scheduledEnd: {
      type: Date,
    },
    address: {
      addressLine: { type: String, required: true },
      landmark: String,
      city: { type: String, default: 'Delhi' },
      pincode: { type: String, default: '110024' },
      fullAddress: String,
    },
    location: {
      addressLine: String,
      city: { type: String, default: 'Delhi' },
      pincode: String,
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    // Explicit Booking State Machine
    status: {
      type: String,
      enum: [
        'DRAFT',
        'MATCHING',
        'OFFERED',
        'ASSIGNED',
        'ACCEPTED',
        'ON_THE_WAY',
        'ARRIVED',
        'IN_PROGRESS',
        'WORK_SUBMITTED',
        'BILL_GENERATED',
        'CUSTOMER_APPROVAL',
        'PAID',
        'COMPLETED',
        'CANCELLED',
        'UNFULFILLED',
        'DISPUTED',
        // Legacy lowercase values mapped gracefully
        'created',
        'matching',
        'offered',
        'accepted',
        'en_route',
        'in_progress',
        'work_reported',
        'priced',
        'payment_pending',
        'completed',
        'cancelled',
        'disputed',
      ],
      default: 'DRAFT',
      uppercase: true,
      index: true,
    },
    matchingMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({
        attempts: 0,
        candidateWorkerIds: [],
        rejectedWorkerIds: [],
        dispatchedAt: null,
        timeoutSeconds: 60,
      }),
    },
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
    },
    cancellationReason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    disputeReason: String,
    timeline: [timelineItemSchema],
  },
  {
    timestamps: true,
  }
);

// Sync aliases & normalize defaults before save
bookingSchema.pre('save', function (next) {
  if (this.customerId && !this.customer) this.customer = this.customerId;
  if (this.customer && !this.customerId) this.customerId = this.customer;

  if (this.workerId && !this.assignedWorker) this.assignedWorker = this.workerId;
  if (this.assignedWorker && !this.workerId) this.workerId = this.assignedWorker;

  if (this.serviceCategory && !this.category) this.category = this.serviceCategory;
  if (this.category && !this.serviceCategory) this.serviceCategory = this.category;

  if (this.address?.addressLine && !this.location?.addressLine) {
    this.location.addressLine = this.address.addressLine;
  }
  if (!this.scheduledEnd && this.scheduledStart) {
    // Default 2 hours duration
    this.scheduledEnd = new Date(new Date(this.scheduledStart).getTime() + 2 * 60 * 60 * 1000);
  }

  next();
});

bookingSchema.index({ 'location.coordinates': '2dsphere' });
bookingSchema.index({ customerId: 1, status: 1 });
bookingSchema.index({ workerId: 1, status: 1 });
bookingSchema.index({ scheduledStart: 1, scheduledEnd: 1 });
bookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', bookingSchema);
