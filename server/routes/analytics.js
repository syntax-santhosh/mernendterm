const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware, requireRoles } = require('../middleware/auth');

// GET /api/analytics/overview
router.get('/overview', (req, res) => {
  const incidents = db.get('incidents');
  const services = db.get('services');

  const resolved = incidents.filter(i => i.status === 'resolved' && i.resolvedAt);
  const active = incidents.filter(i => i.status !== 'resolved');

  // Calculate MTTR (Mean Time to Resolution)
  let totalResolutionMinutes = 0;
  resolved.forEach(inc => {
    const start = new Date(inc.startedAt).getTime();
    const end = new Date(inc.resolvedAt).getTime();
    const durationMin = Math.max(1, (end - start) / (1000 * 60));
    totalResolutionMinutes += durationMin;
  });
  const mttrMinutes = resolved.length > 0 ? Math.round(totalResolutionMinutes / resolved.length) : 34;

  // SLA compliance: check if resolved incidents were within slaTargetMinutes
  let slaCompliantCount = 0;
  resolved.forEach(inc => {
    const durationMin = (new Date(inc.resolvedAt) - new Date(inc.startedAt)) / (1000 * 60);
    if (durationMin <= (inc.slaTargetMinutes || 60)) {
      slaCompliantCount++;
    }
  });
  const slaComplianceRate = resolved.length > 0
    ? Math.round((slaCompliantCount / resolved.length) * 100)
    : 92;

  // Severity breakdown
  const severityCount = {
    P1: incidents.filter(i => i.severity === 'P1').length,
    P2: incidents.filter(i => i.severity === 'P2').length,
    P3: incidents.filter(i => i.severity === 'P3').length,
    P4: incidents.filter(i => i.severity === 'P4').length,
  };

  // Service breakdown
  const serviceDistribution = services.map(svc => ({
    serviceId: svc.id,
    serviceName: svc.name,
    incidentCount: incidents.filter(i => i.serviceId === svc.id).length,
    currentStatus: svc.status,
    uptime: svc.uptime
  }));

  // Overall platform availability
  const avgUptime = services.length > 0
    ? Number((services.reduce((acc, s) => acc + s.uptime, 0) / services.length).toFixed(2))
    : 99.94;

  res.json({
    metrics: {
      totalIncidents: incidents.length,
      activeIncidents: active.length,
      resolvedIncidents: resolved.length,
      mttrMinutes,
      mttdMinutes: 3.8, // automated alert latency
      slaComplianceRate,
      averageUptime: avgUptime
    },
    severityDistribution: severityCount,
    serviceDistribution
  });
});

// GET /api/analytics/post-mortems
router.get('/post-mortems', (req, res) => {
  const postMortems = db.get('postMortems') || [];
  res.json({ postMortems });
});

// POST /api/analytics/post-mortems/generate/:incidentId
router.post('/post-mortems/generate/:incidentId', authMiddleware, (req, res) => {
  const incident = db.findById('incidents', req.params.incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const events = db.find('warRoomEvents', e => e.incidentId === incident.id);
  const service = db.findById('services', incident.serviceId);

  // Compute duration
  const start = new Date(incident.startedAt);
  const end = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date();
  const durationMin = Math.round((end - start) / (1000 * 60));

  const newPostMortem = {
    id: `pm-${incident.id.replace('INC-', '')}`,
    incidentId: incident.id,
    title: `Post-Mortem: ${incident.title}`,
    author: req.user.name,
    publishedAt: new Date().toISOString(),
    executiveSummary: `On ${start.toLocaleDateString()}, ${service ? service.name : 'the service'} experienced a ${incident.severity} incident lasting ${durationMin} minutes. Impact radius included ${incident.impactRadius}. Estimated users impacted: ~${incident.affectedUsersEstimate.toLocaleString()}.`,
    impactSummary: `Duration: ${durationMin} minutes. Peak latency observed on ${incident.serviceName}. SLA Target: ${incident.slaTargetMinutes}m (Status: ${durationMin <= incident.slaTargetMinutes ? 'Complied' : 'Breached'}).`,
    detectionMethod: 'Automated synthetic probe and latency anomaly detection.',
    rootCauseAnalysis: incident.rootCause || 'Underlying resource saturation triggered upstream thread starvation across microservice ingress boundaries.',
    timeline: events.map(e => ({
      time: new Date(e.timestamp).toLocaleTimeString(),
      sender: e.senderName,
      content: e.content
    })),
    lessonsLearned: [
      `Enforce dynamic capacity threshold auto-scaling before connection saturation on ${incident.serviceName}.`,
      'Improve synthetic canary detection sensitivity to detect tail latency spikes sooner.',
      'Automate runbook trigger execution for verified P1 threshold alerts.'
    ],
    actionItems: [
      { task: `Automate capacity alert scaling on ${incident.serviceName}`, assignee: incident.assigneeName || 'Jordan Patel', done: false },
      { task: 'Refactor client connection timeout retry backoff', assignee: req.user.name, done: false },
      { task: 'Conduct chaos engineering drill for secondary failover', assignee: 'Alex Mercer', done: true }
    ]
  };

  const existingIndex = db.get('postMortems').findIndex(pm => pm.incidentId === incident.id);
  if (existingIndex >= 0) {
    db.get('postMortems')[existingIndex] = newPostMortem;
  } else {
    db.insert('postMortems', newPostMortem);
  }

  db.update('incidents', incident.id, { postMortemStatus: 'published' });

  res.status(201).json({
    message: 'Post-mortem report synthesized successfully',
    postMortem: newPostMortem
  });
});

// POST /api/analytics/reset-demo (Reset DB to original seed state)
router.post('/reset-demo', authMiddleware, requireRoles(['admin']), (req, res) => {
  const freshData = db.reset();
  res.json({
    message: 'Database reset to clean demo seed state successfully.',
    incidentsCount: freshData.incidents.length,
    servicesCount: freshData.services.length
  });
});

module.exports = router;
