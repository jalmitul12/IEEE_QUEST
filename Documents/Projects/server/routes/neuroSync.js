const express=require('express');
const {requireAuth}=require('../middleware/auth');
const {verifyIncident}=require('../services/neuroSync');
const router=express.Router();
router.use(requireAuth);

router.post('/verify',(req,res,next)=>{
  try{
    const message=String(req.body?.message||'').trim();
    if(message.length<3)return res.status(400).json({error:'Provide a distress message of at least three characters.'});
    const before=req.body?.before,after=req.body?.after;
    if(before?.length>65536||after?.length>65536)return res.status(413).json({error:'Image sample is too large for the prototype endpoint.'});
    res.json(verifyIncident({message,before,after,threshold:req.body?.threshold??0.75}));
  }catch(error){error.status=400;next(error);}
});

router.get('/capabilities',(req,res)=>res.json({
  tier1:{nlp:'keyword-weighted distress classifier',vision:'SSIM numeric image-patch comparison'},
  tier2:{routing:'Dijkstra shortest path',transport:'IEEE 802.11s hardware adapter simulated'},
  tier3:{classifier:'local stress threshold demo',privacy:'raw vitals remain in browser memory'},
  stream:{protocol:'WebSocket',mqtt:'broker status simulated'},
  limitations:['No live satellite provider','No physical mesh radios','No clinical biometric inference']
}));

module.exports=router;
