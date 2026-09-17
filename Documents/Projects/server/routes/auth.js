const express=require('express');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const {readJson,updateJson}=require('../utils/store');
const {requireAuth}=require('../middleware/auth');
const {JWT_SECRET,isProduction}=require('../config');
const {text,email,mobile,password,ValidationError}=require('../utils/validation');
const router=express.Router();
const asyncHandler=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);

function publicUser(user){
  const {passwordHash,...safe}=user;
  return safe;
}
function scoreFor(userId){
  const tasks=readJson('tasks.json',{})[userId]||[];
  if(!tasks.length)return 0;
  return Math.round(tasks.filter(t=>t.completed).length/tasks.length*100);
}
router.post('/register',asyncHandler(async(req,res)=>{
  const body=req.body||{};
  if(!['on','true',true,'1',1].includes(body.terms))throw new ValidationError('Please accept the academic demo terms.');
  const fullName=text(body.fullName,{min:2,max:80,field:'Full name'});
  const rollNumber=text(body.rollNumber,{min:2,max:40,field:'Roll number / User ID'});
  const phone=mobile(body.mobile);
  const normalizedEmail=email(body.email);
  const address=text(body.address,{min:4,max:220,field:'Address'});
  const city=text(body.city,{min:2,max:80,field:'City'});
  const state=text(body.state,{min:2,max:80,field:'State'});
  const pass=password(body.password);
  if(pass!==String(body.confirmPassword||''))throw new ValidationError('Passwords do not match.');
  const passwordHash=await bcrypt.hash(pass,12);
  let created;
  updateJson('users.json',[],users=>{
    if(users.some(u=>String(u.email).toLowerCase()===normalizedEmail)){
      const err=new ValidationError('An account with this email already exists.');err.status=409;throw err;
    }
    if(users.some(u=>String(u.rollNumber).toLowerCase()===rollNumber.toLowerCase())){
      const err=new ValidationError('An account with this roll number / User ID already exists.');err.status=409;throw err;
    }
    created={id:`USR-${crypto.randomUUID()}`,fullName,rollNumber,mobile:phone,email:normalizedEmail,address,city,state,emergencyContact:'',preferredCity:city,role:'citizen',passwordHash,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    return [...users,created];
  });
  res.status(201).json({message:'Registration successful. You can now sign in.',user:{id:created.id,email:created.email,fullName:created.fullName}});
}));

router.post('/login',asyncHandler(async(req,res)=>{
  const normalizedEmail=email(req.body?.email);
  const pass=String(req.body?.password||'');
  const users=readJson('users.json',[]);
  const user=users.find(u=>String(u.email).toLowerCase()===normalizedEmail);
  if(!user||!(await bcrypt.compare(pass,user.passwordHash)))return res.status(401).json({error:'Invalid email or password.'});
  const payload={id:user.id,email:user.email,fullName:user.fullName,role:user.role||'citizen'};
  const token=jwt.sign(payload,JWT_SECRET,{algorithm:'HS256',expiresIn:'8h',issuer:'aegis.local',audience:'aegis-web',jwtid:crypto.randomUUID()});
  res.cookie('aegis_token',token,{httpOnly:true,sameSite:'strict',secure:isProduction,maxAge:8*60*60*1000,path:'/'});
  res.json({message:'Login successful',user:payload});
}));
router.post('/logout',(req,res)=>{res.clearCookie('aegis_token',{httpOnly:true,sameSite:'strict',secure:isProduction,path:'/'});res.json({message:'Logged out.'});});
router.get('/me',requireAuth,(req,res)=>{
  const user=readJson('users.json',[]).find(x=>x.id===req.user.id);
  if(!user)return res.status(404).json({error:'User not found.'});
  res.json({...publicUser(user),preparednessScore:scoreFor(user.id)});
});
router.patch('/profile',requireAuth,(req,res)=>{
  const body=req.body||{};let updated;
  updateJson('users.json',[],users=>users.map(user=>{
    if(user.id!==req.user.id)return user;
    const next={...user};
    if('fullName'in body)next.fullName=text(body.fullName,{min:2,max:80,field:'Full name'});
    if('mobile'in body)next.mobile=mobile(body.mobile);
    if('address'in body)next.address=text(body.address,{min:4,max:220,field:'Address'});
    if('city'in body)next.city=text(body.city,{min:2,max:80,field:'City'});
    if('state'in body)next.state=text(body.state,{min:2,max:80,field:'State'});
    if('emergencyContact'in body)next.emergencyContact=body.emergencyContact?mobile(body.emergencyContact,'Emergency contact'):'';
    if('preferredCity'in body)next.preferredCity=text(body.preferredCity,{min:2,max:80,field:'Preferred city'});
    next.updatedAt=new Date().toISOString();updated=next;return next;
  }));
  if(!updated)return res.status(404).json({error:'User not found.'});
  res.json({...publicUser(updated),preparednessScore:scoreFor(updated.id)});
});
module.exports=router;
