const DISASTER_TYPES = ['Flood','Cyclone','Earthquake','Tsunami','Landslide','Wildfire','Heatwave','Thunderstorm','Heavy Rainfall','Industrial Disaster','Storm','Fire','Other'];
const SEVERITIES = ['Safe','Low','Moderate','High','Severe','Critical'];
const INCIDENT_STATUSES = ['Reported','Verified','Team Assigned','Responding','Resolved'];
const TEAM_STATUSES = ['Available','Assigned','Responding','Offline'];
const SOS_STATUSES = ['Sent','Received','Team Assigned','Responding','Resolved'];

function text(value, {min=1,max=160,field='Field',required=true}={}) {
  if (value === undefined || value === null || value === '') {
    if (!required) return '';
    throw new ValidationError(`${field} is required.`);
  }
  const out = String(value).trim().replace(/[\u0000-\u001F\u007F]/g, ' ');
  if (out.length < min || out.length > max) throw new ValidationError(`${field} must be ${min}-${max} characters.`);
  return out;
}
function email(value) {
  const v = text(value,{min:5,max:254,field:'Email'}).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) throw new ValidationError('Enter a valid email address.');
  return v;
}
function mobile(value, field='Mobile number') {
  const v = text(value,{min:7,max:20,field}).replace(/[\s()-]/g,'');
  if (!/^\+?[0-9]{7,15}$/.test(v)) throw new ValidationError(`${field} must contain 7-15 digits.`);
  return v;
}
function password(value) {
  const v = String(value || '');
  if (v.length < 8 || v.length > 128 || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/\d/.test(v)) {
    throw new ValidationError('Password must be 8-128 characters and include upper/lowercase letters and a number.');
  }
  return v;
}
function oneOf(value, allowed, field='Value') {
  if (!allowed.includes(value)) throw new ValidationError(`${field} must be one of: ${allowed.join(', ')}.`);
  return value;
}
function number(value, {min=-Infinity,max=Infinity,field='Value',required=true}={}) {
  if ((value === '' || value === undefined || value === null) && !required) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new ValidationError(`${field} must be a valid number.`);
  if (n < min || n > max) throw new ValidationError(`${field} must be between ${min} and ${max}.`);
  return n;
}
function bool(value, field='Value') {
  if (typeof value !== 'boolean') throw new ValidationError(`${field} must be true or false.`);
  return value;
}
function coordinates(value, {required=false}={}) {
  if (!value && !required) return null;
  if (!value || typeof value !== 'object') throw new ValidationError('Location coordinates are invalid.');
  const latitude = number(value.latitude,{min:-90,max:90,field:'Latitude'});
  const longitude = number(value.longitude,{min:-180,max:180,field:'Longitude'});
  return { latitude, longitude };
}
class ValidationError extends Error { constructor(message){ super(message); this.name='ValidationError'; this.status=400; } }
module.exports = { text,email,mobile,password,oneOf,number,bool,coordinates,ValidationError,DISASTER_TYPES,SEVERITIES,INCIDENT_STATUSES,TEAM_STATUSES,SOS_STATUSES };
