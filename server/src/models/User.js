const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['customer', 'worker', 'cooperative_admin'],
      required: true,
      index: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi'],
      default: 'en',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending_approval'],
      default: 'active',
      index: true,
    },
    avatarUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
