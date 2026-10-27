import React, { useState } from 'react';
import { Flame, X, Database, Network, Cpu, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function ChaosDrillModal({ isOpen, onClose, onChaosTriggered }) {
  const [selectedDrill, setSelectedDrill] = useState('database-pressure');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const drills = [
    {
      id: 'database-pressure',
      title: 'Database Lock Contention & Pool Saturation',
      serviceId: 'srv-postgres',
      serviceName: 'PostgreSQL Primary Cluster',
      severity: 'P1',
      icon: Database,
      description: 'Simulates client connection exhaustion, 95% CPU saturation, and 503 cascades across checkout APIs.'
    },
    {
      id: 'network-partition',
      title: 'Canary Gateway Latency & 504 Timeout Surge',
      serviceId: 'srv-checkout',
      serviceName: 'Checkout & Payment Engine',
      severity: 'P2',
      icon: Network,
      description: 'Injects synthetic 4000ms latency spikes and 12% HTTP 504 errors on payment dispatch.'
    },
    {
      id: 'memory-exhaustion',
      title: 'Redis Node Memory Pressure & LRU Eviction',
      serviceId: 'srv-redis',
      serviceName: 'Redis Distributed Cache',
      severity: 'P3',
      icon: Cpu,
      description: 'Simulates unbounded session key flood, triggering rapid cache misses and memory threshold alerts.'
    }
  ];

  const handleLaunch = async () => {
    try {
      setSubmitting(true);
      const drill = drills.find(d => d.id === selectedDrill);
      const res = await api.triggerChaos(drill.serviceId, drill.id);
      if (onChaosTriggered) {
        onChaosTriggered(res.incident);
      }
      onClose();
    } catch (err) {
      alert('Chaos injection failed: ' + err.message);
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
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '560px',
        boxShadow: '0 20px 50px rgba(239, 68, 68, 0.25)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15), transparent)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              <Flame size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>Chaos Engineering Injector</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Simulate production failures to test automated triage & runbook workflows
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

        {/* Drill Choices */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {drills.map(d => {
            const Icon = d.icon;
            const isSelected = selectedDrill === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDrill(d.id)}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isSelected ? 'rgba(239, 68, 68, 0.6)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <Icon size={18} color={isSelected ? '#ef4444' : '#94a3b8'} />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? '#fff' : 'var(--text-main)' }}>
                      {d.title}
                    </span>
                  </div>
                  <span className={`badge ${d.severity === 'P1' ? 'badge-p1' : d.severity === 'P2' ? 'badge-p2' : 'badge-p3'}`}>
                    {d.severity}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {d.description}
                </p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>
                  Target: {d.serviceName}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={submitting}
              className="btn btn-danger"
            >
              <Flame size={16} />
              {submitting ? 'Injecting Chaos...' : 'Launch Chaos Experiment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
