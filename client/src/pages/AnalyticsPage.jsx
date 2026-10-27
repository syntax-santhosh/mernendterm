import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileText, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Layers, 
  AlertTriangle,
  Printer
} from 'lucide-react';
import { api } from '../services/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [postMortems, setPostMortems] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentForPm, setSelectedIncidentForPm] = useState('');
  const [viewingPm, setViewingPm] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [anRes, pmRes, incRes] = await Promise.all([
        api.getAnalytics(),
        api.getPostMortems(),
        api.getIncidents({ status: 'all' })
      ]);

      setAnalytics(anRes);
      setPostMortems(pmRes.postMortems || []);
      setIncidents(incRes.incidents || []);

      if (pmRes.postMortems && pmRes.postMortems.length > 0) {
        setViewingPm(pmRes.postMortems[0]);
      }
      if (incRes.incidents && incRes.incidents.length > 0) {
        setSelectedIncidentForPm(incRes.incidents[0].id);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePm = async () => {
    if (!selectedIncidentForPm) return;
    try {
      setGenerating(true);
      const res = await api.generatePostMortem(selectedIncidentForPm);
      setViewingPm(res.postMortem);
      await loadData();
      alert('Post-Mortem synthesized successfully!');
    } catch (err) {
      alert('Generation failed: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportMarkdown = (pm) => {
    if (!pm) return;
    const md = `# ${pm.title}
**Author:** ${pm.author}  
**Published:** ${new Date(pm.publishedAt).toLocaleString()}  
**Incident ID:** ${pm.incidentId}

## Executive Summary
${pm.executiveSummary}

## Impact Summary
${pm.impactSummary}

## Root Cause Analysis
${pm.rootCauseAnalysis}

## Lessons Learned
${pm.lessonsLearned.map(l => `- ${l}`).join('\n')}

## Action Items
${pm.actionItems.map(a => `- [${a.done ? 'x' : ' '}] ${a.task} (@${a.assignee})`).join('\n')}
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pm.incidentId}-postmortem.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metrics = analytics?.metrics;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '10px', color: '#34d399' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Reliability Intelligence & Incident Post-Mortems</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Quantitative SRE metrics, SLA compliance analytics, and root-cause post-mortem generator
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-cols-4">
        <div className="glass-card">
          <div className="metric-value" style={{ color: '#60a5fa' }}>
            {metrics?.averageUptime || 99.88}%
          </div>
          <div className="metric-label">30-Day Platform Availability</div>
        </div>

        <div className="glass-card">
          <div className="metric-value" style={{ color: '#34d399' }}>
            {metrics?.mttrMinutes || 34}m
          </div>
          <div className="metric-label">MTTR (Mean Time to Resolution)</div>
        </div>

        <div className="glass-card">
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            {metrics?.mttdMinutes || 3.8}m
          </div>
          <div className="metric-label">MTTD (Mean Time to Detect)</div>
        </div>

        <div className="glass-card">
          <div className="metric-value" style={{ color: '#c084fc' }}>
            {metrics?.slaComplianceRate || 92}%
          </div>
          <div className="metric-label">SLA Target Compliance Rate</div>
        </div>
      </div>

      {/* Charts & Distribution Row */}
      <div className="grid-cols-2">
        {/* Severity Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Incidents by Severity Tier
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {analytics?.severityDistribution && Object.entries(analytics.severityDistribution).map(([sev, count]) => {
              const max = Math.max(1, ...Object.values(analytics.severityDistribution));
              const pct = (count / max) * 100;
              const color = sev === 'P1' ? '#ef4444' : sev === 'P2' ? '#f59e0b' : sev === 'P3' ? '#8b5cf6' : '#10b981';

              return (
                <div key={sev}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 700, color }}>{sev} Outages</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{count} incidents</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Service Health & Frequency */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            Service Reliability Summary
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {analytics?.serviceDistribution?.map(s => (
              <div key={s.serviceId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className={`pulse-dot ${s.currentStatus}`} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.serviceName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{s.incidentCount} incidents</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{s.uptime}% uptime</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Post-Mortem Intelligence Section */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#38bdf8" />
              Automated Incident Post-Mortem Synthesis
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Synthesize timeline, root cause, and action items from active or resolved incident records
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <select
              value={selectedIncidentForPm}
              onChange={(e) => setSelectedIncidentForPm(e.target.value)}
              className="form-select"
              style={{ width: 'auto', fontSize: '0.82rem' }}
            >
              {incidents.map(i => (
                <option key={i.id} value={i.id}>
                  {i.id} - {i.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleGeneratePm}
              disabled={generating}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
            >
              <Sparkles size={16} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Synthesizing...' : 'Generate Post-Mortem'}
            </button>
          </div>
        </div>

        {/* Post-Mortem Document View */}
        {viewingPm ? (
          <div style={{ background: '#070b13', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-healthy" style={{ fontSize: '0.65rem', marginBottom: '0.35rem' }}>
                  PUBLISHED SRE POST-MORTEM
                </span>
                <h2 style={{ fontSize: '1.3rem' }}>{viewingPm.title}</h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                  Synthesized by {viewingPm.author} • {new Date(viewingPm.publishedAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleExportMarkdown(viewingPm)}
                  className="btn btn-secondary btn-sm"
                >
                  <Download size={14} />
                  Export .MD
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-secondary btn-sm"
                >
                  <Printer size={14} />
                  Print Report
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Executive Summary
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {viewingPm.executiveSummary}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Impact & Blast Radius
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {viewingPm.impactSummary}
                  </p>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#ef4444', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Root Cause Analysis
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                    {viewingPm.rootCauseAnalysis}
                  </p>
                </div>
              </div>

              {/* Lessons Learned */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#34d399', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Preventative Lessons Learned
                </h4>
                <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                  {viewingPm.lessonsLearned?.map((lesson, idx) => (
                    <li key={idx}>{lesson}</li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div>
                <h4 style={{ fontSize: '0.9rem', color: '#c084fc', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Follow-Up Action Items
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {viewingPm.actionItems?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} color={item.done ? '#10b981' : '#64748b'} />
                        <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : '#fff' }}>
                          {item.task}
                        </span>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        @{item.assignee}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No post-mortems generated yet. Select an incident above and click "Generate Post-Mortem".
          </div>
        )}
      </div>
    </div>
  );
}
