import {ref,watch} from '/vendor/vue/vue.runtime.esm-browser.prod.js';

const $=id=>document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const nodes={wearable:{label:'Wearable',x:70,y:175,online:true},drone:{label:'Drone',x:200,y:65,online:true},relayA:{label:'Relay A',x:285,y:175,online:true},relayB:{label:'Relay B',x:205,y:290,online:true},laptop:{label:'Laptop',x:430,y:70,online:true},command:{label:'Command',x:545,y:175,online:true}};
const edges=[['wearable','drone',3],['wearable','relayA',2],['wearable','relayB',4],['drone','relayA',1],['drone','laptop',3],['relayA','laptop',2],['relayA','command',3],['relayA','relayB',1],['relayB','command',2],['laptop','command',1]];
let currentPath=[];
const highStress=ref(false),heartRate=ref(78),eda=ref(2.1);
let imageSamples={before:[],after:[]};

function seededNoise(x,y){const n=Math.sin(x*12.9898+y*78.233)*43758.5453;return n-Math.floor(n);}
function renderSatellite(){
  for(const [kind,id] of [['before','before-canvas'],['after','after-canvas']]){
    const canvas=$(id),ctx=canvas.getContext('2d'),img=ctx.createImageData(canvas.width,canvas.height),sample=[];
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
      const i=(y*canvas.width+x)*4,terrain=74+seededNoise(x>>2,y>>2)*72+Math.sin(x/19)*15;
      const impact=kind==='after'&&x>78&&x<210&&y>45&&y<145;
      const v=Math.max(0,Math.min(255,impact?terrain*.24+seededNoise(x,y)*28:terrain));
      img.data[i]=v*.62;img.data[i+1]=v*.86;img.data[i+2]=v*.68;img.data[i+3]=255;
      if(x%8===0&&y%8===0)sample.push(Math.round(v));
    }
    ctx.putImageData(img,0,0);imageSamples[kind]=sample;
  }
}

async function runVerification(){
  const button=$('run-verification');setBusy(button,true,'Scanning…');
  try{
    const result=await api('/api/neuro-sync/verify',{method:'POST',body:JSON.stringify({message:$('distress-message').value,before:imageSamples.before,after:imageSamples.after,threshold:.75})});
    $('ssim-value').textContent=result.ssim.toFixed(2);$('nlp-score').textContent=`${Math.round(result.nlp.score*100)}%`;
    $('keywords').textContent=result.nlp.matched.length?`Matched: ${result.nlp.matched.join(', ')}`:'No distress keywords';
    $('coordinates').textContent=result.nlp.coordinates?`${result.nlp.coordinates.latitude}, ${result.nlp.coordinates.longitude}`:'Not found';
    const badge=$('verify-badge');badge.textContent=result.verifiedCritical?'VERIFIED CRITICAL':result.anomaly?'ANOMALY DETECTED':'NOT VERIFIED';badge.className=`status ${result.verifiedCritical?'status-severe':result.anomaly?'status-high':'status-safe'}`;
    toast(result.verifiedCritical?'Critical incident verified by two signals.':'Verification completed.','success');
  }catch(error){toast(error.message,'error');}finally{setBusy(button,false);}
}

function shortestPath(start,end){
  const dist={},prev={},unvisited=new Set();Object.keys(nodes).forEach(n=>{if(nodes[n].online){dist[n]=Infinity;unvisited.add(n);}});if(!unvisited.has(start)||!unvisited.has(end))return {path:[],cost:Infinity};dist[start]=0;
  while(unvisited.size){let u=null;for(const n of unvisited)if(u===null||dist[n]<dist[u])u=n;if(u===null||dist[u]===Infinity)break;unvisited.delete(u);if(u===end)break;
    for(const [a,b,w] of edges){const v=a===u?b:b===u?a;if((a!==u&&b!==u)||!unvisited.has(v))continue;const alt=dist[u]+w;if(alt<dist[v]){dist[v]=alt;prev[v]=u;}}
  }
  const path=[];let u=end;if(dist[end]!==Infinity){while(u){path.unshift(u);if(u===start)break;u=prev[u];}}return {path,cost:dist[end]};
}
function edgeKey(a,b){return [a,b].sort().join('-');}
function drawMesh(){
  const svg=$('mesh-graph');svg.replaceChildren();const result=shortestPath('wearable','command');currentPath=result.path;
  const active=new Set(result.path.slice(1).map((n,i)=>edgeKey(result.path[i],n)));
  for(const [a,b] of edges){const line=document.createElementNS(NS,'line');line.setAttribute('x1',nodes[a].x);line.setAttribute('y1',nodes[a].y);line.setAttribute('x2',nodes[b].x);line.setAttribute('y2',nodes[b].y);line.setAttribute('class',`mesh-edge ${active.has(edgeKey(a,b))?'active':''}`);svg.append(line);}
  for(const [id,n] of Object.entries(nodes)){const g=document.createElementNS(NS,'g');g.setAttribute('class',`mesh-node ${n.online?'':'offline'} ${['wearable','command'].includes(id)?'endpoint':''}`);g.dataset.node=id;const c=document.createElementNS(NS,'circle');c.setAttribute('cx',n.x);c.setAttribute('cy',n.y);c.setAttribute('r',25);const t=document.createElementNS(NS,'text');t.setAttribute('x',n.x);t.setAttribute('y',n.y+42);t.textContent=n.label;g.append(c,t);g.addEventListener('click',()=>toggleNode(id));svg.append(g);}
  if(result.path.length){const packet=document.createElementNS(NS,'circle');packet.setAttribute('r',6);packet.setAttribute('class','packet');const anim=document.createElementNS(NS,'animateMotion');anim.setAttribute('dur','2s');anim.setAttribute('repeatCount','indefinite');anim.setAttribute('path',result.path.map((id,i)=>`${i?'L':'M'} ${nodes[id].x} ${nodes[id].y}`).join(' '));packet.append(anim);svg.append(packet);}
  $('route-label').textContent=result.path.length?result.path.map(id=>nodes[id].label).join(' → '):'NO SURVIVING ROUTE';$('route-cost').textContent=Number.isFinite(result.cost)?result.cost:'∞';
}
function toggleNode(id){if(['wearable','command'].includes(id))return toast('Endpoint nodes stay online for this demo.','info');const start=performance.now();nodes[id].online=!nodes[id].online;drawMesh();const elapsed=Math.max(1,Math.round(performance.now()-start));$('route-time').textContent=`Rerouted ${elapsed} ms`;$('route-time').className=`status ${currentPath.length?'status-safe':'status-severe'}`;toast(`${nodes[id].label} ${nodes[id].online?'restored':'offline'}; route recalculated.`,'success');}
function failRelay(){const target=nodes.relayA.online?'relayA':'drone';nodes[target].online=false;const start=performance.now();drawMesh();$('route-time').textContent=`Rerouted ${Math.max(1,Math.round(performance.now()-start))} ms`;toast(`${nodes[target].label} dropped. Packets moved to the surviving path.`,'success');}

