const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const neo4j = require('neo4j-driver');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
  Donor,
  SurplusFood,
  NGO,
  Shelter,
  Beneficiary,
  Volunteer,
  Vehicle,
  Delivery,
} = require('../models');

async function syncSeedToNeo4j() {
  console.log('🔄 Connecting to MongoDB Atlas & Neo4j AuraDB...');

  // 1. Connect MongoDB
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'food_management_db' });
  console.log('✅ Connected to MongoDB Atlas');

  // 2. Connect Neo4j
  const driver = neo4j.driver(
    process.env.NEO4J_URI,
    neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
    { connectionTimeoutMs: 10000 }
  );
  const session = driver.session();
  console.log('✅ Connected to Neo4j AuraDB');

  try {
    // Clean old demo nodes in Neo4j
    console.log('🧹 Clearing old graph nodes in Neo4j...');
    await session.run('MATCH (n) DETACH DELETE n');

    // Fetch data from MongoDB
    const donors = await Donor.find().populate('locationId');
    const surplusList = await SurplusFood.find().populate('foodItemId').populate('donorId');
    const ngos = await NGO.find();
    const shelters = await Shelter.find().populate('ngoId');
    const beneficiaries = await Beneficiary.find().populate('shelterId');
    const volunteers = await Volunteer.find();
    const vehicles = await Vehicle.find();
    const deliveries = await Delivery.find().populate('pickupId').populate('shelterId');

    console.log(`📦 Loaded from MongoDB:
      - ${donors.length} Donors
      - ${surplusList.length} Surplus Food Batches
      - ${ngos.length} NGOs
      - ${shelters.length} Shelters
      - ${beneficiaries.length} Beneficiary Cohorts
      - ${volunteers.length} Volunteers
      - ${vehicles.length} Vehicles
      - ${deliveries.length} Deliveries`);

    // ── 1. Create Donors ──
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
    console.log('✓ Donors created');

    // ── 2. Create SurplusFood & (Donor)-[:PRODUCES]->(SurplusFood) ──
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

      // Connect Donor to SurplusFood
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
    console.log('✓ SurplusFood & PRODUCES relationships created');

    // ── 3. Create NGOs ──
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
    console.log('✓ NGOs created');

    // ── 4. Create Shelters & (NGO)-[:MANAGES]->(Shelter) ──
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
    console.log('✓ Shelters & MANAGES relationships created');

    // ── 5. Create Beneficiaries & (Shelter)-[:SERVES]->(Beneficiary) ──
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
    console.log('✓ Beneficiaries & SERVES relationships created');

    // ── 6. Create Volunteers, Vehicles & (Volunteer)-[:USES]->(Vehicle) ──
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

      // Pair volunteer with vehicle
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
    console.log('✓ Volunteers, Vehicles & USES relationships created');

    // ── 7. Link Logistics: Volunteer -> SurplusFood & Delivery -> Shelter ──
    // Link active volunteers to food batches for pickup
    for (let i = 0; i < Math.min(volunteers.length, surplusList.length); i++) {
      const vol = volunteers[i];
      const sf = surplusList[i];
      await session.run(
        `MATCH (v:Volunteer {volunteerId: $volunteerId}), (s:SurplusFood {surplusId: $surplusId})
         MERGE (v)-[:PICKS_UP]->(s)`,
        { volunteerId: vol.volunteerId, surplusId: sf.surplusId }
      );
    }

    // Link surplus food delivered to shelters
    for (let i = 0; i < surplusList.length; i++) {
      const sf = surplusList[i];
      const targetShelter = shelters[i % shelters.length];
      if (targetShelter) {
        await session.run(
          `MATCH (s:SurplusFood {surplusId: $surplusId}), (sh:Shelter {shelterId: $shelterId})
           MERGE (s)-[:DELIVERED_TO]->(sh)`,
          { surplusId: sf.surplusId, shelterId: targetShelter.shelterId }
        );
      }

      // Link beneficiary receiving food
      const targetBen = beneficiaries[i % beneficiaries.length];
      if (targetBen) {
        await session.run(
          `MATCH (b:Beneficiary {beneficiaryId: $beneficiaryId}), (s:SurplusFood {surplusId: $surplusId})
           MERGE (b)-[:RECEIVES]->(s)`,
          { beneficiaryId: targetBen.beneficiaryId, surplusId: sf.surplusId }
        );
      }
    }
    console.log('✓ Supply chain relationships (PICKS_UP, DELIVERED_TO, RECEIVES) created');

    // Check final counts
    const nodeCount = await session.run('MATCH (n) RETURN count(n) as c');
    const relCount = await session.run('MATCH ()-[r]->() RETURN count(r) as c');
    console.log(`\n🎉 Success! Neo4j AuraDB now holds:
      ${nodeCount.records[0].get('c').toNumber()} Nodes
      ${relCount.records[0].get('c').toNumber()} Relationships
    All synchronized from seed.js!`);
  } finally {
    await session.close();
    await driver.close();
    await mongoose.disconnect();
  }
}

syncSeedToNeo4j()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Error syncing seed data to Neo4j:', e);
    process.exit(1);
  });
