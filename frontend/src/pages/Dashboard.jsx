import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      if (res.success) {
        setStats(res.data);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return <div className="card">Loading live analytics from MongoDB Atlas...</div>;
  }

  return (
    <div>
      {error && (
        <div className="alert alert-error">
          ⚠️ <strong>Atlas Connection Issue:</strong> {error}. Ensure your MongoDB connection string in backend/.env is valid.
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Donors</span>
          <span className="stat-val">{stats?.totalDonors ?? 0}</span>
          <span className="stat-sub">Active community donors</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Surplus Listings</span>
          <span className="stat-val">{stats?.totalSurplusListings ?? 0}</span>
          <span className="stat-sub">Registered food batches</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Total Donations</span>
          <span className="stat-val">{stats?.totalDonations ?? 0}</span>
          <span className="stat-sub">Historical logged pledges</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Pending Requests</span>
          <span className="stat-val" style={{ color: stats?.pendingFoodRequests > 0 ? '#b45309' : '#111827' }}>
            {stats?.pendingFoodRequests ?? 0}
          </span>
          <span className="stat-sub">Awaiting surplus allocation</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Active Pickups</span>
          <span className="stat-val">{stats?.activePickups ?? 0}</span>
          <span className="stat-sub">Scheduled or en route</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Completed Deliveries</span>
          <span className="stat-val" style={{ color: '#15803d' }}>
            {stats?.completedDeliveries ?? 0}
          </span>
          <span className="stat-sub">Safely delivered to shelters</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Quantity Donated</span>
          <span className="stat-val">{stats?.totalQuantityDonated ?? 0}</span>
          <span className="stat-sub">Meals & food units collected</span>
        </div>

        <div className="stat-card">
          <span className="stat-label">Quantity Delivered</span>
          <span className="stat-val" style={{ color: '#15803d' }}>
            {stats?.totalQuantityDelivered ?? 0}
          </span>
          <span className="stat-sub">Successfully distributed</span>
        </div>
      </div>

      {/* Status Breakdown & Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Food Status Breakdown */}
        <div className="card">
          <div className="card-title">🍲 Surplus Food Status Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(stats?.foodStatusDistribution || []).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#faf7ee', borderRadius: '8px', border: '1px solid #e2d9c8' }}>
                <span style={{ fontWeight: 600 }}>{item.status}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span className="badge badge-info">{item.count} batches</span>
                  <span className="badge badge-success">{item.totalQuantity} units</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Donation Trends By Month */}
        <div className="card">
          <div className="card-title">📈 Donation Trends by Month</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stats?.donationTrends && stats.donationTrends.length > 0 ? (
              stats.donationTrends.map((trend, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#faf7ee', borderRadius: '8px', border: '1px solid #e2d9c8' }}>
                  <span style={{ fontWeight: 600 }}>Month {trend.month}</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span className="badge badge-warning">{trend.count} donations</span>
                    <span className="badge badge-success">{trend.totalQuantity} units</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#6b7280', fontSize: '13px' }}>No monthly trend data recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card">
        <div className="card-title">🕒 Recent Donation Activity (Live from MongoDB Atlas)</div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Donation ID</th>
                <th>Donor Name</th>
                <th>Food Item</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentDonations && stats.recentDonations.length > 0 ? (
                stats.recentDonations.map((d) => (
                  <tr key={d._id}>
                    <td><code>{d.donationId}</code></td>
                    <td><strong>{d.donorId?.name || d.donorSnapshot?.name || 'N/A'}</strong></td>
                    <td>{d.surplusFoodId?.foodItemId?.name || 'Assorted Food'}</td>
                    <td>{d.quantityDonated} {d.unit}</td>
                    <td>
                      <span className={`badge ${d.status === 'Delivered' ? 'badge-success' : d.status === 'Picked Up' ? 'badge-info' : 'badge-warning'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>{new Date(d.donationDate).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#6b7280', padding: '24px' }}>
                    No donation records found. Please seed the database or add new donors.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
