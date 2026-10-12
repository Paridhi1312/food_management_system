import React, { useRef, useEffect, useState, useCallback } from 'react';

// ─── Authentic Neo4j Color Palette ───────────────────────────────────────────
const NEO4J_PALETTE = {
  Donor:        { fill: '#4E79A7', border: '#2B5C8F', text: '#FFFFFF', light: '#E8F0FE', labelColor: '#1A365D' },
  SurplusFood:  { fill: '#F28E2B', border: '#C96E14', text: '#FFFFFF', light: '#FEF3E8', labelColor: '#7B341E' },
  NGO:          { fill: '#59A14F', border: '#3B7D33', text: '#FFFFFF', light: '#EEF7ED', labelColor: '#1C4ED8' },
  Shelter:      { fill: '#EDC948', border: '#C49F18', text: '#1F2937', light: '#FEF9E7', labelColor: '#854D0E' },
  Beneficiary:  { fill: '#B07AA1', border: '#8A547C', text: '#FFFFFF', light: '#F7EDF4', labelColor: '#581C87' },
  Volunteer:    { fill: '#76B7B2', border: '#4E8F8B', text: '#FFFFFF', light: '#ECF6F5', labelColor: '#115E59' },
  Vehicle:      { fill: '#E15759', border: '#B83234', text: '#FFFFFF', light: '#FDF0F0', labelColor: '#991B1B' },
  Delivery:     { fill: '#59A14F', border: '#3B7D33', text: '#FFFFFF', light: '#EEF7ED', labelColor: '#065F46' },
  Default:      { fill: '#8D99AE', border: '#5C6B73', text: '#FFFFFF', light: '#F1F3F5', labelColor: '#334155' },
};

export const getNeo4jTheme = (label) => NEO4J_PALETTE[label] || NEO4J_PALETTE.Default;

