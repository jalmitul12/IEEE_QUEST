const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function tokenFrom(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.aegis_token || null;
}
function verify(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms:['HS256'], issuer:'aegis.local', audience:'aegis-web' });
}
function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try { req.user = verify(token); next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired session.' }); }
}
function requirePageAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  try { req.user = verify(token); next(); }
  catch { return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`); }
}
function requireRole(...roles) {
  return (req,res,next) => roles.includes(req.user?.role) ? next() : res.status(403).json({error:'You do not have permission to perform this action.'});
}
module.exports = { requireAuth, requirePageAuth, requireRole, tokenFrom };
