const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema(
  {
    deliveryId: {
      type: String,
      required: [true, 'Delivery ID is required'],
      unique: true,
      trim: true,
    },
    deliveryTime: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Out for Delivery', 'Delivered', 'Failed', 'Cancelled'],
      default: 'Scheduled',
    },
    quantityDelivered: {
      type: Number,
      required: [true, 'Delivered quantity is required'],
      min: [0.1, 'Quantity delivered must be positive'],
    },
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Route',
    },
    pickupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pickup',
    },
    surplusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurplusFood',
      required: [true, 'SurplusFood reference is required'],
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: [true, 'Shelter reference is required'],
    },
    beneficiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Beneficiary',
    },
  },
  { timestamps: true }
);

DeliverySchema.index({ deliveryId: 1 });
DeliverySchema.index({ status: 1 });
DeliverySchema.index({ shelterId: 1 });
DeliverySchema.index({ deliveryTime: 1 });

module.exports = mongoose.model('Delivery', DeliverySchema);
