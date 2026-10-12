const mongoose = require('mongoose');

// Map of collection names to Mongoose models
const getModelByCollection = (collectionName) => {
  const models = mongoose.models;
  for (const name of Object.keys(models)) {
    if (models[name].collection.name.toLowerCase() === collectionName.toLowerCase()) {
      return models[name];
    }
  }
  return null;
};

// GET /api/database/collections - List all collections and document counts
const getCollectionsInfo = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database is not connected yet.' });
    }

    const collections = await db.listCollections().toArray();
    const info = await Promise.all(
      collections.map(async (col) => {
        const count = await db.collection(col.name).countDocuments();
        let indexes = [];
        try {
          indexes = await db.collection(col.name).indexes();
        } catch {
          indexes = [];
        }
        return {
          name: col.name,
          documentCount: count,
          indexesCount: indexes.length,
          indexes,
        };
      })
    );

    res.json({
      success: true,
      databaseName: db.databaseName,
      collections: info.sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/database/indexes/:collectionName - Get index details
const getCollectionIndexes = async (req, res) => {
  const { collectionName } = req.params;
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }
    const indexes = await db.collection(collectionName).indexes();
    res.json({ success: true, collectionName, indexes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/database/raw/:collectionName - Paginated collection documents
const getCollectionDocuments = async (req, res) => {
  const { collectionName } = req.params;
  const { page = 1, limit = 20, filter = '{}', sort = '{ "_id": -1 }' } = req.query;

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    let parsedFilter = {};
    let parsedSort = { _id: -1 };

    try {
      parsedFilter = JSON.parse(filter);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid JSON filter parameter' });
    }

    try {
      parsedSort = JSON.parse(sort);
    } catch {
      parsedSort = { _id: -1 };
    }

    // Convert _id string to ObjectId if present in filter
    if (parsedFilter._id && typeof parsedFilter._id === 'string' && mongoose.Types.ObjectId.isValid(parsedFilter._id)) {
      parsedFilter._id = new mongoose.Types.ObjectId(parsedFilter._id);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const col = db.collection(collectionName);

    const [documents, total] = await Promise.all([
      col.find(parsedFilter).sort(parsedSort).skip(skip).limit(parseInt(limit)).toArray(),
      col.countDocuments(parsedFilter),
    ]);

    res.json({
      success: true,
      collectionName,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      count: documents.length,
      documents,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/database/raw/:collectionName - Insert raw document
const insertDocument = async (req, res) => {
  const { collectionName } = req.params;
  const docData = req.body;

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const col = db.collection(collectionName);
    const result = await col.insertOne(docData);
    res.status(201).json({
      success: true,
      message: `Document inserted into ${collectionName} successfully`,
      insertedId: result.insertedId,
      document: { _id: result.insertedId, ...docData },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// PUT /api/database/raw/:collectionName/:id - Update raw document
const updateDocument = async (req, res) => {
  const { collectionName, id } = req.params;
  const updateData = req.body;

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    // Don't modify immutable _id
    delete updateData._id;

    let filter = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      filter = { _id: id };
    }

    const col = db.collection(collectionName);
    const result = await col.updateOne(filter, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'Document not found with given ID' });
    }

    const updatedDoc = await col.findOne(filter);
    res.json({
      success: true,
      message: 'Document updated successfully',
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      document: updatedDoc,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE /api/database/raw/:collectionName/:id - Delete raw document
const deleteDocument = async (req, res) => {
  const { collectionName, id } = req.params;

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    let filter = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      filter = { _id: new mongoose.Types.ObjectId(id) };
    } else {
      filter = { _id: id };
    }

    const col = db.collection(collectionName);
    const result = await col.deleteOne(filter);

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Document not found or already deleted' });
    }

    res.json({
      success: true,
      message: `Document deleted from ${collectionName}`,
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/database/custom-query - Execute custom MQL query or pipeline for lab demo
const executeCustomQuery = async (req, res) => {
  const { collectionName, operation, query = '{}', update = '{}', pipeline = '[]' } = req.body;

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return res.status(503).json({ success: false, error: 'Database not connected' });
    }

    const col = db.collection(collectionName);
    let parsedQuery = typeof query === 'string' ? JSON.parse(query || '{}') : query;
    let parsedPipeline = typeof pipeline === 'string' ? JSON.parse(pipeline || '[]') : pipeline;

    let result;
    const startTime = Date.now();

    switch (operation) {
      case 'find':
        result = await col.find(parsedQuery).limit(50).toArray();
        break;
      case 'count':
        result = await col.countDocuments(parsedQuery);
        break;
      case 'aggregate':
        result = await col.aggregate(parsedPipeline).toArray();
        break;
      case 'distinct':
        result = await col.distinct(parsedQuery.field || 'status');
        break;
      default:
        return res.status(400).json({ success: false, error: 'Unknown operation: ' + operation });
    }

    const executionTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      operation,
      collectionName,
      executionTimeMs,
      resultCount: Array.isArray(result) ? result.length : 1,
      result,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = {
  getCollectionsInfo,
  getCollectionIndexes,
  getCollectionDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  executeCustomQuery,
};
