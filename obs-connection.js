const fs = require('fs');
const path = require('path');
const settingsPath = path.join(__dirname,'.local-secrets','connection.json');
function settings(){try{return JSON.parse(fs.readFileSync(settingsPath,'utf8'));}catch{return {};}}
let config=settings();
const { io } = require('socket.io-client');
const { OBSWebSocket } = require('obs-websocket-js');
const obs = new OBSWebSocket();
const socket = io(config.controllerUrl || process.env.CONTROLLER_URL || 'http://127.0.0.1:3000', {path: '/ri3d26/socket.io'});
let connected = false, busy = false, dirty = false;
let collectionChanging=false, collectionEpoch=0, refreshTimer=null;
const rawCall=obs.call.bind(obs), rawBatch=obs.callBatch.bind(obs);
obs.call=(...args)=>collectionChanging?Promise.reject(new Error('OBS scene collection is changing')):rawCall(...args);
obs.callBatch=(...args)=>collectionChanging?Promise.reject(new Error('OBS scene collection is changing')):rawBatch(...args);
function scheduleRefresh(){clearTimeout(refreshTimer);if(!collectionChanging)refreshTimer=setTimeout(()=>refresh(),300);}
const emit = (key, value) => socket.emit('obs-data', 'obs_state', key, value);
async function refresh() {
  dirty = true;
  if (busy || !connected || collectionChanging) return;
  busy = true;
  try {
    while (dirty && connected && !collectionChanging) {
      const epoch=collectionEpoch;
      dirty = false;
      const scenes = await obs.call('GetSceneList');
      const inputs = await obs.call('GetInputList');
      const snapshot = {scenes, inputs: {}, items: {}, outputs: {}};
      const cache = {};
      for (const input of inputs.inputs) {
        const name = input.inputName;
        snapshot.inputs[name] = {...input};
        for (const type of ['GetInputSettings','GetInputVolume','GetInputMute','GetMediaInputStatus']) {
          try { Object.assign(snapshot.inputs[name], await obs.call(type, {inputName:name})); } catch (_) { /* Not every input supports audio/media. */ }
        }
      }
      for (const scene of scenes.scenes) {
        const {sceneItems} = await obs.call('GetSceneItemList', {sceneName:scene.sceneName});
        snapshot.items[scene.sceneName] = sceneItems;
        const mapping = {};
        for (const item of sceneItems) {
          if (item.sourceName.startsWith('RI3D_')) mapping[item.sourceName] = item.sceneItemId;
          cache[`${scene.sceneName}~${item.sourceName}`] = snapshot.inputs[item.sourceName];
        }
        if(epoch!==collectionEpoch||collectionChanging) return;
        socket.emit('obs-data','scene_index_mapping',scene.sceneName,mapping);
      }
      for (const type of ['GetStreamStatus','GetRecordStatus','GetVirtualCamStatus','GetReplayBufferStatus']) {
        try { snapshot.outputs[type] = await obs.call(type); } catch (_) {}
      }
      if(epoch!==collectionEpoch||collectionChanging)return;
      emit('snapshot',snapshot);
      emit('cache',cache);
      emit('currentScene',scenes.currentProgramSceneName);
    }
  } catch (error) { emit('syncError',error.message); }
  finally { busy = false;if(dirty&&!collectionChanging&&connected)scheduleRefresh(); }
}
for (const event of ['CurrentProgramSceneChanged','SceneCreated','SceneRemoved','SceneNameChanged','SceneItemCreated','SceneItemRemoved','SceneItemEnableStateChanged','SceneItemTransformChanged','InputCreated','InputRemoved','InputNameChanged','InputSettingsChanged','InputVolumeChanged','InputMuteStateChanged','MediaInputPlaybackStarted','MediaInputPlaybackEnded','MediaInputActionTriggered','StreamStateChanged','RecordStateChanged','VirtualcamStateChanged','ReplayBufferStateChanged']) obs.on(event, scheduleRefresh);
obs.on('CurrentSceneCollectionChanging',()=>{
 collectionChanging=true;collectionEpoch++;dirty=false;clearTimeout(refreshTimer);
 emit('collectionChanging',true);emit('currentScene',null);emit('cache',{});
 emit('snapshot',{scenes:{scenes:[],currentProgramSceneName:null},inputs:{},items:{},outputs:{}});
});
obs.on('CurrentSceneCollectionChanged',data=>{
 collectionChanging=false;collectionEpoch++;emit('collectionName',data.sceneCollectionName);emit('collectionChanging',false);dirty=true;scheduleRefresh();
});
obs.on('SceneCollectionListChanged',scheduleRefresh);
obs.on('InputVolumeMeters', data => socket.emit('obs-meters',data));
obs.on('ConnectionClosed', () => { connected=false; emit('connected',false); });
let connecting=false;
async function connect() {
  if (config.disabled || connecting || connected) return;
  connecting=true;
  try { await obs.connect(config.obsUrl || process.env.OBS_URL || 'ws://127.0.0.1:4455',config.password ?? process.env.OBS_PASSWORD, {eventSubscriptions: 2047 | (1<<16) | (1<<19)}); connected=true; emit('connected',true); await refresh(); }
  catch (_) { emit('connected',false); }
  finally { connecting=false; }
}
socket.on('connect', () => { emit('connected',connected); connected ? refresh() : connect(); });
socket.on('obs-requests', async (id, requests) => {
  if (!connected || collectionChanging) return socket.emit('obs-responses',id,{error:'OBS disconnected'});
  try { if(requests.length===1 && requests[0].requestType==='RI3DSyncWebSources'){const result=await require('./web-sources').syncWebSources(obs,requests[0].requestData);socket.emit('obs-responses',id,[{requestStatus:{result:true},responseData:result}]);await refresh();return;} if(requests.length===1 && requests[0].requestType==='RI3DPrepareScene'){const response=await require('./managed-scenes').prepareScene(obs,requests[0].requestData);socket.emit('obs-responses',id,[{requestStatus:{result:true},responseData:response}]);await refresh();return;} const response=await obs.callBatch(requests,{executionType:0,haltOnFailure:true}); socket.emit('obs-responses',id,response); await refresh(); }
  catch(error) { socket.emit('obs-responses',id,{error:error.message}); }
});
setInterval(connect,3000);

