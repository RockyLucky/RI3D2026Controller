const fs=require('fs');const path=require('path');
const envFile=path.join(__dirname,'.env');
if(fs.existsSync(envFile))process.loadEnvFile(envFile);
const raw=process.env.EVENT_YEAR || String(new Date().getFullYear());
if(!/^\d{4}$/.test(raw) || Number(raw)<2000 || Number(raw)>9999)throw new Error('EVENT_YEAR must be a four-digit year from 2000 to 9999');
module.exports={eventYear:raw};
