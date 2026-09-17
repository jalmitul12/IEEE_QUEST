const { CLIENT_URL, isProduction } = require('../config');

const defaultCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org",
  "font-src 'self' data:",
  "connect-src 'self'",
].join('; ');

const tailwindDemoCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-eval' https://cdn.tailwindcss.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
].join('; ');

const embeddedDiagnosticsCsp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
].join('; ');

function securityHeaders(req,res,next){
  res.setHeader('Content-Security-Policy', defaultCsp);
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('X-Permitted-Cross-Domain-Policies','none');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','geolocation=(self), camera=(), microphone=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Cross-Origin-Resource-Policy','same-origin');
  res.setHeader('Origin-Agent-Cluster','?1');
  if(isProduction) res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  next();
}

function browserMutationGuard(req,res,next){
  if (!['POST','PUT','PATCH','DELETE'].includes(req.method)) return next();
  const origin = req.get('origin');
  const secFetchSite = req.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') return res.status(403).json({error:'Cross-site request blocked.'});
  if (origin) {
    try {
      const requestOrigin = new URL(origin).origin;
      const hostOrigin = `${req.protocol}://${req.get('host')}`;
      const allowed = new Set([new URL(CLIENT_URL).origin]);
      if (!isProduction) allowed.add(hostOrigin);
      if (!allowed.has(requestOrigin)) return res.status(403).json({error:'Request origin not allowed.'});
    } catch { return res.status(403).json({error:'Invalid request origin.'}); }
  }
  const hasBody = Number(req.get('content-length') || 0) > 0 || req.get('transfer-encoding');
  if (hasBody && !req.is('application/json')) return res.status(415).json({error:'API mutations with a body must use application/json.'});
  next();
}

module.exports = { securityHeaders, browserMutationGuard, defaultCsp, tailwindDemoCsp, embeddedDiagnosticsCsp };
