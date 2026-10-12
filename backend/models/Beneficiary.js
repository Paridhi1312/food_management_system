const mongoose = require('mongoose');

const BeneficiarySchema = new mongoose.Schema(
  {
    beneficiaryId: {
      type: String,
      required: [true, 'Beneficiary ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Beneficiary name is required'],
      trim: true,
    },
    contact: {
      type: String,
      trim: true,
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter',
      required: [true, 'Shelter reference is required'],
    },
  },
  { timestamps: true }
);

BeneficiarySchema.index({ beneficiaryId: 1 });
BeneficiarySchema.index({ shelterId: 1 });

module.exports = mongoose.model('Beneficiary', BeneficiarySchema);
