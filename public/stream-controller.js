const socket=io({path:'/ri3d26/socket.io'});
const el=id=>document.getElementById(id);
let staged=null, current=null, online=false, pending=false;
function update(){el('program').textContent=current||'Waiting for OBS';el('staged').textContent=staged||'No scene selected';el('run').disabled=!online||!staged||pending;}
function snapshot(s){current=typeof s.scenes?.currentProgramSceneName==='string'?s.scenes.currentProgramSceneName.split(' [RI3D Preview]')[0]:null;el('scenes').replaceChildren();const names=s.scenes.scenes.map(x=>x.sceneName).filter(name=>!name.endsWith(' [RI3D Preview]') && name!=='RI3D Sources');if(staged&&!names.includes(staged))staged=null;for(const name of names){const b=document.createElement('button');b.textContent=name+(name===current?' • LIVE':'');b.className=(name===staged?'bg-primary':'bg-secondary')+(name===current?' scene-live':'');b.onclick=()=>{staged=name;loadScenePreview(name);el('result').textContent='Staged. Press Run to put this scene live.';snapshot(s);};el('scenes').append(b);}update();}
socket.on('entireConfig',c=>{online=!!c.obs_state.connected;if(c.obs_state.snapshot)snapshot(c.obs_state.snapshot);status();});
function status(){el('connection').textContent=socket.connected?(online?'OBS connected':'OBS disconnected'):'Controller disconnected';update();}
socket.on('dataUpdated',(g,k,v)=>{if(g!=='obs_state')return;if(k==='connected'){online=!!v;status();}if(k==='snapshot'){online=true;snapshot(v);status();}});
socket.on('disconnect',()=>{online=false;staged=null;status();});
socket.on('connect',status);
el('clear').onclick=()=>{staged=null;update();};
el('run').onclick=()=>{if(!online||!staged||pending||(typeof sourceSaving!=='undefined'&&sourceSaving))return;pending=true;const target=staged;update();el('result').textContent='Sending '+target+'…';socket.timeout(8000).emit('run-scene',target,(err,response)=>{pending=false;el('result').textContent=err?'No confirmation received. Check the live scene before retrying.':response.error||'OBS accepted scene: '+target;update();});};
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{const tab=b.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.className=x===b?'bg-primary':'bg-secondary');el('live').hidden=tab!=='live';el('tool').hidden=tab==='live';el('tool').removeAttribute('src');if(tab!=='live')el('tool').src='/ri3d26/'+tab;});

let previewPending=false;
function clearPreview(message){el('program-preview').hidden=true;el('program-preview').removeAttribute('src');el('preview-status').textContent=message;}
function preview(){
 if(document.hidden || el('live').hidden || !online || !socket.connected){clearPreview('Preview paused');return;}
 if(previewPending)return;
 previewPending=true;
 socket.timeout(5000).emit('program-preview',(error,response)=>{
  previewPending=false;
  if(document.hidden || el('live').hidden || !online || !socket.connected)return clearPreview('Preview paused');
  if(error || !response?.image)return clearPreview(response?.error||'Preview unavailable');
  el('program-preview').src=response.image;el('program-preview').hidden=false;el('preview-status').textContent='Program screenshot • '+new Date().toLocaleTimeString()+' • refreshes every second';
 });
}
setInterval(preview,1000);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearPreview('Preview paused');else preview();});
socket.on('disconnect',()=>clearPreview('OBS preview disconnected'));


let scenePreviewRequest=0, sceneRetryTimer=null;
function cancelSceneRetry(){clearTimeout(sceneRetryTimer);sceneRetryTimer=null;}
function loadScenePreview(scene){
 cancelSceneRetry();const request=++scenePreviewRequest;
 const image=el('scene-preview');image.onload=null;image.onerror=null;image.hidden=true;image.removeAttribute('src');
 function valid(){return request===scenePreviewRequest && staged===scene && socket.connected && !document.hidden && !el('live').hidden;}
 function retry(){if(!valid())return;el('scene-preview-status').textContent='Waiting for image — retrying…';sceneRetryTimer=setTimeout(attempt,1500);}
 function attempt(){
  if(!valid())return;
  el('scene-preview-status').textContent='Loading selected scene…';
  socket.timeout(5000).emit('scene-preview',scene,(error,response)=>{
   if(!valid())return;
   if(error || !response?.image)return retry();
   image.onload=()=>{if(!valid())return;cancelSceneRetry();image.hidden=false;image.onload=null;image.onerror=null;el('scene-preview-status').textContent='Snapshot of '+scene+' • '+new Date().toLocaleTimeString()+' • click the scene again to refresh';};
   image.onerror=()=>{if(!valid())return;image.hidden=true;image.onload=null;image.onerror=null;retry();};
   image.src=response.image;
  });
 }
 attempt();
}
function clearScenePreview(){cancelSceneRetry();scenePreviewRequest++;const image=el('scene-preview');image.onload=null;image.onerror=null;image.hidden=true;image.removeAttribute('src');el('scene-preview-status').textContent='Select a scene to load one screenshot.';}
el('clear').addEventListener('click',clearScenePreview);socket.on('disconnect',clearScenePreview);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelSceneRetry();scenePreviewRequest++;}else if(staged && el('scene-preview').hidden && !el('live').hidden)loadScenePreview(staged);});
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{cancelSceneRetry();scenePreviewRequest++;if(button.dataset.tab==='live' && staged && el('scene-preview').hidden)loadScenePreview(staged);}));


let collectionLoading=false;
socket.on('dataUpdated',(group,key,value)=>{
 if(group==='obs_state' && key==='collectionChanging'){
  collectionLoading=value;staged=null;clearScenePreview();clearPreview('Collection changing');
  if(value){online=false;el('scenes').replaceChildren();el('connection').textContent='Loading OBS collection…';update();}
 }
});
