import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const BeneficiariesPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [isBenModal, setIsBenModal] = useState(false);
  const [isFeedbackModal, setIsFeedbackModal] = useState(false);

  // Beneficiary Form
  const [benForm, setBenForm] = useState({
    beneficiaryId: '',
    name: '',
    contact: '',
    shelterId: '',
  });

  // Feedback Form
  const [feedbackForm, setFeedbackForm] = useState({
    feedbackId: '',
    rating: 5,
    comments: '',
    deliveryId: '',
  });

  const loadData = async () => {
    try {
      const [benRes, shlRes, fbRes, delRes] = await Promise.all([
        api.list('beneficiaries'),
        api.list('shelters'),
        api.list('feedback'),
        api.list('deliveries'),
      ]);
      if (benRes.success) setBeneficiaries(benRes.data);
      if (shlRes.success) setShelters(shlRes.data);
      if (fbRes.success) setFeedbacks(fbRes.data);
      if (delRes.success) setDeliveries(delRes.data);
    } catch (err) {
      alert('Error fetching data: ' + err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBeneficiary = async (e) => {
    e.preventDefault();
    try {
      await api.create('beneficiaries', benForm);
      alert('Beneficiary saved into MongoDB Atlas!');
      setIsBenModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.create('feedback', feedbackForm);
      alert('Feedback logged into MongoDB Atlas!');
      setIsFeedbackModal(false);
      loadData();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button
          className="btn btn-primary"
          onClick={() => {
            setBenForm({
              beneficiaryId: `BEN-${Math.floor(100 + Math.random() * 900)}`,
              name: '',
              contact: '',
              shelterId: shelters[0]?._id || '',
            });
            setIsBenModal(true);
          }}
        >
          👤 Register Beneficiary Group
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => {
            setFeedbackForm({
              feedbackId: `FB-${Math.floor(100 + Math.random() * 900)}`,
              rating: 5,
              comments: '',
              deliveryId: deliveries[0]?._id || '',
            });
            setIsFeedbackModal(true);
          }}
        >
          ⭐ Log Delivery Feedback
        </button>
      </div>

      {/* Beneficiaries Table */}
      <div className="card">
        <div className="card-title">Beneficiaries & Shelter Associations ({beneficiaries.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Beneficiary ID</th>
                <th>Name / Cohort</th>
                <th>Contact</th>
                <th>Associated Shelter</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((b) => (
                <tr key={b._id}>
                  <td><code>{b.beneficiaryId}</code></td>
                  <td><strong>{b.name}</strong></td>
                  <td>{b.contact || 'Registered at shelter desk'}</td>
                  <td><span className="badge badge-success">{b.shelterId?.name || 'N/A'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Records */}
      <div className="card">
        <div className="card-title">Completed Delivery Feedbacks ({feedbacks.length})</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feedback ID</th>
                <th>Delivery Reference</th>
                <th>Rating</th>
                <th>Beneficiary / Shelter Feedback</th>
                <th>Date Logged</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f._id}>
                  <td><code>{f.feedbackId}</code></td>
                  <td><code>{f.deliveryId?.deliveryId || f.deliveryId}</code></td>
                  <td>
                    <span style={{ fontSize: '15px', color: '#eab308' }}>
                      {'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}
                    </span>
                    <span style={{ marginLeft: '6px', fontWeight: 600 }}>({f.rating}/5)</span>
                  </td>
                  <td>"{f.comments}"</td>
                  <td>{new Date(f.feedbackDate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Beneficiary Modal */}
      {isBenModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Register Beneficiary</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsBenModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateBeneficiary}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Beneficiary ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={benForm.beneficiaryId}
                    onChange={(e) => setBenForm({ ...benForm, beneficiaryId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Name or Family Head</label>
                  <input
                    type="text"
                    className="form-control"
                    value={benForm.name}
                    onChange={(e) => setBenForm({ ...benForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={benForm.contact}
                    onChange={(e) => setBenForm({ ...benForm, contact: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Associated Shelter</label>
                  <select
                    className="form-control"
                    value={benForm.shelterId}
                    onChange={(e) => setBenForm({ ...benForm, shelterId: e.target.value })}
                    required
                  >
                    <option value="">Select Shelter</option>
                    {shelters.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBenModal(false)}>
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

      {/* Feedback Modal */}
      {isFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Record Post-Delivery Feedback</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setIsFeedbackModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateFeedback}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Feedback ID</label>
                  <input
                    type="text"
                    className="form-control"
                    value={feedbackForm.feedbackId}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedbackId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Delivery Reference</label>
                  <select
                    className="form-control"
                    value={feedbackForm.deliveryId}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, deliveryId: e.target.value })}
                    required
                  >
                    <option value="">Select Delivery</option>
                    {deliveries.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.deliveryId} - {d.quantityDelivered} units ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Rating (1 to 5 Stars)</label>
                  <select
                    className="form-control"
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: parseInt(e.target.value) })}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Excellent)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
                    <option value={3}>⭐⭐⭐ (3 - Satisfactory)</option>
                    <option value={2}>⭐⭐ (2 - Subpar)</option>
                    <option value={1}>⭐ (1 - Unsatisfactory)</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Comments & Quality Notes</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                    placeholder="Taste, freshness, hygiene, delivery punctuality..."
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsFeedbackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BeneficiariesPage;
