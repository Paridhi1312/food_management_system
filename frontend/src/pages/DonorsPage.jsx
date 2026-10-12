import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const DonorsPage = () => {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [donorHistory, setDonorHistory] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    donorId: '',
    name: '',
    type: 'Restaurant',
    phone: '',
    email: '',
    address: '',
  });

  const loadDonors = async () => {
    try {
      setLoading(true);
      const res = await api.list('donors', { search });
      if (res.success) setDonors(res.data);
    } catch (err) {
      alert('Error fetching donors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonors();
  }, [search]);

  const handleOpenAdd = () => {
    setEditingDonor(null);
    setFormData({
      donorId: `DNR-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type: 'Restaurant',
      phone: '',
      email: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (donor) => {
    setEditingDonor(donor);
    setFormData({
      donorId: donor.donorId,
      name: donor.name,
      type: donor.type,
      phone: donor.phone,
      email: donor.email,
      address: donor.address,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDonor) {
        await api.update('donors', editingDonor._id, formData);
        alert('Donor updated successfully in MongoDB Atlas!');
      } else {
        await api.create('donors', formData);
        alert('Donor created successfully in MongoDB Atlas!');
      }
      setIsModalOpen(false);
      loadDonors();
    } catch (err) {
      alert('Operation failed: ' + err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete donor "${name}"? Historical donation records will be preserved.`)) {
      try {
        await api.delete('donors', id);
        alert('Donor deleted successfully!');
        loadDonors();
      } catch (err) {
        alert('Failed to delete: ' + err.message);
      }
    }
  };

  const handleViewHistory = async (donor) => {
    try {
      const res = await api.list('donations', { donorId: donor._id });
      setDonorHistory(res.data || []);
      setHistoryModal(donor);
    } catch (err) {
      alert('Error loading history: ' + err.message);
    }
  };

  return (
    <div>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Search donors by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          ➕ Add New Donor
        </button>
      </div>

      <div className="card">
        <div className="card-title">All Registered Donors ({donors.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donor ID</th>
                <th>Atlas _id</th>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donors.map((d) => (
                <tr key={d._id}>
                  <td><code>{d.donorId}</code></td>
                  <td><code style={{ fontSize: '11px', color: '#6366f1' }}>{d._id}</code></td>
                  <td><strong>{d.name}</strong></td>
                  <td><span className="badge badge-info">{d.type}</span></td>
                  <td>
                    <div>{d.phone}</div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{d.email}</div>
                  </td>
                  <td>{d.address}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleViewHistory(d)}>
                        📜 History
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEdit(d)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d._id, d.name)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {donors.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                    No donors found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingDonor ? 'Edit Donor' : 'Add New Donor'}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Donor ID (Logical Unique)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.donorId}
                    onChange={(e) => setFormData({ ...formData, donorId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Donor / Organization Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Donor Type</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="Restaurant">Restaurant</option>
                    <option value="Supermarket">Supermarket</option>
                    <option value="Individual">Individual</option>
                    <option value="Event Organizer">Event Organizer</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Physical Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDonor ? 'Save Changes' : 'Create Donor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Donation History Modal */}
      {historyModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Donation History: {historyModal.name}</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setHistoryModal(null)}>✕</button>
            </div>
            {donorHistory.length > 0 ? (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Donation ID</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Donation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donorHistory.map((h) => (
                      <tr key={h._id}>
                        <td><code>{h.donationId}</code></td>
                        <td>{h.quantityDonated} {h.unit}</td>
                        <td><span className="badge badge-success">{h.status}</span></td>
                        <td>{new Date(h.donationDate).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: '#6b7280', padding: '16px 0' }}>No donations recorded yet for this donor.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorsPage;
