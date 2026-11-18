const {test}=require('node:test');const assert=require('node:assert/strict');const {allowed}=require('../local-management');
const req=(address,host,origin,site)=>({socket:{remoteAddress:address},headers:{host,origin,'sec-fetch-site':site}});
test('local same origin accepted',()=>assert.equal(allowed(req('127.0.0.1','127.0.0.1:3000','http://127.0.0.1:3000','same-origin')),true));
test('CCR origin blocked even over loopback',()=>assert.equal(allowed(req('127.0.0.1','127.0.0.1:3000','https://ccr.students.mtu.edu','cross-site')),false));
test('remote clients blocked',()=>assert.equal(allowed(req('10.0.0.2','localhost:3000')),false));
test('rebound host blocked',()=>assert.equal(allowed(req('127.0.0.1','ccr.students.mtu.edu:3000')),false));
