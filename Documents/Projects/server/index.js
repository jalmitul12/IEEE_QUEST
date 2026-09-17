const path=require('path');
const fs=require('fs');
const express=require('express');
const cookieParser=require('cookie-parser');
const morgan=require('morgan');
const rateLimit=require('express-rate-limit');
const bcrypt=require('bcryptjs');
const {WebSocketServer}=require('ws');
const {readJson,writeJson,updateJson}=require('./utils/store');
const {requirePageAuth}=require('./middleware/auth');
const {securityHeaders,browserMutationGuard,tailwindDemoCsp,embeddedDiagnosticsCsp}=require('./middleware/security');
const {PORT,SEED_DEMO_USER,DEMO_PASSWORD,isProduction,TRUST_PROXY}=require('./config');
const authRoutes=require('./routes/auth');
const apiRoutes=require('./routes/api');
const neuroSyncRoutes=require('./routes/neuroSync');

const app=express();
app.disable('x-powered-by');
if(TRUST_PROXY) app.set('trust proxy',1);
app.use(securityHeaders);
app.use(morgan(isProduction?'combined':'dev'));
app.use(express.json({limit:'200kb',type:'application/json'}));
app.use(express.urlencoded({extended:false,limit:'100kb'}));
app.use(cookieParser());
app.use('/api',browserMutationGuard);
app.use('/api',(req,res,next)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');next();});

const authLimiter=rateLimit({windowMs:15*60*1000,max:20,standardHeaders:true,legacyHeaders:false,message:{error:'Too many authentication attempts. Please try again later.'}});
const apiLimiter=rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false,message:{error:'Too many API requests. Please try again later.'}});
const writeLimiter=rateLimit({windowMs:15*60*1000,max:100,standardHeaders:true,legacyHeaders:false,message:{error:'Too many update requests. Please try again later.'}});
app.use('/api/auth',authLimiter,authRoutes);
app.use('/api/neuro-sync',apiLimiter,writeLimiter,neuroSyncRoutes);
app.use('/api',apiLimiter,(req,res,next)=>['POST','PUT','PATCH','DELETE'].includes(req.method)?writeLimiter(req,res,next):next(),apiRoutes);

app.use('/vendor/bootstrap',express.static(path.join(__dirname,'..','node_modules','bootstrap','dist'),{immutable:true,maxAge:'1d'}));
app.use('/vendor/leaflet',express.static(path.join(__dirname,'..','node_modules','leaflet','dist'),{immutable:true,maxAge:'1d'}));
app.use('/vendor/chart.js',express.static(path.join(__dirname,'..','node_modules','chart.js','dist'),{immutable:true,maxAge:'1d'}));
app.use('/vendor/vue',express.static(path.join(__dirname,'..','node_modules','vue','dist'),{immutable:true,maxAge:'1d'}));
app.use('/css',express.static(path.join(__dirname,'..','public','css'),{maxAge:isProduction?'1h':0}));
app.use('/js',express.static(path.join(__dirname,'..','public','js'),{maxAge:isProduction?'1h':0}));
app.use('/assets',express.static(path.join(__dirname,'..','public','assets'),{maxAge:isProduction?'1d':0}));

