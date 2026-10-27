import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Server, 
  Database, 
  Cpu, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Radio, 
  RefreshCw,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

export default function TopologyPage() {
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);

  const { liveServices } = useWebSocket();

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const res = await api.getTopology();
      setTopology(res);
      if (res.nodes && res.nodes.length > 0 && !selectedNode) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load topology:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopology();
  }, []);

  const handleHealthOverride = async (serviceId, status) => {
    try {
      await api.updateServiceHealth(serviceId, status);
      fetchTopology();
    } catch (err) {
      alert('Override failed: ' + err.message);
    }
  };

  // Merge live telemetry data if available
  const displayNodes = topology.nodes.map(node => {
    const live = liveServices.find(s => s.id === node.id);
    if (!live) return node;
    return {
      ...node,
      status: live.status,
      latency: live.latency,
      cpuUsage: live.cpuUsage,
      memoryUsage: live.memoryUsage,
      errorRate: live.errorRate
    };
  });

  // Calculate downstream dependents of selected node
  const dependents = topology.links
    .filter(link => link.target === selectedNode?.id)
    .map(link => displayNodes.find(n => n.id === link.source))
    .filter(Boolean);

  // Upstream dependencies that selected node depends on
  const dependencies = topology.links
    .filter(link => link.source === selectedNode?.id)
    .map(link => displayNodes.find(n => n.id === link.target))
    .filter(Boolean);

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Overview */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '10px', color: '#38bdf8' }}>
            <Network size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Microservice Dependency Topology & Cascade Analyzer</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Interactive blast radius map with real-time health telemetry and upstream/downstream propagation
            </p>
          </div>
        </div>

        <button onClick={fetchTopology} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Mesh
        </button>
      </div>

      {/* Main Grid: Visual Mesh Map on Left, Detailed Inspector on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '1.5rem' }}>
        {/* Topology Node Grid */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
              Service Cluster Nodes ({displayNodes.length})
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Click any node to inspect blast radius
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {displayNodes.map(node => {
              const isSelected = selectedNode?.id === node.id;
              const isCritical = node.status === 'critical';
              const isDegraded = node.status === 'degraded';

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="glass-card glass-card-interactive"
                  style={{
                    padding: '1.2rem',
                    background: isSelected
                      ? 'rgba(59, 130, 246, 0.15)'
                      : isCritical
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isSelected
                      ? '2px solid #3b82f6'
                      : isCritical
                      ? '1px solid rgba(239, 68, 68, 0.5)'
                      : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className={`pulse-dot ${node.status}`} />
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                        {node.label}
                      </span>
                    </div>
                    <span className={`badge ${node.tier === 'Tier 0' ? 'badge-p1' : 'badge-neutral'}`} style={{ fontSize: '0.62rem' }}>
                      {node.tier}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>
                    {node.code} • {node.region}
                  </div>

                  {/* Telemetry Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: node.latency > 150 ? '#ef4444' : '#10b981' }}>
                        {node.latency}ms
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Latency</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: node.cpuUsage > 80 ? '#ef4444' : '#38bdf8' }}>
                        {node.cpuUsage}%
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>CPU</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: node.errorRate > 2 ? '#ef4444' : '#10b981' }}>
                        {node.errorRate}%
                      </div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>Err Rate</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Blast Radius & Health Override Inspector */}
        {selectedNode && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className={`badge ${selectedNode.status === 'critical' ? 'badge-critical' : selectedNode.status === 'degraded' ? 'badge-degraded' : 'badge-healthy'}`}>
                  {selectedNode.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                  ID: {selectedNode.id}
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>
                {selectedNode.label}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tier: {selectedNode.tier} | Hosted in {selectedNode.region}
              </p>
            </div>

            {/* Cascade Blast Radius Risk */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                Downstream Cascade Risk ({dependents.length})
              </div>

              {dependents.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  No downstream services directly depend on this leaf node.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dependents.map(dep => (
                    <div key={dep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5' }}>
                        {dep.label}
                      </span>
                      <span className="badge badge-p1" style={{ fontSize: '0.6rem' }}>
                        At Risk
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upstream Dependencies */}
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={15} />
                Upstream Dependencies ({dependencies.length})
              </div>

              {dependencies.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  Root service with zero upstream dependencies.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dependencies.map(dep => (
                    <div key={dep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#93c5fd' }}>
                        {dep.label}
                      </span>
                      <span className={`badge ${dep.status === 'healthy' ? 'badge-healthy' : 'badge-degraded'}`} style={{ fontSize: '0.6rem' }}>
                        {dep.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Health State Manual Toggle (For Testing) */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                SIMULATE HEALTH OVERRIDE:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  onClick={() => handleHealthOverride(selectedNode.id, 'healthy')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#34d399' }}
                >
                  Healthy
                </button>
                <button
                  onClick={() => handleHealthOverride(selectedNode.id, 'degraded')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: '#fbbf24' }}
                >
                  Degrade
                </button>
                <button
                  onClick={() => handleHealthOverride(selectedNode.id, 'critical')}
                  className="btn btn-outline-danger btn-sm"
                >
                  Critical
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
