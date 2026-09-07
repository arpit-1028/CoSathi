const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true },
      hi: { type: String, required: true },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    icon: {
      type: String,
      default: 'Wrench',
    },
    description: {
      en: String,
      hi: String,
    },
    baseInspectionFee: {
      type: Number,
      default: 149,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