const pub=path.join(__dirname,'..','public'),appDir=path.join(pub,'app');
const publicPages={'/':'index.html','/about':'about.html','/awareness':'awareness.html','/resources':'resources.html','/login':'login.html','/register':'register.html','/system-check':'system-check.html'};
Object.entries(publicPages).forEach(([route,file])=>app.get(route,(req,res)=>{
  if(route==='/awareness')res.setHeader('Content-Security-Policy',tailwindDemoCsp);
  if(route==='/system-check')res.setHeader('Content-Security-Policy',embeddedDiagnosticsCsp);
  if(route==='/login'||route==='/register'){res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');}
  res.sendFile(path.join(pub,file));
}));
const protectedPages=['dashboard','neuro-sync','map','risk','alerts','sos','shelters','evacuation','preparedness','incidents','teams','analytics','notifications','profile','settings'];
protectedPages.forEach(name=>app.get(`/app/${name}`,requirePageAuth,(req,res)=>{res.setHeader('Cache-Control','no-store');res.setHeader('Pragma','no-cache');res.sendFile(path.join(appDir,`${name}.html`));}));
app.get('/health',(req,res)=>res.json({ok:true,application:'Aegis',version:'1.4.0',frontend:'Vue 3 + Neuro-Sync Response prototype',time:new Date().toISOString()}));
app.use('/api',(req,res)=>res.status(404).json({error:'API endpoint not found.'}));
app.use((req,res)=>res.status(404).sendFile(path.join(pub,'404.html')));
app.use((err,req,res,next)=>{console.error(err);const status=Number.isInteger(err.status)?err.status:500;const message=status>=500?'A server error occurred. The operation was not completed.':err.message;if(req.originalUrl.startsWith('/api/'))return res.status(status).json({error:message});res.status(status).sendFile(path.join(pub,'500.html'));});

async function ensureRuntimeData(){
  const runtime=[['users.json',[]],['sos.json',[]],['tasks.json',{}],['user_state.json',{}]];
  for(const [name,fallback] of runtime){
    readJson(name,fallback);
    const p=path.join(__dirname,'..','data',name);
    if(!fs.existsSync(p))writeJson(name,fallback);
    try{fs.chmodSync(p,0o600);}catch{}
  }
  if(isProduction){
    const unsafeDemo=readJson('users.json',[]).some(u=>u.id==='USR-DEMO-OPERATOR'||String(u.email).toLowerCase()==='demo@aegis.local');
    if(unsafeDemo)throw new Error('Production startup blocked: remove the development demo account from data/users.json before deployment.');
  }
}
async function seedDemo(){if(!SEED_DEMO_USER)return;const users=readJson('users.json',[]);if(users.some(u=>u.email==='demo@aegis.local'))return;const hash=await bcrypt.hash(DEMO_PASSWORD,12);updateJson('users.json',[],items=>[...items,{id:'USR-DEMO-OPERATOR',fullName:'Aegis Demo Officer',rollNumber:'DEMO-001',mobile:'9999999999',email:'demo@aegis.local',address:'Emergency Operations Centre',city:'Ahmedabad',state:'Gujarat',emergencyContact:'',preferredCity:'Ahmedabad',role:'operator',passwordHash:hash,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}]);}
function attachNeuroSocket(server){
  const wss=new WebSocketServer({noServer:true});
  server.on('upgrade',(request,socket,head)=>{
    if(request.url!=='/ws/neuro-sync')return socket.destroy();
    const origin=request.headers.origin;
    if(origin){try{if(new URL(origin).host!==request.headers.host)return socket.destroy();}catch{return socket.destroy();}}
    wss.handleUpgrade(request,socket,head,ws=>wss.emit('connection',ws,request));
  });
  wss.on('connection',ws=>{
    let sequence=0;
    const send=()=>{if(ws.readyState===ws.OPEN)ws.send(JSON.stringify({type:'system-health',mqtt:'SIMULATED_ONLINE',peerCount:5,privacy:'LOCAL_ONLY',latencyMs:18+(sequence%7),sequence:sequence++,time:new Date().toISOString()}));};
    send();const timer=setInterval(send,1000);
    ws.on('message',raw=>{if(String(raw).slice(0,32)==='ping'&&ws.readyState===ws.OPEN)ws.send(JSON.stringify({type:'pong',time:new Date().toISOString()}));});
    ws.on('close',()=>clearInterval(timer));ws.on('error',()=>clearInterval(timer));
  });
}
async function startServer(port=PORT){await ensureRuntimeData();await seedDemo();return new Promise(resolve=>{const server=app.listen(port,()=>{attachNeuroSocket(server);console.log(`Aegis running at http://localhost:${port}`);resolve(server);});});}
if(require.main===module){startServer().catch(err=>{console.error(err);process.exit(1);});}
module.exports={app,startServer};
