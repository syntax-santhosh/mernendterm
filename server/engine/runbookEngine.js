const db = require('../db/database');
const { broadcast } = require('../websocket/wsHandler');

class RunbookEngine {
  constructor() {
    this.activeExecutions = new Map();
  }

  async executeRunbook({ runbookId, incidentId, initiatedBy, autoResolve = true }) {
    const runbook = db.findById('runbooks', runbookId);
    if (!runbook) throw new Error('Runbook not found');

    const executionId = `exec-${Date.now()}`;
    const executionRecord = {
      id: executionId,
      runbookId,
      runbookTitle: runbook.title,
      incidentId: incidentId || null,
      targetServiceId: runbook.targetServiceId,
      initiatedBy: initiatedBy || { id: 'usr-admin', name: 'Alex Mercer' },
      status: 'running', // running, completed, failed
      currentStepIndex: 0,
      totalSteps: runbook.steps.length,
      startedAt: new Date().toISOString(),
      completedAt: null,
      logs: []
    };

    db.insert('runbookExecutions', executionRecord);

    broadcast('RUNBOOK_EXECUTION_STARTED', {
      executionId,
      runbook,
      incidentId
    });

    // Run steps sequentially with realistic delays and streaming output
    this.runStepsAsync(executionId, runbook, incidentId, autoResolve);

    return executionRecord;
  }

  async runStepsAsync(executionId, runbook, incidentId, autoResolve) {
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < runbook.steps.length; i++) {
      const step = runbook.steps[i];
      const stepLog = {
        stepIndex: i,
        stepName: step.name,
        command: step.command,
        status: 'in_progress',
        output: '',
        startedAt: new Date().toISOString()
      };

      broadcast('RUNBOOK_STEP_UPDATE', {
        executionId,
        stepIndex: i,
        status: 'in_progress',
        log: `>>> Executing [${step.type.toUpperCase()}]: ${step.command}`
      });

      await delay(1200);

      const generatedOutput = this.generateStepOutput(step);
      stepLog.output = generatedOutput;
      stepLog.status = 'success';
      stepLog.completedAt = new Date().toISOString();

      broadcast('RUNBOOK_STEP_UPDATE', {
        executionId,
        stepIndex: i,
        status: 'success',
        log: generatedOutput
      });

      await delay(800);
    }

    // Mark execution complete
    const execution = db.findById('runbookExecutions', executionId);
    if (execution) {
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      db.save();
    }

    // If linked to an incident and autoResolve is requested
    if (incidentId && autoResolve) {
      const incident = db.findById('incidents', incidentId);
      if (incident) {
        incident.status = 'resolved';
        incident.resolvedAt = new Date().toISOString();
        incident.updatedAt = new Date().toISOString();

        // Restore target service
        const service = db.findById('services', runbook.targetServiceId);
        if (service) {
          service.status = 'healthy';
          service.latency = 12.4;
          service.cpuUsage = 28.5;
          service.memoryUsage = 44.0;
          service.errorRate = 0.02;
          service.lastUpdated = new Date().toISOString();
        }

        // Add resolution event in War Room
        const warRoomEvent = {
          id: `wre-${Date.now()}`,
          incidentId,
          senderId: 'system',
          senderName: 'Runbook Automation Bot',
          senderRole: 'system',
          type: 'status_change',
          content: `✅ Incident resolved automatically after successful execution of runbook "${runbook.title}". All verification probes passing.`,
          timestamp: new Date().toISOString()
        };
        db.insert('warRoomEvents', warRoomEvent);
        db.save();

        broadcast('INCIDENT_RESOLVED', {
          incident,
          resolvedByRunbook: runbook.title,
          warRoomEvent
        });
      }
    }

    broadcast('RUNBOOK_EXECUTION_COMPLETED', {
      executionId,
      status: 'completed'
    });
  }

  generateStepOutput(step) {
    switch (step.actionKey) {
      case 'probe_pool':
        return `PgBouncer pool status:
database: postgres_core | cl_active: 998 | cl_waiting: 184 | sv_active: 150 | sv_idle: 0
[ALERT] Client queue capacity reached. Active pool threshold exceeded by 99.8%.`;

      case 'terminate_zombies':
        return `Querying pg_stat_activity for stalled transactions...
Terminating PID 48291 (idle in transaction, duration: 4m 12s)
Terminating PID 48310 (idle in transaction, duration: 3m 48s)
Terminating PID 48355 (idle in transaction, duration: 2m 51s)
Terminated 42 hung backend connections. Database row lock contention cleared.`;

      case 'scale_pool':
        return `Reconfiguring PgBouncer dynamic pool parameters:
pgbouncer.default_pool_size -> 150 (was 100)
pgbouncer.reserve_pool -> 30 (was 5)
Configuration reloaded gracefully. Zero packet drops.`;

      case 'verify_health':
        return `Starting synthetic load canary against postgres-primary:
50/50 test queries completed successfully.
p50 latency: 4.2ms | p95 latency: 11.8ms | p99 latency: 19.4ms
Error rate: 0.00%. All health gates PASSED.`;

      case 'analyze_canary':
        return `Analyzed 12,400 ingress requests:
Canary v2.4.1 error rate: 12.8% (504 Gateway Timeout)
Baseline v2.4.0 error rate: 0.02%
Recommendation: Abort canary traffic immediately.`;

      case 'reroute_traffic':
        return `VirtualService/checkout-api updated:
spec.http[0].route[0].weight: 100 (v2.4.0 - stable)
spec.http[0].route[1].weight: 0 (v2.4.1 - canary)
Traffic shifted. Active canary connections draining.`;

      case 'rollout_undo':
        return `deployment.apps/checkout-api-canary rolled back
replicas: 4/4 ready
image: registry.pulseops.io/checkout:v2.4.0 (stable)`;

      case 'flush_pools':
        return `Flushed Envoy upstream connection pools. Stale TCP connections closed.`;

      default:
        return `Executed successfully: ${step.command}\nExit code: 0\nStandard output: OK`;
    }
  }
}

module.exports = new RunbookEngine();
