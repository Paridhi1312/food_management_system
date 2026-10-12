const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle registration number is required'],
      unique: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['Van', 'Mini Truck', 'Motorcycle', 'Car', 'Bicycle', 'Refrigerated Truck'],
      default: 'Van',
      required: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity in kg or units is required'],
      min: [1, 'Capacity must be positive'],
    },
    refrigerated: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Available', 'In Transit', 'Maintenance', 'Inactive'],
      default: 'Available',
    },
  },
  { timestamps: true }
);

VehicleSchema.index({ vehicleId: 1 });
VehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
