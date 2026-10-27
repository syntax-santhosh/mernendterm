const db = require('../db/database');
const { broadcast } = require('../websocket/wsHandler');
const config = require('../config');

let intervalId = null;

function startTelemetrySimulator() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    try {
      const services = db.get('services');
      const incidents = db.get('incidents');

      const updatedServices = services.map(svc => {
        // Check if there is an active incident for this service
        const activeIncident = incidents.find(
          inc => inc.serviceId === svc.id && inc.status !== 'resolved'
        );

        let latency = svc.latency;
        let cpuUsage = svc.cpuUsage;
        let memoryUsage = svc.memoryUsage;
        let errorRate = svc.errorRate;
        let status = svc.status;

        const jitter = (Math.random() - 0.5) * 4;

        if (activeIncident) {
          if (activeIncident.severity === 'P1') {
            status = 'critical';
            latency = Math.max(380, Math.min(650, latency + (Math.random() - 0.48) * 20));
            cpuUsage = Math.max(88, Math.min(99, cpuUsage + jitter));
            memoryUsage = Math.max(85, Math.min(96, memoryUsage + jitter * 0.5));
            errorRate = Math.max(12, Math.min(22, errorRate + (Math.random() - 0.5) * 1.5));
          } else if (activeIncident.severity === 'P2') {
            status = 'degraded';
            latency = Math.max(220, Math.min(420, latency + (Math.random() - 0.48) * 15));
            cpuUsage = Math.max(70, Math.min(88, cpuUsage + jitter));
            memoryUsage = Math.max(65, Math.min(82, memoryUsage + jitter * 0.5));
            errorRate = Math.max(4, Math.min(10, errorRate + (Math.random() - 0.5)));
          } else {
            status = 'degraded';
            latency = Math.max(40, Math.min(120, latency + (Math.random() - 0.5) * 8));
            cpuUsage = Math.max(40, Math.min(65, cpuUsage + jitter));
            memoryUsage = Math.max(50, Math.min(68, memoryUsage + jitter * 0.5));
            errorRate = Math.max(0.5, Math.min(2.5, errorRate + (Math.random() - 0.5) * 0.2));
          }
        } else {
          // Healthy service baseline
          status = 'healthy';
          latency = Math.max(4, Math.min(24, latency + (Math.random() - 0.5) * 3));
          cpuUsage = Math.max(15, Math.min(45, cpuUsage + jitter));
          memoryUsage = Math.max(30, Math.min(55, memoryUsage + jitter * 0.3));
          errorRate = Math.max(0.01, Math.min(0.25, errorRate + (Math.random() - 0.5) * 0.04));
        }

        return {
          ...svc,
          status,
          latency: Number(latency.toFixed(1)),
          cpuUsage: Number(cpuUsage.toFixed(1)),
          memoryUsage: Number(memoryUsage.toFixed(1)),
          errorRate: Number(errorRate.toFixed(2)),
          lastUpdated: new Date().toISOString()
        };
      });

      // Update in db cache and broadcast
      db.data.services = updatedServices;

      broadcast('TELEMETRY_UPDATE', {
        services: updatedServices,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Telemetry simulator error:', err);
    }
  }, config.TELEMETRY_INTERVAL_MS);
}

function stopTelemetrySimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  startTelemetrySimulator,
  stopTelemetrySimulator
};
