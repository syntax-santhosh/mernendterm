import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Send, 
  Play, 
  Terminal as TerminalIcon, 
  ShieldAlert, 
  Clock, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Cpu, 
  Zap, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../context/WebSocketContext';

export default function WarRoomPage({ selectedIncidentId, onSelectIncident }) {
  const { user } = useAuth();
  const { isConnected, liveServices, terminalLogs, clearTerminalLogs, addListener } = useWebSocket();

  const [incidents, setIncidents] = useState([]);
  const [activeIncident, setActiveIncident] = useState(null);
  const [feedEvents, setFeedEvents] = useState([]);
  const [runbooks, setRunbooks] = useState([]);
  const [selectedRunbookId, setSelectedRunbookId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [isExecutingRunbook, setIsExecutingRunbook] = useState(false);
  const [loading, setLoading] = useState(true);

  const terminalEndRef = useRef(null);
  const chatEndRef = useRef(null);

  // Load all incidents for switcher
  useEffect(() => {
    api.getIncidents({ status: 'all' }).then(res => {
      const list = res.incidents || [];
      setIncidents(list);
      // If selectedIncidentId provided, use it, else pick the first active incident, or first overall
      const current = list.find(i => i.id === selectedIncidentId) ||
                      list.find(i => i.status !== 'resolved') ||
                      list[0];
      if (current) {
        loadIncidentWarRoom(current.id);
      }
    }).catch(console.error);
  }, [selectedIncidentId]);

  const loadIncidentWarRoom = async (incId) => {
    try {
      setLoading(true);
      const res = await api.getWarRoomFeed(incId);
      setActiveIncident(res.incident);
      setFeedEvents(res.events || []);
      setRunbooks(res.runbooks || []);
      if (res.runbooks && res.runbooks.length > 0) {
        setSelectedRunbookId(res.runbooks[0].id);
      }
    } catch (err) {
      console.error('Failed to load war room feed:', err);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket message and status listener
  useEffect(() => {
    const unsubscribe = addListener((msg) => {
      if (msg.type === 'WAR_ROOM_EVENT' && msg.payload?.incidentId === activeIncident?.id) {
        setFeedEvents(prev => [...prev, msg.payload.event]);
      } else if (msg.type === 'INCIDENT_STATUS_CHANGED' && msg.payload?.incident?.id === activeIncident?.id) {
        setActiveIncident(msg.payload.incident);
        if (msg.payload.statusEvent) {
          setFeedEvents(prev => [...prev, msg.payload.statusEvent]);
        }
      } else if (msg.type === 'INCIDENT_RESOLVED' && msg.payload?.incident?.id === activeIncident?.id) {
        setActiveIncident(msg.payload.incident);
        if (msg.payload.warRoomEvent) {
          setFeedEvents(prev => [...prev, msg.payload.warRoomEvent]);
        }
        setIsExecutingRunbook(false);
      } else if (msg.type === 'RUNBOOK_EXECUTION_COMPLETED') {
        setIsExecutingRunbook(false);
      }
    });
    return unsubscribe;
  }, [addListener, activeIncident]);

  // Auto-scroll chat & terminal
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [feedEvents]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeIncident) return;

    try {
      await api.sendWarRoomMessage(activeIncident.id, messageInput.trim(), 'message');
      setMessageInput('');
    } catch (err) {
      alert('Failed to send message: ' + err.message);
    }
  };

  const handleStatusTransition = async (newStatus) => {
    if (!activeIncident) return;
    try {
      await api.updateIncidentStatus(
        activeIncident.id, 
        newStatus, 
        newStatus === 'identified' ? 'Root cause pinpointed via diagnostic probe.' : undefined
      );
    } catch (err) {
      alert('Status transition failed: ' + err.message);
    }
  };

  const handleExecuteRunbook = async () => {
    if (!selectedRunbookId || !activeIncident) return;
    try {
      setIsExecutingRunbook(true);
      clearTerminalLogs();
      await api.executeRunbook(selectedRunbookId, activeIncident.id, true);
    } catch (err) {
      setIsExecutingRunbook(false);
      alert('Runbook execution failed: ' + err.message);
    }
  };

  // Find telemetry of the service associated with this incident
  const currentServiceTelemetry = liveServices.find(s => s.id === activeIncident?.serviceId);

  const statuses = ['investigating', 'identified', 'monitoring', 'resolved'];
  const currentStatusIndex = statuses.indexOf(activeIncident?.status || 'investigating');

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Incident Switcher Bar */}
      <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Radio size={20} color="#ef4444" className="animate-pulse" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', textTransform: 'uppercase' }}>
            Tactical War Room
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>|</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Incident:</span>
          <select
            value={activeIncident?.id || ''}
            onChange={(e) => {
              loadIncidentWarRoom(e.target.value);
              if (onSelectIncident) onSelectIncident(e.target.value);
            }}
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.82rem' }}
          >
            {incidents.map(inc => (
              <option key={inc.id} value={inc.id}>
                {inc.id} — [{inc.severity}] {inc.title} ({inc.status.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
          <span>Commander: <strong style={{ color: '#60a5fa' }}>{activeIncident?.commanderName}</strong></span>
          <span>•</span>
          <span>Responder: <strong style={{ color: '#34d399' }}>{activeIncident?.assigneeName}</strong></span>
        </div>
      </div>

      {activeIncident && (
        <>
          {/* Incident Command Status Header Banner */}
          <div className="glass-card" style={{
            borderLeft: `5px solid ${activeIncident.severity === 'P1' ? 'var(--color-critical)' : 'var(--color-degraded)'}`,
            padding: '1.5rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <span className={`badge ${activeIncident.severity === 'P1' ? 'badge-p1' : 'badge-p2'}`}>
                    {activeIncident.severity} OUTAGE
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                    {activeIncident.id}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Target Service: <strong>{activeIncident.serviceName}</strong>
                  </span>
                </div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>
                  {activeIncident.title}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '800px' }}>
                  {activeIncident.description}
                </p>
              </div>

              {/* SLA Countdown Badge */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1.25rem',
                textAlign: 'right'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SLA Target Window
                </div>
                <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: activeIncident.status === 'resolved' ? '#10b981' : '#f59e0b' }}>
                  {activeIncident.status === 'resolved' ? 'RESOLVED' : `${activeIncident.slaTargetMinutes}m MAX`}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {activeIncident.status === 'resolved' ? 'Zero SLA breach' : 'Counting down'}
                </div>
              </div>
            </div>

            {/* Lifecycle Stage Progression Stepper */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                INCIDENT LIFECYCLE:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {statuses.map((st, index) => {
                  const isCurrent = activeIncident.status === st;
                  const isPassed = index < currentStatusIndex || activeIncident.status === 'resolved';

                  return (
                    <button
                      key={st}
                      onClick={() => handleStatusTransition(st)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        border: isCurrent
                          ? '1px solid #3b82f6'
                          : isPassed
                          ? '1px solid rgba(16, 185, 129, 0.4)'
                          : '1px solid var(--border-subtle)',
                        background: isCurrent
                          ? 'rgba(59, 130, 246, 0.25)'
                          : isPassed
                          ? 'rgba(16, 185, 129, 0.15)'
                          : 'rgba(255, 255, 255, 0.03)',
                        color: isCurrent
                          ? '#93c5fd'
                          : isPassed
                          ? '#6ee7b7'
                          : 'var(--text-dim)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      {isPassed && <CheckCircle2 size={13} color="#10b981" />}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Two-Column Tactical Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '1.5rem', minHeight: '600px' }}>
            {/* Left: Collaborative Real-Time War Room Timeline & Chat */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Radio size={16} color="#38bdf8" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>War Room Incident Comms</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {feedEvents.length} log events
                </span>
              </div>

              {/* Chat Message List */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingRight: '0.5rem', maxHeight: '520px' }}>
                {feedEvents.map(evt => {
                  const isSystem = evt.senderRole === 'system';
                  const isActionItem = evt.type === 'action_item';
                  const isStatusChange = evt.type === 'status_change';

                  return (
                    <div
                      key={evt.id}
                      style={{
                        padding: '0.75rem 0.95rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isStatusChange
                          ? 'rgba(59, 130, 246, 0.1)'
                          : isActionItem
                          ? 'rgba(245, 158, 11, 0.1)'
                          : 'rgba(255, 255, 255, 0.03)',
                        border: isStatusChange
                          ? '1px solid rgba(59, 130, 246, 0.25)'
                          : isActionItem
                          ? '1px solid rgba(245, 158, 11, 0.3)'
                          : '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isSystem ? '#38bdf8' : '#e2e8f0' }}>
                            {evt.senderName}
                          </span>
                          <span className={`badge ${evt.senderRole === 'admin' ? 'badge-p1' : evt.senderRole === 'commander' ? 'badge-p2' : 'badge-neutral'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem' }}>
                            {evt.senderRole}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                        {evt.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Form */}
              <form onSubmit={handleSendMessage} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Post responder update, hypothesis, or note (supports markdown)..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  <Send size={15} />
                  <span>Send</span>
                </button>
              </form>
            </div>

            {/* Right: Telemetry & Runbook Command Deck */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Real-Time Telemetry Gauges */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Activity size={16} color="#38bdf8" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      Telemetry Stream: {activeIncident.serviceName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div className={`pulse-dot ${currentServiceTelemetry?.status === 'critical' ? 'critical' : currentServiceTelemetry?.status === 'degraded' ? 'degraded' : 'healthy'}`} />
                    <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {currentServiceTelemetry?.status || 'Active'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: (currentServiceTelemetry?.latency || 0) > 200 ? '#ef4444' : '#10b981' }}>
                      {currentServiceTelemetry ? `${currentServiceTelemetry.latency}ms` : '380ms'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Latency</div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: (currentServiceTelemetry?.cpuUsage || 0) > 85 ? '#ef4444' : '#38bdf8' }}>
                      {currentServiceTelemetry ? `${currentServiceTelemetry.cpuUsage}%` : '94%'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>CPU Load</div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: (currentServiceTelemetry?.memoryUsage || 0) > 80 ? '#f59e0b' : '#38bdf8' }}>
                      {currentServiceTelemetry ? `${currentServiceTelemetry.memoryUsage}%` : '89%'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Memory</div>
                  </div>

                  <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: (currentServiceTelemetry?.errorRate || 0) > 5 ? '#ef4444' : '#10b981' }}>
                      {currentServiceTelemetry ? `${currentServiceTelemetry.errorRate}%` : '14%'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Error Rate</div>
                  </div>
                </div>
              </div>

              {/* Remediation Runbook Command Module */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} color="#a855f7" />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Executable Runbook Deck</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Automated Remediation
                  </span>
                </div>

                {runbooks.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    No automated runbook mapped for this service yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <select
                      value={selectedRunbookId}
                      onChange={(e) => setSelectedRunbookId(e.target.value)}
                      className="form-select"
                      style={{ fontSize: '0.82rem' }}
                    >
                      {runbooks.map(rb => (
                        <option key={rb.id} value={rb.id}>
                          {rb.title} ({rb.steps.length} steps)
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleExecuteRunbook}
                      disabled={isExecutingRunbook || activeIncident.status === 'resolved'}
                      className="btn btn-primary"
                      style={{ width: '100%', fontSize: '0.85rem', background: activeIncident.status === 'resolved' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                    >
                      <Play size={16} className={isExecutingRunbook ? 'animate-spin' : ''} />
                      {isExecutingRunbook ? 'Executing Runbook Steps...' : activeIncident.status === 'resolved' ? 'Incident Already Resolved' : 'Execute Remediation Runbook'}
                    </button>
                  </div>
                )}
              </div>

              {/* Live Streaming Terminal Window */}
              <div className="terminal-window" style={{ flex: 1, minHeight: '260px', display: 'flex', flexDirection: 'column' }}>
                <div className="terminal-header">
                  <div className="terminal-dots">
                    <div className="terminal-dot red" />
                    <div className="terminal-dot yellow" />
                    <div className="terminal-dot green" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                    <TerminalIcon size={13} />
                    <span>pulseops-remediation-console</span>
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
                      Ready. Click "Execute Remediation Runbook" above to trigger automated diagnostic & remediation workflow...
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
          </div>
        </>
      )}
    </div>
  );
}