let reloading=false;
setInterval(async()=>{
 const next=settings();
 if(reloading || connecting || JSON.stringify(next)===JSON.stringify(config))return;
 reloading=true;
 try {await obs.disconnect();connected=false;config=next;socket.disconnect();socket.io.uri=config.controllerUrl || process.env.CONTROLLER_URL || 'http://127.0.0.1:3000';socket.connect();await connect();} finally {reloading=false;}
},1500);

// Reassert observed connectivity so dashboards can recover a stale status.
let checkingConnection=false;
setInterval(async()=>{
 if(!connected || collectionChanging || checkingConnection || !socket.connected)return;
 checkingConnection=true;
 try {await obs.call('GetVersion');emit('connected',true);}
 catch {if(!collectionChanging){connected=false;emit('connected',false);try{await obs.disconnect();}catch{}}}
 finally{checkingConnection=false;}
},5000);

// Lightweight fallback scene discovery; full refresh only when names or Program change.
let sceneCheckBusy=false, lastSceneSignature='';
setInterval(async()=>{
 if(!connected||collectionChanging||busy||sceneCheckBusy)return;
 sceneCheckBusy=true;const epoch=collectionEpoch;
 try{const list=await obs.call('GetSceneList');if(epoch!==collectionEpoch)return;const signature=JSON.stringify(list);if(signature!==lastSceneSignature){lastSceneSignature=signature;scheduleRefresh();}}
 catch{}finally{sceneCheckBusy=false;}
},15000);
