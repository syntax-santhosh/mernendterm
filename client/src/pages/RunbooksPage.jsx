import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Play, 
  Terminal as TerminalIcon, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileCode, 
  History, 
  Server,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useWebSocket } from '../context/WebSocketContext';

export default function RunbooksPage() {
  const [runbooks, setRunbooks] = useState([]);
  const [selectedRunbook, setSelectedRunbook] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [targetIncidentId, setTargetIncidentId] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  const { terminalLogs, clearTerminalLogs, addListener } = useWebSocket();
  const terminalEndRef = useRef(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [rbRes, execRes, incRes] = await Promise.all([
          api.getRunbooks(),
          api.getRecentExecutions(),
          api.getIncidents({ status: 'active' })
        ]);

        setRunbooks(rbRes.runbooks || []);
        setExecutions(execRes.executions || []);
        setIncidents(incRes.incidents || []);

        if (rbRes.runbooks && rbRes.runbooks.length > 0) {
          setSelectedRunbook(rbRes.runbooks[0]);
        }
        if (incRes.incidents && incRes.incidents.length > 0) {
          setTargetIncidentId(incRes.incidents[0].id);
        }
      } catch (err) {
        console.error('Failed to load runbooks data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const unsubscribe = addListener((msg) => {
      if (msg.type === 'RUNBOOK_EXECUTION_COMPLETED') {
        setIsRunning(false);
        api.getRecentExecutions().then(res => setExecutions(res.executions || []));
      }
    });
    return unsubscribe;
  }, [addListener]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleExecute = async () => {
    if (!selectedRunbook) return;
    try {
      setIsRunning(true);
      clearTerminalLogs();
      await api.executeRunbook(selectedRunbook.id, targetIncidentId || undefined, true);
    } catch (err) {
      setIsRunning(false);
      alert('Execution failed: ' + err.message);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(168, 85, 247, 0.15)', borderRadius: '10px', color: '#c084fc' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem' }}>Automated Remediation Runbooks Catalog</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Executable site reliability procedures, diagnostic checks, and automated mitigations
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Catalog List on Left, Runbook Details & Execution Deck on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1.5rem' }}>
        {/* Runbook List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Available Procedures ({runbooks.length})
          </div>

          {runbooks.map(rb => {
            const isSelected = selectedRunbook?.id === rb.id;
            return (
              <div
                key={rb.id}
                onClick={() => setSelectedRunbook(rb)}
                className="glass-card glass-card-interactive"
                style={{
                  padding: '1rem',
                  background: isSelected ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isSelected ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                    {rb.category}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    ~{rb.estimatedDurationMinutes}m
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#e9d5ff' : '#fff', marginBottom: '0.35rem' }}>
                  {rb.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {rb.steps.length} Automated Steps • Target: {rb.targetServiceId}
                </div>
              </div>
            );
          })}

          {/* Past Executions Audit Trail */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <History size={14} />
              Recent Execution Logs
            </div>

            {executions.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>No recent executions recorded.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {executions.map(ex => (
                  <div key={ex.id} style={{ padding: '0.5rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: '#e2e8f0' }}>
                      <span>{ex.runbookTitle}</span>
                      <span className={`badge ${ex.status === 'completed' ? 'badge-healthy' : 'badge-neutral'}`} style={{ fontSize: '0.55rem' }}>
                        {ex.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                      By {ex.initiatedBy?.name} • {new Date(ex.startedAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Runbook Step Inspection & Live Execution Terminal */}
        {selectedRunbook && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#c084fc', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {selectedRunbook.category}
                  </div>
                  <h3 style={{ fontSize: '1.25rem' }}>{selectedRunbook.title}</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    {selectedRunbook.description}
                  </p>
                </div>

                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>AUTHOR</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedRunbook.author}</div>
                </div>
              </div>

              {/* Step Sequence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', margin: '1rem 0' }}>
                {selectedRunbook.steps.map((st, i) => (
                  <div key={st.id} style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#e2e8f0' }}>
                        Step {i + 1}: {st.name}
                      </span>
                      <span className="badge badge-neutral" style={{ fontSize: '0.6rem' }}>
                        {st.type}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#93c5fd', background: 'rgba(15, 23, 42, 0.8)', padding: '0.35rem 0.6rem', borderRadius: '4px', overflowX: 'auto' }}>
                      $ {st.command}
                    </div>
                  </div>
                ))}
              </div>

              {/* Execution Controls */}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Incident:</span>
                  <select
                    value={targetIncidentId}
                    onChange={(e) => setTargetIncidentId(e.target.value)}
                    className="form-select"
                    style={{ width: 'auto', fontSize: '0.82rem', padding: '0.35rem 0.65rem' }}
                  >
                    <option value="">-- None (Standalone Drill) --</option>
                    {incidents.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.id} - {i.title}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={isRunning}
                  className="btn btn-primary"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  <Play size={16} className={isRunning ? 'animate-spin' : ''} />
                  {isRunning ? 'Streaming Steps...' : 'Execute Runbook Steps'}
                </button>
              </div>
            </div>

            {/* Terminal Window */}
            <div className="terminal-window" style={{ minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
              <div className="terminal-header">
                <div className="terminal-dots">
                  <div className="terminal-dot red" />
                  <div className="terminal-dot yellow" />
                  <div className="terminal-dot green" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                  <TerminalIcon size={13} />
                  <span>runbook-execution-engine</span>
                </div>
                <button
                  onClick={clearTerminalLogs}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  Clear
                </button>
              </div>

              <div className="terminal-body" style={{ flex: 1 }}>
                {terminalLogs.length === 0 ? (
                  <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Click "Execute Runbook Steps" to begin live command orchestration...
                  </div>
                ) : (
                  terminalLogs.map(log => (
                    <div key={log.id} style={{ marginBottom: '0.4rem' }}>
                      <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>{' '}
                      <span style={{ color: log.status === 'success' ? '#34d399' : '#93c5fd' }}>
                        {log.log}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
