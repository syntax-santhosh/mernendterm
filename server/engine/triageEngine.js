const db = require('../db/database');

/**
 * Intelligent Incident Triage Engine
 * Calculates severity, SLA thresholds, blast radius cascade, and on-call routing
 */
class TriageEngine {
  calculateSeverity(params) {
    const {
      serviceTier = 'Tier 1',
      affectedUsers = 0,
      errorRate = 0,
      latencyMs = 0,
      isCoreDataStore = false
    } = params;

    let score = 0;

    // Service criticality weight
    if (serviceTier === 'Tier 0') score += 40;
    else if (serviceTier === 'Tier 1') score += 25;
    else score += 10;

    // User impact volume
    if (affectedUsers >= 10000) score += 35;
    else if (affectedUsers >= 2500) score += 25;
    else if (affectedUsers >= 500) score += 15;
    else score += 5;

    // Error rate severity
    if (errorRate >= 10) score += 20;
    else if (errorRate >= 3) score += 12;
    else if (errorRate >= 1) score += 5;

    // Latency degradation
    if (latencyMs >= 500) score += 15;
    else if (latencyMs >= 200) score += 8;

    // Core data store impact
    if (isCoreDataStore) score += 15;

    if (score >= 80) return 'P1';
    if (score >= 55) return 'P2';
    if (score >= 35) return 'P3';
    return 'P4';
  }

  getSlaTargetMinutes(severity) {
    switch (severity) {
      case 'P1': return 30;  // 30 min SLA
      case 'P2': return 60;  // 1 hour SLA
      case 'P3': return 120; // 2 hour SLA
      case 'P4': return 240; // 4 hour SLA
      default: return 60;
    }
  }

  suggestResponder(serviceId) {
    const users = db.get('users');
    if (serviceId === 'srv-postgres') {
      return users.find(u => u.id === 'usr-engineer') || users[0];
    }
    if (serviceId === 'srv-checkout' || serviceId === 'srv-auth') {
      return users.find(u => u.id === 'usr-commander') || users[0];
    }
    return users.find(u => u.id === 'usr-admin') || users[0];
  }

  calculateBlastRadius(serviceId) {
    const services = db.get('services');
    const target = services.find(s => s.id === serviceId);
    if (!target) return [];

    // Find services that depend directly on this service
    const downstream = services.filter(s => s.dependencies && s.dependencies.includes(serviceId));
    return downstream.map(s => ({
      id: s.id,
      name: s.name,
      tier: s.tier,
      impact: 'Direct Dependency Risk'
    }));
  }
}

module.exports = new TriageEngine();
