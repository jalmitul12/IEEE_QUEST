const crypto = require('crypto');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = Number(process.env.PORT || 3000);
const CLIENT_URL = process.env.CLIENT_URL || `http://localhost:${PORT}`;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

let JWT_SECRET = process.env.JWT_SECRET;
if (isProduction) {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
  }
} else if (!JWT_SECRET || JWT_SECRET.length < 32) {
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('[Aegis] JWT_SECRET was not supplied; using an ephemeral development secret for this process.');
}

const SEED_DEMO_USER = !isProduction && process.env.SEED_DEMO_USER !== 'false';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Demo@123';

module.exports = { NODE_ENV, isProduction, PORT, CLIENT_URL, TRUST_PROXY, JWT_SECRET, SEED_DEMO_USER, DEMO_PASSWORD };
