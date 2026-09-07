const mongoose = require('mongoose');

const rateCardItemSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // Compatibility alias
    serviceCode: {
      type: String,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.Mixed, // ObjectId ref to ServiceCategory OR category slug string
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    nameHindi: {
      type: String,
      default: '',
    },
    // Compatibility alias
    title: {
      en: { type: String },
      hi: { type: String },
    },
    description: {
      en: { type: String, default: '' },
      hi: { type: String, default: '' },
    },
    unit: {
      type: String,
      enum: ['per_unit', 'fixed', 'per_hour', 'per_point', 'per_room'],
      default: 'per_unit',
    },
    // Compatibility alias
    billingType: {
      type: String,
      enum: ['per_unit', 'fixed', 'per_hour', 'per_point', 'per_room'],
      default: 'per_unit',
    },
    basePrice: {
      type: Number,
      required: true,
    },
    // Compatibility alias
    standardRate: {
      type: Number,
    },
    minPrice: {
      type: Number,
      required: true,
    },
    // Compatibility alias
    cooperativeMinRate: {
      type: Number,
    },
    maxPrice: {
      type: Number,
      required: true,
    },
    // Compatibility alias
    cooperativeMaxRate: {
      type: Number,
    },
    durationMinutes: {
      type: Number,
      default: 45,
    },
    // Compatibility alias
    estimatedDurationMinutes: {
      type: Number,
      default: 45,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Compatibility alias
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate & pre-save hook to synchronize aliases seamlessly
rateCardItemSchema.pre('validate', function (next) {
  // Sync code and serviceCode
  if (this.code && !this.serviceCode) this.serviceCode = this.code;
  if (this.serviceCode && !this.code) this.code = this.serviceCode;

  // Sync name/nameHindi and title
  if (this.name && (!this.title || !this.title.en)) {
    this.title = {
      en: this.name,
      hi: this.nameHindi || this.name,
    };
  }
  if (this.title?.en && !this.name) this.name = this.title.en;
  if (this.title?.hi && !this.nameHindi) this.nameHindi = this.title.hi;

  // Sync basePrice and standardRate
  if (this.basePrice !== undefined && this.standardRate === undefined) {
    this.standardRate = this.basePrice;
  }
  if (this.standardRate !== undefined && this.basePrice === undefined) {
    this.basePrice = this.standardRate;
  }

  // Sync minPrice and cooperativeMinRate
  if (this.minPrice !== undefined && this.cooperativeMinRate === undefined) {
    this.cooperativeMinRate = this.minPrice;
  }
  if (this.cooperativeMinRate !== undefined && this.minPrice === undefined) {
    this.minPrice = this.cooperativeMinRate;
  }
  if (this.minPrice === undefined && this.basePrice !== undefined) {
    this.minPrice = Math.round(this.basePrice * 0.85);
    this.cooperativeMinRate = this.minPrice;
  }

  // Sync maxPrice and cooperativeMaxRate
  if (this.maxPrice !== undefined && this.cooperativeMaxRate === undefined) {
    this.cooperativeMaxRate = this.maxPrice;
  }
  if (this.cooperativeMaxRate !== undefined && this.maxPrice === undefined) {
    this.maxPrice = this.cooperativeMaxRate;
  }
  if (this.maxPrice === undefined && this.basePrice !== undefined) {
    this.maxPrice = Math.round(this.basePrice * 1.25);
    this.cooperativeMaxRate = this.maxPrice;
  }

  // Sync unit and billingType
  if (this.unit && !this.billingType) this.billingType = this.unit;
  if (this.billingType && !this.unit) this.unit = this.billingType;

  // Sync durationMinutes and estimatedDurationMinutes
  if (this.durationMinutes !== undefined && this.estimatedDurationMinutes === undefined) {
    this.estimatedDurationMinutes = this.durationMinutes;
  }
  if (this.estimatedDurationMinutes !== undefined && this.durationMinutes === undefined) {
    this.durationMinutes = this.estimatedDurationMinutes;
  }

  // Sync active and isActive
  if (this.active !== undefined && this.isActive === undefined) {
    this.isActive = this.active;
  }
  if (this.isActive !== undefined && this.active === undefined) {
    this.active = this.isActive;
  }

  next();
});

rateCardItemSchema.index({ category: 1, active: 1 });
rateCardItemSchema.index({ code: 1, active: 1 });

module.exports = mongoose.model('RateCardItem', rateCardItemSchema);
