async function syncWebSources(obs,{slots}){
 const sceneName='RI3D Sources';const scenes=await obs.call('GetSceneList');if(!scenes.scenes.some(s=>s.sceneName===sceneName))await obs.call('CreateScene',{sceneName});
 const existing=(await obs.call('GetInputList')).inputs;
 const skipped=[];
 for(let index=0;index<6;index++){
  let input=slots[index];const inputName=`RI3D_SOURCE_${index+1}`;
  // Preserve media/file assignments until a player webpage is configured explicitly.
  if(input && input.type!=='web'){skipped.push(index+1);if(existing.some(i=>i.inputName===inputName))continue;input=null;}
  const url=input?.url||'about:blank';if(input){const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('Browser sources require webpage URLs.');}
  const found=existing.find(i=>i.inputName===inputName);if(found&&found.inputKind!=='browser_source')throw Error(inputName+' exists with a different source type.');
  const settings={url,width:1920,height:1080,shutdown:true};
  if(found)await obs.call('SetInputSettings',{inputName,inputSettings:settings,overlay:true});
  else await obs.call('CreateInput',{sceneName,inputName,inputKind:'browser_source',inputSettings:settings,sceneItemEnabled:false});
 }
 return {skipped};
}
module.exports={syncWebSources};

