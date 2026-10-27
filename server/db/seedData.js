const bcrypt = require('bcryptjs');

function getSeedData() {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('Password123!', salt);

  const users = [
    {
      id: 'usr-admin',
      name: 'Alex Mercer',
      email: 'alex.mercer@pulseops.io',
      password: passwordHash,
      role: 'admin',
      title: 'Principal Site Reliability Architect',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-01-10T08:00:00.000Z'
    },
    {
      id: 'usr-commander',
      name: 'Sarah Chen',
      email: 'sarah.chen@pulseops.io',
      password: passwordHash,
      role: 'commander',
      title: 'Incident Commander / SRE Lead',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-02-15T09:30:00.000Z'
    },
    {
      id: 'usr-engineer',
      name: 'Jordan Patel',
      email: 'jordan.patel@pulseops.io',
      password: passwordHash,
      role: 'engineer',
      title: 'Cloud Infrastructure Engineer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-03-01T11:15:00.000Z'
    },
    {
      id: 'usr-viewer',
      name: 'Morgan Davis',
      email: 'morgan.davis@pulseops.io',
      password: passwordHash,
      role: 'viewer',
      title: 'VP of Engineering / Stakeholder',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      status: 'active',
      createdAt: '2026-04-12T14:20:00.000Z'
    }
  ];

  const services = [
    {
      id: 'srv-postgres',
      name: 'PostgreSQL Primary Cluster',
      code: 'postgres-primary',
      tier: 'Tier 0',
      status: 'critical', // healthy, degraded, critical, maintenance
      uptime: 99.82,
      latency: 482, // ms
      errorRate: 14.8, // %
      cpuUsage: 94.2, // %
      memoryUsage: 89.5, // %
      dependencies: [],
      owner: 'Database Reliability Team',
      region: 'us-east-1 (N. Virginia)',
      description: 'Primary transactional cluster holding orders, accounts, and ledger state.',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'srv-checkout',
      name: 'Checkout & Payment Engine',
      code: 'checkout-api',
      tier: 'Tier 0',
      status: 'degraded',
      uptime: 99.45,
      latency: 310,
      errorRate: 6.2,
      cpuUsage: 78.4,
      memoryUsage: 71.0,
      dependencies: ['srv-postgres', 'srv-redis'],
      owner: 'Fintech Core Team',
      region: 'us-east-1 (N. Virginia)',
      description: 'Handles cart finalization, payment gateway dispatch, and receipts.',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'srv-redis',
      name: 'Redis Distributed Cache',
      code: 'redis-cache',
      tier: 'Tier 1',
      status: 'healthy',
      uptime: 99.98,
      latency: 4,
      errorRate: 0.05,
      cpuUsage: 34.1,
      memoryUsage: 62.3,
      dependencies: [],
      owner: 'Platform Infra',
      region: 'us-east-1 (Cluster A/B)',
      description: 'Session state, rate limiting keys, and inventory cache layer.',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'srv-auth',
      name: 'Identity & JWT Gateway',
      code: 'auth-service',
      tier: 'Tier 0',
      status: 'healthy',
      uptime: 99.99,
      latency: 18,
      errorRate: 0.12,
      cpuUsage: 41.5,
      memoryUsage: 48.0,
      dependencies: ['srv-redis', 'srv-postgres'],
      owner: 'Security Engineering',
      region: 'global-anycast',
      description: 'OAuth2/OIDC provider, token issuer, and session validator.',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'srv-billing',
      name: 'Async Billing Webhook Worker',
      code: 'billing-webhook',
      tier: 'Tier 2',
      status: 'healthy',
      uptime: 99.91,
      latency: 85,
      errorRate: 0.4,
      cpuUsage: 28.0,
      memoryUsage: 38.5,
      dependencies: ['srv-postgres'],
      owner: 'Fintech Core Team',
      region: 'us-east-2 (Ohio)',
      description: 'Consumes Stripe/Adyen webhooks and reconciliation events.',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'srv-cdn',
      name: 'Global CDN & Edge Shield',
      code: 'cdn-edge',
      tier: 'Tier 0',
      status: 'healthy',
      uptime: 100.0,
      latency: 8,
      errorRate: 0.01,
      cpuUsage: 19.3,
      memoryUsage: 24.2,
      dependencies: [],
      owner: 'Edge & Network Infra',
      region: 'multi-region-edge',
      description: 'DDoS mitigation, static asset delivery, and SSL termination.',
      lastUpdated: new Date().toISOString()
    }
  ];

  const incidents = [
    {
      id: 'INC-1042',
      title: 'Database Connection Pool Saturation on postgres-primary',
      description: 'Client connection exhaustion resulting in queued queries and 503 Service Unavailable cascades on checkout services.',
      severity: 'P1', // P1, P2, P3, P4
      status: 'investigating', // triggered, investigating, identified, monitoring, resolved
      serviceId: 'srv-postgres',
      serviceName: 'PostgreSQL Primary Cluster',
      commanderId: 'usr-commander',
      commanderName: 'Sarah Chen',
      assignedTo: 'usr-engineer',
      assigneeName: 'Jordan Patel',
      impactRadius: 'All checkout, customer accounts, and order fulfillment APIs',
      affectedUsersEstimate: 14200,
      slaTargetMinutes: 30,
      startedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      tags: ['database', 'connection-pool', 'checkout-critical', 'sla-breach-risk'],
      rootCause: null,
      postMortemStatus: 'pending' // pending, drafted, published
    },
    {
      id: 'INC-1041',
      title: 'Elevated 504 Gateway Timeouts in Payment Dispatch',
      description: 'Checkout API upstream latency spiked past 3000ms threshold causing client retries storm.',
      severity: 'P2',
      status: 'identified',
      serviceId: 'srv-checkout',
      serviceName: 'Checkout & Payment Engine',
      commanderId: 'usr-commander',
      commanderName: 'Sarah Chen',
      assignedTo: 'usr-commander',
      assigneeName: 'Sarah Chen',
      impactRadius: 'US-East checkout transactions with card processing',
      affectedUsersEstimate: 3800,
      slaTargetMinutes: 60,
      startedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      resolvedAt: null,
      tags: ['latency', 'checkout-api', 'upstream-timeout'],
      rootCause: 'Connection starvation due to postgres-primary connection pool saturation.',
      postMortemStatus: 'pending'
    },
    {
      id: 'INC-1039',
      title: 'Redis Node Memory Pressure & Sudden Cache Eviction Spike',
      description: 'Uncapped key TTL on recommendation session tokens triggered aggressive LRU evictions.',
      severity: 'P3',
      status: 'resolved',
      serviceId: 'srv-redis',
      serviceName: 'Redis Distributed Cache',
      commanderId: 'usr-commander',
      commanderName: 'Sarah Chen',
      assignedTo: 'usr-engineer',
      assigneeName: 'Jordan Patel',
      impactRadius: 'Cache miss rate increased from 2% to 34% for 18 minutes',
      affectedUsersEstimate: 850,
      slaTargetMinutes: 120,
      startedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      tags: ['redis', 'memory', 'cache-eviction'],
      rootCause: 'New recommendation service deployed without default TTL on ephemeral cache payloads.',
      postMortemStatus: 'published'
    },
    {
      id: 'INC-1035',
      title: 'Transient Webhook Retries Accumulation on Third-Party Gateway',
      description: 'Webhook delivery backoff queue grew by 400% following downstream endpoint maintenance.',
      severity: 'P4',
      status: 'resolved',
      serviceId: 'srv-billing',
      serviceName: 'Async Billing Webhook Worker',
      commanderId: 'usr-admin',
      commanderName: 'Alex Mercer',
      assignedTo: 'usr-engineer',
      assigneeName: 'Jordan Patel',
      impactRadius: 'Async invoice generation delayed by average 4 minutes',
      affectedUsersEstimate: 120,
      slaTargetMinutes: 240,
      startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString(),
      tags: ['webhooks', 'billing', 'queue-depth'],
      rootCause: 'Downstream merchant endpoint rate-limit bucket misconfiguration.',
      postMortemStatus: 'published'
    }
  ];

  const runbooks = [
    {
      id: 'rb-pg-pool-remediation',
      title: 'PostgreSQL Connection Pool Flush & Dynamic Capacity Scaling',
      category: 'Database & Storage',
      targetServiceId: 'srv-postgres',
      estimatedDurationMinutes: 4,
      author: 'Jordan Patel',
      description: 'Diagnostic probes connection pool exhaustion, kills zombie client connections, reconfigures PgBouncer pool ceiling, and validates response latency.',
      steps: [
        {
          id: 'step-1',
          name: 'Inspect PgBouncer Pool Saturation & Client Wait Queues',
          command: 'pgbouncer-cli --cmd "SHOW POOLS; SHOW CLIENTS WHERE state=\'waiting\'"',
          type: 'diagnostic',
          actionKey: 'probe_pool',
          description: 'Checks current active, waiting, and idle connections against max limits.'
        },
        {
          id: 'step-2',
          name: 'Terminate Idle-in-Transaction Zombie Sessions',
          command: 'psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = \'idle in transaction\' AND state_change < NOW() - INTERVAL \'2 minutes\';"',
          type: 'remediation',
          actionKey: 'terminate_zombies',
          description: 'Safely purges hung connections holding table row locks.'
        },
        {
          id: 'step-3',
          name: 'Dynamically Scale PgBouncer Pool Reserve & Worker Limit',
          command: 'sysctl-infra set pgbouncer.default_pool_size=150 pgbouncer.reserve_pool=30 --reload',
          type: 'remediation',
          actionKey: 'scale_pool',
          description: 'Expands database proxy concurrency ceiling without restarting primary postgres daemon.'
        },
        {
          id: 'step-4',
          name: 'Execute Synthetic Canary Health Check & Latency Probe',
          command: 'synthetic-probe run --target postgres-primary --concurrency 50 --timeout 500ms',
          type: 'verification',
          actionKey: 'verify_health',
          description: 'Runs 50 concurrent test transactions to verify healthy latency < 25ms.'
        }
      ]
    },
    {
      id: 'rb-checkout-canary-rollback',
      title: 'Checkout Service Canary Traffic Reroute & Rolling Rollback',
      category: 'Deployment & Traffic',
      targetServiceId: 'srv-checkout',
      estimatedDurationMinutes: 3,
      author: 'Sarah Chen',
      description: 'Isolates degraded canary pod replicas, reroutes upstream traffic to stable blue deployment, and purges stale response buffers.',
      steps: [
        {
          id: 'step-1',
          name: 'Assess Canary Error Distribution vs Baseline',
          command: 'istioctl analyze -n production --filter svc=checkout-api',
          type: 'diagnostic',
          actionKey: 'analyze_canary',
          description: 'Confirms error rate disparity between v2.4.1 (canary) and v2.4.0 (stable).'
        },
        {
          id: 'step-2',
          name: 'Shift 100% Ingress Traffic to Stable Blue Cluster',
          command: 'kubectl apply -f /k8s/checkout/virtualservice-stable-100.yaml',
          type: 'remediation',
          actionKey: 'reroute_traffic',
          description: 'Immediately removes bleeding edge pods from user-facing traffic routing.'
        },
        {
          id: 'step-3',
          name: 'Perform Graceful Rolling Rollback of Canary Replicas',
          command: 'kubectl rollout undo deployment/checkout-api-canary -n production',
          type: 'remediation',
          actionKey: 'rollout_undo',
          description: 'Restores previous known good container image and state.'
        },
        {
          id: 'step-4',
          name: 'Flush Gateway Connection Keep-Alive Pools',
          command: 'envoy-admin -X POST /reset_stream_pools?upstream=checkout-service',
          type: 'verification',
          actionKey: 'flush_pools',
          description: 'Ensures zero hung TCP streams remain attached to terminated pods.'
        }
      ]
    },
    {
      id: 'rb-redis-sentinel-failover',
      title: 'Redis Distributed Node Sentinel Failover & Buffer Reset',
      category: 'Cache & Memory',
      targetServiceId: 'srv-redis',
      estimatedDurationMinutes: 2,
      author: 'Alex Mercer',
      description: 'Orchestrates zero-downtime leader election across Redis Sentinel quorum and clears dirty eviction locks.',
      steps: [
        {
          id: 'step-1',
          name: 'Check Replication Lag & Quorum Health',
          command: 'redis-cli -p 26379 SENTINEL ckquorum mymaster',
          type: 'diagnostic',
          actionKey: 'check_quorum',
          description: 'Ensures minimum 2 of 3 Sentinel monitors agree on node status.'
        },
        {
          id: 'step-2',
          name: 'Trigger Graceful Failover to Hot Standby Replica',
          command: 'redis-cli -p 26379 SENTINEL FAILOVER mymaster',
          type: 'remediation',
          actionKey: 'trigger_failover',
          description: 'Promotes replica-02 to master and updates client DNS pointer.'
        },
        {
          id: 'step-3',
          name: 'Verify Client Read/Write Consistency',
          command: 'redis-cli -h redis-master.internal PING && redis-benchmark -t set,get -q -n 5000',
          type: 'verification',
          actionKey: 'verify_redis',
          description: 'Validates sub-millisecond response on new master node.'
        }
      ]
    }
  ];

  const warRoomEvents = [
    {
      id: 'wre-1',
      incidentId: 'INC-1042',
      senderId: 'usr-admin',
      senderName: 'Alex Mercer',
      senderRole: 'admin',
      type: 'message', // message, status_change, runbook_step, alert
      content: 'I have declared INC-1042 as a P1 Critical incident. Database connection limits have been hit and checkout services are throwing 503 cascades.',
      timestamp: new Date(Date.now() - 24 * 60 * 1000).toISOString()
    },
    {
      id: 'wre-2',
      incidentId: 'INC-1042',
      senderId: 'usr-commander',
      senderName: 'Sarah Chen',
      senderRole: 'commander',
      type: 'status_change',
      content: 'Assigned as Incident Commander. Initiating emergency response protocol. @Jordan Patel please check PgBouncer telemetry.',
      timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString()
    },
    {
      id: 'wre-3',
      incidentId: 'INC-1042',
      senderId: 'usr-engineer',
      senderName: 'Jordan Patel',
      senderRole: 'engineer',
      type: 'message',
      content: 'Investigating PgBouncer now. Active client count is pinned at 1000/1000 with 184 requests queued in buffer. We have 40+ idle-in-transaction queries blocking connections.',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'wre-4',
      incidentId: 'INC-1042',
      senderId: 'usr-commander',
      senderName: 'Sarah Chen',
      senderRole: 'commander',
      type: 'action_item',
      content: 'Action Item: Execute PostgreSQL Connection Pool Flush & Dynamic Capacity Scaling runbook.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
  ];

  const runbookExecutions = [];

  const postMortems = [
    {
      id: 'pm-1039',
      incidentId: 'INC-1039',
      title: 'Post-Mortem: Redis Node Memory Pressure & Sudden Cache Eviction Spike',
      author: 'Jordan Patel',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      executiveSummary: 'On Oct 27, 2026, the Redis Distributed Cache node experienced memory saturation due to an unexpiring payload key deployed in the recommendation microservice. LRU eviction dropped active user sessions for 18 minutes before a hot-patch and key TTL ceiling was established.',
      impactSummary: '850 user sessions degraded; checkout cache miss rate peaked at 34%. No permanent data loss.',
      detectionMethod: 'PagerDuty alert triggered by redis_evicted_keys_rate > 500/sec.',
      rootCauseAnalysis: 'Recommendation microservice update omitted default Redis TTL configuration, defaulting keys to persistent storage.',
      lessonsLearned: [
        'Mandatory linter rule in CI to enforce TTL parameters on all Redis SET commands.',
        'Implement automated maxmemory-policy guardrails in Redis cluster staging.',
        'Add alert threshold at 80% memory saturation before LRU eviction begins.'
      ],
      actionItems: [
        { task: 'Add PR linter for Redis cache TTL parameters', assignee: 'Jordan Patel', done: true },
        { task: 'Set maxmemory soft alert threshold to 75%', assignee: 'Alex Mercer', done: true },
        { task: 'Audit all microservices for persistent Redis key usage', assignee: 'Sarah Chen', done: false }
      ]
    }
  ];

  return {
    users,
    services,
    incidents,
    runbooks,
    warRoomEvents,
    runbookExecutions,
    postMortems
  };
}

module.exports = { getSeedData };
