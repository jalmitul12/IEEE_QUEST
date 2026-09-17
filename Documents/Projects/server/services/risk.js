const { number, ValidationError } = require('../utils/validation');
function clamp(n,min=0,max=100){ return Math.max(min,Math.min(max,n)); }
function calculateRisk(input={}) {
  const rainfall=number(input.rainfall,{min:0,max:500,field:'Rainfall'});
  const wind=number(input.windSpeed,{min:0,max:350,field:'Wind speed'});
  const humidity=number(input.humidity,{min:0,max:100,field:'Humidity'});
  const seismic=number(input.seismicActivity,{min:0,max:10,field:'Seismic activity'});
  const water=number(input.waterLevel,{min:0,max:20,field:'Water level'});
  const temperature=number(input.temperature,{min:-20,max:70,field:'Temperature'});
  const terrain=number(input.terrainRisk,{min:0,max:10,field:'Terrain risk'});
  const history=number(input.historicalFrequency ?? 0,{min:0,max:10,field:'Historical incident frequency'});

  const flood=clamp(rainfall*.17+water*7+humidity*.11+terrain*3+history*2);
  const cyclone=clamp(wind*.34+humidity*.15+rainfall*.07+history*2);
  const earthquake=clamp(seismic*10+terrain*1.8+history*1.5);
  const heatwave=clamp(Math.max(0,temperature-30)*7+Math.max(0,55-humidity)*.22+history*1.6);
  const landslide=clamp(rainfall*.13+terrain*6+water*2.4+history*2);
  const scores={Flood:flood,Cyclone:cyclone,Earthquake:earthquake,Heatwave:heatwave,Landslide:landslide};
  const [primary,score]=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0];
  if(!Number.isFinite(score)) throw new ValidationError('Risk inputs could not be evaluated.');
  let severity='Safe';
  if(score>=85)severity='Critical'; else if(score>=70)severity='Severe'; else if(score>=55)severity='High'; else if(score>=35)severity='Moderate'; else if(score>=15)severity='Low';
  const rankedFactors=[
    ['Rainfall',rainfall/500],['Wind speed',wind/350],['Humidity',humidity/100],['Seismic activity',seismic/10],['Water level',water/20],['Temperature',Math.max(0,temperature-30)/40],['Terrain risk',terrain/10],['Historical frequency',history/10]
  ].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name])=>name);
  const confidence=Math.round(clamp(64 + Math.min(20, history*2) + (Object.values(scores).some(v=>v>70)?8:0),55,94));
  const advice=severity==='Critical'||severity==='Severe'?'Prepare for immediate protective action and monitor verified official alerts.':severity==='High'?'Review evacuation routes, charge devices and keep emergency supplies ready.':severity==='Moderate'?'Increase monitoring and review household preparedness.':'Continue routine monitoring and maintain basic preparedness.';
  return {score:Math.round(score),severity,primaryHazard:primary,breakdown:Object.fromEntries(Object.entries(scores).map(([k,v])=>[k,Math.round(v)])),factors:rankedFactors,confidence,advice,simulated:true,disclaimer:'Educational/simulated risk estimate. Not an official warning.'};
}
module.exports={calculateRisk};
