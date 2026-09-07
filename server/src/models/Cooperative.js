const mongoose = require('mongoose');

const cooperativeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    registeredOffice: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    serviceZones: [
      {
        zoneName: String,
        pincodes: [String],
      },
    ],
    contactPhone: String,
    contactEmail: String,
    welfareFundBalance: {
      type: Number,
      default: 0,
    },
    cooperativeSharePercent: {
      type: Number,
      default: 5, // 5% deducted to social security welfare pool
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Cooperative', cooperativeSchema);