// Helper to split node name into 2 readable lines inside circle (like Neo4j Browser)
const splitNameForCircle = (name = '') => {
  if (!name) return ['', ''];
  // Clean prefixes if any
  const clean = name.replace(/^#\d+\s*/, '').trim();
  const words = clean.split(/\s+/);
  if (words.length === 1) {
    return [words[0].slice(0, 9), ''];
  }
  if (words.length === 2) {
    return [words[0].slice(0, 8), words[1].slice(0, 8)];
  }
  // 3+ words: group line 1 and line 2
  const mid = Math.ceil(words.length / 2);
  const l1 = words.slice(0, mid).join(' ').slice(0, 9);
  const l2 = words.slice(mid).join(' ').slice(0, 9);
  return [l1, l2];
};

const Neo4jGraphCanvas = ({
  rawNodes = [],
  rawLinks = [],
  loading = false,
  onRefresh,
  height = 680,
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Simulation persistent state
  const simRef = useRef({
    nodes: [],
    links: [],
    animId: null,
    draggingNode: null,
    hoveredNode: null,
    pan: { x: 0, y: 0 },
    zoom: 1,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    initialized: false,
  });

  const [selectedNode, setSelectedNode] = useState(null);
  const [filterLabel, setFilterLabel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ nodes: 0, links: 0 });
  const [spreadFactor, setSpreadFactor] = useState(1.8);

  const availableLabels = Array.from(
    new Set(rawNodes.map((n) => n.label || (n.labels && n.labels[0]) || 'Entity'))
  ).filter(Boolean);

  // ─── Initialize and Layout Nodes ──────────────────────────────────────────
  useEffect(() => {
    const sim = simRef.current;
    const existingPosMap = new Map();
    sim.nodes.forEach((n) => {
      existingPosMap.set(n.id, { x: n.x, y: n.y, vx: n.vx, vy: n.vy });
    });

    // Filter nodes
    const filteredRawNodes = rawNodes.filter((n) => {
      const lbl = n.label || (n.labels && n.labels[0]) || 'Entity';
      if (filterLabel !== 'ALL' && lbl !== filterLabel) return false;
      return true;
    });

    const activeNodeIds = new Set(filteredRawNodes.map((n) => n.id));

    // Filter links
    const filteredRawLinks = rawLinks.filter((l) => {
      const srcId = typeof l.source === 'object' ? l.source.id : l.source;
      const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
      return activeNodeIds.has(srcId) && activeNodeIds.has(tgtId);
    });

    const container = containerRef.current;
    const width = container ? container.clientWidth : 950;
    const h = height;

    // Grouping by label for initial structured flow (left to right supply chain, widely spaced)
    const labelXAnchors = {
      Donor:        width * 0.08,
      SurplusFood:  width * 0.28,
      NGO:          width * 0.50,
      Shelter:      width * 0.72,
      Beneficiary:  width * 0.92,
      Volunteer:    width * 0.24,
      Vehicle:      width * 0.50,
      Delivery:     width * 0.74,
      Default:      width * 0.50,
    };

    const labelCounters = {};

    sim.nodes = filteredRawNodes.map((n) => {
      const lbl = n.label || (n.labels && n.labels[0]) || 'Entity';
      labelCounters[lbl] = (labelCounters[lbl] || 0) + 1;
      const count = labelCounters[lbl];

      const existing = existingPosMap.get(n.id);
      let initX, initY;

      if (existing) {
        initX = existing.x;
        initY = existing.y;
      } else {
        const targetX = labelXAnchors[lbl] || width * 0.5;
        const totalInGroup = filteredRawNodes.filter(
          (fn) => (fn.label || fn.labels?.[0]) === lbl
        ).length;
        const ySpacing = Math.max(110, Math.min(170, (h - 140) / Math.max(1, totalInGroup)));
        const startY = (h - (totalInGroup - 1) * ySpacing) / 2;
        initX = targetX + (Math.random() - 0.5) * 80;
        initY = startY + (count - 1) * ySpacing + (Math.random() - 0.5) * 40;

        if (lbl === 'Volunteer') {
          initX = width * 0.18 + (count - 1) * 140;
          initY = h * 0.85 + (Math.random() - 0.5) * 35;
        } else if (lbl === 'Vehicle') {
          initX = width * 0.46 + (count - 1) * 140;
          initY = h * 0.87 + (Math.random() - 0.5) * 35;
        }
      }

      const [line1, line2] = splitNameForCircle(n.name);

      return {
        ...n,
        label: lbl,
        x: initX,
        y: initY,
        vx: existing ? existing.vx * 0.3 : 0,
        vy: existing ? existing.vy * 0.3 : 0,
        radius: 27,
        line1,
        line2,
      };
    });

    const nodeLookup = new Map();
    sim.nodes.forEach((n) => nodeLookup.set(n.id, n));

    sim.links = filteredRawLinks
      .map((l) => {
        const srcId = typeof l.source === 'object' ? l.source.id : l.source;
        const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
        const sourceNode = nodeLookup.get(srcId);
        const targetNode = nodeLookup.get(tgtId);
        if (!sourceNode || !targetNode) return null;
        return {
          ...l,
          source: sourceNode,
          target: targetNode,
        };
      })
      .filter(Boolean);

    // Initial default zoom / pan fit (roomy, centered overview)
    if (!sim.initialized && sim.nodes.length > 0) {
      sim.zoom = 0.65;
      sim.pan = { x: width * 0.08, y: h * 0.06 };
      sim.initialized = true;
    }

    setStats({ nodes: sim.nodes.length, links: sim.links.length });

    if (selectedNode && !activeNodeIds.has(selectedNode.id)) {
      setSelectedNode(null);
    }
  }, [rawNodes, rawLinks, filterLabel, height]);

  // ─── Main Physics & Canvas Animation Loop ──────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const sim = simRef.current;

    let isRunning = true;

    const stepSimulation = () => {
      const nodes = sim.nodes;
      const links = sim.links;
      const container = containerRef.current;
      const width = container ? container.clientWidth : 950;
      const h = height;

      // 1. Global Multi-Body Repulsion (Coulomb's Law) - Pushes nodes spread far apart
      const kRepel = 28000 * spreadFactor;
      const maxRepelDist = 1100 * spreadFactor;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy + 180;
          const dist = Math.sqrt(distSq);

          if (dist < maxRepelDist) {
            const force = kRepel / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }

          // Anti-overlap collision buffer with generous spacing (no crowded clusters)
          const minDist = (a.radius + b.radius + 80) * Math.min(spreadFactor, 1.8);
          if (dist < minDist) {
            const overlap = (minDist - dist) * 0.6;
            const nx = dx / dist;
            const ny = dy / dist;
            a.vx -= nx * overlap * 0.55;
            a.vy -= ny * overlap * 0.55;
            b.vx += nx * overlap * 0.55;
            b.vy += ny * overlap * 0.55;
          }
        }
      }

      // 2. Link Spring Tether (Only pulls when nodes are further than springTarget, never clumps them together)
      const springTarget = Math.round(280 * spreadFactor);
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const a = link.source;
        const b = link.target;
        if (!a || !b) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Only tether if nodes drift farther than springTarget
        if (dist > springTarget) {
          const displacement = dist - springTarget;
          const force = displacement * 0.007; // gentle tether
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      // 3. Ultra-Gentle Centering & Damping (soft pull so nodes remain spread out)
      const cx = width / 2;
      const cy = h / 2;
      const damping = 0.83;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (sim.draggingNode === n) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }

        // Soft pull to center - very gentle to avoid compressing the layout
        n.vx += (cx - n.x) * 0.0006;
        n.vy += (cy - n.y) * 0.0006;

        n.vx *= damping;
        n.vy *= damping;

        // Clamp speed
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 8) {
          n.vx = (n.vx / speed) * 8;
          n.vy = (n.vy / speed) * 8;
        }

        n.x += n.vx;
        n.y += n.vy;
      }
    };

    const draw = () => {
      const container = containerRef.current;
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const h = height;

      if (canvas.width !== width * dpr || canvas.height !== h * dpr) {
        canvas.width = width * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Clean canvas background with subtle grid (Neo4j Bloom style)
      ctx.fillStyle = '#FBFAF7';
      ctx.fillRect(0, 0, width, h);

      // Dot grid
      ctx.fillStyle = '#E5E0D8';
      const gridSize = 24;
      const startX = sim.pan.x % gridSize;
      const startY = sim.pan.y % gridSize;
      for (let x = startX; x < width; x += gridSize) {
        for (let y = startY; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.85, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.save();
      ctx.translate(sim.pan.x, sim.pan.y);
      ctx.scale(sim.zoom, sim.zoom);

      const nodes = sim.nodes;
      const links = sim.links;
      const hovered = sim.hoveredNode;
      const searchLower = searchQuery.trim().toLowerCase();

      // Collect neighborhood of hovered node for dimming effect
      const neighborNodeIds = new Set();
      if (hovered) {
        neighborNodeIds.add(hovered.id);
        links.forEach((l) => {
          if (l.source.id === hovered.id) neighborNodeIds.add(l.target.id);
          if (l.target.id === hovered.id) neighborNodeIds.add(l.source.id);
        });
      }

      // ── 1. DRAW LINKS (Relationships) ──
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const a = link.source;
        const b = link.target;
        if (!a || !b) continue;

        const isDirectToHovered =
          hovered && (a.id === hovered.id || b.id === hovered.id);
        const isConnectedToSelected =
          selectedNode && (a.id === selectedNode.id || b.id === selectedNode.id);

        // Dimming if hovering over a specific node
        if (hovered && !isDirectToHovered) {
          ctx.globalAlpha = 0.15;
        } else {
          ctx.globalAlpha = 1.0;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / dist;
        const uy = dy / dist;

        // Line endpoints at circle borders
        const startX = a.x + ux * a.radius;
        const startY = a.y + uy * a.radius;
        const targetRadius = b.radius || 27;
        const endX = b.x - ux * (targetRadius + 2);
        const endY = b.y - uy * (targetRadius + 2);

        // Draw Line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);

        if (isDirectToHovered || isConnectedToSelected) {
          ctx.strokeStyle = '#15803D';
          ctx.lineWidth = 2.2;
        } else {
          ctx.strokeStyle = '#A5ABB6';
          ctx.lineWidth = 1.3;
        }
        ctx.stroke();

        // Arrow head on edge pointing to target node
        const arrowLen = 7;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - ux * arrowLen - uy * (arrowLen * 0.55),
          endY - uy * arrowLen + ux * (arrowLen * 0.55)
        );
        ctx.lineTo(
          endX - ux * arrowLen + uy * (arrowLen * 0.55),
          endY - uy * arrowLen - ux * (arrowLen * 0.55)
        );
        ctx.closePath();
        ctx.fillStyle = isDirectToHovered || isConnectedToSelected ? '#15803D' : '#8D99AE';
        ctx.fill();

        // Relationship Type Pill (Small, clean ALL_CAPS text in center)
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const relType = link.type || 'REL';

        ctx.font = '600 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const txtWidth = ctx.measureText(relType).width;
        const pillW = txtWidth + 8;
        const pillH = 13;

        ctx.fillStyle = isDirectToHovered || isConnectedToSelected ? '#DCFCE7' : '#FFFFFF';
        ctx.strokeStyle = isDirectToHovered || isConnectedToSelected ? '#16A34A' : '#CBD5E1';
        ctx.lineWidth = 1;

        const px = midX - pillW / 2;
        const py = midY - pillH / 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(px, py, pillW, pillH, 6) : ctx.rect(px, py, pillW, pillH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDirectToHovered || isConnectedToSelected ? '#14532D' : '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(relType, midX, midY);
      }

      ctx.globalAlpha = 1.0;

      // ── 2. DRAW NODES (Exact Neo4j Circle Style) ──
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const theme = getNeo4jTheme(n.label);
        const isHoveredNode = hovered && hovered.id === n.id;
        const isConnectedNeighbor = neighborNodeIds.has(n.id);
        const isSelected = selectedNode && selectedNode.id === n.id;
        const isMatched =
          searchLower &&
          (n.name?.toLowerCase().includes(searchLower) ||
            n.label?.toLowerCase().includes(searchLower));

        // Dimming effect: If a node is hovered, fade out unrelated nodes
        if (hovered && !isConnectedNeighbor) {
          ctx.globalAlpha = 0.22;
        } else {
          ctx.globalAlpha = 1.0;
        }

        // Search match glow halo
        if (isMatched) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
          ctx.fill();
        }

        // Selection / Hover outer ring
        if (isSelected || isHoveredNode) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + 5, 0, Math.PI * 2);
          ctx.fillStyle = isSelected ? 'rgba(21, 128, 61, 0.25)' : 'rgba(78, 121, 167, 0.25)';
          ctx.fill();
          ctx.strokeStyle = isSelected ? '#15803D' : theme.fill;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Drop shadow for 3D elevation
        ctx.beginPath();
        ctx.arc(n.x, n.y + 1.5, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.fill();

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = theme.fill;
        ctx.fill();

        // Crisp Circle Border (Classic Neo4j Style)
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.strokeStyle = isSelected ? '#FFFFFF' : theme.border;
        ctx.stroke();

        // ── Text INSIDE the circle (Authentic Neo4j Browser look) ──
        ctx.fillStyle = theme.text;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (n.line2) {
          ctx.font = '600 9.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(n.line1, n.x, n.y - 5);
          ctx.font = '500 8.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(n.line2, n.x, n.y + 6);
        } else {
          ctx.font = '600 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillText(n.line1 || `#${n.id}`, n.x, n.y);
        }
      }

      ctx.globalAlpha = 1.0;

      // ── 3. TOOLTIP ON HOVER (Shows full details without clutter) ──
      if (hovered) {
        const theme = getNeo4jTheme(hovered.label);
        const title = hovered.name || `#${hovered.id}`;
        ctx.font = '700 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const titleW = ctx.measureText(title).width;
        const boxW = Math.max(120, titleW + 24);
        const boxH = 38;
        const boxX = hovered.x - boxW / 2;
        const boxY = hovered.y - hovered.radius - boxH - 8;

        // Tooltip container
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 6) : ctx.rect(boxX, boxY, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        // Tooltip Header Pill
        ctx.fillStyle = theme.fill;
        ctx.beginPath();
        ctx.arc(boxX + 12, boxY + 12, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#6B7280';
        ctx.font = '600 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`:${hovered.label}`, boxX + 20, boxY + 13);

        // Tooltip Title
        ctx.fillStyle = '#111827';
        ctx.font = '700 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillText(title, boxX + 10, boxY + 27);
      }

      ctx.restore();
      ctx.restore();

      if (isRunning) {
        stepSimulation();
        sim.animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      isRunning = false;
      if (sim.animId) cancelAnimationFrame(sim.animId);
    };
  }, [selectedNode, searchQuery, height, spreadFactor]);

  // Coordinate Conversion helper
  const screenToWorld = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const sim = simRef.current;
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (sx - sim.pan.x) / sim.zoom;
    const wy = (sy - sim.pan.y) / sim.zoom;
    return { x: wx, y: wy };
  }, []);

  const getNodeAt = useCallback((worldX, worldY) => {
    const sim = simRef.current;
    for (let i = sim.nodes.length - 1; i >= 0; i--) {
      const n = sim.nodes[i];
      const dx = worldX - n.x;
      const dy = worldY - n.y;
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) {
        return n;
      }
    }
    return null;
  }, []);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const clickedNode = getNodeAt(x, y);
    const sim = simRef.current;

    if (clickedNode) {
      sim.draggingNode = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      sim.isPanning = true;
      sim.panStart = { x: e.clientX - sim.pan.x, y: e.clientY - sim.pan.y };
    }
  };

  const handleMouseMove = (e) => {
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const sim = simRef.current;

    if (sim.draggingNode) {
      sim.draggingNode.x = x;
      sim.draggingNode.y = y;
      sim.draggingNode.vx = 0;
      sim.draggingNode.vy = 0;
      return;
    }

    if (sim.isPanning) {
      sim.pan = {
        x: e.clientX - sim.panStart.x,
        y: e.clientY - sim.panStart.y,
      };
      return;
    }

    const hovered = getNodeAt(x, y);
    if (hovered !== sim.hoveredNode) {
      sim.hoveredNode = hovered;
      const canvas = canvasRef.current;
      if (canvas) canvas.style.cursor = hovered ? 'pointer' : 'default';
    }
  };

  const handleMouseUp = () => {
    const sim = simRef.current;
    sim.draggingNode = null;
    sim.isPanning = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const sim = simRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.max(0.35, Math.min(2.5, sim.zoom * zoomFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    sim.pan.x = mouseX - (mouseX - sim.pan.x) * (newZoom / sim.zoom);
    sim.pan.y = mouseY - (mouseY - sim.pan.y) * (newZoom / sim.zoom);
    sim.zoom = newZoom;
  };

  // Zoom / Fit Controls
  const handleZoomIn = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    const cx = container ? container.clientWidth / 2 : 450;
    const cy = height / 2;
    const newZoom = Math.min(2.5, sim.zoom * 1.2);
    sim.pan.x = cx - (cx - sim.pan.x) * (newZoom / sim.zoom);
    sim.pan.y = cy - (cy - sim.pan.y) * (newZoom / sim.zoom);
    sim.zoom = newZoom;
  };

  const handleZoomOut = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    const cx = container ? container.clientWidth / 2 : 450;
    const cy = height / 2;
    const newZoom = Math.max(0.35, sim.zoom / 1.2);
    sim.pan.x = cx - (cx - sim.pan.x) * (newZoom / sim.zoom);
    sim.pan.y = cy - (cy - sim.pan.y) * (newZoom / sim.zoom);
    sim.zoom = newZoom;
  };

  const handleSpreadChange = (newFactor) => {
    setSpreadFactor(newFactor);
    const sim = simRef.current;
    sim.nodes.forEach((n) => {
      n.vx += (Math.random() - 0.5) * 6;
      n.vy += (Math.random() - 0.5) * 6;
    });
  };

  const handleFitGraph = () => {
    const sim = simRef.current;
    const container = containerRef.current;
    if (!container || sim.nodes.length === 0) return;
    const width = container.clientWidth;
    const h = height;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    sim.nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const padding = 70;
    const boxW = Math.max(300, maxX - minX + padding * 2);
    const boxH = Math.max(300, maxY - minY + padding * 2);
    const zoomX = width / boxW;
    const zoomY = h / boxH;
    const targetZoom = Math.max(0.35, Math.min(1.1, Math.min(zoomX, zoomY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    sim.zoom = targetZoom;
    sim.pan = {
      x: width / 2 - centerX * targetZoom,
      y: h / 2 - centerY * targetZoom,
    };
  };

  // Connected relationships for selected node inspector
  const selectedIncoming = selectedNode
    ? rawLinks.filter((l) => (typeof l.target === 'object' ? l.target.id : l.target) === selectedNode.id)
    : [];

  const selectedOutgoing = selectedNode
    ? rawLinks.filter((l) => (typeof l.source === 'object' ? l.source.id : l.source) === selectedNode.id)
    : [];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        background: '#FFFFFF',
        border: '1px solid #E2D9C8',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        marginBottom: 24,
      }}
    >
      {/* ── Top Neo4j Explorer Header & Controls ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 18px',
          background: '#FAF7EE',
          borderBottom: '1px solid #E2D9C8',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#15803D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            🕸️
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F2937' }}>
              Neo4j Graph Explorer
            </div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>
              {stats.nodes} nodes · {stats.links} relationships · Hover over any node to highlight its connections
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Label Filter */}
          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              color: '#1F2937',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="ALL">All Labels ({rawNodes.length})</option>
            {availableLabels.map((lbl) => (
              <option key={lbl} value={lbl}>
                :{lbl} ({rawNodes.filter((n) => (n.label || n.labels?.[0]) === lbl).length})
              </option>
            ))}
          </select>

          {/* Search Input */}
          <input
            type="text"
            placeholder="🔍 Find node..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              color: '#1F2937',
              width: 150,
              outline: 'none',
            }}
          />

          {/* Zoom controls */}
          <div style={{ display: 'flex', border: '1px solid #D1D5DB', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              style={{
                background: '#FFFFFF',
                border: 'none',
                borderRight: '1px solid #D1D5DB',
                padding: '6px 10px',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 700,
                color: '#374151',
              }}
            >
              +
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              style={{
                background: '#FFFFFF',
                border: 'none',
                borderRight: '1px solid #D1D5DB',
                padding: '6px 10px',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 700,
                color: '#374151',
              }}
            >
              −
            </button>
            <button
              onClick={handleFitGraph}
              title="Fit Graph to Screen"
              style={{
                background: '#FFFFFF',
                border: 'none',
                padding: '6px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
                color: '#374151',
              }}
            >
              ⛶ Fit Graph
            </button>
          </div>

          {/* Spread / Spacing Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              background: '#FFFFFF',
              border: '1px solid #D1D5DB',
              borderRadius: 6,
              padding: '3px 6px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4B5563', marginRight: 2 }}>
              Spread:
            </span>
            {[
              { label: 'Normal', val: 1.2 },
              { label: 'Spacious', val: 1.8 },
              { label: 'Ultra', val: 2.5 },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => handleSpreadChange(opt.val)}
                title={`Spread factor: ${opt.val}x`}
                style={{
                  background: spreadFactor === opt.val ? '#15803D' : 'transparent',
                  color: spreadFactor === opt.val ? '#FFFFFF' : '#374151',
                  border: 'none',
                  borderRadius: 4,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Refresh Graph */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: '#15803D',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {loading ? '⏳ Updating…' : '⟳ Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* ── Main Canvas ── */}
      <div style={{ position: 'relative', width: '100%', height }}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{
            display: 'block',
            width: '100%',
            height,
            cursor: 'default',
          }}
        />

        {/* Selected Node Details Inspector Card */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 320,
              maxHeight: height - 28,
              overflowY: 'auto',
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #E2D9C8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              padding: 16,
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: getNeo4jTheme(selectedNode.label).fill,
                    display: 'inline-block',
                  }}
                />
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      background: getNeo4jTheme(selectedNode.label).light,
                      color: getNeo4jTheme(selectedNode.label).labelColor,
                      borderRadius: 4,
                      padding: '1px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    :{selectedNode.label}
                  </span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 2 }}>
                    {selectedNode.name}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9CA3AF',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 2,
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 12 }}>
              Neo4j Node ID: <code>#{selectedNode.id}</code>
            </div>

            {/* Properties */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                Properties
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: '8px 10px' }}>
                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 ? (
                  Object.entries(selectedNode.properties).map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 11,
                        padding: '3px 0',
                        borderBottom: '1px dashed #E2E8F0',
                      }}
                    >
                      <span style={{ color: '#64748B', fontWeight: 600 }}>{k}</span>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>No properties</div>
                )}
              </div>
            </div>

            {/* Connected Relationships */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>
                Connected Relationships ({selectedOutgoing.length + selectedIncoming.length})
              </div>

              {selectedOutgoing.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: '#16A34A', fontWeight: 700, marginBottom: 4 }}>
                    Outgoing (➔)
                  </div>
                  {selectedOutgoing.map((rel, idx) => {
                    const targetNodeId = typeof rel.target === 'object' ? rel.target.id : rel.target;
                    const tgt = rawNodes.find((n) => n.id === targetNodeId);
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: '4px 6px',
                          background: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          borderRadius: 4,
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#15803D' }}>-[:{rel.type}]-&gt;</span>
                        <span style={{ color: '#166534', fontWeight: 500 }}>
                          {tgt?.name || `#${targetNodeId}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedIncoming.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: '#2563EB', fontWeight: 700, marginBottom: 4 }}>
                    Incoming (⬅)
                  </div>
                  {selectedIncoming.map((rel, idx) => {
                    const srcNodeId = typeof rel.source === 'object' ? rel.source.id : rel.source;
                    const src = rawNodes.find((n) => n.id === srcNodeId);
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: '4px 6px',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          borderRadius: 4,
                          marginBottom: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span style={{ color: '#1E40AF', fontWeight: 500 }}>
                          {src?.name || `#${srcNodeId}`}
                        </span>
                        <span style={{ fontWeight: 700, color: '#2563EB' }}>-[:{rel.type}]-&gt;</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Neo4j Legend Bar (Like Neo4j Browser) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          padding: '10px 18px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2D9C8',
          fontSize: 11,
        }}
      >
        <span style={{ fontWeight: 700, color: '#4B5563', marginRight: 4 }}>Node Labels:</span>
        {availableLabels.map((lbl) => {
          const theme = getNeo4jTheme(lbl);
          const count = rawNodes.filter((n) => (n.label || n.labels?.[0]) === lbl).length;
          return (
            <div
              key={lbl}
              onClick={() => setFilterLabel(filterLabel === lbl ? 'ALL' : lbl)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 9999,
                background: filterLabel === lbl ? theme.fill : theme.light,
                border: `1px solid ${theme.border}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: filterLabel === lbl ? '#FFFFFF' : theme.fill,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontWeight: 600, color: filterLabel === lbl ? '#FFFFFF' : theme.labelColor }}>
                :{lbl}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  opacity: 0.85,
                  color: filterLabel === lbl ? '#FFFFFF' : theme.labelColor,
                }}
              >
                ({count})
              </span>
            </div>
          );
        })}
        <span style={{ marginLeft: 'auto', color: '#9CA3AF', fontSize: 10 }}>
          💡 Hover node to highlight connections · Drag to move · Scroll to zoom
        </span>
      </div>
    </div>
  );
};

export default Neo4jGraphCanvas;
