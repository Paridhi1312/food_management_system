import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const SurplusFoodPage = () => {
  const [surplusList, setSurplusList] = useState([]);
  const [donors, setDonors] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [sortByExpiry, setSortByExpiry] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    surplusId: '',
    quantity: 50,
    unit: 'meals',
    preparedTime: new Date().toISOString().slice(0, 16),
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'Available',
    packagingType: 'Sealed Container',
    donorId: '',
    foodItemId: '',
    locationId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (sortByExpiry) params.sort = 'expiryTime';

      const [surplusRes, donorRes, itemRes, locRes] = await Promise.all([
        api.list('surplus-food', params),
        api.list('donors'),
        api.list('food-items'),
        api.list('locations'),
      ]);

      if (surplusRes.success) setSurplusList(surplusRes.data);
      if (donorRes.success) setDonors(donorRes.data);
      if (itemRes.success) setFoodItems(itemRes.data);
      if (locRes.success) setLocations(locRes.data);
    } catch (err) {
      alert('Error fetching surplus food: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus, sortByExpiry]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      surplusId: `SUR-${Math.floor(100 + Math.random() * 900)}`,
      quantity: 50,
      unit: 'meals',
      preparedTime: new Date().toISOString().slice(0, 16),
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      status: 'Available',
      packagingType: 'Sealed Container',
      donorId: donors[0]?._id || '',
      foodItemId: foodItems[0]?._id || '',
      locationId: locations[0]?._id || '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      surplusId: item.surplusId,
      quantity: item.quantity,
      unit: item.unit,
      preparedTime: new Date(item.preparedTime).toISOString().slice(0, 16),
      expiryTime: new Date(item.expiryTime).toISOString().slice(0, 16),
      status: item.status,
      packagingType: item.packagingType,
      donorId: item.donorId?._id || item.donorId,
      foodItemId: item.foodItemId?._id || item.foodItemId,
      locationId: item.locationId?._id || item.locationId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (new Date(formData.expiryTime) <= new Date(formData.preparedTime)) {
        alert('Expiry time must be strictly after prepared time!');
        return;
      }

      if (editingItem) {
        await api.update('surplus-food', editingItem._id, formData);
        alert('Surplus food updated in MongoDB Atlas!');
      } else {
        await api.create('surplus-food', formData);
        alert('Surplus food listing added to MongoDB Atlas!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      alert('Operation failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this surplus food record from MongoDB Atlas?')) {
      try {
        await api.delete('surplus-food', id);
        alert('Deleted successfully!');
        loadData();
      } catch (err) {
        alert('Delete failed: ' + err.message);
      }
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Allocated">Allocated</option>
            <option value="Delivered">Delivered</option>
            <option value="Expired">Expired</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={sortByExpiry}
              onChange={(e) => setSortByExpiry(e.target.checked)}
            />
            Sort by Expiry (Earliest First)
          </label>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          🍲 Register Surplus Food
        </button>
      </div>

      <div className="card">
        <div className="card-title">Surplus Food Listings ({surplusList.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Surplus ID</th>
                <th>Food Item</th>
                <th>Donor</th>
                <th>Quantity</th>
                <th>Allocated</th>
                <th>Packaging</th>
                <th>Prepared / Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {surplusList.map((s) => {
                const isExpired = new Date(s.expiryTime) < new Date();
                return (
                  <tr key={s._id} style={{ backgroundColor: isExpired ? '#fff5f5' : 'inherit' }}>
                    <td><code>{s.surplusId}</code></td>
                    <td>
                      <strong>{s.foodItemId?.name || 'Unnamed Food'}</strong>
                      {s.foodItemId?.vegetarian && (
                        <span style={{ marginLeft: '6px', color: '#16a34a', fontSize: '12px' }}>🌱 Pure Veg</span>
                      )}
                    </td>
                    <td>{s.donorId?.name || 'N/A'}</td>
                    <td><strong>{s.quantity} {s.unit}</strong></td>
                    <td>{s.allocatedQuantity || 0} {s.unit}</td>
                    <td><span className="badge badge-secondary">{s.packagingType}</span></td>
                    <td>
                      <div style={{ fontSize: '12px' }}>Prep: {new Date(s.preparedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isExpired ? '#dc2626' : '#15803d' }}>
                        Exp: {new Date(s.expiryTime).toLocaleString()} {isExpired && '(EXPIRED)'}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        s.status === 'Available' ? 'badge-success' :
                        s.status === 'Delivered' ? 'badge-info' :
                        s.status === 'Expired' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(s)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Surplus Food' : 'Register Surplus Food'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Surplus ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.surplusId}
                    onChange={(e) => setFormData({ ...formData, surplusId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Food Item</label>
                  <select
                    className="form-control"
                    value={formData.foodItemId}
                    onChange={(e) => setFormData({ ...formData, foodItemId: e.target.value })}
                    required
                  >
                    <option value="">Select Food Item</option>
                    {foodItems.map((fi) => (
                      <option key={fi._id} value={fi._id}>{fi.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Donor Organization</label>
                  <select
                    className="form-control"
                    value={formData.donorId}
                    onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                    required
                  >
                    <option value="">Select Donor</option>
                    {donors.map((d) => (
                      <option key={d._id} value={d._id}>{d.name} ({d.type})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Total Available Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit</label>
                  <select
                    className="form-control"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="meals">meals</option>
                    <option value="packets">packets</option>
                    <option value="kg">kg</option>
                    <option value="boxes">boxes</option>
                    <option value="litres">litres</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Packaging Type</label>
                  <select
                    className="form-control"
                    value={formData.packagingType}
                    onChange={(e) => setFormData({ ...formData, packagingType: e.target.value })}
                  >
                    <option value="Sealed Container">Sealed Container</option>
                    <option value="Aluminum Foil">Aluminum Foil</option>
                    <option value="Cardboard Box">Cardboard Box</option>
                    <option value="Plastic Container">Plastic Container</option>
                    <option value="Insulated Crate">Insulated Crate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Prepared Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.preparedTime}
                    onChange={(e) => setFormData({ ...formData, preparedTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.expiryTime}
                    onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Reserved">Reserved</option>
                    <option value="Allocated">Allocated</option>
                    <option value="Picked Up">Picked Up</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Save Updates' : 'Add Surplus Food'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurplusFoodPage;
