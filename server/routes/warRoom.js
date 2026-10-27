const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const { broadcast } = require('../websocket/wsHandler');

// GET /api/war-room/:incidentId/feed
router.get('/:incidentId/feed', (req, res) => {
  const events = db.find('warRoomEvents', e => e.incidentId === req.params.incidentId);
  events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const incident = db.findById('incidents', req.params.incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  // Active runbooks for this service
  const runbooks = db.find('runbooks', r => r.targetServiceId === incident.serviceId);

  res.json({
    incident,
    events,
    runbooks
  });
});

// POST /api/war-room/:incidentId/message
router.post('/:incidentId/message', authMiddleware, (req, res) => {
  const { content, type = 'message' } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be blank' });
  }

  const incident = db.findById('incidents', req.params.incidentId);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const newEvent = {
    id: `wre-${Date.now()}`,
    incidentId: incident.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    type, // 'message', 'action_item', 'alert'
    content: content.trim(),
    timestamp: new Date().toISOString()
  };

  db.insert('warRoomEvents', newEvent);

  broadcast('WAR_ROOM_EVENT', {
    incidentId: incident.id,
    event: newEvent
  });

  res.status(201).json({ event: newEvent });
});

module.exports = router;
