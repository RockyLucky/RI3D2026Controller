const SINGLE_MEDIA = "RI3D_MEDIA";
const OBSManager = require('./obs-server').OBSManager;


function setOBSmediaSource(obsManager, camera, target, targetSceneId, scene, isLocal=false){
    if(!obsManager) return;
    // check if type of obsManager is OBSManager (for code completion safety)
    if(!(obsManager instanceof OBSManager)) return;


    let x = camera.x;
    let y = camera.y;
    let width = camera.width;
    let height = camera.height;
    let url = camera.url;

    // target is the object name
    let requests = [
        {
            "requestType": "SetSceneItemTransform",
            "requestData": {
                "sceneName": scene,
                "sceneItemId": targetSceneId,
                "sceneItemTransform": {
                    "positionX": parseInt(x),
                    "positionY": parseInt(y),
                    "scaleX": parseFloat(width),
                    "scaleY": parseFloat(height)
                }
            }
        },
        {
            "requestType": "SetSceneItemEnabled",
            "requestData": {
                "sceneName": scene,
                "sceneItemId": targetSceneId,
                "sceneItemEnabled": true
            }
        },
        {
            "requestType": "SetInputSettings",
            "requestData": {
                "inputName": target,
                "inputSettings": {
                    "input": url,
                    "is_local_file": isLocal,
                }
            }
        }
    ];

    return requests;

    
}

function setOBSwebSource(obsManager, camera, target, targetSceneId, scene){
    if(!obsManager) return;
    // check if type of obsManager is OBSManager (for code completion safety)
    if(!(obsManager instanceof OBSManager)) return;

    let x = camera.x;
    let y = camera.y;
    let width = camera.width;
    let height = camera.height;
    let url = camera.url;

    // target is the object name
    let requests = [
        {
            "requestType": "SetSceneItemTransform",
            "requestData": {
                "sceneName": scene,
                "sceneItemId": targetSceneId,
                "sceneItemTransform": {
                    "positionX": parseInt(x),
                    "positionY": parseInt(y),
                }
            }
        },
        {
            "requestType": "SetSceneItemEnabled",
            "requestData": {
                "sceneName": scene,
                "sceneItemId": targetSceneId,
                "sceneItemEnabled": true
            }
        },
        {
            "requestType": "SetInputSettings",
            "requestData": {
                "inputName": target,
                "inputSettings": {
                    "url": url,
                    "width": parseInt(width),
                    "height": parseInt(height)
                }
            }
        }
    ];

    return requests;
}

function isValidCamera(camera){
    // need x, y, width, height, url
    if(!camera) return false;
    if(camera.x === undefined) return false;
    if(camera.y === undefined) return false;
    if(camera.width === undefined) return false;
    if(camera.height === undefined) return false;
    if(!camera.url) return false;

    return true;
}

function triggerPlayTransition(globalConfig, obsManager){
    if(!obsManager) return;
    if(!(obsManager instanceof OBSManager)) return;

    globalConfig.camera.playTransition += 1;
    obsManager.socketServer.emit("dataUpdated", "camera", "playTransition", globalConfig.camera.playTransition);
}

async function handleReaction(key, value, globalConfig, obsManager){
    if(!obsManager) return;

    // if the key is livePreview, then react to the change by setting the preview source in OBS
    if(key === "livePreview"){
        // get the id and preview option
        let id = globalConfig.camera.livePreview.id;
        let previewOption = globalConfig.camera.livePreview.preview;

        if(!id || previewOption !== "obs") return; // just don't react TODO:

        let camera = globalConfig.camera.configured.find(cam => cam.id === id);
        if(!camera) return; // camera not found
        if(!isValidCamera(camera)) return; // invalid camera

        let currentScene = globalConfig.obs_state.currentScene;
        if(!currentScene) return; // no current scene
        
        // and then get the scene index mapping for the current scene
        let sceneMapping = globalConfig.scene_index_mapping[currentScene];
        if(!sceneMapping) return; // no mapping for current scene

        if(camera.type == "web"){
            let targetSceneId = sceneMapping[`RI3D_WEB_1`];
            if(targetSceneId == null) return; // no target scene id for single media

            let requests = setOBSwebSource(obsManager, camera, 'RI3D_WEB_1', targetSceneId, currentScene);
            await obsManager.sendBatchRequests(requests);
        }else{
            let targetSceneId = sceneMapping[`RI3D_MEDIA_1`];
            if(targetSceneId == null) return; // no target scene id for single media

            let requests = setOBSmediaSource(obsManager, camera, 'RI3D_MEDIA_1', targetSceneId, currentScene, camera.type == "file");
            await obsManager.sendBatchRequests(requests);
        }

    }else if(key === "configured"){
        // then we will adjust the live preview if the currently selected camera is removed
        let id = globalConfig.camera.livePreview.id;
        let previewOption = globalConfig.camera.livePreview.preview;

        // OR allow if the 
        
        if(!id || previewOption === "off" || previewOption == null) return; // just don't react TODO:
        let camera = globalConfig.camera.configured.find(cam => cam.id === id);
        if(!camera) {
            // then the currently selected camera is gone, so turn off live preview
            globalConfig.camera.livePreview.id = null;
            return;
        }
        if(!isValidCamera(camera)) return; // invalid camera

        let currentScene = globalConfig.obs_state.currentScene;
        if(!currentScene) return; // no current scene

        let sceneMapping = globalConfig.scene_index_mapping[currentScene];
        if(!sceneMapping) return; // no mapping for current scene
{}
        if(!id || previewOption === "off"){
            // something else
        }else{
            if(camera.type == "web"){
                let targetSceneId = sceneMapping[`RI3D_WEB_1`];
                if(targetSceneId == null) return; // no target scene id for single media

                let requests = setOBSwebSource(obsManager, camera, 'RI3D_WEB_1', targetSceneId, currentScene);
                await obsManager.sendBatchRequests(requests);
            }else{
                let targetSceneId = sceneMapping[`RI3D_MEDIA_1`];
                if(targetSceneId == null) return; // no target scene id for single media

                let requests = setOBSmediaSource(obsManager, camera, 'RI3D_MEDIA_1', targetSceneId, currentScene, camera.type == "file");
                await obsManager.sendBatchRequests(requests);
            }
        }
    }else if(key === "sceneRequest"){
        const request=globalConfig.camera.sceneRequest;
        try {
            const commands=require('./camera-plan').planScene(request,globalConfig);
            obsManager.sendBatchRequests(commands,response=>{
                const failed=response?.error || (Array.isArray(response) && response.some(r=>!r.requestStatus?.result));
                if(failed){obsManager.socketServer.emit('camera-error',response.error || 'OBS rejected a camera assignment; check source names and types.');return;}
                globalConfig.camera.activeSceneRequest=request;
                globalConfig.camera.sceneRequest={};
                obsManager.socketServer.emit('dataUpdated','camera','activeSceneRequest',request);
            });
        } catch(error){obsManager.socketServer.emit('camera-error',error.message);}
;
    }
}
module.exports={handleReaction};
