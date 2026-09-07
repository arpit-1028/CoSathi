const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  tag: { type: String, default: 'Home' },
  street: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, default: 'Delhi' },
  pincode: { type: String, required: true },
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
});

const customerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    defaultAddress: addressSchema,
    savedAddresses: [addressSchema],
    totalBookings: {
      type: Number,
      default: 0,
    },
    emergencyContact: {
      name: String,
      phone: String,
    },
  },
  {
    timestamps: true,
  }
);

customerProfileSchema.index({ 'defaultAddress.location': '2dsphere' });

module.exports = mongoose.model('CustomerProfile', customerProfileSchema);