const history={hr:Array(48).fill(78),eda:Array(48).fill(2.1)};
function drawSignal(id,values,color,min,max){const c=$(id),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.strokeStyle='#20384f';ctx.lineWidth=1;for(let y=20;y<c.height;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();}ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();values.forEach((v,i)=>{const x=i/(values.length-1)*c.width,y=c.height-(v-min)/(max-min)*c.height;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();}
function tickVitals(){
  const targetHr=highStress.value?136:78,targetEda=highStress.value?6.8:2.1;
  heartRate.value+=Math.sign(targetHr-heartRate.value)*Math.min(Math.abs(targetHr-heartRate.value),2)+((Math.random()-.5)*2);
  eda.value+=Math.sign(targetEda-eda.value)*Math.min(Math.abs(targetEda-eda.value),.16)+((Math.random()-.5)*.08);
  history.hr.push(heartRate.value);history.hr.shift();history.eda.push(eda.value);history.eda.shift();$('hr-value').textContent=Math.round(heartRate.value);$('eda-value').textContent=eda.value.toFixed(1);drawSignal('hr-chart',history.hr,'#fb7185',55,155);drawSignal('eda-chart',history.eda,'#67e8f9',0,8);
}
function setStress(value){highStress.value=value;}
watch(highStress,value=>{
  document.documentElement.classList.toggle('high-stress-hud',value);$('stress-hud').setAttribute('aria-hidden',String(!value));$('stress-badge').textContent=value?'HIGH STRESS':'CALM';$('stress-badge').className=`status ${value?'status-severe':'status-safe'}`;$('toggle-stress').textContent=value?'Return to calm':'3 · Simulate high stress';
});

function connectHealth(){
  const protocol=location.protocol==='https:'?'wss:':'ws:',socket=new WebSocket(`${protocol}//${location.host}/ws/neuro-sync`);
  socket.addEventListener('open',()=>{$('ws-state').textContent='Live';$('ws-dot').className='online';socket.send('ping');});
  socket.addEventListener('message',event=>{try{const d=JSON.parse(event.data);if(d.type!=='system-health')return;$('mqtt-state').textContent=d.mqtt.replace('SIMULATED_','');$('peer-count').textContent=d.peerCount;$('latency').textContent=`${d.latencyMs} ms`;}catch{}});
  socket.addEventListener('close',()=>{$('ws-state').textContent='Offline';$('ws-dot').className='offline';setTimeout(connectHealth,2500);});socket.addEventListener('error',()=>socket.close());
}
function resetDemo(){Object.values(nodes).forEach(n=>n.online=true);setStress(false);heartRate.value=78;eda.value=2.1;drawMesh();$('verify-badge').textContent='Awaiting scan';$('verify-badge').className='status status-moderate';for(const id of ['ssim-value','nlp-score','coordinates'])$(id).textContent='—';$('keywords').textContent='No keywords scanned';toast('Demo reset.','success');}

document.addEventListener('DOMContentLoaded',()=>{
  injectShell('Neuro-Sync Response™','Multimodal verification, self-healing mesh routing and cognitive-load adaptive display.');renderSatellite();drawMesh();tickVitals();connectHealth();setInterval(tickVitals,180);
  $('run-verification').addEventListener('click',runVerification);$('fail-node').addEventListener('click',failRelay);$('toggle-stress').addEventListener('click',()=>setStress(!highStress.value));$('return-calm').addEventListener('click',()=>setStress(false));$('reset-demo').addEventListener('click',resetDemo);
});
