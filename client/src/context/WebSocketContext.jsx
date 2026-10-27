import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

const WebSocketContext = createContext(null);

export function WebSocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveServices, setLiveServices] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const listenersRef = useRef(new Set());
  const wsRef = useRef(null);

  useEffect(() => {
    let reconnectTimeout = null;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleIncomingMessage(payload);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic reconnection attempt after 3s
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  function handleIncomingMessage(msg) {
    setLastEvent(msg);

    // Notify registered listeners
    listenersRef.current.forEach(callback => callback(msg));

    switch (msg.type) {
      case 'TELEMETRY_UPDATE':
        if (msg.payload && msg.payload.services) {
          setLiveServices(msg.payload.services);
        }
        break;

      case 'RUNBOOK_STEP_UPDATE':
        if (msg.payload && msg.payload.log) {
          setTerminalLogs(prev => [...prev.slice(-100), {
            id: Date.now() + Math.random(),
            stepIndex: msg.payload.stepIndex,
            status: msg.payload.status,
            log: msg.payload.log,
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
        break;

      case 'INCIDENT_RESOLVED':
        // Trigger celebratory confetti on screen!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        break;

      default:
        break;
    }
  }

  const addListener = (cb) => {
    listenersRef.current.add(cb);
    return () => listenersRef.current.delete(cb);
  };

  const clearTerminalLogs = () => {
    setTerminalLogs([]);
  };

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        liveServices,
        lastEvent,
        terminalLogs,
        addListener,
        clearTerminalLogs
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
