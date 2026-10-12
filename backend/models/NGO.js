const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema(
  {
    ngoId: {
      type: String,
      required: [true, 'NGO ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'NGO name is required'],
      trim: true,
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      unique: true,
      trim: true,
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
  },
  { timestamps: true }
);

NGOSchema.index({ ngoId: 1 });
NGOSchema.index({ registrationNumber: 1 });

module.exports = mongoose.model('NGO', NGOSchema);
