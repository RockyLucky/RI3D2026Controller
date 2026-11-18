const fs=require('fs');
const path=require('path');
const express=require('express');
const file=path.join(__dirname,'.local-secrets','connection.json');
function allowed(req){
 const host=req.headers.host;
 return ['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress) && ['127.0.0.1:3000','localhost:3000','[::1]:3000'].includes(host) && (!req.headers.origin || req.headers.origin===`http://${host}`) && (!req.headers['sec-fetch-site'] || ['same-origin','none'].includes(req.headers['sec-fetch-site']));
}
module.exports=app=>{
 app.use('/management',(req,res,next)=>{res.set({'Cache-Control':'no-store','Content-Security-Policy':"frame-ancestors 'none'",'X-Frame-Options':'DENY'});if(!allowed(req))return res.sendStatus(403);next();});
 app.get('/management',(req,res)=>res.sendFile(path.join(__dirname,'views','management.html')));
 app.get('/management/settings',(req,res)=>{let config={};try{config=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}res.json({obsUrl:config.obsUrl||'ws://127.0.0.1:4455',controllerUrl:config.controllerUrl||'http://127.0.0.1:3000',hasPassword:!!config.password,disabled:!!config.disabled});});
 app.post('/management/settings',express.json({limit:'8kb'}),(req,res)=>{
  if(req.headers['x-local-settings']!=='1')return res.sendStatus(403);
  try{
   const {obsUrl,controllerUrl,password,disabled}=req.body;
   const obs=new URL(obsUrl), controller=new URL(controllerUrl);
   if(obs.protocol!=='ws:' || !['127.0.0.1','localhost','[::1]'].includes(obs.hostname) || obs.username || obs.password)throw Error();
   if(!['http:','https:'].includes(controller.protocol)||controller.username||controller.password)throw Error();
   let old={};try{old=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
   if(typeof password!=='string'||typeof disabled!=='boolean')throw Error();
   fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
   fs.writeFileSync(file,JSON.stringify({obsUrl,controllerUrl,password:password||old.password||'',disabled}),{mode:0o600});res.json({saved:true});
  }catch{res.status(400).json({error:'Use a local ws:// OBS address and valid controller URL.'});}
 });
};
module.exports.allowed=allowed;
