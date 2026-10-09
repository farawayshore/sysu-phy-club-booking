import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['worker/router.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {routeBookingRequest}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const origin='https://farawayshore.github.io',api='https://example.workers.dev/api/bookings';
const config={ALLOWED_ORIGINS:origin,FRONTEND_URL:origin+'/sysu-phy-club-booking/'};
function handlers(){const calls=[];return {calls,GET:async()=>{calls.push('GET');return Response.json({bookings:[]})},POST:async()=>{calls.push('POST');return Response.json({id:'new'}, {status:201})},DELETE:async()=>{calls.push('DELETE');return Response.json({cancelled:true})}}}
const req=(method,headers={})=>new Request(api,{method,headers});
test('Pages preflight permits JSON POST and DELETE without invoking database handlers',async()=>{
 for(const method of ['POST','DELETE']){const h=handlers();const r=await routeBookingRequest(req('OPTIONS',{'Origin':origin,'Access-Control-Request-Method':method,'Access-Control-Request-Headers':'Content-Type'}),config,h);assert.equal(r.status,204);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.ok(r.headers.get('Access-Control-Allow-Methods').includes(method));assert.deepEqual(h.calls,[])}
});
test('foreign, deceptive and null origins cannot write or preflight',async()=>{
 for(const bad of ['https://farawayshore.github.io.evil.example','http://farawayshore.github.io','https://other.github.io','null',''])for(const method of ['POST','DELETE','OPTIONS']){const h=handlers();const r=await routeBookingRequest(req(method,{Origin:bad,'Access-Control-Request-Method':'POST'}),config,h);assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);assert.deepEqual(h.calls,[])}
});
test('unsupported preflight method and headers are rejected without invoking handlers',async()=>{
 for(const [method,header] of [['PUT','content-type'],['POST','authorization']]){const h=handlers();assert.equal((await routeBookingRequest(req('OPTIONS',{Origin:origin,'Access-Control-Request-Method':method,'Access-Control-Request-Headers':header}),config,h)).status,403);assert.deepEqual(h.calls,[])}
});
test('allowed requests and errors expose responses to Pages with Vary Origin, no credential sharing',async()=>{
 for(const method of ['GET','POST','DELETE']){const h=handlers();const r=await routeBookingRequest(req(method,{Origin:origin}),config,h);assert.equal(r.status,method==='POST'?201:200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.ok(r.headers.get('Vary').includes('Origin'));assert.equal(r.headers.get('Access-Control-Allow-Credentials'),null);assert.deepEqual(h.calls,[method])}
 const h=handlers();h.POST=async()=>{throw new Error('private database error')};const r=await routeBookingRequest(req('POST',{Origin:origin}),config,h);assert.equal(r.status,503);assert.equal(r.headers.get('Access-Control-Allow-Origin'),origin);assert.ok(!(await r.text()).includes('private'));
});
test('public GET and same-origin local preview stay usable; API root redirects to Pages',async()=>{
 const h=handlers();assert.equal((await routeBookingRequest(req('GET'),config,h)).status,200);assert.equal((await routeBookingRequest(req('POST',{Origin:new URL(api).origin}),config,h)).status,201);
 const r=await routeBookingRequest(new Request(new URL('/',api)),config,h);assert.equal(r.status,302);assert.equal(r.headers.get('Location'),config.FRONTEND_URL);
});
