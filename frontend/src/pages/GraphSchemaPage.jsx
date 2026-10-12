import React from 'react';

const GraphSchemaPage = () => {
  const relationships = [
    { source: 'Donor', rel: 'PRODUCES', target: 'SurplusFood', desc: 'A donor registers batches of surplus food.' },
    { source: 'Donor', rel: 'LOCATED_AT', target: 'Location', desc: 'Physical geocoded pickup point of donor premises.' },
    { source: 'FoodItem', rel: 'BELONGS_TO', target: 'FoodCategory', desc: 'Categorization (Cooked Meals, Bakery, Produce, etc.).' },
    { source: 'SurplusFood', rel: 'IS_OF_TYPE', target: 'FoodItem', desc: 'Type of food item surplus batch contains.' },
    { source: 'NGO', rel: 'MANAGES', target: 'Shelter', desc: 'NGO runs multiple welfare shelters or soup kitchens.' },
    { source: 'NGO', rel: 'CREATES', target: 'FoodRequest', desc: 'NGO submits formal ration requests based on community need.' },
    { source: 'FoodRequest', rel: 'MATCHES', target: 'SurplusFood', desc: 'Matched by shelf-life, quantity, and priority.' },
    { source: 'Shelter', rel: 'SERVES', target: 'Beneficiary', desc: 'Registered resident families, elderly, or children.' },
    { source: 'Volunteer', rel: 'USES', target: 'Vehicle', desc: 'Assigned transport vehicle (Van, Cold truck, etc.).' },
    { source: 'Volunteer', rel: 'ASSIGNED_TO', target: 'Pickup', desc: 'Volunteer assigned to pick up food batch.' },
    { source: 'Pickup', rel: 'COLLECTS', target: 'SurplusFood', desc: 'Physical handover from donor premises.' },
    { source: 'Pickup', rel: 'GENERATES', target: 'Delivery', desc: 'Successful collection triggers active delivery dispatch.' },
    { source: 'Delivery', rel: 'DELIVERS', target: 'SurplusFood', desc: 'Safe delivery of preserved meals.' },
    { source: 'Delivery', rel: 'GOES_TO', target: 'Shelter', desc: 'Target destination shelter receiving ration.' },
    { source: 'Delivery', rel: 'FOLLOWS', target: 'Route', desc: 'Optimized transit corridor with distance and duration.' },
    { source: 'Beneficiary', rel: 'RECEIVES', target: 'SurplusFood', desc: 'End recipients consume the delivered nutrition.' },
    { source: 'Delivery', rel: 'GENERATES', target: 'Feedback', desc: 'Post-delivery hygiene, quality, and punctuality rating.' },
    { source: 'Donor', rel: 'LOGS', target: 'Donation', desc: 'Audit record and snapshot preserving historical CSR impact.' },
  ];

  const entities = [
    { name: 'Donor', color: '#15803d', desc: 'Restaurants, caterers, bakeries' },
    { name: 'SurplusFood', color: '#047857', desc: 'Active perishable food batches' },
    { name: 'FoodItem', color: '#0d9488', desc: 'Item description & veg/non-veg flag' },
    { name: 'FoodCategory', color: '#0891b2', desc: 'Cooked, Bakery, Fresh produce' },
    { name: 'NGO', color: '#2563eb', desc: 'Non-profit redistribution organizations' },
    { name: 'Shelter', color: '#4f46e5', desc: 'Community homes & capacity' },
    { name: 'Beneficiary', color: '#7c3aed', desc: 'Target recipients & cohorts' },
    { name: 'Volunteer', color: '#c026d3', desc: 'On-ground rescue personnel' },
    { name: 'Vehicle', color: '#db2777', desc: 'Fleet units & refrigerated capacity' },
    { name: 'FoodRequest', color: '#ea580c', desc: 'Demand ticket with deadline' },
    { name: 'Pickup', color: '#d97706', desc: 'Collection logistics event' },
    { name: 'Delivery', color: '#16a34a', desc: 'Distribution destination record' },
    { name: 'Location', color: '#64748b', desc: 'Geocoded GPS & city address' },
    { name: 'Route', color: '#475569', desc: 'Source to destination transit stats' },
    { name: 'Donation', color: '#059669', desc: 'Historical donation audit' },
    { name: 'Feedback', color: '#ca8a04', desc: '1-5 star ratings & meal reviews' },
  ];

  return (
    <div>
      <div className="card">
        <div className="card-title">🌐 Visual Graph Schema: Entities & Logical Relationships</div>
        <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '20px' }}>
          This visual graph portrays the relational model implemented via <strong>MongoDB ObjectIds</strong> and <strong>Mongoose <code>$lookup</code> & population</strong> in <strong>MongoDB Atlas</strong>.
        </p>

        {/* Visual Entity Nodes Cloud */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px', padding: '16px', background: '#faf7ee', borderRadius: '10px', border: '1px solid #e2d9c8' }}>
          {entities.map((ent) => (
            <div
              key={ent.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                backgroundColor: 'white',
                border: `2px solid ${ent.color}`,
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
            >
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: ent.color }} />
              <div>
                <strong style={{ fontSize: '13px', color: '#1f2937' }}>{ent.name}</strong>
                <div style={{ fontSize: '10px', color: '#6b7280' }}>{ent.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Relationship Arrows Grid */}
        <div className="card-title">Labelled Relationships & References</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
          {relationships.map((rel, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                border: '1px solid #e2d9c8',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontWeight: 700, color: '#15803d', fontSize: '14px', background: '#dcfce7', padding: '4px 8px', borderRadius: '4px' }}>
                  {rel.source}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}>
                  <div style={{ height: '2px', background: '#94a3b8', flex: 1 }} />
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#1e293b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {rel.rel}
                  </span>
                  <span style={{ color: '#94a3b8' }}>➔</span>
                </div>

                <span style={{ fontWeight: 700, color: '#0f766e', fontSize: '14px', background: '#ccfbf1', padding: '4px 8px', borderRadius: '4px' }}>
                  {rel.target}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>{rel.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GraphSchemaPage;
