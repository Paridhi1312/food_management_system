const mongoose = require('mongoose');

const FoodItemSchema = new mongoose.Schema(
  {
    foodId: {
      type: String,
      required: [true, 'Food ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Food item name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    vegetarian: {
      type: Boolean,
      default: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodCategory',
      required: [true, 'FoodCategory reference is required'],
    },
  },
  { timestamps: true }
);

FoodItemSchema.index({ categoryId: 1 });

module.exports = mongoose.model('FoodItem', FoodItemSchema);
