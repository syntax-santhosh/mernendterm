import React from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Radio, 
  Network, 
  BookOpen, 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  RotateCcw
} from 'lucide-react';
import { useWebSocket } from '../context/WebSocketContext';

export default function Sidebar({ activeTab, setActiveTab, onOpenChaosModal }) {
  const { isConnected } = useWebSocket();

  const navItems = [
    { id: 'incidents', label: 'Incident Command', icon: AlertTriangle, badge: 'Live' },
    { id: 'war-room', label: 'Incident War Room', icon: Radio },
    { id: 'topology', label: 'Service Mesh & Topology', icon: Network },
    { id: 'runbooks', label: 'Remediation Runbooks', icon: BookOpen },
    { id: 'analytics', label: 'Reliability & Post-Mortems', icon: BarChart3 },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
        }}>
          <Activity size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
            Pulse<span style={{ color: '#38bdf8' }}>Ops</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            SRE Command Engine
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ padding: '1.25rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Operations Console
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: isActive ? '#60a5fa' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} color={isActive ? '#3b82f6' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(239, 68, 68, 0.2)',
                  color: '#f87171',
                  fontWeight: 700
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Chaos Engineering Quick Action */}
        <div style={{ marginTop: '1.5rem', padding: '0 0.75rem' }}>
          <button
            onClick={onOpenChaosModal}
            className="btn btn-outline-danger"
            style={{ width: '100%', fontSize: '0.8rem', padding: '0.6rem 0.85rem' }}
          >
            <Flame size={16} />
            Inject Chaos Drill
          </button>
        </div>
      </nav>

      {/* System Bus Status Footer */}
      <div style={{
        padding: '1rem 1.25rem',
        borderTop: '1px solid var(--border-subtle)',
        background: 'rgba(5, 8, 15, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className={`pulse-dot ${isConnected ? 'healthy' : 'critical'}`} />
          <span style={{ color: isConnected ? 'var(--text-muted)' : '#f87171' }}>
            {isConnected ? 'Telemetry Bus Live' : 'Reconnecting...'}
          </span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', fontSize: '0.7rem' }}>
          v2.4.0
        </span>
      </div>
    </aside>
  );
}
