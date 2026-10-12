const mongoose = require('mongoose');

const DonorSchema = new mongoose.Schema(
  {
    donorId: {
      type: String,
      required: [true, 'Donor ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Donor name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Restaurant', 'Supermarket', 'Individual', 'Event Organizer', 'Corporate', 'Bakery', 'Other'],
      default: 'Restaurant',
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
  },
  { timestamps: true }
);

DonorSchema.index({ type: 1 });

module.exports = mongoose.model('Donor', DonorSchema);
