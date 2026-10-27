const express = require('express');
const router = express.Router();
const db = require('../db/database');
const runbookEngine = require('../engine/runbookEngine');
const { authMiddleware, requireRoles } = require('../middleware/auth');

// GET /api/runbooks
router.get('/', (req, res) => {
  const runbooks = db.get('runbooks');
  res.json({ runbooks });
});

// GET /api/runbooks/executions/recent
router.get('/executions/recent', (req, res) => {
  const executions = db.get('runbookExecutions') || [];
  executions.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  res.json({ executions: executions.slice(0, 15) });
});

// GET /api/runbooks/:id
router.get('/:id', (req, res) => {
  const runbook = db.findById('runbooks', req.params.id);
  if (!runbook) {
    return res.status(404).json({ error: 'Runbook not found' });
  }

  const targetService = db.findById('services', runbook.targetServiceId);
  const pastExecutions = db.find('runbookExecutions', e => e.runbookId === runbook.id);

  res.json({
    runbook,
    targetService,
    pastExecutions
  });
});

// POST /api/runbooks
router.post('/', authMiddleware, requireRoles(['admin', 'commander']), (req, res) => {
  const { title, category = 'General', targetServiceId, estimatedDurationMinutes = 5, description, steps = [] } = req.body;

  if (!title || !targetServiceId || steps.length === 0) {
    return res.status(400).json({ error: 'Title, targetServiceId, and at least 1 step are required.' });
  }

  const newRunbook = {
    id: `rb-${Date.now()}`,
    title,
    category,
    targetServiceId,
    estimatedDurationMinutes: Number(estimatedDurationMinutes),
    author: req.user.name,
    description: description || '',
    steps: steps.map((s, index) => ({
      id: `step-${index + 1}`,
      name: s.name,
      command: s.command,
      type: s.type || 'remediation',
      actionKey: s.actionKey || 'custom_action',
      description: s.description || ''
    }))
  };

  db.insert('runbooks', newRunbook);
  res.status(201).json({
    message: 'Runbook created successfully',
    runbook: newRunbook
  });
});

// POST /api/runbooks/:id/execute (Trigger automated runbook execution)
router.post('/:id/execute', authMiddleware, requireRoles(['admin', 'commander', 'engineer']), async (req, res) => {
  const { incidentId, autoResolve = true } = req.body;

  try {
    const execution = await runbookEngine.executeRunbook({
      runbookId: req.params.id,
      incidentId,
      initiatedBy: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role
      },
      autoResolve: Boolean(autoResolve)
    });

    res.json({
      message: 'Runbook execution launched. Step telemetry streaming live on WebSocket.',
      execution
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
