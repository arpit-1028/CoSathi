const mongoose = require('mongoose');

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    cooperative: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cooperative',
      required: true,
      index: true,
    },
    memberId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    primarySkill: {
      type: String,
      required: true,
      index: true,
    },
    skills: [
      {
        category: String,
        subSkills: [String],
        experienceYears: Number,
      },
    ],
    experienceYears: {
      type: Number,
      default: 1,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'provisional', 'rejected', 'suspended'],
      default: 'approved',
      index: true,
    },
    aadhaarVerification: {
      maskedNumber: { type: String, default: 'XXXXXXXX1234' },
      documentUrl: String,
      isSimulated: { type: Boolean, default: true },
      verifiedAt: Date,
      notes: String,
    },
    homeBaseLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [77.2090, 28.6139], // Default Delhi coordinates
      },
    },
    maxServiceRadiusKm: {
      type: Number,
      default: 12, // Default 12 km operational radius
      min: 2,
      max: 50,
    },
    serviceAreaDescription: {
      type: String,
      default: 'South Delhi & Central NCR',
    },
    bankDetails: {
      accountHolder: String,
      accountNumberMasked: String,
      ifsc: String,
      upiId: String,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

workerProfileSchema.index({ homeBaseLocation: '2dsphere' });
workerProfileSchema.index({ primarySkill: 1, verificationStatus: 1 });

module.exports = mongoose.model('WorkerProfile', workerProfileSchema);
