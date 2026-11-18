// Explicit OBS marker names define scene slots, independent of scene names.
function sceneInputs(scene,config){
 const items=config.obs_state.snapshot?.items?.[scene]||[];
 const markers=items.map(item=>({item,match:/^RI3D Managed Web ([1-6])$/.exec(item.sourceName)})).filter(x=>x.match).sort((a,b)=>Number(a.match[1])-Number(b.match[1]));
 if(markers.length){const seen=new Set();return markers.map(({item,match})=>{const slot=Number(match[1]);if(seen.has(slot))throw Error('Duplicate managed slot '+slot);seen.add(slot);const id=config.camera.sourceSlots?.[slot-1];const input=config.camera.configured.find(c=>c.id===id);if(!input||input.type!=='web'||!input.url)throw Error('Source '+slot+' must select a Website input in Camera Manager.');return {...input,slot,markerTransform:item.sceneItemTransform};});}
 if(!['Present','Passive','TwoCamera'].includes(scene))return null;
 const count=scene==='TwoCamera'?2:1;return Array.from({length:count},(_,i)=>{const input=config.camera.configured.find(c=>c.id===config.camera.sourceSlots?.[i]);if(!input||!['web','media','file'].includes(input.type)||!input.url)throw Error('Assign valid Sources before preparing this scene.');return {...input,slot:i+1};});
}
module.exports={sceneInputs};
