const mongoose = require('mongoose');

const billLineItemSchema = new mongoose.Schema({
  code: { type: String, required: true },
  serviceCode: { type: String }, // compatibility alias
  name: { type: String, required: true },
  title: { type: String }, // compatibility alias
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true },
  unitRate: { type: Number }, // compatibility alias
  subtotal: { type: Number, required: true },
  minPrice: { type: Number },
  maxPrice: { type: Number },
  unit: { type: String, default: 'per_unit' },
  rateCardVersion: { type: String, default: 'v1' },
});

billLineItemSchema.pre('validate', function (next) {
  if (this.code && !this.serviceCode) this.serviceCode = this.code;
  if (this.serviceCode && !this.code) this.code = this.serviceCode;

  if (this.name && !this.title) this.title = this.name;
  if (this.title && !this.name) this.name = this.title;

  if (this.unitPrice !== undefined && this.unitRate === undefined) this.unitRate = this.unitPrice;
  if (this.unitRate !== undefined && this.unitPrice === undefined) this.unitPrice = this.unitRate;

  if (this.unitPrice !== undefined && this.quantity !== undefined) {
    this.subtotal = Math.round(this.unitPrice * this.quantity);
  }

  next();
});

const billSchema = new mongoose.Schema(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    rateCardVersion: {
      type: String,
      required: true,
      default: 'v2026.1',
    },
    lineItems: [billLineItemSchema],
    grossAmount: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number, // alias for grossAmount
    },
    // Cooperative 10% Share
    cooperativeShare: {
      type: Number,
      required: true,
      default: 0,
    },
    cooperativeWelfareDeduction: {
      type: Number,
      default: 0, // compatibility alias
    },
    // Worker 90% Share
    workerShare: {
      type: Number,
      required: true,
    },
    workerNetEarnings: {
      type: Number, // compatibility alias
    },
    discount: {
      type: Number,
      default: 0,
    },
    netPayable: {
      type: Number,
      required: true,
    },
    billStatus: {
      type: String,
      enum: ['draft', 'presented', 'finalized', 'paid', 'settled', 'disputed'],
      default: 'draft',
      index: true,
    },
    customerApproved: {
      type: Boolean,
      default: false,
    },
    rateSnapshot: {
      rateCardVersion: { type: String, default: 'v2026.1' },
      snapshotDate: { type: Date, default: Date.now },
      frozen: { type: Boolean, default: true },
      itemsSnapshot: [mongoose.Schema.Types.Mixed],
    },
    paidAt: Date,
    paymentMethod: String,
    transactionId: String,
  },
  {
    timestamps: true,
  }
);

billSchema.pre('validate', function (next) {
  if (this.grossAmount !== undefined && this.totalAmount === undefined) {
    this.totalAmount = this.grossAmount;
  }
  if (this.totalAmount !== undefined && this.grossAmount === undefined) {
    this.grossAmount = this.totalAmount;
  }

  // 90% Worker / 10% Cooperative Fund calculation
  if (this.grossAmount !== undefined) {
    if (this.workerShare === undefined) {
      this.workerShare = Math.round(this.grossAmount * 0.90);
    }
    if (this.cooperativeShare === undefined) {
      this.cooperativeShare = this.grossAmount - this.workerShare;
    }
    this.workerNetEarnings = this.workerShare;
    this.cooperativeWelfareDeduction = this.cooperativeShare;
    this.netPayable = this.grossAmount - (this.discount || 0);
  }

  next();
});

module.exports = mongoose.model('Bill', billSchema);
