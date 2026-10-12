import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const DatabaseOperationsPage = () => {
  const [activeSubTab, setActiveSubTab] = useState('browser'); // 'browser' | 'queries' | 'aggregations' | 'indexes'
  const [collections, setCollections] = useState([]);
  const [selectedCol, setSelectedCol] = useState('donors');
  const [documents, setDocuments] = useState([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [page, setPage] = useState(1);
  const [filterJson, setFilterJson] = useState('{}');
  const [sortJson, setSortJson] = useState('{ "_id": -1 }');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditModal, setIsEditModal] = useState(false);
  const [isInsertModal, setIsInsertModal] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Queries State
  const [queryType, setQueryType] = useState('availableSurplus');
  const [queryResult, setQueryResult] = useState(null);

  // Aggregations State
  const [pipelineId, setPipelineId] = useState('1');
  const [pipelineData, setPipelineData] = useState(null);

  // Indexes State
  const [indexList, setIndexList] = useState([]);

  // Load Collections
  const loadCollections = async () => {
    try {
      const res = await api.getCollections();
      if (res.success) {
        setCollections(res.collections);
        if (res.collections.length > 0 && !res.collections.find((c) => c.name === selectedCol)) {
          setSelectedCol(res.collections[0].name);
        }
      }
    } catch (err) {
      setErrorMsg('Failed to load collections: ' + err.message);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  // Load Documents for selected collection
  const loadDocs = async () => {
    if (!selectedCol) return;
    try {
      setErrorMsg(null);
      const res = await api.getRawDocuments(selectedCol, {
        page,
        limit: 15,
        filter: filterJson,
        sort: sortJson,
      });
      if (res.success) {
        setDocuments(res.documents);
        setTotalDocs(res.total);
      }
    } catch (err) {
      setErrorMsg('Failed to fetch documents: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'browser') {
      loadDocs();
    }
  }, [selectedCol, page, activeSubTab]);

  // Load Indexes for collection
  const loadIndexes = async () => {
    if (!selectedCol) return;
    try {
      const res = await api.getCollectionIndexes(selectedCol);
      if (res.success) setIndexList(res.indexes);
    } catch (err) {
      setErrorMsg('Failed to load indexes: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'indexes') {
      loadIndexes();
    }
  }, [selectedCol, activeSubTab]);

  // Run Predefined Queries
  const runPredefinedQuery = async () => {
    try {
      setErrorMsg(null);
      const res = await api.executeAdvancedQuery({ queryType });
      if (res.success) {
        setQueryResult(res);
      }
    } catch (err) {
      setErrorMsg('Query execution error: ' + err.message);
    }
  };

  // Run Aggregation Pipeline
  const runAggregation = async () => {
    try {
      setErrorMsg(null);
      const res = await api.getAggregations(pipelineId);
      if (res.success) {
        setPipelineData(res.data);
      }
    } catch (err) {
      setErrorMsg('Aggregation error: ' + err.message);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'aggregations') {
      runAggregation();
    }
  }, [pipelineId, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === 'queries') {
      runPredefinedQuery();
    }
  }, [queryType, activeSubTab]);

  // Raw Document Operations
  const handleInsertDocument = async () => {
    try {
      setErrorMsg(null);
      const parsed = JSON.parse(jsonInput);
      const res = await api.insertRawDoc(selectedCol, parsed);
      setSuccessMsg(res.message);
      setIsInsertModal(false);
      loadDocs();
      loadCollections();
    } catch (err) {
      setErrorMsg('Insert error: ' + err.message);
    }
  };

  const handleUpdateDocument = async () => {
    try {
      setErrorMsg(null);
      const parsed = JSON.parse(jsonInput);
      const res = await api.updateRawDoc(selectedCol, selectedDoc._id, parsed);
      setSuccessMsg(res.message);
      setIsEditModal(false);
      loadDocs();
    } catch (err) {
      setErrorMsg('Update error: ' + err.message);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm(`Delete document ${id} from MongoDB Atlas?`)) {
      try {
        setErrorMsg(null);
        const res = await api.deleteRawDoc(selectedCol, id);
        setSuccessMsg(res.message);
        loadDocs();
        loadCollections();
      } catch (err) {
        setErrorMsg('Delete error: ' + err.message);
      }
    }
  };

  return (
    <div>
      {/* Alert Notices */}
      {errorMsg && <div className="alert alert-error">❌ {errorMsg}</div>}
      {successMsg && <div className="alert alert-success">✅ {successMsg}</div>}

      {/* Lab Demo Subtabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2d9c8', paddingBottom: '10px' }}>
        {[
          { id: 'browser', label: '🗄️ Collections & Raw CRUD', desc: 'Browse Atlas collections, view ObjectIds, insert/update/delete' },
          { id: 'queries', label: '🔍 Advanced MongoDB Queries', desc: 'Find, sort, range filters, 24h expiry check, multiple donations' },
          { id: 'aggregations', label: '📊 Aggregation Pipelines', desc: '$match, $group, $sort, $project, $lookup, $unwind' },
          { id: 'indexes', label: '⚡ Index Information', desc: 'View B-Tree indexes created in Atlas' },
        ].map((t) => (
          <button
            key={t.id}
            className={`btn ${activeSubTab === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveSubTab(t.id);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: Collections Browser & Raw CRUD */}
      {activeSubTab === 'browser' && (
        <div>
          {/* Collection Selector & Filter Bar */}
          <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontWeight: 600, fontSize: '13px' }}>Select Collection:</label>
              <select
                className="form-control"
                value={selectedCol}
                onChange={(e) => {
                  setSelectedCol(e.target.value);
                  setPage(1);
                }}
              >
                {collections.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name} ({c.documentCount} docs)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setJsonInput('{\n  \n}');
                  setIsInsertModal(true);
                }}
              >
                ➕ Insert New Document
              </button>
            </div>
          </div>

          {/* Filter / Sort Query Inputs */}
          <div className="card" style={{ background: '#fdfbf7' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <div className="form-group">
                <label>Filter Query (Valid JSON format):</label>
                <input
                  type="text"
                  className="form-control"
                  value={filterJson}
                  onChange={(e) => setFilterJson(e.target.value)}
                  placeholder='e.g. { "status": "Available" }'
                />
              </div>
              <div className="form-group">
                <label>Sort Query (Valid JSON format):</label>
                <input
                  type="text"
                  className="form-control"
                  value={sortJson}
                  onChange={(e) => setSortJson(e.target.value)}
                  placeholder='e.g. { "createdAt": -1 }'
                />
              </div>
              <button className="btn btn-primary" onClick={() => { setPage(1); loadDocs(); }}>
                Run Find()
              </button>
            </div>
          </div>

          {/* Documents Table */}
          <div className="card">
            <div className="card-title">
              <span>Collection: <code>{selectedCol}</code> (Showing page {page} of {Math.ceil(totalDocs / 15) || 1} — Total: {totalDocs} docs)</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  ◀ Prev
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page * 15 >= totalDocs}
                  onClick={() => setPage(page + 1)}
                >
                  Next ▶
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>_id (MongoDB ObjectId)</th>
                    <th>Document Preview</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc._id}>
                      <td style={{ verticalAlign: 'top', width: '220px' }}>
                        <code style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>{doc._id}</code>
                      </td>
                      <td style={{ verticalAlign: 'top' }}>
                        <pre style={{ margin: 0, fontSize: '11px', maxHeight: '100px', overflowY: 'auto', background: '#f8fafc', padding: '6px', borderRadius: '4px' }}>
                          {JSON.stringify(doc, null, 2)}
                        </pre>
                      </td>
                      <td style={{ verticalAlign: 'top', width: '180px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setSelectedDoc(doc);
                              setJsonInput(JSON.stringify(doc, null, 2));
                              setIsEditModal(true);
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteDocument(doc._id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                        No documents matched the criteria in this collection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Advanced MongoDB Queries */}
      {activeSubTab === 'queries' && (
        <div>
          <div className="card">
            <div className="card-title">Select Advanced Laboratory Query to Execute against MongoDB Atlas</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { id: 'availableSurplus', title: '1. Available Surplus Food', desc: 'Find surplus records where status = "Available" and expiryTime > now()' },
                { id: 'expiringSoon', title: '2. Expiring Within 24h', desc: 'Range query on expiryTime ($gt now, $lte now + 24h) for quick rescue' },
                { id: 'pendingRequests', title: '3. Pending Food Requests', desc: 'Find pending or partially fulfilled requests sorted by urgency' },
                { id: 'multipleDonations', title: '4. Donors With Multiple Donations', desc: 'Donors with 2 or more distinct historical contributions' },
                { id: 'shelterDeliveries', title: '5. Shelter Deliveries', desc: 'Find all dispatched and delivered rations for shelters' },
                { id: 'availableVolunteersAndVehicles', title: '6. Available Logistics Personnel', desc: 'Query ready drivers, volunteers, and vehicles' },
                { id: 'sortByExpiry', title: '7. Sort Food by Expiry Date', desc: 'Surplus food sorted ascending by closest expiration' },
                { id: 'filterRequests', title: '8. Filter Requests by Priority', desc: 'Priority and deadline filter query' },
              ].map((q) => (
                <div
                  key={q.id}
                  onClick={() => setQueryType(q.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    border: queryType === q.id ? '2px solid #15803d' : '1px solid #e2d9c8',
                    backgroundColor: queryType === q.id ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <strong style={{ fontSize: '14px', color: '#14532d' }}>{q.title}</strong>
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{q.desc}</p>
                </div>
              ))}
            </div>

            {queryResult && (
              <div>
                <div style={{ padding: '12px', background: '#faf7ee', borderRadius: '8px', border: '1px solid #e2d9c8', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 600, color: '#15803d' }}>{queryResult.description}</div>
                  <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '4px' }}>
                    Records returned from Atlas: <strong>{queryResult.count}</strong>
                  </div>
                </div>

                <div className="json-viewer">
                  {JSON.stringify(queryResult.data, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Aggregation Pipelines */}
      {activeSubTab === 'aggregations' && (
        <div>
          <div className="card">
            <div className="card-title">Demonstrate Aggregation Pipelines ($match, $group, $sort, $project, $lookup, $unwind)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {[
                { id: '1', title: '1. Total Quantity by Donor', desc: '$lookup, $unwind, $group sum' },
                { id: '2', title: '2. Quantity Delivered by Shelter', desc: '$match, $lookup, $group sum' },
                { id: '3', title: '3. Donations by Food Category', desc: 'Multi-level $lookup across 3 collections' },
                { id: '4', title: '4. Monthly Donation Totals', desc: '$group by year/month with $avg and $sum' },
                { id: '5', title: '5. Requests Grouped by Status', desc: '$group, $project with metrics' },
                { id: '6', title: '6. Average Feedback Rating', desc: '$group null with $avg, $min, $max' },
                { id: '7', title: '7. Top Donors Leaderboard', desc: '$group, $sort, $limit, $lookup' },
              ].map((p) => (
                <button
                  key={p.id}
                  className={`btn ${pipelineId === p.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPipelineId(p.id)}
                  style={{ textAlign: 'left', padding: '12px' }}
                >
                  <div><strong>{p.title}</strong></div>
                  <div style={{ fontSize: '11px', opacity: 0.85 }}>{p.desc}</div>
                </button>
              ))}
            </div>

            {pipelineData && (
              <div>
                <div style={{ padding: '14px', background: '#faf7ee', borderRadius: '8px', border: '1px solid #e2d9c8', marginBottom: '16px' }}>
                  <h4 style={{ color: '#15803d', marginBottom: '6px' }}>{pipelineData.name}</h4>
                  <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px' }}>{pipelineData.description}</p>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>MongoDB Aggregation Stages Executed:</span>
                    <pre style={{ background: '#f1ede4', padding: '10px', borderRadius: '6px', fontSize: '11px', marginTop: '6px', overflowX: 'auto' }}>
                      {JSON.stringify(pipelineData.pipelineSyntax, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="card-title">Live Aggregation Result ({pipelineData.count} grouped results):</div>
                <div className="json-viewer">
                  {JSON.stringify(pipelineData.result, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: Index Information */}
      {activeSubTab === 'indexes' && (
        <div>
          <div className="card">
            <div className="card-title">
              <span>B-Tree Indexes for Collection: <code>{selectedCol}</code></span>
              <select
                className="form-control"
                style={{ width: 'auto' }}
                value={selectedCol}
                onChange={(e) => setSelectedCol(e.target.value)}
              >
                {collections.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <p style={{ fontSize: '13px', color: '#4b5563', marginBottom: '16px' }}>
              These indexes are actively created in MongoDB Atlas to speed up search on primary and frequently queried keys (e.g. <code>donorId</code>, <code>status</code>, <code>expiryTime</code>, <code>requestId</code>, <code>donationDate</code>).
            </p>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Index Name</th>
                    <th>Key Definition</th>
                    <th>Unique</th>
                    <th>Version (v)</th>
                  </tr>
                </thead>
                <tbody>
                  {indexList.map((idx, i) => (
                    <tr key={i}>
                      <td><strong><code>{idx.name}</code></strong></td>
                      <td><code>{JSON.stringify(idx.key)}</code></td>
                      <td>{idx.unique ? <span className="badge badge-success">Unique Constraint</span> : <span className="badge badge-secondary">Secondary</span>}</td>
                      <td>v{idx.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Insert Document Modal */}
      {isInsertModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Insert Document into <code>{selectedCol}</code></h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsInsertModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
              Provide document in valid JSON format. MongoDB Atlas will assign an ObjectId automatically if _id is omitted.
            </p>
            <textarea
              rows="12"
              className="form-control"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsInsertModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInsertDocument}>Insert to Atlas</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {isEditModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3>Edit Document: <code>{selectedDoc?._id}</code></h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditModal(false)}>✕</button>
            </div>
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
              Modify JSON properties below. Note: _id is immutable.
            </p>
            <textarea
              rows="14"
              className="form-control"
              style={{ fontFamily: 'monospace', fontSize: '12px' }}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setIsEditModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateDocument}>Update in Atlas</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseOperationsPage;
