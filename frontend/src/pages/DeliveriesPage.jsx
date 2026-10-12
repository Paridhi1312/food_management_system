import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [surplusList, setSurplusList] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    deliveryId: '',
    quantityDelivered: 50,
    status: 'Scheduled',
    shelterId: '',
    surplusId: '',
    routeId: '',
    beneficiaryId: '',
  });

  const loadData = async () => {
    try {
      const [delRes, shlRes, surRes, rtRes, benRes] = await Promise.all([
        api.list('deliveries'),
        api.list('shelters'),
        api.list('surplus-food'),
        api.list('routes'),
        api.list('beneficiaries'),
      ]);
      if (delRes.success) setDeliveries(delRes.data);
      if (shlRes.success) setShelters(shlRes.data);
      if (surRes.success) setSurplusList(surRes.data);
      if (rtRes.success) setRoutes(rtRes.data);
      if (benRes.success) setBeneficiaries(benRes.data);
    } catch (err) {
      alert('Error fetching deliveries: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      deliveryId: `DEL-${Math.floor(100 + Math.random() * 900)}`,
      quantityDelivered: 50,
      status: 'Scheduled',
      shelterId: shelters[0]?._id || '',
      surplusId: surplusList[0]?._id || '',
      routeId: routes[0]?._id || '',
      beneficiaryId: beneficiaries[0]?._id || '',
    });
    setIsModalOpen(true);
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    try {
      await api.create('deliveries', formData);
      alert('Delivery logged into MongoDB Atlas!');
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.update('deliveries', id, { status });
      loadData();
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontWeight: 600 }}>Redistribution Route & Delivery Tracking</span>
          <span style={{ color: '#6b7280', fontSize: '13px', marginLeft: '8px' }}>
            Tracking surplus distribution to destination community shelters.
          </span>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          📦 Record New Delivery
        </button>
      </div>

      {/* Deliveries Table */}
      <div className="card">
        <div className="card-title">Completed & Active Deliveries ({deliveries.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery ID</th>
                <th>Destination Shelter</th>
                <th>Quantity</th>
                <th>Surplus Item</th>
                <th>Beneficiary Rep</th>
                <th>Route Info</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((del) => (
                <tr key={del._id}>
                  <td><code>{del.deliveryId}</code></td>
                  <td><strong>{del.shelterId?.name || 'N/A'}</strong></td>
                  <td><strong>{del.quantityDelivered} units</strong></td>
                  <td>{del.surplusId?.foodItemId?.name || 'Food Batch'}</td>
                  <td>{del.beneficiaryId?.name || 'General Ward'}</td>
                  <td>
                    {del.routeId ? (
                      <span style={{ fontSize: '12px' }}>
                        {del.routeId.distanceKm} km ({del.routeId.estimatedDuration})
                      </span>
                    ) : (
                      'Direct Transit'
                    )}
                  </td>
                  <td>
                    <span className={`badge ${
                      del.status === 'Delivered' ? 'badge-success' :
                      del.status === 'Out for Delivery' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {del.status}
                    </span>
                  </td>
                  <td>
                    {del.status !== 'Delivered' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleUpdateStatus(del._id, 'Delivered')}
                      >
                        Mark Delivered
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Routes Directory */}
      <div className="card">
        <div className="card-title">Transit Routes Directory ({routes.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Route ID</th>
                <th>Distance</th>
                <th>Estimated Transit Time</th>
                <th>Traffic Status</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((rt) => (
                <tr key={rt._id}>
                  <td><code>{rt.routeId}</code></td>
                  <td><strong>{rt.distanceKm} km</strong></td>
                  <td>{rt.estimatedDuration}</td>
                  <td><span className="badge badge-success">{rt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Delivery Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Delivery</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDelivery}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Delivery ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.deliveryId}
                    onChange={(e) => setFormData({ ...formData, deliveryId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination Shelter</label>
                  <select
                    className="form-control"
                    value={formData.shelterId}
                    onChange={(e) => setFormData({ ...formData, shelterId: e.target.value })}
                    required
                  >
                    <option value="">Select Shelter</option>
                    {shelters.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity Delivered</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.quantityDelivered}
                    onChange={(e) => setFormData({ ...formData, quantityDelivered: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Surplus Food Batch</label>
                  <select
                    className="form-control"
                    value={formData.surplusId}
                    onChange={(e) => setFormData({ ...formData, surplusId: e.target.value })}
                    required
                  >
                    <option value="">Select Food</option>
                    {surplusList.map((s) => (
                      <option key={s._id} value={s._id}>{s.surplusId} - {s.quantity} {s.unit}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assigned Route</label>
                  <select
                    className="form-control"
                    value={formData.routeId}
                    onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  >
                    <option value="">Select Route</option>
                    {routes.map((r) => (
                      <option key={r._id} value={r._id}>{r.routeId} ({r.distanceKm} km)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Beneficiary Group / Rep</label>
                  <select
                    className="form-control"
                    value={formData.beneficiaryId}
                    onChange={(e) => setFormData({ ...formData, beneficiaryId: e.target.value })}
                  >
                    <option value="">Select Beneficiary</option>
                    {beneficiaries.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveriesPage;
