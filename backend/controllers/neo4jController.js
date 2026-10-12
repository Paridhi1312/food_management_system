const { getDriver, getNeo4jStatus } = require('../config/neo4j');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const notConfiguredResponse = (res) =>
  res.status(503).json({
    success: false,
    neo4jConfigured: false,
    error:
      'Neo4j is not configured. Add NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD to your backend/.env file and restart the server.',
    setupGuide: {
      step1: 'Create a free AuraDB instance at https://neo4j.com/cloud/platform/aura-graph-database/',
      step2: 'Copy your Connection URI (bolt:// or neo4j+s://)',
      step3: 'Add to backend/.env:\n  NEO4J_URI=bolt://...\n  NEO4J_USER=neo4j\n  NEO4J_PASSWORD=your_password',
      step4: 'Restart the backend server',
    },
  });

const cleanProperties = (props) => {
  if (!props || typeof props !== 'object') return props;
  const cleaned = {};
  for (const [k, v] of Object.entries(props)) {
    if (v && typeof v === 'object' && typeof v.toNumber === 'function') {
      cleaned[k] = v.toNumber();
    } else if (v && typeof v === 'object' && 'low' in v && 'high' in v) {
      cleaned[k] = v.low;
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
};

const runQuery = async (query, params = {}) => {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.run(query, params);
    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        const val = record.get(key);
        if (val && val.constructor && val.constructor.name === 'Node') {
          obj[key] = { id: val.identity.toNumber(), labels: val.labels, properties: cleanProperties(val.properties) };
        } else if (val && val.constructor && val.constructor.name === 'Relationship') {
          obj[key] = {
            id: val.identity.toNumber(),
            type: val.type,
            startNodeId: val.start.toNumber(),
            endNodeId: val.end.toNumber(),
            properties: cleanProperties(val.properties),
          };
        } else if (val && val.constructor && val.constructor.name === 'Integer') {
          obj[key] = val.toNumber();
        } else {
          obj[key] = val;
        }
      });
      return obj;
    });
  } finally {
    await session.close();
  }
};

// ─── Health / Status ───────────────────────────────────────────────────────────

exports.getStatus = async (req, res) => {
  const status = getNeo4jStatus();
  res.json({ success: true, ...status });
};

const {
  Donor,
  SurplusFood,
  NGO,
  Shelter,
  Beneficiary,
  Volunteer,
  Vehicle,
} = require('../models');

// ─── Seed & Sync Food-Domain Graph from MongoDB (seed.js) ─────────────────────

