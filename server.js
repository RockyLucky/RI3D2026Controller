const { eventYear } = require('./config');
const express = require('express');
const fs = require('fs');
const app = express();
require('./local-management')(app);
app.get('/ri3d26/control', (req,res)=>res.sendFile(__dirname+'/views/stream-controller.html'));
const basePath = "/ri3d26";
const cors = require('cors');
// allow localhost:3001
app.use(cors({
    origin: '*'
}));

const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    path: basePath + '/socket.io',
    // allow for localhost during development
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const OBSWebSocket = require('obs-websocket-js').OBSWebSocket;
const OBSManager = require('./obs-server').OBSManager;

const reaction_camera = require('./reaction_camera');


// serve the public folder
app.use(basePath, express.static('public'));
// serve previews folder
app.use(basePath + '/previews', express.static('previews'));

app.get(basePath + '/livestream', (req, res) => {
    res.sendFile(__dirname + '/views/livestream.html');
});
app.get(basePath + '/stream', (req, res) => {
    res.sendFile(__dirname + '/views/stream.html');
});
app.get(basePath + '/scenes', (req, res) => {
    res.sendFile(__dirname + '/views/scenes.html');
});
app.get(basePath + '/manager', (req, res) => {
    res.sendFile(__dirname + '/views/manager.html');
});
app.get(basePath + '/documents', (req, res) => {
    res.sendFile(__dirname + '/views/documents.html');
});
app.get(basePath + '/bigtimer', (req, res) => {
    res.sendFile(__dirname + '/views/bigtimer.html');
});
app.get(basePath + '/schedule', (req, res) => {
    res.sendFile(__dirname + '/views/schedule.html');
});
app.get(basePath + '/preview', (req, res) => {
    res.sendFile(__dirname + '/views/preview.html');
});
app.get(basePath + '/mixer', (req,res) => res.sendFile(__dirname + '/views/mixer.html'));
app.get(basePath + '/home', (req, res) => {
    res.type('html').send(fs.readFileSync(__dirname + '/views/home.html','utf8').replaceAll('{{EVENT_YEAR}}', eventYear));
});

app.get(basePath + '/document-search', (req, res) => {
    // query parameter "q" holds the search term
    let searchTerm = req.query.q || "";
    let matchingDocs = [];
    matchingDocs = globalConfig.documents.documents.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        doc.visibility !== 'hidden'
    );

    res.json({ results: matchingDocs });
});

app.get(basePath + '/document-view', (req, res) => {
    // query parameter "id" holds the document id
    let docId = req.query.id || "";
    let document = globalConfig.documents.documents.find(doc => doc.id === docId);
    if(document){
        res.redirect(document.source);
    }else{
        res.status(404).send("Document not found");
    }
});

const reaction_groups = {
    "camera": (key, value) => reaction_camera.handleReaction(key, value, globalConfig, obsManager)
}

// hold the primary data structure here
let globalConfig = {
    overlay: {
        requestedStage: null,
        currentStage: null
    },
    camera: {
        playTransition: 0,
        available: ["Livestream"],
        livePreview: {
            id: null,
            preview: "off"
        },
        configured: [],
        preview: "images",
        manager: null,
        activeSceneRequest: {},
        sceneRequest: {}
    },
    documents: {
        documents: []
    },
    schedule: {
        scheduleItems: {},
        activeScheduleItems: [],
        additionalScheduleNotes: ""
    },
    obs_state: {
        scenesToTarget: [ // set MANUALLY - mimiced in obs-connection.js
            "Passive",
            "Present",
            "BeRightBack",
            "TwoCamera",
            "StartingSoon"
        ],
        currentScene: null,
        cache: {},
        sourceCameraNames: { // keep track of which sources are mapped to which cameras
            "Passive": [
                "RI3D_MEDIA_1",
                "RI3D_WEB_1"
            ],
            "Present": [
                "RI3D_MEDIA_1",
                "RI3D_WEB_1"
            ],
            "BeRightBack": [
                "RI3D_MEDIA_1",
                "RI3D_WEB_1"
            ],
            "TwoCamera": [
                "RI3D_MEDIA_1",
                "RI3D_MEDIA_2",
                "RI3D_WEB_1",
                "RI3D_WEB_2"
            ],
            "StartingSoon": []
        }
    },
    scene_index_mapping: { // automatically filled on OBS connection

    },
    constants: {
        publicDocumentsLink: "https://drive.google.com/drive/u/0/folders/1N6PCUuDWNRrZHfQ6jIBQx7Wa8wZkaUfx",
        publicCalendarLink: "https://calendar.google.com/calendar/embed?src=c_6ad2a24c07de8545d32333b8289aa930a0f82c4e274e1b482afca4f8f9db0df7%40group.calendar.google.com&ctz=America%2FDetroit",
        clockMode: "countdown", // disabled, time, or countdown
        countdownTarget: "2026-01-13T12:00:00-04:00", // ISO string
        forceTransitions: "animation" // force, animation
    }
};

