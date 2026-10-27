const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db/database');
const { initWebSocket } = require('./websocket/wsHandler');
const { startTelemetrySimulator } = require('./engine/telemetrySimulator');

const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const serviceRoutes = require('./routes/services');
const runbookRoutes = require('./routes/runbooks');
const warRoomRoutes = require('./routes/warRoom');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
initWebSocket(server);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/runbooks', runbookRoutes);
app.use('/api/war-room', warRoomRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'PulseOps Autonomous Incident Command & SRE Reliability Platform',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if available (production mode)
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// Fallback for client-side routing
app.use((req, res) => {
  const indexHtml = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head><title>PulseOps API</title><style>body{font-family:sans-serif;background:#0b0f19;color:#e2e8f0;padding:40px;}</style></head>
        <body>
          <h2>PulseOps SRE Platform API is Running on Port ${config.PORT}</h2>
          <p>Frontend dev server runs at <code>http://localhost:5173</code>.</p>
          <p>Run <code>npm run build</code> to serve production build directly here.</p>
        </body>
        </html>
      `);
    }
  });
});

// Start background telemetry simulation
startTelemetrySimulator();

// Start server
server.listen(config.PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 PulseOps SRE Incident Command Platform running`);
  console.log(`📡 HTTP Server & API: http://localhost:${config.PORT}`);
  console.log(`⚡ WebSocket Bus: ws://localhost:${config.PORT}/ws`);
  console.log(`====================================================`);
});
