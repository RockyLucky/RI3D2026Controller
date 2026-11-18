function browserUrl(raw){
 const url=String(raw).trim();
 if(!/\.m3u8(?:[?#]|$)/i.test(url))return url;
 const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('Invalid playlist URL');
 parsed.pathname=parsed.pathname.replace(/\/chunklist[^/]*\.m3u8$/i,'/playlist.m3u8');
 // OBS runs beside the local controller; no credentials are placed in this URL.
 return 'http://127.0.0.1:3000/ri3d26/feed-player.html?url='+encodeURIComponent(parsed.toString());
}
module.exports={browserUrl};
