const { io } = require('socket.io-client');
const { OBSWebSocket } = require('obs-websocket-js');
const obs = new OBSWebSocket();
const socket = io(process.env.CONTROLLER_URL || 'http://127.0.0.1:3000', {path: '/ri3d26/socket.io'});
let connected = false, busy = false, dirty = false;
const emit = (key, value) => socket.emit('obs-data', 'obs_state', key, value);
async function refresh() {
  dirty = true;
  if (busy || !connected) return;
  busy = true;
  try {
    while (dirty && connected) {
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
        socket.emit('obs-data','scene_index_mapping',scene.sceneName,mapping);
      }
      for (const type of ['GetStreamStatus','GetRecordStatus','GetVirtualCamStatus','GetReplayBufferStatus']) {
        try { snapshot.outputs[type] = await obs.call(type); } catch (_) {}
      }
      emit('snapshot',snapshot);
      emit('cache',cache);
      emit('currentScene',scenes.currentProgramSceneName);
    }
  } catch (error) { emit('syncError',error.message); }
  finally { busy = false; }
}
for (const event of ['CurrentProgramSceneChanged','SceneCreated','SceneRemoved','SceneNameChanged','SceneItemCreated','SceneItemRemoved','SceneItemEnableStateChanged','SceneItemTransformChanged','InputCreated','InputRemoved','InputNameChanged','InputSettingsChanged','InputVolumeChanged','InputMuteStateChanged','MediaInputPlaybackStarted','MediaInputPlaybackEnded','MediaInputActionTriggered','StreamStateChanged','RecordStateChanged','VirtualcamStateChanged','ReplayBufferStateChanged']) obs.on(event, refresh);
obs.on('InputVolumeMeters', data => socket.emit('obs-meters',data));
obs.on('ConnectionClosed', () => { connected=false; emit('connected',false); });
let connecting=false;
async function connect() {
  if (connecting || connected) return;
  connecting=true;
  try { await obs.connect(process.env.OBS_URL || 'ws://127.0.0.1:4455',process.env.OBS_PASSWORD, {eventSubscriptions: 2047 | (1<<16) | (1<<19)}); connected=true; emit('connected',true); await refresh(); }
  catch (_) { emit('connected',false); }
  finally { connecting=false; }
}
socket.on('connect', () => { emit('connected',connected); connected ? refresh() : connect(); });
socket.on('obs-requests', async (id, requests) => {
  if (!connected) return socket.emit('obs-responses',id,{error:'OBS disconnected'});
  try { const response=await obs.callBatch(requests,{executionType:0}); socket.emit('obs-responses',id,response); await refresh(); }
  catch(error) { socket.emit('obs-responses',id,{error:error.message}); }
});
setInterval(connect,3000);
