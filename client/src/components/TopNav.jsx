import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle, 
  RotateCcw, 
  ChevronDown, 
  ShieldCheck, 
  Zap, 
  Flame 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function TopNav({ activeTab, onOpenDeclareModal, onOpenChaosModal, onRefreshData }) {
  const { user, demoUsers, switchDemoUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const viewTitles = {
    'incidents': 'Incident Command Center',
    'war-room': 'Active Incident War Room',
    'topology': 'Service Mesh Topology & Blast Radius',
    'runbooks': 'Automated SRE Remediation Runbooks',
    'analytics': 'Reliability Analytics & Post-Mortem Intelligence'
  };

  const handlePersonaSwitch = async (userId) => {
    try {
      await switchDemoUser(userId);
      setDropdownOpen(false);
    } catch (err) {
      alert('Failed to switch persona: ' + err.message);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Reset database to clean seed state? This restores active incidents and demo services.')) return;
    try {
      setResetting(true);
      await api.resetDemoData();
      if (onRefreshData) onRefreshData();
      alert('Database restored to initial seed state.');
    } catch (err) {
      alert('Failed to reset: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="top-nav">
      {/* Current View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
          {viewTitles[activeTab] || 'Incident Operations'}
        </h2>
        <span style={{
          fontSize: '0.7rem',
          padding: '0.2rem 0.5rem',
          background: 'rgba(59, 130, 246, 0.12)',
          color: '#60a5fa',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 600,
          border: '1px solid rgba(59, 130, 246, 0.25)'
        }}>
          LIVE ENVIRONMENT
        </span>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Declare Incident Button */}
        <button
          onClick={onOpenDeclareModal}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
        >
          <PlusCircle size={16} />
          <span>Declare Incident</span>
        </button>

        {/* Reset Database Button */}
        <button
          onClick={handleResetData}
          disabled={resetting}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
          title="Reset database to seed state"
        >
          <RotateCcw size={15} className={resetting ? 'animate-spin' : ''} />
          <span>Reset Demo</span>
        </button>

        {/* Persona Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.75rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
              alt={user?.name}
              style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{user?.name || 'Alex Mercer'}</div>
              <div style={{ fontSize: '0.68rem', color: '#60a5fa', textTransform: 'uppercase', fontWeight: 700 }}>
                {user?.role || 'ADMIN'}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-muted)" />
          </button>

          {/* Persona Menu */}
          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '270px',
              background: '#0d131f',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: '0.5rem',
              zIndex: 50
            }}>
              <div style={{
                padding: '0.4rem 0.6rem 0.6rem',
                borderBottom: '1px solid var(--border-subtle)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Switch Evaluator Persona
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.4rem' }}>
                {demoUsers.map(du => {
                  const isCurrent = user?.id === du.id;
                  return (
                    <button
                      key={du.id}
                      onClick={() => handlePersonaSwitch(du.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.5rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        background: isCurrent ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <img
                        src={du.avatar}
                        alt={du.name}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.82rem', color: isCurrent ? '#60a5fa' : '#fff' }}>
                          {du.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {du.title}
                        </div>
                      </div>
                      <span className={`badge ${du.role === 'admin' ? 'badge-p1' : du.role === 'commander' ? 'badge-p2' : 'badge-neutral'}`} style={{ fontSize: '0.62rem' }}>
                        {du.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
