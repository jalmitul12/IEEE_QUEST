const AEGIS = { sessionLocation:null, user:null, settings:null, notificationCount:null };

async function api(path, options={}){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  let externalAbort;
  if(options.signal){
    if(options.signal.aborted)controller.abort();
    else{externalAbort=()=>controller.abort();options.signal.addEventListener('abort',externalAbort,{once:true});}
  }
  try{
    const headers={...(options.headers||{})};
    if(options.body && !(options.body instanceof FormData) && !headers['Content-Type']) headers['Content-Type']='application/json';
    const res=await fetch(path,{credentials:'same-origin',...options,headers,signal:controller.signal});
    const type=res.headers.get('content-type')||'';
    const data=type.includes('application/json')?await res.json().catch(()=>({})):{};
    if(res.status===401 && location.pathname.startsWith('/app/')){location.href=`/login?next=${encodeURIComponent(location.pathname)}`;throw new Error('Session expired.');}
    if(!res.ok) throw new Error(data.error||`Request failed (${res.status}).`);
    return data;
  }catch(err){
    if(err.name==='AbortError')throw new Error('The request timed out. Please try again.');
    throw err;
  }finally{clearTimeout(timeout);if(externalAbort)options.signal?.removeEventListener('abort',externalAbort);}
}
function escapeHtml(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function statusClass(s=''){return `status status-${String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;}
function formatDate(value){try{return new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));}catch{return String(value||'');}}
function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
function haversine(a,b){const R=6371,r=d=>d*Math.PI/180;const dLat=r(b.latitude-a.latitude),dLon=r(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(r(a.latitude))*Math.cos(r(b.latitude))*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function create(tag,attrs={},children=[]){const node=document.createElement(tag);for(const[k,v]of Object.entries(attrs)){if(v===undefined||v===null)continue;if(k==='class')node.className=v;else if(k==='text')node.textContent=v;else if(k.startsWith('data-'))node.setAttribute(k,v);else if(k==='ariaLabel')node.setAttribute('aria-label',v);else if(k==='style'&&typeof v==='string')node.setAttribute('style',v);else if(k in node && !['role'].includes(k))node[k]=v;else node.setAttribute(k,v);}for(const child of(Array.isArray(children)?children:[children])){if(child===null||child===undefined)continue;node.append(child.nodeType?child:document.createTextNode(String(child)));}return node;}
function clear(node){while(node.firstChild)node.removeChild(node.firstChild);return node;}
function toast(message,type='info'){let region=document.getElementById('toast-region');if(!region){region=create('div',{id:'toast-region',class:'toast-region','aria-live':'polite','aria-atomic':'true'});document.body.append(region);}const item=create('div',{class:`toast toast-${type}`,role:'status'},message);region.append(item);setTimeout(()=>item.classList.add('show'),10);setTimeout(()=>{item.classList.remove('show');setTimeout(()=>item.remove(),220)},3600);}
function setBusy(button,busy,label='Working…'){if(!button)return;if(busy){button.dataset.original=button.textContent;button.disabled=true;button.textContent=label;}else{button.disabled=false;button.textContent=button.dataset.original||button.textContent;delete button.dataset.original;}}
async function logout(){try{await api('/api/auth/logout',{method:'POST'});}finally{localStorage.removeItem('aegisRememberEmail');sessionStorage.removeItem('aegisSessionLocation');location.href='/login';}}
async function loadUser(force=false){if(AEGIS.user&&!force)return AEGIS.user;const u=await api('/api/auth/me');AEGIS.user=u;document.querySelectorAll('[data-user]').forEach(e=>e.textContent=u.fullName);document.querySelectorAll('[data-role]').forEach(e=>e.textContent=u.role||'citizen');document.querySelectorAll('[data-avatar]').forEach(e=>e.textContent=(u.fullName||'A').trim().slice(0,1).toUpperCase());return u;}
function localSettings(){try{return JSON.parse(localStorage.getItem('aegisSettings')||'{}')}catch{return {}}}
function applyPreferences(settings=localSettings()){const root=document.documentElement;const prefersDark=matchMedia('(prefers-color-scheme: dark)').matches;const theme=settings.theme==='system'?(prefersDark?'dark':'light'):(settings.theme||'dark');root.dataset.theme=theme;root.classList.toggle('high-contrast',!!settings.highContrast);root.classList.toggle('reduced-motion',!!settings.reducedMotion);root.classList.toggle('compact-ui',!!settings.compactDashboard);}
async function loadSettings(force=false){if(AEGIS.settings&&!force)return AEGIS.settings;try{const settings=await api('/api/settings');AEGIS.settings=settings;localStorage.setItem('aegisSettings',JSON.stringify(settings));applyPreferences(settings);if(!settings.rememberLocation)localStorage.removeItem('aegisLastLocation');return settings;}catch{const settings=localSettings();AEGIS.settings=settings;applyPreferences(settings);return settings;}}
function locationError(err){if(!err)return 'Unable to retrieve location.';if(err.code===1)return 'Location permission was denied. Enter a manual location instead.';if(err.code===2)return 'Location is currently unavailable. Enter a manual location instead.';if(err.code===3)return 'Location request timed out. Try again or enter it manually.';return err.message||'Unable to retrieve location.';}
function getCurrentLocation(options={}){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error('Geolocation is not supported by this browser.'));navigator.geolocation.getCurrentPosition(pos=>resolve({latitude:Number(pos.coords.latitude.toFixed(6)),longitude:Number(pos.coords.longitude.toFixed(6)),accuracy:Math.round(pos.coords.accuracy||0),label:'Current device location'}),err=>reject(new Error(locationError(err))),{enableHighAccuracy:false,timeout:8000,maximumAge:60000,...options});});}
async function storeLocation(loc){AEGIS.sessionLocation=loc;sessionStorage.setItem('aegisSessionLocation',JSON.stringify(loc));const settings=AEGIS.settings||await loadSettings();if(settings.rememberLocation)localStorage.setItem('aegisLastLocation',JSON.stringify(loc));else localStorage.removeItem('aegisLastLocation');document.dispatchEvent(new CustomEvent('aegis:location',{detail:loc}));return loc;}
function getRememberedLocation(){for(const key of ['aegisSessionLocation','aegisLastLocation']){const storage=key.includes('Session')?sessionStorage:localStorage;try{const v=JSON.parse(storage.getItem(key)||'null');if(v&&Number.isFinite(v.latitude)&&Number.isFinite(v.longitude))return v;}catch{}}return AEGIS.sessionLocation;}
function qs(name){return new URLSearchParams(location.search).get(name);}
function playNotificationTone(){if(!AEGIS.settings?.sound)return;try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;const ctx=new Ctx(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=620;gain.gain.setValueAtTime(.035,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.17);osc.addEventListener('ended',()=>ctx.close());}catch{}}
document.addEventListener('DOMContentLoaded',()=>{applyPreferences();document.querySelectorAll('[data-logout]').forEach(b=>b.addEventListener('click',logout));if(location.pathname.startsWith('/app/')){loadSettings();loadUser().catch(()=>{});}});
