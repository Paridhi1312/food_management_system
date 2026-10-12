const mongoose = require('mongoose');

const FoodCategorySchema = new mongoose.Schema(
  {
    categoryId: {
      type: String,
      required: [true, 'Category ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

FoodCategorySchema.index({ categoryId: 1 });

module.exports = mongoose.model('FoodCategory', FoodCategorySchema);
