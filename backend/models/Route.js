const mongoose = require('mongoose');

const RouteSchema = new mongoose.Schema(
  {
    routeId: {
      type: String,
      required: [true, 'Route ID is required'],
      unique: true,
      trim: true,
    },
    sourceLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Source location is required'],
    },
    destinationLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Destination location is required'],
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance in km is required'],
      min: [0.1, 'Distance must be positive'],
    },
    estimatedDuration: {
      type: String,
      required: [true, 'Estimated duration is required (e.g., "35 mins")'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Congested', 'Clear', 'Completed'],
      default: 'Clear',
    },
  },
  { timestamps: true }
);

RouteSchema.index({ routeId: 1 });

module.exports = mongoose.model('Route', RouteSchema);
