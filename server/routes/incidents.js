const express = require('express');
const router = express.Router();
const db = require('../db/database');
const triageEngine = require('../engine/triageEngine');
const { authMiddleware, requireRoles } = require('../middleware/auth');
const { broadcast } = require('../websocket/wsHandler');

// GET /api/incidents
router.get('/', (req, res) => {
  const { status, severity, serviceId, search } = req.query;
  let incidents = db.get('incidents');

  if (status && status !== 'all') {
    if (status === 'active') {
      incidents = incidents.filter(i => i.status !== 'resolved');
    } else {
      incidents = incidents.filter(i => i.status === status);
    }
  }

  if (severity && severity !== 'all') {
    incidents = incidents.filter(i => i.severity === severity);
  }

  if (serviceId && serviceId !== 'all') {
    incidents = incidents.filter(i => i.serviceId === serviceId);
  }

  if (search) {
    const q = search.toLowerCase();
    incidents = incidents.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.id.toLowerCase().includes(q) ||
      i.serviceName.toLowerCase().includes(q) ||
      (i.tags && i.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Sort: active first, then by date descending
  incidents.sort((a, b) => {
    if (a.status !== 'resolved' && b.status === 'resolved') return -1;
    if (a.status === 'resolved' && b.status !== 'resolved') return 1;
    return new Date(b.startedAt) - new Date(a.startedAt);
  });

  res.json({ incidents });
});

// GET /api/incidents/:id
router.get('/:id', (req, res) => {
  const incident = db.findById('incidents', req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const blastRadius = triageEngine.calculateBlastRadius(incident.serviceId);
  const warRoomEvents = db.find('warRoomEvents', e => e.incidentId === incident.id);
  const service = db.findById('services', incident.serviceId);

  res.json({
    incident,
    service,
    blastRadius,
    warRoomEvents
  });
});

// POST /api/incidents (Create new incident with automated triage)
router.post('/', authMiddleware, requireRoles(['admin', 'commander', 'engineer']), (req, res) => {
  const {
    title,
    description,
    serviceId,
    affectedUsersEstimate = 1000,
    tags = []
  } = req.body;

  if (!title || !serviceId) {
    return res.status(400).json({ error: 'Title and target service are required.' });
  }

  const service = db.findById('services', serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  // Calculate intelligent triage score & severity
  const severity = triageEngine.calculateSeverity({
    serviceTier: service.tier,
    affectedUsers: Number(affectedUsersEstimate),
    errorRate: service.errorRate,
    latencyMs: service.latency,
    isCoreDataStore: service.code.includes('postgres') || service.code.includes('redis')
  });

  const slaTargetMinutes = triageEngine.getSlaTargetMinutes(severity);
  const suggestedAssignee = triageEngine.suggestResponder(serviceId);

  const newIncidentId = `INC-${1000 + db.get('incidents').length + 1}`;
  const now = new Date().toISOString();

  const incident = {
    id: newIncidentId,
    title,
    description: description || `Automated alert triggered on ${service.name}.`,
    severity,
    status: 'investigating',
    serviceId: service.id,
    serviceName: service.name,
    commanderId: req.user.id,
    commanderName: req.user.name,
    assignedTo: suggestedAssignee.id,
    assigneeName: suggestedAssignee.name,
    impactRadius: `${service.name} and dependent tiers`,
    affectedUsersEstimate: Number(affectedUsersEstimate),
    slaTargetMinutes,
    startedAt: now,
    updatedAt: now,
    resolvedAt: null,
    tags: Array.isArray(tags) ? tags : ['auto-detected', service.code],
    rootCause: null,
    postMortemStatus: 'pending'
  };

  db.insert('incidents', incident);

  // Update target service status to critical/degraded
  service.status = severity === 'P1' ? 'critical' : 'degraded';
  db.save();

  // Add initial declaration event in War Room
  const initialEvent = {
    id: `wre-${Date.now()}`,
    incidentId: incident.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    type: 'message',
    content: `🚨 Incident declared: ${incident.title}. Automated triage categorized as **${severity}** (SLA Target: ${slaTargetMinutes} min). On-call responder routed to @${suggestedAssignee.name}.`,
    timestamp: now
  };
  db.insert('warRoomEvents', initialEvent);

  broadcast('INCIDENT_CREATED', {
    incident,
    service,
    initialEvent
  });

  res.status(201).json({
    message: 'Incident declared and triaged successfully.',
    incident
  });
});

// PATCH /api/incidents/:id/status
router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status, rootCause } = req.body;
  const validStatuses = ['triggered', 'investigating', 'identified', 'monitoring', 'resolved'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }

  const incident = db.findById('incidents', req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const updates = { status, updatedAt: new Date().toISOString() };
  if (rootCause) updates.rootCause = rootCause;

  if (status === 'resolved' && !incident.resolvedAt) {
    updates.resolvedAt = new Date().toISOString();

    // Check if target service should be marked healthy
    const service = db.findById('services', incident.serviceId);
    if (service) {
      service.status = 'healthy';
      db.save();
    }
  }

  const updatedIncident = db.update('incidents', incident.id, updates);

  // Add event to War Room
  const statusEvent = {
    id: `wre-${Date.now()}`,
    incidentId: incident.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    type: 'status_change',
    content: `State changed from **${incident.status.toUpperCase()}** to **${status.toUpperCase()}** by ${req.user.name}. ${rootCause ? `Root cause: "${rootCause}"` : ''}`,
    timestamp: new Date().toISOString()
  };
  db.insert('warRoomEvents', statusEvent);

  broadcast('INCIDENT_STATUS_CHANGED', {
    incident: updatedIncident,
    statusEvent
  });

  res.json({
    message: `Incident status updated to ${status}`,
    incident: updatedIncident
  });
});

// PATCH /api/incidents/:id/assign
router.patch('/:id/assign', authMiddleware, (req, res) => {
  const { assigneeId } = req.body;
  const targetUser = db.findById('users', assigneeId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Assignee user not found' });
  }

  const incident = db.findById('incidents', req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const updated = db.update('incidents', incident.id, {
    assignedTo: targetUser.id,
    assigneeName: targetUser.name
  });

  const assignEvent = {
    id: `wre-${Date.now()}`,
    incidentId: incident.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    type: 'message',
    content: `Assigned incident investigation to **${targetUser.name}** (${targetUser.title}).`,
    timestamp: new Date().toISOString()
  };
  db.insert('warRoomEvents', assignEvent);

  broadcast('INCIDENT_ASSIGNED', {
    incident: updated,
    assignEvent
  });

  res.json({ incident: updated });
});

// POST /api/incidents/simulate-chaos (Chaos drill injector)
router.post('/simulate-chaos', authMiddleware, requireRoles(['admin', 'commander']), (req, res) => {
  const { serviceId, drillType = 'database-pressure' } = req.body;
  const service = db.findById('services', serviceId || 'srv-postgres');
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const drills = {
    'database-pressure': {
      title: 'Chaos Monkey: PostgreSQL Lock Contention & Transaction Deadlock Surge',
      description: 'Simulated high-frequency locking queries injected by synthetic chaos harness.',
      severity: 'P1',
      affectedUsers: 18500
    },
    'network-partition': {
      title: 'Chaos Monkey: Cross-AZ Network Degradation & Packet Drop',
      description: 'Artificial 300ms network packet delay and 15% drop rate injected across VPC peering.',
      severity: 'P2',
      affectedUsers: 6200
    },
    'memory-exhaustion': {
      title: 'Chaos Monkey: Redis Out-Of-Memory Spike Under Unbounded Cache Load',
      description: 'Synthetic key flood test triggered memory threshold alert.',
      severity: 'P3',
      affectedUsers: 1400
    }
  };

  const drill = drills[drillType] || drills['database-pressure'];
  const newIncidentId = `INC-${1000 + db.get('incidents').length + 1}`;
  const now = new Date().toISOString();

  const incident = {
    id: newIncidentId,
    title: drill.title,
    description: drill.description,
    severity: drill.severity,
    status: 'investigating',
    serviceId: service.id,
    serviceName: service.name,
    commanderId: req.user.id,
    commanderName: req.user.name,
    assignedTo: req.user.id,
    assigneeName: req.user.name,
    impactRadius: `${service.name} and dependent microservice tiers`,
    affectedUsersEstimate: drill.affectedUsers,
    slaTargetMinutes: triageEngine.getSlaTargetMinutes(drill.severity),
    startedAt: now,
    updatedAt: now,
    resolvedAt: null,
    tags: ['chaos-drill', 'simulated', service.code],
    rootCause: 'Controlled chaos experiment initiated by platform engineer.',
    postMortemStatus: 'pending'
  };

  db.insert('incidents', incident);
  service.status = drill.severity === 'P1' ? 'critical' : 'degraded';
  db.save();

  const chaosEvent = {
    id: `wre-${Date.now()}`,
    incidentId: incident.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    type: 'alert',
    content: `🔥 CHAOS EXPERIMENT INJECTED: "${drill.title}". Active responders should follow recovery runbooks.`,
    timestamp: now
  };
  db.insert('warRoomEvents', chaosEvent);

  broadcast('INCIDENT_CREATED', { incident, service, initialEvent: chaosEvent });

  res.status(201).json({
    message: 'Chaos experiment started successfully',
    incident
  });
});

module.exports = router;
