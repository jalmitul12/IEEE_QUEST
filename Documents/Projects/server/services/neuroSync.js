const DISTRESS_TERMS={trapped:0.32,collapse:0.3,collapsed:0.3,flood:0.24,fire:0.24,injured:0.2,help:0.14,emergency:0.16,landslide:0.28,missing:0.16};

function analyseDistress(input=''){
  const text=String(input).toLowerCase().slice(0,2000);
  const matched=Object.keys(DISTRESS_TERMS).filter(term=>new RegExp(`\\b${term}\\b`,'i').test(text));
  const score=Math.min(0.99,Number(matched.reduce((sum,term)=>sum+DISTRESS_TERMS[term],0).toFixed(2)));
  const coordinateMatch=text.match(/(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  let coordinates=null;
  if(coordinateMatch){
    const latitude=Number(coordinateMatch[1]),longitude=Number(coordinateMatch[2]);
    if(latitude>=-90&&latitude<=90&&longitude>=-180&&longitude<=180)coordinates={latitude,longitude};
  }
  return {matched,score,distress:score>=0.3,coordinates};
}

function ssim(before,after){
  if(!Array.isArray(before)||!Array.isArray(after)||before.length!==after.length||before.length<4)throw new Error('Before and after image samples must be equal arrays with at least four pixels.');
  const a=before.map(Number),b=after.map(Number);
  if(a.some(x=>!Number.isFinite(x)||x<0||x>255)||b.some(x=>!Number.isFinite(x)||x<0||x>255))throw new Error('Image samples must contain numbers from 0 to 255.');
  const n=a.length,meanA=a.reduce((s,x)=>s+x,0)/n,meanB=b.reduce((s,x)=>s+x,0)/n;
  let varA=0,varB=0,cov=0;
  for(let i=0;i<n;i++){const da=a[i]-meanA,db=b[i]-meanB;varA+=da*da;varB+=db*db;cov+=da*db;}
  varA/=n-1;varB/=n-1;cov/=n-1;
  const c1=(0.01*255)**2,c2=(0.03*255)**2;
  return Math.max(-1,Math.min(1,((2*meanA*meanB+c1)*(2*cov+c2))/((meanA**2+meanB**2+c1)*(varA+varB+c2))));
}

function verifyIncident({message,before,after,threshold=0.75}){
  const nlp=analyseDistress(message);
  const similarity=ssim(before,after);
  const anomaly=similarity<Number(threshold);
  return {nlp,ssim:Number(similarity.toFixed(4)),threshold:Number(threshold),anomaly,verifiedCritical:Boolean(nlp.distress&&anomaly),processedAt:new Date().toISOString(),source:'prototype-simulation'};
}

module.exports={analyseDistress,ssim,verifyIncident};
