const fields=['positionX','positionY','scaleX','scaleY','rotation','alignment','boundsType','boundsAlignment','boundsWidth','boundsHeight','cropLeft','cropRight','cropTop','cropBottom'];
const transform=t=>Object.fromEntries(Object.entries(t||{}).filter(([k])=>fields.includes(k)));
function slotOf(name){const marker=/^RI3D Managed Web ([1-6])$/.exec(name);const generated=/^RI3D Managed \| .* \| ([1-6]) \| (browser_source|ffmpeg_source)$/.exec(name);return Number(marker?.[1]||generated?.[1])||null;}
async function copyDecorations(obs,sourceItems,targetScene,targetItems){
 for(const source of sourceItems){if(slotOf(source.sourceName)||/^RI3D_(MEDIA|WEB|SOURCE)_/.test(source.sourceName)||source.sourceName==='VDO.NINJA')continue;
  let item=targetItems.find(i=>i.sourceName===source.sourceName);if(!item){const created=await obs.call('CreateSceneItem',{sceneName:targetScene,sourceName:source.sourceName,sceneItemEnabled:source.sceneItemEnabled});item={sceneItemId:created.sceneItemId};}
  await obs.call('SetSceneItemTransform',{sceneName:targetScene,sceneItemId:item.sceneItemId,sceneItemTransform:transform(source.sceneItemTransform)});
  await obs.call('SetSceneItemEnabled',{sceneName:targetScene,sceneItemId:item.sceneItemId,sceneItemEnabled:source.sceneItemEnabled});
  if(Number.isInteger(source.sceneItemIndex))await obs.call('SetSceneItemIndex',{sceneName:targetScene,sceneItemId:item.sceneItemId,sceneItemIndex:source.sceneItemIndex});
 }
}
module.exports={transform,slotOf,copyDecorations};
