// Resolve all slots before emitting commands, so invalid assignments cannot hide working inputs.
function planScene(request, config){
 const mapping=config.scene_index_mapping[request.scene];
 if(!mapping)throw Error('Scene is not available in OBS.');
 const managed=Object.keys(mapping).filter(n=>/^RI3D_(WEB|MEDIA)_\d+$/.test(n));
 const selected=new Set(), commands=[];
 if(!Array.isArray(request.cameras)||request.cameras.length>2)throw Error('Select up to two camera inputs.');
 request.cameras.forEach((id,index)=>{
  if(!id)return;
  const camera=config.camera.configured.find(c=>c.id===id);
  if(!camera || !['web','media','file'].includes(camera.type) || typeof camera.url!=='string'||!camera.url.trim())throw Error('Selected input is missing or invalid.');
  const name=`RI3D_${camera.type==='web'?'WEB':'MEDIA'}_${index+1}`;
  if(!Number.isInteger(mapping[name]))throw Error(`Scene ${request.scene} needs an OBS ${camera.type==='web'?'Browser':'Media'} Source named ${name}.`);
  const x=Number(camera.x),y=Number(camera.y),w=Number(camera.width),h=Number(camera.height);
  if(![x,y,w,h].every(Number.isFinite)||w<=0||h<=0)throw Error('Input position or size is invalid.');
  selected.add(name);
  commands.push({requestType:'SetInputSettings',requestData:{inputName:name,overlay:true,inputSettings:camera.type==='web'?{url:camera.url,width:Math.round(w),height:Math.round(h)}:{input:camera.url,is_local_file:camera.type==='file'}}});
  commands.push({requestType:'SetSceneItemTransform',requestData:{sceneName:request.scene,sceneItemId:mapping[name],sceneItemTransform:camera.type==='web'?{positionX:x,positionY:y}:{positionX:x,positionY:y,scaleX:w,scaleY:h}}});
 });
 for(const name of managed)commands.push({requestType:'SetSceneItemEnabled',requestData:{sceneName:request.scene,sceneItemId:mapping[name],sceneItemEnabled:selected.has(name)}});
 commands.push({requestType:'SetCurrentProgramScene',requestData:{sceneName:request.scene}});
 return commands;
}
module.exports={planScene};
