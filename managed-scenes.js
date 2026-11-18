// Isolated per-scene inputs keep preparation from changing the live scene's shared inputs.
async function prepareScene(obs,{sceneName,inputs,preview=false}){
 const original=sceneName;
 const alternate=original+' [RI3D Preview]';
 const state=await obs.call('GetSceneList');
 // Read layout directly from OBS, never from the asynchronously refreshed dashboard cache.
 const originalItems=(await obs.call('GetSceneItemList',{sceneName:original})).sceneItems;
 inputs=inputs.map((input,index)=>{
  const marker=originalItems.find(item=>item.sourceName==='RI3D Managed Web '+(input.slot||index+1));
  return {...input,markerTransform:marker?.sceneItemTransform,markerIndex:marker?.sceneItemIndex};
 });
 const {currentProgramSceneName}=state;
 sceneName=currentProgramSceneName===original?alternate:original;
 if(!state.scenes.some(s=>s.sceneName===sceneName)){
  await obs.call('CreateScene',{sceneName});
  const template=originalItems;
  for(const item of template){
   if(/^RI3D_(MEDIA|WEB|SOURCE)_/.test(item.sourceName)||item.sourceName.startsWith('RI3D Managed |')||/^RI3D Managed Web [1-6]$/.test(item.sourceName)||item.sourceName==='VDO.NINJA')continue;
   const added=await obs.call('CreateSceneItem',{sceneName,sourceName:item.sourceName,sceneItemEnabled:item.sceneItemEnabled});
   const t=item.sceneItemTransform;
   const transform={};for(const key of ['positionX','positionY','scaleX','scaleY','rotation','alignment','boundsType','boundsAlignment','boundsWidth','boundsHeight','cropLeft','cropRight','cropTop','cropBottom'])if(t[key]!==undefined)transform[key]=t[key];
   await obs.call('SetSceneItemTransform',{sceneName,sceneItemId:added.sceneItemId,sceneItemTransform:transform});
  }
 }
 if(sceneName===currentProgramSceneName)throw Error('Cannot prepare the live bank.');
 const sourceScene=original;
 const sourceItems=sourceScene===original?originalItems:(await obs.call('GetSceneItemList',{sceneName:sourceScene})).sceneItems;
 const copyLayout=true;
 const video=await obs.call('GetVideoSettings');
 let {sceneItems}=await obs.call('GetSceneItemList',{sceneName});
 for(let index=0;index<inputs.length;index++){
  const input=inputs[index];if(!input || !['web','media','file'].includes(input.type)||!input.url)throw Error('Assigned source needs a valid type and URL in Camera Manager.');
 }
 for(let index=0;index<inputs.length;index++){
  const input=inputs[index],kind=input.type==='web'?'browser_source':'ffmpeg_source';
  const inputName=`RI3D Managed | ${sceneName} | ${input.slot||index+1} | ${kind}`;
  const settings=kind==='browser_source'?{url:require('./browser-url').browserUrl(input.url),width:1920,height:1080,shutdown:true}:{input:input.url,is_local_file:input.type==='file',close_when_inactive:true,restart_on_activate:true};
  let item=sceneItems.find(x=>x.sourceName===inputName);
  const existed=!!item;
  const layout=require('./scene-layout');
  const sourceLayout=sourceItems.find(i=>i.sceneItemEnabled && i.sourceName.startsWith('RI3D Managed |') && layout.slotOf(i.sourceName)===(input.slot||index+1))||sourceItems.find(i=>i.sourceName==='RI3D Managed Web '+(input.slot||index+1));
  if(copyLayout && sourceLayout){input.markerTransform=sourceLayout.sceneItemTransform;input.markerIndex=sourceLayout.sceneItemIndex;}
  if(!item && kind==='browser_source' && (await obs.call('GetInputList')).inputs.some(i=>i.inputName===inputName)){const added=await obs.call('CreateSceneItem',{sceneName,sourceName:inputName,sceneItemEnabled:false});item={sceneItemId:added.sceneItemId,sourceName:inputName};}
  if(!item){const created=await obs.call('CreateInput',{sceneName,inputName,inputKind:kind,inputSettings:settings,sceneItemEnabled:false});item={sceneItemId:created.sceneItemId,sourceName:inputName};}
  else {const current=await obs.call('GetInputSettings',{inputName});if(Object.entries(settings).some(([k,v])=>current.inputSettings[k]!==v))await obs.call('SetInputSettings',{inputName,inputSettings:settings,overlay:true});}
  if(!existed || (copyLayout && sourceLayout))await obs.call('SetSceneItemTransform',{sceneName,sceneItemId:item.sceneItemId,sceneItemTransform:input.markerTransform?Object.fromEntries(Object.entries(input.markerTransform).filter(([k])=>['positionX','positionY','scaleX','scaleY','rotation','alignment','boundsType','boundsAlignment','boundsWidth','boundsHeight','cropLeft','cropRight','cropTop','cropBottom'].includes(k))):{positionX:index*video.baseWidth/inputs.length,positionY:0,alignment:5,rotation:0,boundsType:'OBS_BOUNDS_SCALE_INNER',boundsAlignment:0,boundsWidth:video.baseWidth/inputs.length,boundsHeight:video.baseHeight,cropLeft:0,cropRight:0,cropTop:0,cropBottom:0}});
  await obs.call('SetSceneItemEnabled',{sceneName,sceneItemId:item.sceneItemId,sceneItemEnabled:true});
  if(!existed || (copyLayout && sourceLayout))await obs.call('SetSceneItemIndex',{sceneName,sceneItemId:item.sceneItemId,sceneItemIndex:input.markerIndex??index});
 }
 const keep=new Set(inputs.map((input,index)=>`RI3D Managed | ${sceneName} | ${input.slot||index+1} | ${input.type==='web'?'browser_source':'ffmpeg_source'}`));
 for(const item of sceneItems)if((/^RI3D_(MEDIA|WEB)_\d+$/.test(item.sourceName)||item.sourceName.startsWith('RI3D Managed |')||/^RI3D Managed Web [1-6]$/.test(item.sourceName)||/^RI3D_SOURCE_\d+$/.test(item.sourceName)||item.sourceName==='VDO.NINJA')&&!keep.has(item.sourceName))await obs.call('SetSceneItemEnabled',{sceneName,sceneItemId:item.sceneItemId,sceneItemEnabled:false});
 if(copyLayout && sourceScene!==sceneName)await require('./scene-layout').copyDecorations(obs,sourceItems,sceneName,(await obs.call('GetSceneItemList',{sceneName})).sceneItems);

 if(preview){const studio=await obs.call('GetStudioModeEnabled');if(studio.studioModeEnabled)await obs.call('SetCurrentPreviewScene',{sceneName});}
 return {sceneName};
}
module.exports={prepareScene};
