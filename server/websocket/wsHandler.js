const WebSocket = require('ws');

let wss = null;
const clients = new Set();

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    clients.add(ws);
    // Send immediate handshake confirmation
    ws.send(JSON.stringify({
      type: 'CONNECTED',
      data: {
        timestamp: new Date().toISOString(),
        clientCount: clients.size,
        message: 'PulseOps Live Telemetry & Incident Bus Connected'
      }
    }));

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        handleClientMessage(ws, parsed);
      } catch (err) {
        console.error('WebSocket incoming message parse error:', err);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
      clients.delete(ws);
    });
  });

  return wss;
}

function handleClientMessage(ws, message) {
  switch (message.type) {
    case 'PING':
      ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      break;
    default:
      break;
  }
}

function broadcast(eventType, payload) {
  if (!wss) return;
  const messageString = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  }
}

module.exports = {
  initWebSocket,
  broadcast
};
