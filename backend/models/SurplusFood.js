const mongoose = require('mongoose');

const SurplusFoodSchema = new mongoose.Schema(
  {
    surplusId: {
      type: String,
      required: [true, 'Surplus ID is required'],
      unique: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0.1, 'Quantity must be positive and greater than zero'],
    },
    allocatedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Allocated quantity cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['kg', 'packets', 'meals', 'litres', 'boxes'],
      default: 'meals',
      required: true,
    },
    preparedTime: {
      type: Date,
      required: [true, 'Preparation time is required'],
    },
    expiryTime: {
      type: Date,
      required: [true, 'Expiry time is required'],
    },
    status: {
      type: String,
      enum: ['Available', 'Reserved', 'Allocated', 'Picked Up', 'Delivered', 'Expired', 'Cancelled'],
      default: 'Available',
    },
    packagingType: {
      type: String,
      enum: ['Sealed Container', 'Aluminum Foil', 'Cardboard Box', 'Plastic Container', 'Insulated Crate', 'Other'],
      default: 'Sealed Container',
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: [true, 'Donor reference is required'],
    },
    foodItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodItem',
      required: [true, 'FoodItem reference is required'],
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
    },
  },
  { timestamps: true }
);

SurplusFoodSchema.index({ status: 1 });
SurplusFoodSchema.index({ expiryTime: 1 });
SurplusFoodSchema.index({ donorId: 1 });
SurplusFoodSchema.index({ foodItemId: 1 });

module.exports = mongoose.model('SurplusFood', SurplusFoodSchema);
