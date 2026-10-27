const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { broadcast } = require('../websocket/wsHandler');

// GET /api/services
router.get('/', (req, res) => {
  const services = db.get('services');
  res.json({ services });
});

// GET /api/services/topology
router.get('/topology', (req, res) => {
  const services = db.get('services');
  const incidents = db.get('incidents');

  // Build nodes and links
  const nodes = services.map(svc => {
    const activeIncident = incidents.find(
      i => i.serviceId === svc.id && i.status !== 'resolved'
    );

    return {
      id: svc.id,
      label: svc.name,
      code: svc.code,
      tier: svc.tier,
      status: svc.status,
      latency: svc.latency,
      errorRate: svc.errorRate,
      cpuUsage: svc.cpuUsage,
      memoryUsage: svc.memoryUsage,
      hasActiveIncident: !!activeIncident,
      incidentSeverity: activeIncident ? activeIncident.severity : null,
      region: svc.region
    };
  });

  const links = [];
  services.forEach(svc => {
    if (svc.dependencies && Array.isArray(svc.dependencies)) {
      svc.dependencies.forEach(depId => {
        links.push({
          source: svc.id,
          target: depId,
          type: 'depends_on'
        });
      });
    }
  });

  res.json({ nodes, links });
});

// GET /api/services/:id
router.get('/:id', (req, res) => {
  const service = db.findById('services', req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const activeIncidents = db.find('incidents', i => i.serviceId === service.id && i.status !== 'resolved');
  const resolvedIncidents = db.find('incidents', i => i.serviceId === service.id && i.status === 'resolved');
  const runbooks = db.find('runbooks', r => r.targetServiceId === service.id);

  res.json({
    service,
    activeIncidents,
    resolvedIncidents,
    runbooks
  });
});

// POST /api/services
router.post('/', authMiddleware, requireRoles(['admin', 'commander']), (req, res) => {
  const { name, code, tier = 'Tier 1', owner = 'Platform Team', region = 'us-east-1', dependencies = [], description = '' } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Service name and code are required.' });
  }

  const newService = {
    id: `srv-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name,
    code,
    tier,
    status: 'healthy',
    uptime: 100.0,
    latency: 12.0,
    errorRate: 0.01,
    cpuUsage: 25.0,
    memoryUsage: 35.0,
    dependencies,
    owner,
    region,
    description,
    lastUpdated: new Date().toISOString()
  };

  db.insert('services', newService);
  broadcast('SERVICE_CREATED', { service: newService });

  res.status(201).json({
    message: 'Service registered into catalog.',
    service: newService
  });
});

// PATCH /api/services/:id/health (Manual override for demonstrations)
router.patch('/:id/health', authMiddleware, requireRoles(['admin', 'commander']), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['healthy', 'degraded', 'critical', 'maintenance'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Choose from: ${validStatuses.join(', ')}` });
  }

  const service = db.findById('services', req.params.id);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const updated = db.update('services', service.id, {
    status,
    lastUpdated: new Date().toISOString()
  });

  broadcast('SERVICE_STATUS_CHANGED', { service: updated });

  res.json({
    message: `Service status updated to ${status}`,
    service: updated
  });
});

module.exports = router;
