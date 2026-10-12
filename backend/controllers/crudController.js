const mongoose = require('mongoose');

// Helper to check valid ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Generic controller creator for standard CRUD
const createCrudController = (Model, modelName, populateFields = []) => {
  return {
    // GET ALL with optional search and filter
    getAll: async (req, res) => {
      try {
        const { search, sort, page = 1, limit = 50, ...filters } = req.query;
        let query = {};

        // Merge query filters
        Object.keys(filters).forEach((key) => {
          if (filters[key] !== undefined && filters[key] !== '') {
            query[key] = filters[key];
          }
        });

        // Search text if applicable
        if (search) {
          if (Model.schema.paths.name) {
            query.name = { $regex: search, $options: 'i' };
          }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        let execQuery = Model.find(query).skip(skip).limit(parseInt(limit));

        if (sort) {
          execQuery = execQuery.sort(sort);
        } else {
          execQuery = execQuery.sort({ createdAt: -1 });
        }

        populateFields.forEach((field) => {
          execQuery = execQuery.populate(field);
        });

        const data = await execQuery.exec();
        const total = await Model.countDocuments(query);

        res.json({
          success: true,
          count: data.length,
          total,
          page: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          data,
        });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    },

    // GET BY ID
    getById: async (req, res) => {
      try {
        const { id } = req.params;
        let doc;
        if (isValidObjectId(id)) {
          let q = Model.findById(id);
          populateFields.forEach((field) => (q = q.populate(field)));
          doc = await q.exec();
        }

        // Check logical ID if not found by ObjectId
        if (!doc) {
          const idFields = [
            'donorId', 'surplusId', 'foodId', 'categoryId', 'ngoId',
            'shelterId', 'beneficiaryId', 'volunteerId', 'vehicleId',
            'requestId', 'pickupId', 'deliveryId', 'locationId',
            'routeId', 'donationId', 'feedbackId'
          ];
          for (const field of idFields) {
            if (Model.schema.paths[field]) {
              let q = Model.findOne({ [field]: id });
              populateFields.forEach((f) => (q = q.populate(f)));
              doc = await q.exec();
              if (doc) break;
            }
          }
        }

        if (!doc) {
          return res.status(404).json({ success: false, error: `${modelName} not found` });
        }
        res.json({ success: true, data: doc });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    },

    // CREATE
    create: async (req, res) => {
      try {
        const doc = new Model(req.body);
        await doc.save();
        res.status(201).json({ success: true, message: `${modelName} created successfully`, data: doc });
      } catch (err) {
        if (err.code === 11000) {
          const dupField = Object.keys(err.keyPattern || {})[0] || 'identifier';
          return res.status(400).json({ success: false, error: `Duplicate error: ${dupField} already exists.` });
        }
        res.status(400).json({ success: false, error: err.message });
      }
    },

    // UPDATE
    update: async (req, res) => {
      try {
        const { id } = req.params;
        let doc = null;

        if (isValidObjectId(id)) {
          doc = await Model.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        }

        if (!doc) {
          const idFields = [
            'donorId', 'surplusId', 'foodId', 'categoryId', 'ngoId',
            'shelterId', 'beneficiaryId', 'volunteerId', 'vehicleId',
            'requestId', 'pickupId', 'deliveryId', 'locationId',
            'routeId', 'donationId', 'feedbackId'
          ];
          for (const field of idFields) {
            if (Model.schema.paths[field]) {
              doc = await Model.findOneAndUpdate({ [field]: id }, req.body, { new: true, runValidators: true });
              if (doc) break;
            }
          }
        }

        if (!doc) {
          return res.status(404).json({ success: false, error: `${modelName} not found` });
        }
        res.json({ success: true, message: `${modelName} updated successfully`, data: doc });
      } catch (err) {
        res.status(400).json({ success: false, error: err.message });
      }
    },

    // DELETE
    delete: async (req, res) => {
      try {
        const { id } = req.params;
        let doc = null;

        // Custom business logic: If Donor is deleted, preserve historical donations!
        if (modelName === 'Donor') {
          const Donor = Model;
          const { Donation } = require('../models');
          let donorDoc = isValidObjectId(id) ? await Donor.findById(id) : await Donor.findOne({ donorId: id });
          if (donorDoc) {
            // Snapshot donor information into donations if not already present
            await Donation.updateMany(
              { donorId: donorDoc._id, donorSnapshot: { $exists: false } },
              {
                $set: {
                  donorSnapshot: {
                    name: donorDoc.name,
                    type: donorDoc.type,
                    email: donorDoc.email,
                    phone: donorDoc.phone,
                  },
                },
              }
            );
            doc = await Donor.findByIdAndDelete(donorDoc._id);
          }
        } else {
          if (isValidObjectId(id)) {
            doc = await Model.findByIdAndDelete(id);
          }
          if (!doc) {
            const idFields = [
              'surplusId', 'foodId', 'categoryId', 'ngoId', 'shelterId',
              'beneficiaryId', 'volunteerId', 'vehicleId', 'requestId',
              'pickupId', 'deliveryId', 'locationId', 'routeId',
              'donationId', 'feedbackId'
            ];
            for (const field of idFields) {
              if (Model.schema.paths[field]) {
                doc = await Model.findOneAndDelete({ [field]: id });
                if (doc) break;
              }
            }
          }
        }

        if (!doc) {
          return res.status(404).json({ success: false, error: `${modelName} not found` });
        }
        res.json({ success: true, message: `${modelName} deleted successfully`, data: doc });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
    },
  };
};

module.exports = { createCrudController, isValidObjectId };
