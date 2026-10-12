const express = require('express');
const { getDashboardStats, getAggregations } = require('../controllers/analyticsController');
const { executeAdvancedQueries, matchFoodRequests, allocateFood } = require('../controllers/queryController');
const {
  getCollectionsInfo,
  getCollectionIndexes,
  getCollectionDocuments,
  insertDocument,
  updateDocument,
  deleteDocument,
  executeCustomQuery,
} = require('../controllers/databaseController');

const router = express.Router();

// Dashboard & Analytics
router.get('/analytics/dashboard', getDashboardStats);
router.get('/analytics/aggregations', getAggregations);

// Advanced Queries
router.get('/queries/execute', executeAdvancedQueries);
router.get('/queries/match-request/:requestId', matchFoodRequests);
router.post('/queries/allocate', allocateFood);

// Database Operations (Lab Demo Page)
router.get('/database/collections', getCollectionsInfo);
router.get('/database/indexes/:collectionName', getCollectionIndexes);
router.get('/database/raw/:collectionName', getCollectionDocuments);
router.post('/database/raw/:collectionName', insertDocument);
router.put('/database/raw/:collectionName/:id', updateDocument);
router.delete('/database/raw/:collectionName/:id', deleteDocument);
router.post('/database/custom-query', executeCustomQuery);

module.exports = router;
