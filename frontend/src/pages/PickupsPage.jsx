import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const PickupsPage = () => {
  const [pickups, setPickups] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [surplusList, setSurplusList] = useState([]);
  const [isPickupModal, setIsPickupModal] = useState(false);
  const [isVolunteerModal, setIsVolunteerModal] = useState(false);

  // Pickup form
  const [pickupForm, setPickupForm] = useState({
    pickupId: '',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    status: 'Scheduled',
    volunteerId: '',
    vehicleId: '',
    surplusId: '',
    notes: '',
  });

  // Volunteer form
  const [volunteerForm, setVolunteerForm] = useState({
    volunteerId: '',
    name: '',
    phone: '',
    email: '',
    availability: 'Full Time',
    status: 'Available',
  });

  const loadData = async () => {
    try {
      const [pkpRes, volRes, vehRes, surRes] = await Promise.all([
        api.list('pickups'),
        api.list('volunteers'),
        api.list('vehicles'),
        api.list('surplus-food'),
      ]);
      if (pkpRes.success) setPickups(pkpRes.data);
      if (volRes.success) setVolunteers(volRes.data);
      if (vehRes.success) setVehicles(vehRes.data);
      if (surRes.success) setSurplusList(surRes.data);
    } catch (err) {
      alert('Error fetching pickups data: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePickup = async (e) => {
    e.preventDefault();
    try {
      await api.create('pickups', pickupForm);
      alert('Pickup scheduled in MongoDB Atlas!');
      setIsPickupModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleCreateVolunteer = async (e) => {
    e.preventDefault();
    try {
      await api.create('volunteers', volunteerForm);
      alert('Volunteer onboarded into MongoDB Atlas!');
      setIsVolunteerModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.update('pickups', id, {
        status: newStatus,
        ...(newStatus === 'Completed' ? { actualPickupTime: new Date() } : {}),
      });
      loadData();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setPickupForm({
              pickupId: `PKP-${Math.floor(100 + Math.random() * 900)}`,
              scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
              status: 'Scheduled',
              volunteerId: volunteers[0]?._id || '',
              vehicleId: vehicles[0]?._id || '',
              surplusId: surplusList[0]?._id || '',
              notes: '',
            });
            setIsPickupModal(true);
          }}
        >
          🚚 Schedule Food Pickup
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setVolunteerForm({
              volunteerId: `VOL-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              phone: '',
              email: '',
              availability: 'Full Time',
              status: 'Available',
            });
            setIsVolunteerModal(true);
          }}
        >
          🙋 Add Volunteer
        </button>
      </div>

      {/* Pickups Table */}
      <div className="card">
        <div className="card-title">Scheduled & Active Pickups ({pickups.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pickup ID</th>
                <th>Surplus Item</th>
                <th>Volunteer</th>
                <th>Vehicle Assigned</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Notes</th>
                <th>Update Status</th>
              </tr>
            </thead>
            <tbody>
              {pickups.map((p) => (
                <tr key={p._id}>
                  <td><code>{p.pickupId}</code></td>
                  <td><strong>{p.surplusId?.foodItemId?.name || 'Surplus Batch'}</strong></td>
                  <td>{p.volunteerId?.name || 'Unassigned'}</td>
                  <td>
                    {p.vehicleId ? (
                      <span>{p.vehicleId.vehicleType} ({p.vehicleId.vehicleNumber})</span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{new Date(p.scheduledTime).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${
                      p.status === 'Completed' ? 'badge-success' :
                      p.status === 'In Progress' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.notes || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {p.status === 'Scheduled' && (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleUpdateStatus(p._id, 'In Progress')}>
                          Start
                        </button>
                      )}
                      {p.status === 'In Progress' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleUpdateStatus(p._id, 'Completed')}>
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteers & Fleet */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <div className="card">
          <div className="card-title">Volunteers Fleet ({volunteers.length})</div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Shift</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map((v) => (
                  <tr key={v._id}>
                    <td><code>{v.volunteerId}</code></td>
                    <td><strong>{v.name}</strong></td>
                    <td>{v.phone}</td>
                    <td>{v.availability}</td>
                    <td>
                      <span className={`badge ${v.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Vehicles & Transport ({vehicles.length})</div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Type</th>
                  <th>Capacity</th>
                  <th>Cold Storage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vh) => (
                  <tr key={vh._id}>
                    <td><code>{vh.vehicleNumber}</code></td>
                    <td><strong>{vh.vehicleType}</strong></td>
                    <td>{vh.capacity} units</td>
                    <td>{vh.refrigerated ? '❄️ Yes' : 'No'}</td>
                    <td>
                      <span className={`badge ${vh.status === 'Available' ? 'badge-success' : 'badge-secondary'}`}>
                        {vh.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Pickup Modal */}
      {isPickupModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schedule Food Pickup</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsPickupModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePickup}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Pickup ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pickupForm.pickupId}
                    onChange={(e) => setPickupForm({ ...pickupForm, pickupId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Surplus Batch</label>
                  <select
                    className="form-control"
                    value={pickupForm.surplusId}
                    onChange={(e) => setPickupForm({ ...pickupForm, surplusId: e.target.value })}
                    required
                  >
                    <option value="">Select Surplus Food</option>
                    {surplusList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.surplusId} - {s.quantity} {s.unit} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Volunteer</label>
                  <select
                    className="form-control"
                    value={pickupForm.volunteerId}
                    onChange={(e) => setPickupForm({ ...pickupForm, volunteerId: e.target.value })}
                    required
                  >
                    <option value="">Select Volunteer</option>
                    {volunteers.map((v) => (
                      <option key={v._id} value={v._id}>{v.name} ({v.status})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign Vehicle</label>
                  <select
                    className="form-control"
                    value={pickupForm.vehicleId}
                    onChange={(e) => setPickupForm({ ...pickupForm, vehicleId: e.target.value })}
                    required
                  >
                    <option value="">Select Vehicle</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicleNumber} ({v.vehicleType} - Cap: {v.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Scheduled Pickup Time</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={pickupForm.scheduledTime}
                    onChange={(e) => setPickupForm({ ...pickupForm, scheduledTime: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Logistics Notes</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pickupForm.notes}
                    onChange={(e) => setPickupForm({ ...pickupForm, notes: e.target.value })}
                    placeholder="Gate details, contact person, etc."
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPickupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Volunteer Modal */}
      {isVolunteerModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Onboard Volunteer</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsVolunteerModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateVolunteer}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Volunteer ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={volunteerForm.volunteerId}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, volunteerId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={volunteerForm.name}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={volunteerForm.phone}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={volunteerForm.email}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Availability Shift</label>
                  <select
                    className="form-control"
                    value={volunteerForm.availability}
                    onChange={(e) => setVolunteerForm({ ...volunteerForm, availability: e.target.value })}
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Full Time">Full Time</option>
                    <option value="Weekends">Weekends</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsVolunteerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupsPage;
