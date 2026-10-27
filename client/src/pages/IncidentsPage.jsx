import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  ExternalLink, 
  Zap, 
  ArrowRight,
  Flame,
  Radio
} from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

export default function IncidentsPage({ onSelectIncident, onOpenDeclareModal, onOpenChaosModal }) {
  const [incidents, setIncidents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { addListener } = useWebSocket();

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents({
        status: statusFilter,
        severity: severityFilter,
        search: searchQuery
      });
      setIncidents(res.incidents || []);

      const analyticsRes = await api.getAnalytics();
      setMetrics(analyticsRes.metrics);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const unsubscribe = addListener((msg) => {
      if (['INCIDENT_CREATED', 'INCIDENT_STATUS_CHANGED', 'INCIDENT_RESOLVED', 'INCIDENT_ASSIGNED'].includes(msg.type)) {
        fetchIncidents();
      }
    });
    return unsubscribe;
  }, [addListener]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleQuickResolve = async (incidentId, e) => {
    e.stopPropagation();
    try {
      await api.updateIncidentStatus(incidentId, 'resolved', 'Mitigated via emergency manual intervention.');
      fetchIncidents();
    } catch (err) {
      alert('Failed to resolve: ' + err.message);
    }
  };

  const activeCount = incidents.filter(i => i.status !== 'resolved').length;
  const p1Count = incidents.filter(i => i.severity === 'P1' && i.status !== 'resolved').length;

  return (
    <div className="page-container">
      {/* Top Header Metrics Row */}
      <div className="grid-cols-4" style={{ marginBottom: '2rem' }}>
        {/* Active Incidents KPI */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: activeCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeCount > 0 ? '#ef4444' : '#10b981'
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: activeCount > 0 ? '#f87171' : '#fff' }}>
              {activeCount}
            </div>
            <div className="metric-label">Active Incidents</div>
          </div>
        </div>

        {/* P1 Critical Count */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <ShieldAlert size={24} />
          </div>
          <div>
            <div className="metric-value" style={{ color: p1Count > 0 ? '#ef4444' : '#fff' }}>
              {p1Count}
            </div>
            <div className="metric-label">P1 Critical Outages</div>
          </div>
        </div>

        {/* MTTR */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6'
          }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-value">
              {metrics ? `${metrics.mttrMinutes}m` : '34m'}
            </div>
            <div className="metric-label">Mean Time to Resolve (MTTR)</div>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-value">
              {metrics ? `${metrics.slaComplianceRate}%` : '96%'}
            </div>
            <div className="metric-label">SLA Target Compliance</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '0.4rem', fontWeight: 600 }}>STATUS:</span>
            {['all', 'active', 'investigating', 'identified', 'monitoring', 'resolved'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  border: statusFilter === status ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-subtle)',
                  background: statusFilter === status ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                  color: statusFilter === status ? '#60a5fa' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Severity Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginRight: '0.4rem', fontWeight: 600 }}>SEV:</span>
            {['all', 'P1', 'P2', 'P3', 'P4'].map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: severityFilter === sev ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid var(--border-subtle)',
                  background: severityFilter === sev ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: severityFilter === sev ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search incidents or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.2rem', width: '220px', fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem' }}
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-sm">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Incidents Table / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading live incidents feed...
          </div>
        ) : incidents.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 1rem' }} />
            <h3>No incidents match current filter</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              All systems operational or matching query returned 0 items.
            </p>
          </div>
        ) : (
          incidents.map(inc => {
            const isResolved = inc.status === 'resolved';
            const badgeClass = inc.severity === 'P1' ? 'badge-p1' : inc.severity === 'P2' ? 'badge-p2' : inc.severity === 'P3' ? 'badge-p3' : 'badge-p4';

            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc.id)}
                className="glass-card glass-card-interactive"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  borderLeft: `4px solid ${inc.severity === 'P1' ? 'var(--color-critical)' : inc.severity === 'P2' ? 'var(--color-degraded)' : 'var(--color-accent)'}`
                }}
              >
                {/* Left: ID, Severity, Title, Meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: '#93c5fd' }}>
                      {inc.id}
                    </span>
                    <span className={`badge ${badgeClass}`}>
                      {inc.severity}
                    </span>
                    <span className={`badge ${isResolved ? 'badge-healthy' : 'badge-neutral'}`}>
                      {inc.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      Started {new Date(inc.startedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem', color: isResolved ? '#94a3b8' : '#fff' }}>
                    {inc.title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Service: <strong style={{ color: '#e2e8f0' }}>{inc.serviceName}</strong></span>
                    <span>•</span>
                    <span>Impact: {inc.impactRadius}</span>
                    <span>•</span>
                    <span>Affected Users: ~{inc.affectedUsersEstimate?.toLocaleString()}</span>
                  </div>

                  {/* Tags */}
                  {inc.tags && inc.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                      {inc.tags.map(tag => (
                        <span key={tag} style={{
                          fontSize: '0.65rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-dim)'
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Responders & Quick Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  {/* Responder Info */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      Responder
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                      {inc.assigneeName || 'Unassigned'}
                    </div>
                  </div>

                  {/* SLA Target */}
                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                      SLA Target
                    </div>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isResolved ? '#10b981' : '#f59e0b' }}>
                      {inc.slaTargetMinutes}m
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!isResolved && (
                      <button
                        onClick={(e) => handleQuickResolve(inc.id, e)}
                        className="btn btn-secondary btn-sm"
                        title="Mark resolved directly"
                      >
                        <CheckCircle2 size={14} color="#10b981" />
                        Resolve
                      </button>
                    )}

                    <button
                      onClick={() => onSelectIncident(inc.id)}
                      className="btn btn-primary btn-sm"
                    >
                      <Radio size={14} />
                      War Room
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
