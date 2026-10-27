import React, { useState, useEffect } from 'react';
import { AlertCircle, X, ShieldAlert, Cpu, Users, Zap } from 'lucide-react';
import { api } from '../services/api';

export default function DeclareIncidentModal({ isOpen, onClose, onIncidentCreated }) {
  const [services, setServices] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [affectedUsers, setAffectedUsers] = useState(5000);
  const [tagsInput, setTagsInput] = useState('production, outage');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      api.getServices().then(res => {
        setServices(res.services || []);
        if (res.services && res.services.length > 0) {
          setSelectedServiceId(res.services[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Real-time preview of triage severity calculation
  const selectedService = services.find(s => s.id === selectedServiceId);
  const isTier0 = selectedService?.tier === 'Tier 0';
  const isCoreDb = selectedService?.code.includes('postgres') || selectedService?.code.includes('redis');
  
  let previewScore = 0;
  if (isTier0) previewScore += 40; else previewScore += 25;
  if (affectedUsers >= 10000) previewScore += 35;
  else if (affectedUsers >= 2500) previewScore += 25;
  else previewScore += 15;
  if (isCoreDb) previewScore += 15;

  let previewSeverity = 'P4';
  if (previewScore >= 80) previewSeverity = 'P1';
  else if (previewScore >= 55) previewSeverity = 'P2';
  else if (previewScore >= 35) previewSeverity = 'P3';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !selectedServiceId) {
      setError('Please provide a title and select a service.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const res = await api.createIncident({
        title,
        description,
        serviceId: selectedServiceId,
        affectedUsersEstimate: Number(affectedUsers),
        tags
      });

      if (onIncidentCreated) {
        onIncidentCreated(res.incident);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        background: '#0d131f',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Declare System Incident</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Automated triage engine will score severity & route on-call responder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Incident Summary / Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Latency Spike and 500 Internal Server Errors in Ingress"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Affected Microservice *
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="form-select"
              >
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Estimated Affected Users
              </label>
              <input
                type="number"
                min="10"
                step="500"
                value={affectedUsers}
                onChange={(e) => setAffectedUsers(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Real-time Triage Score Engine Preview */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Zap size={18} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                  Auto-Triage Prediction
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Computed Weight: {previewScore} pts | Tier: {selectedService?.tier || 'Tier 1'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${previewSeverity === 'P1' ? 'badge-p1' : previewSeverity === 'P2' ? 'badge-p2' : 'badge-p3'}`}>
                {previewSeverity} SEVERITY
              </span>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Initial Observations & Symptoms
            </label>
            <textarea
              rows={3}
              placeholder="Describe error patterns, impacted endpoints, and anomalies..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Labels (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-danger"
            >
              {submitting ? 'Triaging...' : 'Declare & Dispatch Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
