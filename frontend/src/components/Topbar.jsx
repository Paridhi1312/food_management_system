import React from 'react';

const Topbar = ({ title, description, atlasStatus, onRefresh }) => {
  return (
    <header className="topbar">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="btn btn-secondary btn-sm" onClick={onRefresh} title="Sync with Atlas">
          🔄 Refresh
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '20px',
            backgroundColor: atlasStatus?.status === 'CONNECTED' ? '#dcfce7' : '#fee2e2',
            color: atlasStatus?.status === 'CONNECTED' ? '#15803d' : '#b91c1c',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <span
            className={`status-dot ${atlasStatus?.status === 'CONNECTED' ? 'online' : 'offline'}`}
          />
          {atlasStatus?.status === 'CONNECTED'
            ? `Connected: ${atlasStatus.host || 'Atlas Cluster'}`
            : 'Atlas Not Connected'}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
