const mongoose = require('mongoose');

const VolunteerSchema = new mongoose.Schema(
  {
    volunteerId: {
      type: String,
      required: [true, 'Volunteer ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Volunteer name is required'],
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
    availability: {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Full Time', 'Weekends'],
      default: 'Full Time',
    },
    status: {
      type: String,
      enum: ['Available', 'On Delivery', 'Busy', 'Inactive'],
      default: 'Available',
    },
    currentVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
  },
  { timestamps: true }
);

VolunteerSchema.index({ volunteerId: 1 });
VolunteerSchema.index({ status: 1 });

module.exports = mongoose.model('Volunteer', VolunteerSchema);
