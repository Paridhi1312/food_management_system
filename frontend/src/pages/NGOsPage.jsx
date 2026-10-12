import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const NGOsPage = () => {
  const [ngos, setNgos] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isNgoModal, setIsNgoModal] = useState(false);
  const [isShelterModal, setIsShelterModal] = useState(false);

  // NGO Form
  const [ngoForm, setNgoForm] = useState({
    ngoId: '',
    name: '',
    registrationNumber: '',
    phone: '',
    email: '',
  });

  // Shelter Form
  const [shelterForm, setShelterForm] = useState({
    shelterId: '',
    name: '',
    capacity: 100,
    phone: '',
    address: '',
    ngoId: '',
    locationId: '',
  });

  const loadData = async () => {
    try {
      const [ngoRes, shelterRes, locRes] = await Promise.all([
        api.list('ngos'),
        api.list('shelters'),
        api.list('locations'),
      ]);
      if (ngoRes.success) setNgos(ngoRes.data);
      if (shelterRes.success) setShelters(shelterRes.data);
      if (locRes.success) setLocations(locRes.data);
    } catch (err) {
      alert('Error fetching NGO data: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNGO = async (e) => {
    e.preventDefault();
    try {
      await api.create('ngos', ngoForm);
      alert('NGO registered in MongoDB Atlas!');
      setIsNgoModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleCreateShelter = async (e) => {
    e.preventDefault();
    try {
      await api.create('shelters', shelterForm);
      alert('Shelter registered and linked to NGO in Atlas!');
      setIsShelterModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleDeleteNgo = async (id) => {
    if (window.confirm('Delete this NGO?')) {
      await api.delete('ngos', id);
      loadData();
    }
  };

  const handleDeleteShelter = async (id) => {
    if (window.confirm('Delete this shelter?')) {
      await api.delete('shelters', id);
      loadData();
    }
  };

  return (
    <div>
      {/* Top action cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setNgoForm({
              ngoId: `NGO-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              registrationNumber: `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`,
              phone: '',
              email: '',
            });
            setIsNgoModal(true);
          }}
        >
          🏢 Register New NGO
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setShelterForm({
              shelterId: `SHL-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              capacity: 100,
              phone: '',
              address: '',
              ngoId: ngos[0]?._id || '',
              locationId: locations[0]?._id || '',
            });
            setIsShelterModal(true);
          }}
        >
          🏠 Register Community Shelter
        </button>
      </div>

      {/* NGOs Table */}
      <div className="card">
        <div className="card-title">Registered NGOs ({ngos.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>NGO ID</th>
                <th>Atlas _id</th>
                <th>Organization Name</th>
                <th>Govt Registration</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ngos.map((ngo) => (
                <tr key={ngo._id}>
                  <td><code>{ngo.ngoId}</code></td>
                  <td><code style={{ fontSize: '11px', color: '#6366f1' }}>{ngo._id}</code></td>
                  <td><strong>{ngo.name}</strong></td>
                  <td><span className="badge badge-info">{ngo.registrationNumber}</span></td>
                  <td>{ngo.phone}</td>
                  <td>{ngo.email}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteNgo(ngo._id)}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shelters Table */}
      <div className="card">
        <div className="card-title">Managed Shelters ({shelters.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shelter ID</th>
                <th>Shelter Name</th>
                <th>Managing NGO</th>
                <th>Capacity</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shelters.map((sh) => (
                <tr key={sh._id}>
                  <td><code>{sh.shelterId}</code></td>
                  <td><strong>{sh.name}</strong></td>
                  <td>
                    <span className="badge badge-success">
                      {sh.ngoId?.name || 'Linked NGO'}
                    </span>
                  </td>
                  <td><strong>{sh.capacity} beds/people</strong></td>
                  <td>{sh.phone}</td>
                  <td>{sh.address}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteShelter(sh._id)}>
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* NGO Modal */}
      {isNgoModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Non-Profit Organization (NGO)</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsNgoModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateNGO}>
              <div className="form-grid">
                <div className="form-group">
                  <label>NGO ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ngoForm.ngoId}
                    onChange={(e) => setNgoForm({ ...ngoForm, ngoId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>NGO Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ngoForm.name}
                    onChange={(e) => setNgoForm({ ...ngoForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Registration Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ngoForm.registrationNumber}
                    onChange={(e) => setNgoForm({ ...ngoForm, registrationNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={ngoForm.phone}
                    onChange={(e) => setNgoForm({ ...ngoForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={ngoForm.email}
                    onChange={(e) => setNgoForm({ ...ngoForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsNgoModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Atlas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelter Modal */}
      {isShelterModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Community Shelter</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsShelterModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateShelter}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Shelter ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shelterForm.shelterId}
                    onChange={(e) => setShelterForm({ ...shelterForm, shelterId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Shelter Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shelterForm.name}
                    onChange={(e) => setShelterForm({ ...shelterForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Managing NGO</label>
                  <select
                    className="form-control"
                    value={shelterForm.ngoId}
                    onChange={(e) => setShelterForm({ ...shelterForm, ngoId: e.target.value })}
                    required
                  >
                    <option value="">Select NGO</option>
                    {ngos.map((n) => (
                      <option key={n._id} value={n._id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Capacity (Persons)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={shelterForm.capacity}
                    onChange={(e) => setShelterForm({ ...shelterForm, capacity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shelterForm.phone}
                    onChange={(e) => setShelterForm({ ...shelterForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={shelterForm.address}
                    onChange={(e) => setShelterForm({ ...shelterForm, address: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsShelterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NGOsPage;
