import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const FoodRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [matchingData, setMatchingData] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    requestId: '',
    quantityRequired: 50,
    requiredBefore: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    priority: 'Medium',
    ngoId: '',
    shelterId: '',
  });

  const loadData = async () => {
    try {
      const [reqRes, ngoRes, shlRes] = await Promise.all([
        api.list('food-requests'),
        api.list('ngos'),
        api.list('shelters'),
      ]);
      if (reqRes.success) setRequests(reqRes.data);
      if (ngoRes.success) setNgos(ngoRes.data);
      if (shlRes.success) setShelters(shlRes.data);
    } catch (err) {
      alert('Error fetching data: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      requestId: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      quantityRequired: 50,
      requiredBefore: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      priority: 'Medium',
      ngoId: ngos[0]?._id || '',
      shelterId: shelters[0]?._id || '',
    });
    setIsModalOpen(true);
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      await api.create('food-requests', formData);
      alert('Food Request created in MongoDB Atlas!');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleFindMatches = async (req) => {
    setSelectedRequest(req);
    try {
      const res = await api.matchFoodRequest(req._id);
      if (res.success) {
        setMatchingData(res);
      }
    } catch (err) {
      alert('Error matching requests: ' + err.message);
    }
  };

  const handleAllocateFood = async (surplusId, availableQty) => {
    const qtyToAllocate = prompt(
      `Enter quantity to allocate from surplus (Max available: ${availableQty}, Remaining required: ${matchingData.request.remainingRequired}):`,
      Math.min(availableQty, matchingData.request.remainingRequired)
    );

    if (!qtyToAllocate || isNaN(qtyToAllocate) || parseFloat(qtyToAllocate) <= 0) return;

    try {
      const res = await api.allocateFood({
        requestId: matchingData.request.id,
        surplusId,
        allocateQuantity: parseFloat(qtyToAllocate),
      });

      if (res.success) {
        alert(`Allocation successful! ${res.message}`);
        // Refresh match modal and requests
        const refreshed = await api.matchFoodRequest(matchingData.request.id);
        setMatchingData(refreshed);
        loadData();
      }
    } catch (err) {
      alert('Allocation error: ' + err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 600 }}>Surplus Food Matching Engine:</span>
          <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '8px' }}>
            Matches pending requests with available non-expired food by quantity, shelf-life, and urgency.
          </span>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          ➕ Post Food Request
        </button>
      </div>

      {/* Requests List */}
      <div className="card">
        <div className="card-title">Food Requests ({requests.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Requesting NGO</th>
                <th>Shelter</th>
                <th>Required</th>
                <th>Fulfilled</th>
                <th>Deadline</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Smart Match</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td><code>{r.requestId}</code></td>
                  <td><strong>{r.ngoId?.name || 'N/A'}</strong></td>
                  <td>{r.shelterId?.name || 'N/A'}</td>
                  <td><strong>{r.quantityRequired} units</strong></td>
                  <td>
                    <span style={{ color: r.fulfilledQuantity >= r.quantityRequired ? '#15803d' : '#b45309' }}>
                      {r.fulfilledQuantity || 0} / {r.quantityRequired}
                    </span>
                  </td>
                  <td>{new Date(r.requiredBefore).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${r.priority === 'Urgent' ? 'badge-danger' : r.priority === 'High' ? 'badge-warning' : 'badge-secondary'}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Fulfilled' ? 'badge-success' : r.status === 'Partially Fulfilled' ? 'badge-warning' : 'badge-secondary'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    {r.status !== 'Fulfilled' ? (
                      <button className="btn btn-primary btn-sm" onClick={() => handleFindMatches(r)}>
                        ⚡ Find Matches
                      </button>
                    ) : (
                      <span style={{ color: '#15803d', fontSize: '12px', fontWeight: 600 }}>✅ Fulfilled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Engine Results Modal */}
      {matchingData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>Matching Results for {matchingData.request.requestId}</h3>
                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  Target: {matchingData.request.remainingRequired} units needed before {new Date(matchingData.request.requiredBefore).toLocaleString()}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => setMatchingData(null)}>✕</button>
            </div>

            {matchingData.matches && matchingData.matches.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {matchingData.matches.map((m, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid #e2d9c8',
                      borderRadius: '10px',
                      padding: '16px',
                      background: m.matchScore >= 70 ? '#f0fdf4' : '#faf7ee',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{m.surplus.foodItemId?.name}</strong>
                        <span style={{ marginLeft: '10px', color: '#6b7280', fontSize: '13px' }}>
                          Donor: {m.surplus.donorId?.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={`badge ${m.matchScore >= 70 ? 'badge-success' : 'badge-warning'}`}>
                          {m.matchScore}% Compatibility
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAllocateFood(m.surplus._id, m.availableQuantity)}
                        >
                          Allocate Food
                        </button>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', display: 'flex', gap: '20px', color: '#374151', marginBottom: '10px' }}>
                      <div>📦 Available: <strong>{m.availableQuantity} {m.surplus.unit}</strong></div>
                      <div>⏳ Expiry: <strong>{new Date(m.surplus.expiryTime).toLocaleString()}</strong></div>
                      <div>🛡️ Packaging: <strong>{m.surplus.packagingType}</strong></div>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#4b5563', marginBottom: '4px' }}>
                        Why this matches:
                      </div>
                      <ul style={{ fontSize: '12px', color: '#047857', paddingLeft: '18px', margin: 0 }}>
                        {m.matchReasons.map((r, rIdx) => (
                          <li key={rIdx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="alert alert-warning">
                No matching available surplus food currently found with sufficient shelf-life or unallocated quantity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Food Request Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Food Request</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateRequest}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Request ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.requestId}
                    onChange={(e) => setFormData({ ...formData, requestId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity Required</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.quantityRequired}
                    onChange={(e) => setFormData({ ...formData, quantityRequired: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Requesting NGO</label>
                  <select
                    className="form-control"
                    value={formData.ngoId}
                    onChange={(e) => setFormData({ ...formData, ngoId: e.target.value })}
                    required
                  >
                    <option value="">Select NGO</option>
                    {ngos.map((n) => (
                      <option key={n._id} value={n._id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Destination Shelter</label>
                  <select
                    className="form-control"
                    value={formData.shelterId}
                    onChange={(e) => setFormData({ ...formData, shelterId: e.target.value })}
                  >
                    <option value="">Select Shelter</option>
                    {shelters.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} (Cap: {s.capacity})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Required Before (Deadline)</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.requiredBefore}
                    onChange={(e) => setFormData({ ...formData, requiredBefore: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodRequestsPage;
