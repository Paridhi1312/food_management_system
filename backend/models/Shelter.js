const mongoose = require('mongoose');

const ShelterSchema = new mongoose.Schema(
  {
    shelterId: {
      type: String,
      required: [true, 'Shelter ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO',
      required: [true, 'NGO reference is required'],
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
  },
  { timestamps: true }
);

ShelterSchema.index({ shelterId: 1 });
ShelterSchema.index({ ngoId: 1 });

module.exports = mongoose.model('Shelter', ShelterSchema);
