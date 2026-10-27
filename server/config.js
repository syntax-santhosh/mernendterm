const path = require('path');

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'pulseops_super_secret_jwt_key_2026_production',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.join(__dirname, 'data', 'pulseops_db.json'),
  TELEMETRY_INTERVAL_MS: 3000, // broadcast telemetry every 3s
};
