# PulseOps — Autonomous Incident Command & SRE Reliability Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61dafb.svg)](https://react.dev/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-orange.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Production--Ready-purple.svg)]()

> Mission-critical Site Reliability Engineering (SRE) and Incident Response orchestration engine featuring real-time telemetry streaming, automated incident triage scoring, collaborative incident war rooms, executable remediation runbooks, and automated root-cause post-mortem generation.

---

## 1. Problem Statement

Modern microservice architectures and distributed cloud infrastructure suffer from severe operational friction during outages:
- **Alert Fatigue & Delayed Triage:** Critical P1 outages get lost amidst thousands of noisy alerts, delaying initial response.
- **Fragmented Incident Communication:** Responders waste precious minutes coordinating across disconnected Slack channels, cloud consoles, and ticketing tools.
- **High Mean Time to Resolution (MTTR):** Lack of standardized, automated remediation runbooks forces engineers to perform manual, error-prone terminal troubleshooting under high-stress conditions.
- **Inadequate Post-Mortem Intelligence:** Post-mortems are frequently neglected, poorly documented, and fail to translate outage learnings into enforceable operational guardrails.

---

## 2. Target Users

- **Site Reliability Engineers (SREs) & DevOps Teams:** Require instant visibility into telemetry anomalies and automated runbook execution.
- **Incident Commanders:** Need a single pane of glass to coordinate on-call responders, manage blast radius cascades, and ensure SLA compliance.
- **Backend & Cloud Infrastructure Engineers:** Execute diagnostic probes, failovers, and canaries without manual SSH interventions.
- **Engineering Managers & Stakeholders:** Track quantitative reliability metrics (MTTR, MTTD, 99.9x uptime SLAs) and review executive post-mortem summaries.

---

## 3. The Solution

**PulseOps** solves these challenges by providing an integrated, end-to-end incident orchestration platform:
1. **Intelligent Auto-Triage Engine:** Automatically scores incident severity (P1-Critical to P4-Low) based on service tier, affected users, error rates, and blast radius.
2. **Real-Time War Room & Telemetry Bus:** Powered by WebSockets to synchronize live telemetry metrics (CPU, RAM, latency, error rate) and responder communication across all active engineers.
3. **Executable Remediation Runbooks:** Interactive step-by-step diagnostic and remediation engine streaming simulated CLI command outputs (PgBouncer pool scaling, Canary rollbacks, Redis Sentinel failovers) with automated verification probes.
4. **Interactive Service Mesh Topology:** Visualizes service dependencies and models downstream cascade failure risks.
5. **Post-Mortem Intelligence Engine:** Automatically synthesizes incident timelines, root causes, lessons learned, and action items with one-click Markdown and printable report exports.

---

## 4. Key Workflows & Features

```text
Synthetic Monitoring Probe / Chaos Drill
                 ↓
    Automated Triage Scoring (P1 - P4)
                 ↓
    War Room Dispatch & On-Call Routing
                 ↓
     Live Telemetry & Responder Chat (WebSocket)
                 ↓
   Runbook Execution & Terminal Streaming
                 ↓
Automated Verification Probe & SLA Recovery
                 ↓
   Synthesized Post-Mortem & Export
```

### 1. Incident Command Center
- Real-time KPI summary: Active Outages, P1 Critical count, Mean Time to Resolve (MTTR), and SLA Compliance %.
- Multi-dimensional filtering by lifecycle state (`investigating`, `identified`, `monitoring`, `resolved`) and severity tier.
- Full-text search across incident titles, identifiers, service names, and tags.

### 2. Tactical War Room
- Lifecycle state transitions (`Triggered` → `Investigating` → `Identified` → `Monitoring` → `Resolved`).
- Live countdown timer tracking SLA compliance window.
- Real-time collaborative responder chat with markdown support, sender roles, and timestamps.
- Live service telemetry dials: Latency (ms), CPU Load (%), Memory (%), and Error Rate (%).

### 3. Executable Remediation Runbooks
- Standardized SRE procedures including:
  - *PostgreSQL Connection Pool Flush & Dynamic Capacity Scaling*
  - *Checkout Service Canary Traffic Reroute & Rolling Rollback*
  - *Redis Distributed Node Sentinel Failover & Buffer Reset*
- In-browser streaming terminal console rendering live command execution logs and exit codes.
- Automatic verification probes that validate recovery and resolve incidents upon completion.

### 4. Service Mesh Topology & Cascade Analyzer
- Node mapping across microservices (Postgres Primary, Checkout API, Redis Cache, Auth Gateway, Billing Worker, CDN Edge).
- Downstream cascade risk inspector calculating upstream and dependent failure blast radius.
- Manual health state override controls for operational drills.

### 5. Chaos Engineering Injector
- Built-in failure injection harness to test system resilience:
  - High-frequency PostgreSQL lock contention & deadlock storm.
  - Cross-AZ network degradation & 504 Gateway timeout surge.
  - Redis memory exhaustion & unbounded cache key leak.

### 6. Reliability Intelligence & Post-Mortems
- MTTR and MTTD analytics tracking platform availability over time.
- Automated AI Post-Mortem generator that ingests war room event timelines and telemetry data to generate structured post-mortems with action items.
- One-click export to Markdown (`.md`) and formatted print report.

