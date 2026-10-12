const mongoose = require('mongoose');

const FoodRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      trim: true,
    },
    quantityRequired: {
      type: Number,
      required: [true, 'Quantity required is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    fulfilledQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Fulfilled quantity cannot be negative'],
    },
    requiredBefore: {
      type: Date,
      required: [true, 'Deadline date is required'],
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'Urgent'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Pending', 'Partially Fulfilled', 'Fulfilled', 'Cancelled'],
      default: 'Pending',
    },
    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NGO',
      required: [true, 'NGO reference is required'],
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
    },
    matchedSurplusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SurplusFood',
    },
  },
  { timestamps: true }
);

FoodRequestSchema.index({ requestId: 1 });
FoodRequestSchema.index({ status: 1 });
FoodRequestSchema.index({ priority: 1 });
FoodRequestSchema.index({ requiredBefore: 1 });
FoodRequestSchema.index({ ngoId: 1 });

module.exports = mongoose.model('FoodRequest', FoodRequestSchema);