exports.seedDemoGraph = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const session = driver.session();
  try {
    // Clear old demo nodes
    await session.run('MATCH (n) DETACH DELETE n');

    // Fetch live MongoDB entities
    const donors = await Donor.find().populate('locationId');
    const surplusList = await SurplusFood.find().populate('foodItemId').populate('donorId');
    const ngos = await NGO.find();
    const shelters = await Shelter.find().populate('ngoId');
    const beneficiaries = await Beneficiary.find().populate('shelterId');
    const volunteers = await Volunteer.find();
    const vehicles = await Vehicle.find();

    // 1. Donors
    for (const d of donors) {
      await session.run(
        `MERGE (d:Donor {donorId: $donorId})
         SET d.name = $name, d.type = $type, d.city = $city, d.phone = $phone, d.demo = true`,
        {
          donorId: d.donorId,
          name: d.name,
          type: d.type || 'Donor',
          city: d.locationId?.city || 'Delhi',
          phone: d.phone || '',
        }
      );
    }

    // 2. SurplusFood & PRODUCES
    for (const sf of surplusList) {
      const foodName = sf.foodItemId?.name || sf.surplusId;
      const displayName = `${foodName} (${sf.quantity} ${sf.unit})`;
      await session.run(
        `MERGE (s:SurplusFood {surplusId: $surplusId})
         SET s.name = $displayName, s.foodName = $foodName, s.quantity = $quantity,
             s.unit = $unit, s.status = $status, s.demo = true`,
        {
          surplusId: sf.surplusId,
          displayName,
          foodName,
          quantity: sf.quantity,
          unit: sf.unit,
          status: sf.status,
        }
      );

      if (sf.donorId) {
        await session.run(
          `MATCH (d:Donor {donorId: $donorId}), (s:SurplusFood {surplusId: $surplusId})
           MERGE (d)-[:PRODUCES]->(s)`,
          {
            donorId: sf.donorId.donorId,
            surplusId: sf.surplusId,
          }
        );
      }
    }

    // 3. NGOs
    for (const n of ngos) {
      await session.run(
        `MERGE (ngo:NGO {ngoId: $ngoId})
         SET ngo.name = $name, ngo.type = $type, ngo.demo = true`,
        {
          ngoId: n.ngoId,
          name: n.name,
          type: n.type || 'NGO',
        }
      );
    }

    // 4. Shelters & MANAGES
    for (const sh of shelters) {
      await session.run(
        `MERGE (s:Shelter {shelterId: $shelterId})
         SET s.name = $name, s.capacity = $capacity, s.demo = true`,
        {
          shelterId: sh.shelterId,
          name: sh.name,
          capacity: sh.capacity,
        }
      );

      if (sh.ngoId) {
        await session.run(
          `MATCH (n:NGO {ngoId: $ngoId}), (s:Shelter {shelterId: $shelterId})
           MERGE (n)-[:MANAGES]->(s)`,
          {
            ngoId: sh.ngoId.ngoId,
            shelterId: sh.shelterId,
          }
        );
      }
    }

    // 5. Beneficiaries & SERVES
    for (const b of beneficiaries) {
      await session.run(
        `MERGE (ben:Beneficiary {beneficiaryId: $beneficiaryId})
         SET ben.name = $name, ben.contact = $contact, ben.demo = true`,
        {
          beneficiaryId: b.beneficiaryId,
          name: b.name || b.beneficiaryId,
          contact: b.contact || '',
        }
      );

      if (b.shelterId) {
        await session.run(
          `MATCH (s:Shelter {shelterId: $shelterId}), (ben:Beneficiary {beneficiaryId: $beneficiaryId})
           MERGE (s)-[:SERVES]->(ben)`,
          {
            shelterId: b.shelterId.shelterId,
            beneficiaryId: b.beneficiaryId,
          }
        );
      }
    }

    // 6. Volunteers & Vehicles & USES
    for (let i = 0; i < volunteers.length; i++) {
      const v = volunteers[i];
      await session.run(
        `MERGE (vol:Volunteer {volunteerId: $volunteerId})
         SET vol.name = $name, vol.phone = $phone, vol.status = $status, vol.demo = true`,
        {
          volunteerId: v.volunteerId,
          name: v.name,
          phone: v.phone || '',
          status: v.status || 'Active',
        }
      );

      if (vehicles.length > 0) {
        const veh = vehicles[i % vehicles.length];
        await session.run(
          `MERGE (vh:Vehicle {vehicleId: $vehicleId})
           SET vh.name = $name, vh.vehicleNumber = $vehicleNumber, vh.vehicleType = $vehicleType,
               vh.capacity = $capacity, vh.demo = true`,
          {
            vehicleId: veh.vehicleId,
            name: `${veh.vehicleType} (${veh.vehicleNumber})`,
            vehicleNumber: veh.vehicleNumber,
            vehicleType: veh.vehicleType,
            capacity: veh.capacity,
          }
        );

        await session.run(
          `MATCH (vol:Volunteer {volunteerId: $volunteerId}), (vh:Vehicle {vehicleId: $vehicleId})
           MERGE (vol)-[:USES]->(vh)`,
          {
            volunteerId: v.volunteerId,
            vehicleId: veh.vehicleId,
          }
        );
      }
    }

    // 7. Supply chain links
    for (let i = 0; i < Math.min(volunteers.length, surplusList.length); i++) {
      await session.run(
        `MATCH (v:Volunteer {volunteerId: $volId}), (s:SurplusFood {surplusId: $surplusId})
         MERGE (v)-[:PICKS_UP]->(s)`,
        { volId: volunteers[i].volunteerId, surplusId: surplusList[i].surplusId }
      );
    }

    for (let i = 0; i < surplusList.length; i++) {
      const sh = shelters[i % shelters.length];
      if (sh) {
        await session.run(
          `MATCH (s:SurplusFood {surplusId: $surplusId}), (sh:Shelter {shelterId: $shelterId})
           MERGE (s)-[:DELIVERED_TO]->(sh)`,
          { surplusId: surplusList[i].surplusId, shelterId: sh.shelterId }
        );
      }

      const ben = beneficiaries[i % beneficiaries.length];
      if (ben) {
        await session.run(
          `MATCH (b:Beneficiary {beneficiaryId: $benId}), (s:SurplusFood {surplusId: $surplusId})
           MERGE (b)-[:RECEIVES]->(s)`,
          { benId: ben.beneficiaryId, surplusId: surplusList[i].surplusId }
        );
      }
    }

    const nRes = await session.run('MATCH (n) RETURN count(n) as c');
    const rRes = await session.run('MATCH ()-[r]->() RETURN count(r) as c');
    const nCnt = nRes.records[0].get('c').toNumber();
    const rCnt = rRes.records[0].get('c').toNumber();

    res.json({
      success: true,
      message: `✅ Synced ${nCnt} nodes and ${rCnt} relationships directly from MongoDB Atlas (seed.js)!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  } finally {
    await session.close();
  }
};

// ─── 1. CREATE – Node ─────────────────────────────────────────────────────────

exports.createNode = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { label, properties } = req.body;
  if (!label) return res.status(400).json({ success: false, error: 'label is required' });

  try {
    const query = `CREATE (n:${label} $props) RETURN n`;
    const records = await runQuery(query, { props: { ...properties, createdAt: new Date().toISOString() } });
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 2. CREATE – Relationship ─────────────────────────────────────────────────

exports.createRelationship = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { fromLabel, fromName, relType, toLabel, toName, properties } = req.body;
  if (!fromLabel || !fromName || !relType || !toLabel || !toName)
    return res.status(400).json({ success: false, error: 'fromLabel, fromName, relType, toLabel, toName are required' });

  try {
    const query = `
      MATCH (a:${fromLabel} {name: $fromName})
      MATCH (b:${toLabel}   {name: $toName})
      CREATE (a)-[r:${relType} $props]->(b)
      RETURN a, r, b
    `;
    const records = await runQuery(query, { fromName, toName, props: properties || {} });
    if (records.length === 0)
      return res.status(404).json({ success: false, error: 'One or both nodes not found. Check names & labels.' });
    res.json({ success: true, cypher: query.trim(), data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 3. READ – All Nodes by Label ────────────────────────────────────────────

exports.getNodes = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { label } = req.params;
  const limit = parseInt(req.query.limit) || 25;

  try {
    const query = label
      ? `MATCH (n:${label}) RETURN n LIMIT ${limit}`
      : `MATCH (n) RETURN n LIMIT ${limit}`;
    const records = await runQuery(query);
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 4. READ – Relationships ──────────────────────────────────────────────────

exports.getRelationships = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const limit = parseInt(req.query.limit) || 25;
  const { type } = req.query;

  try {
    const query = type
      ? `MATCH (a)-[r:${type}]->(b) RETURN a, r, b LIMIT ${limit}`
      : `MATCH (a)-[r]->(b) RETURN a, r, b LIMIT ${limit}`;
    const records = await runQuery(query);
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 5. READ – Node by name ───────────────────────────────────────────────────

exports.getNodeByName = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { label, name } = req.params;
  try {
    const query = `MATCH (n:${label} {name: $name}) RETURN n`;
    const records = await runQuery(query, { name });
    if (records.length === 0)
      return res.status(404).json({ success: false, error: `Node :${label} {name: "${name}"} not found` });
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 6. UPDATE – Node properties ─────────────────────────────────────────────

exports.updateNode = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { label, name } = req.params;
  const { properties } = req.body;
  if (!properties || Object.keys(properties).length === 0)
    return res.status(400).json({ success: false, error: 'properties object is required' });

  try {
    const sets = Object.keys(properties)
      .map((k) => `n.${k} = $props.${k}`)
      .join(', ');
    const query = `MATCH (n:${label} {name: $name}) SET ${sets}, n.updatedAt = $now RETURN n`;
    const records = await runQuery(query, { name, props: properties, now: new Date().toISOString() });
    if (records.length === 0)
      return res.status(404).json({ success: false, error: `Node :${label} {name: "${name}"} not found` });
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 7. DELETE – Node ─────────────────────────────────────────────────────────

exports.deleteNode = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { label, name } = req.params;
  try {
    const query = `MATCH (n:${label} {name: $name}) DETACH DELETE n RETURN count(n) as deleted`;
    // Note: DETACH DELETE doesn't return the deleted node, so we check first
    const checkQuery = `MATCH (n:${label} {name: $name}) RETURN count(n) as count`;
    const check = await runQuery(checkQuery, { name });
    if (!check[0] || check[0].count === 0)
      return res.status(404).json({ success: false, error: `Node :${label} {name: "${name}"} not found` });

    await runQuery(query, { name });
    res.json({ success: true, cypher: query, message: `Node :${label} {name: "${name}"} and all its relationships deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 8. DELETE – Relationship ─────────────────────────────────────────────────

exports.deleteRelationship = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { fromLabel, fromName, relType, toLabel, toName } = req.body;
  if (!fromLabel || !fromName || !relType || !toLabel || !toName)
    return res.status(400).json({ success: false, error: 'fromLabel, fromName, relType, toLabel, toName are required' });

  try {
    const query = `
      MATCH (a:${fromLabel} {name: $fromName})-[r:${relType}]->(b:${toLabel} {name: $toName})
      DELETE r
      RETURN count(r) as deleted
    `;
    const records = await runQuery(query, { fromName, toName });
    res.json({ success: true, cypher: query.trim(), message: `Relationship :${relType} deleted.`, data: records });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 9. Generic Cypher Runner ─────────────────────────────────────────────────

exports.runCypher = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  const { query, params } = req.body;
  if (!query) return res.status(400).json({ success: false, error: 'query is required' });

  try {
    const records = await runQuery(query, params || {});
    res.json({ success: true, cypher: query, data: records, count: records.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 10. Graph Stats ──────────────────────────────────────────────────────────

exports.getGraphStats = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  try {
    const nodeCount = await runQuery('MATCH (n) RETURN count(n) as count');
    const relCount = await runQuery('MATCH ()-[r]->() RETURN count(r) as count');
    const labels = await runQuery('CALL db.labels() YIELD label RETURN label');
    const relTypes = await runQuery('CALL db.relationshipTypes() YIELD relationshipType RETURN relationshipType');

    res.json({
      success: true,
      stats: {
        totalNodes: nodeCount[0]?.count ?? 0,
        totalRelationships: relCount[0]?.count ?? 0,
        labels: labels.map((r) => r.label),
        relationshipTypes: relTypes.map((r) => r.relationshipType),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── 11. Visual Graph Full Data ────────────────────────────────────────────────

exports.getGraphData = async (req, res) => {
  const driver = getDriver();
  if (!driver) return notConfiguredResponse(res);

  try {
    const nodeRecords = await runQuery('MATCH (n) RETURN n LIMIT 200');
    const relRecords = await runQuery('MATCH (a)-[r]->(b) RETURN a, r, b LIMIT 250');

    const nodeMap = new Map();

    const extractNode = (n) => {
      if (!n || n.id === undefined) return;
      if (!nodeMap.has(n.id)) {
        const props = cleanProperties(n.properties) || {};
        const displayName =
          props.name ||
          props.foodName ||
          props.groupName ||
          props.regNo ||
          props.donorId ||
          props.ngoId ||
          props.foodId ||
          `#${n.id}`;

        nodeMap.set(n.id, {
          id: n.id,
          labels: n.labels || ['Entity'],
          label: (n.labels && n.labels[0]) || 'Entity',
          name: displayName,
          properties: props,
        });
      }
    };

    nodeRecords.forEach((rec) => {
      if (rec.n) extractNode(rec.n);
    });

    const links = [];
    relRecords.forEach((rec) => {
      if (rec.a) extractNode(rec.a);
      if (rec.b) extractNode(rec.b);
      if (rec.a && rec.b) {
        const sourceId = rec.r?.startNodeId !== undefined ? rec.r.startNodeId : rec.a.id;
        const targetId = rec.r?.endNodeId !== undefined ? rec.r.endNodeId : rec.b.id;
        links.push({
          id: rec.r?.id !== undefined ? String(rec.r.id) : `${sourceId}-${targetId}-${rec.r?.type || 'REL'}`,
          source: sourceId,
          target: targetId,
          type: rec.r?.type || 'CONNECTED_TO',
          properties: cleanProperties(rec.r?.properties) || {},
        });
      }
    });

    res.json({
      success: true,
      data: {
        nodes: Array.from(nodeMap.values()),
        links,
        nodeCount: nodeMap.size,
        linkCount: links.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