### 7. Multi-Persona Role-Based Access Control (RBAC)
- Built-in instant persona switcher to test different roles:
  - **Alex Mercer** (Principal SRE Architect - Admin)
  - **Sarah Chen** (Incident Commander / SRE Lead)
  - **Jordan Patel** (Cloud Infrastructure Engineer)
  - **Morgan Davis** (VP of Engineering - Stakeholder / Viewer)

---

## 5. Technology Stack & Architectural Decisions

| Layer | Technologies Used | Engineering Rationale |
|---|---|---|
| **Frontend Framework** | React 18, Vite | Lightning-fast HMR, component modularity, and optimized production bundle. |
| **Icons & Styling** | Lucide React, Custom Dark CSS System | Bespoke SRE console aesthetic with glassmorphism, glowing status rings, and zero external CSS bloat. |
| **Animation & UX** | Canvas Confetti, CSS Keyframes | Instant visual feedback upon incident mitigation and smooth telemetry transitions. |
| **Backend Runtime** | Node.js (v20+ / v24), Express 5 | High throughput, asynchronous non-blocking event loop, and modular REST routing. |
| **Real-Time Communication** | WebSocket (`ws` protocol) | Bidirectional pub-sub event bus broadcasting live telemetry and war room messages with zero polling. |
| **Authentication & Security** | JWT (JSON Web Tokens), bcryptjs | Stateless authorization, password hashing, and role-based route guard middleware. |
| **Persistence Engine** | Atomic File-Backed ACID JSON Store | Zero-configuration persistence engine with disk flush and auto-seeding. Zero external DB installation required! |

---

## 6. Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│               Client (React 18 + Vite)                │
│  - Incident Console   - Live War Room   - Topology Map │
│  - Runbook Terminal   - Post-Mortem View               │
└───────────────▲────────────────────────▲───────────────┘
                │ HTTP REST API          │ WebSocket Bus (/ws)
┌───────────────▼────────────────────────▼───────────────┐
│               Node.js Express 5 Server                 │
│  - Auth & RBAC Guard    - Triage Scoring Engine        │
│  - Telemetry Simulator  - Runbook Execution Runner     │
└───────────────┬────────────────────────────────────────┘
                │ Atomic Writes & Queries
┌───────────────▼────────────────────────────────────────┐
│           Persistent Database Engine (JSON)            │
│  - Users & Roles        - Incident Logs                │
│  - Service Topology     - Runbooks & Post-Mortems      │
└────────────────────────────────────────────────────────┘
```

---

## 7. Local Setup Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Git**

### Installation Steps

1. **Clone the Repository:**
   ```bash
   git clone <repository-url>
   cd endtermmern
   ```

2. **Install Root & Server Dependencies:**
   ```bash
   npm install
   ```

3. **Install Client Frontend Dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Run the Complete Application in Development Mode:**
   ```bash
   npm run dev
   ```
   This concurrently boots:
   - Backend API & WebSocket Server: `http://localhost:5000`
   - Frontend Vite Client: `http://localhost:5173`

5. **Run in Production Mode (Single Port):**
   ```bash
   npm run build
   npm start
   ```
   Open `http://localhost:5000` in any web browser.

---

## 8. Environment Variables

Create a `.env` file in the root directory (or use default built-in fallbacks):

```env
# Application Port
PORT=5000

# JSON Web Token Secret
JWT_SECRET=pulseops_super_secret_jwt_key_2026_production

# Live Telemetry Interval in Milliseconds
TELEMETRY_INTERVAL_MS=3000
```

---

## 9. Pre-Configured Demo Credentials

For quick evaluation, use the persona switcher dropdown in the top navigation bar, or log in with:

| Email | Password | Role | Description |
|---|---|---|---|
| `alex.mercer@pulseops.io` | `Password123!` | Admin | Principal Site Reliability Architect |
| `sarah.chen@pulseops.io` | `Password123!` | Commander | Incident Commander & SRE Lead |
| `jordan.patel@pulseops.io` | `Password123!` | Engineer | Cloud Infrastructure Engineer |
| `morgan.davis@pulseops.io` | `Password123!` | Viewer | VP of Engineering (Read-Only) |

---

## 10. Final Submission Details

- **Project Name:** PulseOps — Autonomous Incident Command & SRE Reliability Platform
- **Student Name:** Santhosh
- **Problem Statement:** Eliminating MTTR bottlenecks, alert fatigue, and fragmented incident collaboration in distributed microservices through real-time telemetry, automated triage, interactive war rooms, and executable remediation runbooks.
- **GitHub Repository:** `https://github.com/syntax-santhosh/mernendterm.git`
- **Deployed Application / Build:** Self-contained production build runnable via `npm start` or deployed to cloud platforms (Render, Railway, Heroku).
- **Tech Stack:** Node.js, Express 5, React 18, Vite, WebSocket (`ws`), JWT, bcryptjs, Lucide Icons, Canvas Confetti.
- **Major Features:** Automated Triage Severity Scoring, Real-time Collaborative War Room, Live Telemetry Streamer, Executable Runbook Runner with Terminal Log Streaming, Service Dependency Topology Cascade Analyzer, Chaos Engineering Drill Injector, and Automated Post-Mortem Synthesis with Markdown Export.
