const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    feedbackId: {
      type: String,
      required: [true, 'Feedback ID is required'],
      unique: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comments: {
      type: String,
      required: [true, 'Comments are required'],
      trim: true,
    },
    feedbackDate: {
      type: Date,
      default: Date.now,
    },
    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
      required: [true, 'Delivery reference is required'],
    },
  },
  { timestamps: true }
);

FeedbackSchema.index({ feedbackId: 1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ deliveryId: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema);
