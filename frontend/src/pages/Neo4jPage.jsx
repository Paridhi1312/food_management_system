import React, { useState, useEffect, useCallback } from 'react';
import Neo4jGraphCanvas from '../components/Neo4jGraphCanvas';

const API_BASE = 'http://localhost:5000/api';

// ─── Utility: Cypher Code Box ─────────────────────────────────────────────────
const CypherBox = ({ query }) =>
  query ? (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        padding: '10px 14px',
        marginTop: 12,
        position: 'relative',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#0f766e',
          marginBottom: 4,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>⚡ Cypher Executed</span>
      </div>
      <pre
        style={{
          margin: 0,
          color: '#0f172a',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          lineHeight: 1.4,
        }}
      >
        {query}
      </pre>
    </div>
  ) : null;

// ─── Utility: Result Display ───────────────────────────────────────────────────
const ResultBox = ({ data, error, message }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (error)
    return (
      <div
        style={{
          background: '#fef2f2',
          borderRadius: 8,
          padding: '10px 14px',
          marginTop: 10,
          border: '1px solid #fecaca',
        }}
      >
        <span style={{ color: '#b91c1c', fontSize: 12, fontWeight: 500 }}>❌ {error}</span>
      </div>
    );

  if (message && !data?.length)
    return (
      <div
        style={{
          background: '#f0fdf4',
          borderRadius: 8,
          padding: '10px 14px',
          marginTop: 10,
          border: '1px solid #bbf7d0',
        }}
      >
        <span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>✅ {message}</span>
      </div>
    );

  if (data && data.length > 0)
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>
            ✓ Returned {data.length} record{data.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 11,
              color: '#0f766e',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            {showRaw ? 'Hide Raw JSON' : 'View Raw JSON'}
          </button>
        </div>

        {showRaw ? (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 6,
              padding: '10px 12px',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            <pre style={{ margin: 0, color: '#334155', fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2d9c8', borderRadius: 6 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, background: '#ffffff' }}>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < data.length - 1 ? '1px solid #f1efe9' : 'none' }}>
                    <td style={{ padding: '8px 10px', background: '#faf8f5', width: 28, color: '#9ca3af', fontWeight: 600 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#1f2937' }}>
                      {Object.entries(row).map(([key, val]) => (
                        <span key={key} style={{ display: 'inline-block', marginRight: 12, marginBottom: 4 }}>
                          <strong style={{ color: '#4b5563' }}>{key}:</strong>{' '}
                          <span style={{ color: '#0f766e' }}>
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                          </span>
                        </span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );

  return null;
};

// ─── Section Card matching app UI ─────────────────────────────────────────────
const SectionCard = ({ themeColor = '#15803d', icon, title, subtitle, badgeText, children }) => {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 12,
        border: '1px solid #e2d9c8',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#faf7ee',
          borderBottom: '1px solid #e2d9c8',
          borderLeft: `4px solid ${themeColor}`,
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
        {badgeText && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 4,
              background: '#ffffff',
              border: '1px solid #e2d9c8',
              color: themeColor,
              textTransform: 'uppercase',
            }}
          >
            {badgeText}
          </span>
        )}
      </div>
      <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
};

// ─── Form Inputs ──────────────────────────────────────────────────────────────
const FInput = ({ label, value, onChange, placeholder, mono, type = 'text' }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 600 }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: '#ffffff',
        border: '1px solid #d1d5db',
        color: '#111827',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#15803d')}
      onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
    />
  </div>
);

const FTextarea = ({ label, value, onChange, placeholder, rows = 3 }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 4, fontWeight: 600 }}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        resize: 'vertical',
        background: '#ffffff',
        border: '1px solid #d1d5db',
        color: '#111827',
        borderRadius: 6,
        padding: '8px 12px',
        fontSize: 12,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        outline: 'none',
        transition: 'border-color 0.2s',
      }}
      onFocus={(e) => (e.target.style.borderColor = '#15803d')}
      onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
    />
  </div>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const Btn = ({ onClick, loading, color = '#15803d', children, disabled }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    style={{
      background: loading || disabled ? '#e5e7eb' : color,
      color: loading || disabled ? '#9ca3af' : '#ffffff',
      border: 'none',
      borderRadius: 6,
      padding: '8px 18px',
      fontSize: 13,
      fontWeight: 600,
      cursor: loading || disabled ? 'not-allowed' : 'pointer',
      transition: 'opacity 0.2s',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    }}
  >
    {loading ? '⏳ Running Cypher…' : children}
  </button>
);

// ─── API call helper ──────────────────────────────────────────────────────────
const call = async (method, path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Neo4jPage = () => {
  const [neo4jStatus, setNeo4jStatus] = useState(null);
  const [graphStats, setGraphStats] = useState(null);

  // Visual Graph Data State
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [graphLoading, setGraphLoading] = useState(false);

  // Active CRUD Tab (Create, Read, Update, Delete, Custom Cypher)
  const [activeTab, setActiveTab] = useState('create');

  // CREATE Node
  const [cnLabel, setCnLabel] = useState('Donor');
  const [cnPropsJson, setCnPropsJson] = useState('{"name":"City Bakery","city":"Delhi","type":"Bakery"}');
  const [cnResult, setCnResult] = useState(null);
  const [cnLoading, setCnLoading] = useState(false);

  // CREATE Relationship
  const [crFromLabel, setCrFromLabel] = useState('Donor');
  const [crFrom, setCrFrom] = useState('Green Leaf Restaurant');
  const [crRel, setCrRel] = useState('PRODUCES');
  const [crToLabel, setCrToLabel] = useState('SurplusFood');
  const [crTo, setCrTo] = useState('Paneer Curry 20kg');
  const [crPropsJson, setCrPropsJson] = useState('{}');
  const [crResult, setCrResult] = useState(null);
  const [crLoading, setCrLoading] = useState(false);

  // READ Nodes
  const [rLabel, setRLabel] = useState('Donor');
  const [rLimit, setRLimit] = useState('10');
  const [rResult, setRResult] = useState(null);
  const [rLoading, setRLoading] = useState(false);

  // READ Relationships
  const [rrType, setRrType] = useState('');
  const [rrLimit, setRrLimit] = useState('10');
  const [rrResult, setRrResult] = useState(null);
  const [rrLoading, setRrLoading] = useState(false);

  // UPDATE Node
  const [updLabel, setUpdLabel] = useState('Donor');
  const [updName, setUpdName] = useState('Green Leaf Restaurant');
  const [updPropsJson, setUpdPropsJson] = useState('{"city":"Mumbai South","status":"Verified Partner"}');
  const [updResult, setUpdResult] = useState(null);
  const [updLoading, setUpdLoading] = useState(false);

  // DELETE Node
  const [delLabel, setDelLabel] = useState('Donor');
  const [delName, setDelName] = useState('City Bakery');
  const [delResult, setDelResult] = useState(null);
  const [delLoading, setDelLoading] = useState(false);

  // DELETE Relationship
  const [drFromLabel, setDrFromLabel] = useState('Donor');
  const [drFrom, setDrFrom] = useState('Green Leaf Restaurant');
  const [drRel, setDrRel] = useState('PRODUCES');
  const [drToLabel, setDrToLabel] = useState('SurplusFood');
  const [drTo, setDrTo] = useState('Paneer Curry 20kg');
  const [drResult, setDrResult] = useState(null);
  const [drLoading, setDrLoading] = useState(false);

  // Custom Cypher
  const [cypherQuery, setCypherQuery] = useState(
    'MATCH (d:Donor)-[r:PRODUCES]->(s:SurplusFood) RETURN d.name, type(r), s.name LIMIT 10'
  );
  const [cypherParams, setCypherParams] = useState('{}');
  const [cypherResult, setCypherResult] = useState(null);
  const [cypherLoading, setCypherLoading] = useState(false);

  // Seed
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  // Fetch Visual Graph Data
  const fetchGraphData = useCallback(async () => {
    try {
      setGraphLoading(true);
      const res = await call('GET', '/neo4j/graph-data');
      if (res.success && res.data) {
        setGraphData(res.data);
      }
    } catch {
      // silently handle or set empty
    } finally {
      setGraphLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const s = await call('GET', '/neo4j/status');
      setNeo4jStatus(s);
      if (s.isConnected) {
        const stats = await call('GET', '/neo4j/stats');
        if (stats.success) setGraphStats(stats.stats);
        fetchGraphData();
      }
    } catch {
      setNeo4jStatus({ isConnected: false, error: 'Backend unreachable' });
    }
  }, [fetchGraphData]);

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 20000);
    return () => clearInterval(iv);
  }, [fetchStatus]);

  const parseProps = (json) => {
    try {
      return JSON.parse(json);
    } catch {
      return {};
    }
  };

  // ─── CRUD Handlers (Triggering Graph Refresh Automatically) ─────────────────
  const handleCreateNode = async () => {
    setCnLoading(true);
    const r = await call('POST', '/neo4j/nodes', { label: cnLabel, properties: parseProps(cnPropsJson) });
    setCnResult(r);
    setCnLoading(false);
    fetchStatus();
  };

  const handleCreateRel = async () => {
    setCrLoading(true);
    const r = await call('POST', '/neo4j/relationships', {
      fromLabel: crFromLabel,
      fromName: crFrom,
      relType: crRel,
      toLabel: crToLabel,
      toName: crTo,
      properties: parseProps(crPropsJson),
    });
    setCrResult(r);
    setCrLoading(false);
    fetchStatus();
  };

  const handleReadNodes = async () => {
    setRLoading(true);
    const r = await call('GET', `/neo4j/nodes/${rLabel}?limit=${rLimit}`);
    setRResult(r);
    setRLoading(false);
  };

  const handleReadRels = async () => {
    setRrLoading(true);
    const q = rrType ? `?type=${rrType}&limit=${rrLimit}` : `?limit=${rrLimit}`;
    const r = await call('GET', `/neo4j/relationships${q}`);
    setRrResult(r);
    setRrLoading(false);
  };

  const handleUpdate = async () => {
    setUpdLoading(true);
    const r = await call('PUT', `/neo4j/nodes/${updLabel}/${encodeURIComponent(updName)}`, {
      properties: parseProps(updPropsJson),
    });
    setUpdResult(r);
    setUpdLoading(false);
    fetchStatus();
  };

  const handleDeleteNode = async () => {
    setDelLoading(true);
    const r = await call('DELETE', `/neo4j/nodes/${delLabel}/${encodeURIComponent(delName)}`);
    setDelResult(r);
    setDelLoading(false);
    fetchStatus();
  };

  const handleDeleteRel = async () => {
    setDrLoading(true);
    const r = await call('DELETE', '/neo4j/relationships', {
      fromLabel: drFromLabel,
      fromName: drFrom,
      relType: drRel,
      toLabel: drToLabel,
      toName: drTo,
    });
    setDrResult(r);
    setDrLoading(false);
    fetchStatus();
  };

  const handleCypher = async () => {
    setCypherLoading(true);
    const r = await call('POST', '/neo4j/cypher', {
      query: cypherQuery,
      params: parseProps(cypherParams),
    });
    setCypherResult(r);
    setCypherLoading(false);
    fetchStatus();
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    const r = await call('POST', '/neo4j/seed');
    setSeedResult(r);
    setSeedLoading(false);
    fetchStatus();
  };

  const connected = neo4jStatus?.isConnected;

  return (
    <div style={{ color: '#1f2937' }}>
      {/* ── Status Banner (Matching App UI Theme) ── */}
      <div
        style={{
          background: connected
            ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)'
            : 'linear-gradient(135deg, #fef2f2 0%, #ffffff 100%)',
          borderRadius: 12,
          border: `1px solid ${connected ? '#bbf7d0' : '#fecaca'}`,
          padding: '16px 22px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: connected ? '#15803d' : '#dc2626',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            🔗
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: connected ? '#14532d' : '#991b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Neo4j AuraDB Graph</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  background: connected ? '#dcfce7' : '#fee2e2',
                  color: connected ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                }}
              >
                {connected ? '● CONNECTED' : '○ DISCONNECTED'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              {connected
                ? `Bolt Protocol · ${neo4jStatus?.address || 'AuraDB Cloud'} · User: ${neo4jStatus?.user || 'a9f33597'}`
                : 'Neo4j connection pending. Check backend/.env credentials.'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {connected && graphStats && (
            <>
              {[
                { label: 'Total Nodes', val: graphStats.totalNodes, icon: '⬡', color: '#15803d' },
                { label: 'Relationships', val: graphStats.totalRelationships, icon: '⇢', color: '#0f766e' },
                { label: 'Entity Labels', val: graphStats.labels?.length, icon: '🏷', color: '#2563eb' },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2d9c8',
                    borderRadius: 8,
                    padding: '8px 14px',
                    textAlign: 'center',
                    minWidth: 90,
                  }}
                >
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.color }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </>
          )}

          <button
            onClick={fetchStatus}
            style={{
              background: '#ffffff',
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: 8,
              padding: '9px 14px',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⟳ Refresh</span>
          </button>

          <button
            onClick={handleSeed}
            disabled={seedLoading || !connected}
            style={{
              background: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 16px',
              fontSize: 12,
              cursor: seedLoading || !connected ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {seedLoading ? '🔄 Syncing seed.js…' : '🔄 Sync seed.js Data'}
          </button>
        </div>
      </div>

      {seedResult && (
        <div
          style={{
            marginBottom: 20,
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: seedResult.success ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${seedResult.success ? '#bbf7d0' : '#fecaca'}`,
            color: seedResult.success ? '#15803d' : '#b91c1c',
          }}
        >
          {seedResult.success ? seedResult.message : seedResult.error}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. VISUAL GRAPH CANVAS (THE REAL GRAPH THAT NEO4J MAKES!)          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Neo4jGraphCanvas
        rawNodes={graphData.nodes}
        rawLinks={graphData.links}
        loading={graphLoading}
        onRefresh={fetchGraphData}
        height={680}
      />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. CYPHER CRUD LAB OPERATIONS (CLEAN APP UI CARDS)                 */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2d9c8',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          marginBottom: 24,
        }}
      >
        {/* Navigation Tabs for Operations */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2d9c8',
            background: '#faf7ee',
            overflowX: 'auto',
          }}
        >
          {[
            { id: 'create', label: '➕ CREATE Operations', color: '#15803d' },
            { id: 'read', label: '🔍 READ Operations', color: '#2563eb' },
            { id: 'update', label: '✏️ UPDATE Operations', color: '#d97706' },
            { id: 'delete', label: '🗑️ DELETE Operations', color: '#dc2626' },
            { id: 'cypher', label: '⌨️ Custom Cypher Runner', color: '#0f766e' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: activeTab === tab.id ? '#ffffff' : 'transparent',
                color: activeTab === tab.id ? tab.color : '#6b7280',
                border: 'none',
                borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
                padding: '14px 20px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 22 }}>
          {/* ── CREATE TAB ── */}
          {activeTab === 'create' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
              {/* Create Node */}
              <SectionCard
                themeColor="#15803d"
                icon="➕"
                title="CREATE – Graph Node"
                subtitle="Instantiate a new node in Neo4j with labels and properties"
                badgeText="Cypher: CREATE"
              >
                <FInput
                  label="Node Label (e.g. Donor, SurplusFood, NGO, Shelter, Volunteer)"
                  value={cnLabel}
                  onChange={setCnLabel}
                  placeholder="Donor"
                />
                <FTextarea
                  label='Properties (JSON) – include "name" or identifying fields'
                  value={cnPropsJson}
                  onChange={setCnPropsJson}
                  placeholder='{"name":"City Bakery","city":"Delhi","type":"Bakery"}'
                  rows={3}
                />
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleCreateNode} loading={cnLoading} color="#15803d" disabled={!connected}>
                    ➕ Execute CREATE Node
                  </Btn>
                </div>
                {cnResult && <CypherBox query={cnResult.cypher} />}
                {cnResult && <ResultBox data={cnResult.data} error={cnResult.error} message={cnResult.message} />}
              </SectionCard>

              {/* Create Relationship */}
              <SectionCard
                themeColor="#15803d"
                icon="🔗"
                title="CREATE – Relationship"
                subtitle="Connect two nodes via directed edge (fromNode)-[:TYPE]->(toNode)"
                badgeText="Cypher: CREATE"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="From Label" value={crFromLabel} onChange={setCrFromLabel} placeholder="Donor" />
                  <FInput label="From Node Name" value={crFrom} onChange={setCrFrom} placeholder="Green Leaf Restaurant" />
                </div>
                <FInput label="Relationship Type (e.g. PRODUCES, MANAGES, SERVES)" value={crRel} onChange={setCrRel} placeholder="PRODUCES" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="To Label" value={crToLabel} onChange={setCrToLabel} placeholder="SurplusFood" />
                  <FInput label="To Node Name" value={crTo} onChange={setCrTo} placeholder="Paneer Curry 20kg" />
                </div>
                <FTextarea label="Relationship Properties (JSON)" value={crPropsJson} onChange={setCrPropsJson} placeholder="{}" rows={2} />
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleCreateRel} loading={crLoading} color="#15803d" disabled={!connected}>
                    🔗 Execute CREATE Relationship
                  </Btn>
                </div>
                {crResult && <CypherBox query={crResult.cypher} />}
                {crResult && <ResultBox data={crResult.data} error={crResult.error} message={crResult.message} />}
              </SectionCard>
            </div>
          )}

          {/* ── READ TAB ── */}
          {activeTab === 'read' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
              {/* Read Nodes */}
              <SectionCard
                themeColor="#2563eb"
                icon="🔍"
                title="READ – Query Nodes"
                subtitle="Retrieve matching nodes and properties by label"
                badgeText="Cypher: MATCH RETURN"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <FInput label="Node Label (leave empty for all)" value={rLabel} onChange={setRLabel} placeholder="Donor" />
                  <FInput label="Limit" value={rLimit} onChange={setRLimit} placeholder="10" type="number" />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleReadNodes} loading={rLoading} color="#2563eb" disabled={!connected}>
                    🔍 Query Nodes
                  </Btn>
                </div>
                {rResult && <CypherBox query={rResult.cypher} />}
                {rResult && <ResultBox data={rResult.data} error={rResult.error} />}
              </SectionCard>

              {/* Read Relationships */}
              <SectionCard
                themeColor="#2563eb"
                icon="↔"
                title="READ – Query Relationships"
                subtitle="Inspect graph topology and connecting edges"
                badgeText="Cypher: MATCH (a)-[r]->(b)"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                  <FInput label="Relationship Type (leave empty for all)" value={rrType} onChange={setRrType} placeholder="PRODUCES" />
                  <FInput label="Limit" value={rrLimit} onChange={setRrLimit} placeholder="10" type="number" />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleReadRels} loading={rrLoading} color="#2563eb" disabled={!connected}>
                    ↔ Query Relationships
                  </Btn>
                </div>
                {rrResult && <CypherBox query={rrResult.cypher} />}
                {rrResult && <ResultBox data={rrResult.data} error={rrResult.error} />}
              </SectionCard>
            </div>
          )}

          {/* ── UPDATE TAB ── */}
          {activeTab === 'update' && (
            <div style={{ maxWidth: 700 }}>
              <SectionCard
                themeColor="#d97706"
                icon="✏️"
                title="UPDATE – Node Properties"
                subtitle="Modify node properties using Cypher SET statement"
                badgeText="Cypher: SET"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="Node Label" value={updLabel} onChange={setUpdLabel} placeholder="Donor" />
                  <FInput label='Target Node Name (identifying "name")' value={updName} onChange={setUpdName} placeholder="Green Leaf Restaurant" />
                </div>
                <FTextarea
                  label="Properties to Update/Add (JSON)"
                  value={updPropsJson}
                  onChange={setUpdPropsJson}
                  placeholder='{"city":"Mumbai South","status":"Verified Partner"}'
                  rows={3}
                />
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleUpdate} loading={updLoading} color="#d97706" disabled={!connected}>
                    ✏️ Execute UPDATE Properties
                  </Btn>
                </div>
                {updResult && <CypherBox query={updResult.cypher} />}
                {updResult && <ResultBox data={updResult.data} error={updResult.error} message={updResult.message} />}
              </SectionCard>
            </div>
          )}

          {/* ── DELETE TAB ── */}
          {activeTab === 'delete' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
              {/* Delete Node */}
              <SectionCard
                themeColor="#dc2626"
                icon="🗑️"
                title="DELETE – Node"
                subtitle="Remove node and cascade its edges using DETACH DELETE"
                badgeText="Cypher: DETACH DELETE"
              >
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 6,
                    padding: '8px 12px',
                    marginBottom: 12,
                    fontSize: 11,
                    color: '#991b1b',
                  }}
                >
                  ⚠️ <code>DETACH DELETE</code> safely unlinks and removes all associated edges.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="Node Label" value={delLabel} onChange={setDelLabel} placeholder="Donor" />
                  <FInput label="Node Name" value={delName} onChange={setDelName} placeholder="City Bakery" />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleDeleteNode} loading={delLoading} color="#dc2626" disabled={!connected}>
                    🗑️ Delete Node
                  </Btn>
                </div>
                {delResult && <CypherBox query={delResult.cypher} />}
                {delResult && <ResultBox data={delResult.data} error={delResult.error} message={delResult.message} />}
              </SectionCard>

              {/* Delete Relationship */}
              <SectionCard
                themeColor="#dc2626"
                icon="✂️"
                title="DELETE – Relationship"
                subtitle="Sever an edge while preserving both source and target nodes"
                badgeText="Cypher: DELETE r"
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="From Label" value={drFromLabel} onChange={setDrFromLabel} placeholder="Donor" />
                  <FInput label="From Node Name" value={drFrom} onChange={setDrFrom} placeholder="Green Leaf Restaurant" />
                </div>
                <FInput label="Relationship Type" value={drRel} onChange={setDrRel} placeholder="PRODUCES" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <FInput label="To Label" value={drToLabel} onChange={setDrToLabel} placeholder="SurplusFood" />
                  <FInput label="To Node Name" value={drTo} onChange={setDrTo} placeholder="Paneer Curry 20kg" />
                </div>
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleDeleteRel} loading={drLoading} color="#dc2626" disabled={!connected}>
                    ✂️ Delete Relationship
                  </Btn>
                </div>
                {drResult && <CypherBox query={drResult.cypher} />}
                {drResult && <ResultBox data={drResult.data} error={drResult.error} message={drResult.message} />}
              </SectionCard>
            </div>
          )}

          {/* ── CUSTOM CYPHER TAB ── */}
          {activeTab === 'cypher' && (
            <div style={{ maxWidth: 860 }}>
              <SectionCard
                themeColor="#0f766e"
                icon="⌨️"
                title="Custom Cypher Runner"
                subtitle="Execute any raw Cypher read or write query against live AuraDB"
                badgeText="Interactive Cypher Console"
              >
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6b7280', alignSelf: 'center', fontWeight: 600 }}>Presets:</span>
                  {[
                    { label: 'Donor ➔ Food ➔ Shelter', q: 'MATCH p=(d:Donor)-[:PRODUCES]->(s:SurplusFood)-[:DELIVERED_TO]->(sh:Shelter) RETURN d.name, s.name, sh.name LIMIT 10' },
                    { label: 'All Volunteer Deliveries', q: 'MATCH (v:Volunteer)-[:PICKS_UP]->(s:SurplusFood) RETURN v.name, s.name LIMIT 10' },
                    { label: 'NGOs & Managed Shelters', q: 'MATCH (n:NGO)-[:MANAGES]->(sh:Shelter) RETURN n.name, sh.name, sh.capacity LIMIT 10' },
                    { label: 'Top Producing Donors', q: 'MATCH (d:Donor)-[:PRODUCES]->(s:SurplusFood) RETURN d.name, count(s) as batchCount ORDER BY batchCount DESC LIMIT 5' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCypherQuery(preset.q)}
                      style={{
                        background: '#faf7ee',
                        border: '1px solid #e2d9c8',
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 11,
                        color: '#15803d',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <FTextarea
                  label="Cypher Query Statement"
                  value={cypherQuery}
                  onChange={setCypherQuery}
                  placeholder="MATCH (n) RETURN n LIMIT 10"
                  rows={4}
                />
                <FTextarea
                  label="Parameters JSON (optional)"
                  value={cypherParams}
                  onChange={setCypherParams}
                  placeholder="{}"
                  rows={2}
                />
                <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                  <Btn onClick={handleCypher} loading={cypherLoading} color="#0f766e" disabled={!connected}>
                    ▶ Run Cypher Query
                  </Btn>
                </div>
                {cypherResult && <CypherBox query={cypherResult.cypher} />}
                {cypherResult && <ResultBox data={cypherResult.data} error={cypherResult.error} message={cypherResult.message} />}
              </SectionCard>
            </div>
          )}
        </div>
      </div>

      {/* ── Reference Cheat-sheet ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid #e2d9c8',
          padding: '18px 22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📚 Cypher Syntax Reference for Food Donation Graph</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 10 }}>
          {[
            { op: 'CREATE', q: "CREATE (d:Donor {name:'Sunrise Hotel', city:'Chennai', demo:true}) RETURN d" },
            { op: 'CREATE REL', q: "MATCH (d:Donor {name:'Green Leaf Restaurant'}), (s:SurplusFood {name:'Paneer Curry 20kg'})\nCREATE (d)-[:PRODUCES]->(s) RETURN d,s" },
            { op: 'READ', q: 'MATCH (n:Donor) RETURN n.name, n.city LIMIT 10' },
            { op: 'READ PATH', q: 'MATCH p=(d:Donor)-[:PRODUCES]->(s)-[:DELIVERED_TO]->(sh:Shelter)\nRETURN p LIMIT 5' },
            { op: 'UPDATE', q: "MATCH (n:Donor {name:'Green Leaf Restaurant'})\nSET n.verified=true, n.updatedAt=datetime() RETURN n" },
            { op: 'DELETE', q: "MATCH (n:Donor {name:'Sunrise Hotel'}) DETACH DELETE n" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#faf8f5',
                border: '1px solid #e2d9c8',
                borderRadius: 6,
                padding: '8px 12px',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '1px 6px',
                  borderRadius: 4,
                  display: 'inline-block',
                  marginBottom: 4,
                }}
              >
                {item.op}
              </span>
              <pre
                style={{
                  margin: 0,
                  fontSize: 11,
                  color: '#334155',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                }}
              >
                {item.q}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Neo4jPage;