let obsManager = new OBSManager(io);

async function readConfig(group) {
    // TRY to read the file, if it doesn't exist return the default structure
    if(!fs.existsSync(`data/${group}.json`)){
        // then return default structure
        if (!fs.existsSync(`data/default/${group}.json`)) return globalConfig[group];
        const defaultStructure = await fs.promises.readFile(`data/default/${group}.json`, 'utf8');
        return JSON.parse(defaultStructure);
    }
    // otherwise read the file
    const data = await fs.promises.readFile(`data/${group}.json`, 'utf8');
    return JSON.parse(data);
}

const DO_NOT_WRITE= ["obs_state", "scene_index_mapping", "constants"];

async function writeConfig(config, group) {
    if(DO_NOT_WRITE.includes(group)) return;

    await fs.promises.mkdir('data', {recursive:true});
    const data = JSON.stringify(config, null, 2);
    await fs.promises.writeFile(`data/${group}.json`, data, 'utf8');
}

async function init(){
    // go through each key of globalConfig and read the file
    for (const group of Object.keys(globalConfig)) {
        if(DO_NOT_WRITE.includes(group)) continue; // don't hit one that was marked to not write
        
        globalConfig[group] = await readConfig(group);
    }
}

io.on('connection', (socket) => {
    console.log('a page connected');
    socket.on('program-preview', ack => {
        if(typeof ack!=='function')return;
        const state=globalConfig.obs_state;
        if(!state.connected || !state.currentScene)return ack({error:'OBS disconnected'});
        if(socket.previewPending || Date.now()-(socket.lastPreview||0)<900)return ack({error:'Preview busy'});
        socket.previewPending=true;socket.lastPreview=Date.now();let done=false;
        const timer=setTimeout(()=>{if(!done){done=true;socket.previewPending=false;ack({error:'Preview timed out'});}},4000);
        obsManager.sendBatchRequests([{requestType:'GetSourceScreenshot',requestData:{sourceName:state.currentScene,imageFormat:'jpeg',imageWidth:640,imageCompressionQuality:60}}],response=>{
            if(done)return;done=true;clearTimeout(timer);socket.previewPending=false;
            const image=response?.[0]?.responseData?.imageData;
            ack(typeof image==='string' && image.startsWith('data:image/')?{image,scene:state.currentScene}:{error:'OBS preview unavailable'});
        });
    });
    socket.on('save-source-slots',async (slots,ack)=>{
        if(typeof ack!=='function')return;
        try {
            if(!Array.isArray(slots)||slots.length!==6||slots.some(id=>id!==null&&(typeof id!=='string'||!globalConfig.camera.configured.some(c=>c.id===id))))throw Error('Choose existing Camera Manager inputs for all six sources.');
            await writeConfig({...globalConfig.camera,sourceSlots:slots},'camera');globalConfig.camera.sourceSlots=slots;io.emit('dataUpdated','camera','sourceSlots',slots);
            // Assignment changes remain configuration only; prepare the inactive bank before Take Live.
            ack({ok:true});
        }catch(error){ack({error:error.message});}
    });
    socket.on('scene-preview', (scene, ack) => {
        if(typeof ack!=='function')return;
        const state=globalConfig.obs_state;
        if(!state.connected || !state.snapshot?.scenes?.scenes.some(s=>s.sceneName===scene))return ack({error:'OBS disconnected or scene missing'});
        if(socket.scenePreviewPending || Date.now()-(socket.lastScenePreview||0)<900)return ack({error:'Preview busy'});
        socket.scenePreviewPending=true;socket.lastScenePreview=Date.now();let done=false;
        const finish=result=>{if(done)return;done=true;clearTimeout(timer);socket.scenePreviewPending=false;ack(result);};
        const timer=setTimeout(()=>finish({error:'Preview timed out'}),4500);
        let previewScene=scene;
        const screenshot=()=>{if(done)return;obsManager.sendBatchRequests([{requestType:'GetSourceScreenshot',requestData:{sourceName:previewScene,imageFormat:'jpeg',imageWidth:640,imageCompressionQuality:60}}],response=>{
            const image=response?.[0]?.responseData?.imageData;finish(typeof image==='string'&&image.startsWith('data:image/')?{image,scene}:{error:'OBS preview unavailable'});
        });};
        let managedInputs;try{managedInputs=require('./scene-markers').sceneInputs(scene,globalConfig);}catch(error){return finish({error:error.message});}
        if(managedInputs){
            const inputs=managedInputs;const count=inputs.length;
            if(inputs.length!==count||inputs.some(c=>!c||!['media','web','file'].includes(c.type)||!c.url))return finish({error:'Assign valid Sources before previewing this scene.'});
            obsManager.sendBatchRequests([{requestType:'RI3DPrepareScene',requestData:{sceneName:scene,inputs,preview:true}}],response=>{if(done)return;if(response?.error)return finish({error:response.error});previewScene=response?.[0]?.responseData?.sceneName||scene;setTimeout(screenshot,700);});
        }else screenshot();
    });
    socket.on('run-scene',(scene,ack)=>{
        if(typeof ack!=='function')return;
        const state=globalConfig.obs_state;
        if(!state.connected || typeof scene!=='string' || !state.snapshot?.scenes?.scenes.some(s=>s.sceneName===scene))return ack({error:'OBS is unavailable or scene no longer exists.'});
        let managedInputs;try{managedInputs=require('./scene-markers').sceneInputs(scene,globalConfig);}catch(error){return ack({error:error.message});}
        if(managedInputs){
            const inputs=managedInputs;const count=inputs.length;
            if(inputs.length!==count || inputs.some(c=>!c||!['media','web','file'].includes(c.type)||!c.url))return ack({error:'Assign valid numbered Sources in Camera Manager before taking this scene live.'});
            let finished=false;const timeout=setTimeout(()=>{if(!finished){finished=true;ack({error:'Scene preparation timed out; check OBS before retrying.'});}},6500);
            obsManager.sendBatchRequests([{requestType:'RI3DPrepareScene',requestData:{sceneName:scene,inputs}}],response=>{
                if(finished)return;
                if(response?.error){finished=true;clearTimeout(timeout);return ack({error:response.error});}
                obsManager.sendBatchRequests([{requestType:'SetCurrentProgramScene',requestData:{sceneName:response?.[0]?.responseData?.sceneName||scene}}],result=>{if(finished)return;finished=true;clearTimeout(timeout);ack(result?.[0]?.requestStatus?.result?{ok:true}:{error:result?.error||'OBS rejected the scene switch.'});});
            });return;
        }
        let done=false;const timer=setTimeout(()=>{if(!done){done=true;ack({error:'OBS did not confirm. Check the live scene.'});}},6500);
        obsManager.sendBatchRequests([{requestType:'SetCurrentProgramScene',requestData:{sceneName:scene}}],response=>{
            if(done)return;done=true;clearTimeout(timer);
            ack(response?.error?{error:response.error}:Array.isArray(response)&&response[0]?.requestStatus?.result?{ok:true}:{error:'OBS rejected the scene request.'});
        });
    });
    socket.on('obs-responses', (id,response) => obsManager.resolveRequest(id,response));
    socket.on('obs-meters', data => io.emit('obs-meters',data));
    socket.on('mixer-command', (name, muted, db) => {
      if(typeof name !== 'string') return;
      if(typeof muted === 'boolean') obsManager.sendBatchRequests([{requestType:'SetInputMute',requestData:{inputName:name,inputMuted:muted}}]);
      else if(Number.isFinite(db) && db >= -100 && db <= 26) obsManager.sendBatchRequests([{requestType:'SetInputVolume',requestData:{inputName:name,inputVolumeDb:db}}]);
    });

    socket.emit("entireConfig", globalConfig);

    socket.on('changeData', async (group, key, value) => {
        console.log(`Changing data: ${group} -> ${key} = ${value}`);
        if(globalConfig[group]){
            globalConfig[group][key] = value;
            await writeConfig(globalConfig[group], group);
            io.emit('dataUpdated', group, key, value);

            // check for reactions
            if(reaction_groups[group]){
                // no await needed here
                reaction_groups[group](key, value);
            }
        }
    });

    // handle to receive OBS data bits
    // this is NOT in response to anything, just as a "default"
    socket.on('obs-data', (group, key, value) => {
        console.log(`Received OBS data: ${group} -> ${key} = ${value}`);
        if(globalConfig[group]){
            globalConfig[group][key] = value;
            
            io.emit('dataUpdated', group, key, value);
        }
    });

});



// // refresher loop for grabbing the camera previews / data
// setInterval(async () => {
//     if(!obsManager) {
//         console.log("OBS Manager not connected, skipping preview fetch.");
//         return;
//     }

//     console.log(globalConfig);

//     if(globalConfig.camera.preview == "images"){
//         globalConfig.camera.available.forEach( async (cameraName) => {
//             try {
//                 const imageData = await obsManager.requestScreenshotForSource(cameraName, 'jpg');
//                 // then save to the previews
//                 const base64Data = imageData.split('base64,')[1];
//                 fs.writeFileSync(`previews/${cameraName}.jpg`, base64Data, 'base64');
//             }catch (error) {
//                 console.error(`Error fetching screenshot for camera ${cameraName}:`, error);
//             }
//         });
//     }
// }, 5000);

init().then(() => http.listen(Number(process.env.PORT) || 3000, process.env.HOST || '127.0.0.1', () => { console.log('Local controller ready'); })).catch(console.error);



