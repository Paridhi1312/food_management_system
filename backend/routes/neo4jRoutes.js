const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/neo4jController');

// Status
router.get('/neo4j/status', ctrl.getStatus);

// Graph Stats & Visual Graph Data
router.get('/neo4j/stats', ctrl.getGraphStats);
router.get('/neo4j/graph-data', ctrl.getGraphData);

// Seed Demo Data
router.post('/neo4j/seed', ctrl.seedDemoGraph);

// Generic Cypher Runner
router.post('/neo4j/cypher', ctrl.runCypher);

// CREATE
router.post('/neo4j/nodes', ctrl.createNode);
router.post('/neo4j/relationships', ctrl.createRelationship);

// READ
router.get('/neo4j/nodes', ctrl.getNodes);                           // all nodes
router.get('/neo4j/nodes/:label', ctrl.getNodes);                   // by label
router.get('/neo4j/nodes/:label/:name', ctrl.getNodeByName);        // by label+name
router.get('/neo4j/relationships', ctrl.getRelationships);           // all rels

// UPDATE
router.put('/neo4j/nodes/:label/:name', ctrl.updateNode);

// DELETE
router.delete('/neo4j/nodes/:label/:name', ctrl.deleteNode);
router.delete('/neo4j/relationships', ctrl.deleteRelationship);

module.exports = router;
