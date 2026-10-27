import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import IncidentsPage from './pages/IncidentsPage';
import WarRoomPage from './pages/WarRoomPage';
import TopologyPage from './pages/TopologyPage';
import RunbooksPage from './pages/RunbooksPage';
import AnalyticsPage from './pages/AnalyticsPage';
import DeclareIncidentModal from './components/DeclareIncidentModal';
import ChaosDrillModal from './components/ChaosDrillModal';

function MainApp() {
  const [activeTab, setActiveTab] = useState('incidents');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [isDeclareOpen, setIsDeclareOpen] = useState(false);
  const [isChaosOpen, setIsChaosOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectIncident = (incidentId) => {
    setSelectedIncidentId(incidentId);
    setActiveTab('war-room');
  };

  const handleIncidentCreated = (incident) => {
    setSelectedIncidentId(incident.id);
    setActiveTab('war-room');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleChaosTriggered = (incident) => {
    setSelectedIncidentId(incident.id);
    setActiveTab('war-room');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenChaosModal={() => setIsChaosOpen(true)}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <TopNav
          activeTab={activeTab}
          onOpenDeclareModal={() => setIsDeclareOpen(true)}
          onOpenChaosModal={() => setIsChaosOpen(true)}
          onRefreshData={() => setRefreshTrigger(prev => prev + 1)}
        />

        <main style={{ flex: 1 }}>
          {activeTab === 'incidents' && (
            <IncidentsPage
              key={refreshTrigger}
              onSelectIncident={handleSelectIncident}
              onOpenDeclareModal={() => setIsDeclareOpen(true)}
              onOpenChaosModal={() => setIsChaosOpen(true)}
            />
          )}

          {activeTab === 'war-room' && (
            <WarRoomPage
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
            />
          )}

          {activeTab === 'topology' && (
            <TopologyPage key={refreshTrigger} />
          )}

          {activeTab === 'runbooks' && (
            <RunbooksPage key={refreshTrigger} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage key={refreshTrigger} />
          )}
        </main>
      </div>

      {/* Modals */}
      <DeclareIncidentModal
        isOpen={isDeclareOpen}
        onClose={() => setIsDeclareOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />

      <ChaosDrillModal
        isOpen={isChaosOpen}
        onClose={() => setIsChaosOpen(false)}
        onChaosTriggered={handleChaosTriggered}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </AuthProvider>
  );
}
