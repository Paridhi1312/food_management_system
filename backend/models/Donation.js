const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
  {
    donationId: {
      type: String,
      required: [true, 'Donation ID is required'],
      unique: true,
      trim: true,
    },
    donationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    quantityDonated: {
      type: Number,
      required: [true, 'Quantity donated is required'],
      min: [0.1, 'Quantity must be positive'],
    },
    unit: {
      type: String,
      default: 'meals',
    },
    status: {
      type: String,
      enum: ['Pledged', 'Confirmed', 'Picked Up', 'Delivered', 'Cancelled'],
      default: 'Pledged',
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor reference is required'],
    },
    donorSnapshot: {
      name: String,
      type: String,
      email: String,
      phone: String,
    },
    surplusFoodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurplusFood',
    },
  },
  { timestamps: true }
);

DonationSchema.index({ donationId: 1 });
DonationSchema.index({ donationDate: 1 });
DonationSchema.index({ donorId: 1 });
DonationSchema.index({ status: 1 });

module.exports = mongoose.model('Donation', DonationSchema);
