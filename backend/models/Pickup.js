const mongoose = require('mongoose');

const PickupSchema = new mongoose.Schema(
  {
    pickupId: {
      type: String,
      required: [true, 'Pickup ID is required'],
      unique: true,
      trim: true,
    },
    scheduledTime: {
      type: Date,
      required: [true, 'Scheduled time is required'],
    },
    actualPickupTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      required: [true, 'Volunteer reference is required'],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle reference is required'],
    },
    surplusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurplusFood',
      required: [true, 'SurplusFood reference is required'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

PickupSchema.index({ pickupId: 1 });
PickupSchema.index({ status: 1 });
PickupSchema.index({ volunteerId: 1 });
PickupSchema.index({ surplusId: 1 });

module.exports = mongoose.model('Pickup', PickupSchema);
