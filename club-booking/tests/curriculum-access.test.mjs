import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=async path=>{const r=await build({entryPoints:[path],bundle:true,write:false,format:'esm',platform:'node'});return import('data:text/javascript;base64,'+Buffer.from(r.outputFiles[0].text).toString('base64'))};
const {routeBookingRequest}=await bundle('worker/router.ts');
const {publicCurriculum}=await bundle('db/curriculum.ts');
const url='https://api.example/api/curriculum',origin='https://farawayshore.github.io';
const config={ALLOWED_ORIGINS:origin};
const bookings={GET:async()=>Response.json({}),POST:async()=>Response.json({}),DELETE:async()=>Response.json({})};
test('timetable endpoint is public read-only, including from the approved frontend',async()=>{
 let reads=0;const read=async()=>{reads++;return Response.json({version:1,timetables:[]})};
 for(const method of ['POST','PUT','PATCH','DELETE']){const response=await routeBookingRequest(new Request(url,{method,headers:{Origin:origin}}),config,bookings,read);assert.equal(response.status,405);assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin)}
 assert.equal(reads,0);
 const result=await routeBookingRequest(new Request(url,{headers:{Origin:origin}}),config,bookings,read);assert.equal(result.status,200);assert.equal(reads,1);
 for(const method of ['POST','PUT','PATCH','DELETE'])assert.equal((await routeBookingRequest(new Request(url,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':method}}),config,bookings,read)).status,403);
});
test('no published document returns an empty timetable, and malformed published content fails closed',async()=>{
 const db=row=>({prepare:()=>({bind:()=>({first:async()=>row})})});
 assert.deepEqual(await publicCurriculum(db(null)),{version:1,timetables:[]});
 assert.deepEqual(await publicCurriculum(db({data:'{"version":1,"timetables":[]}'})),{version:1,timetables:[]});
 await assert.rejects(()=>publicCurriculum(db({data:'{"version":2,"timetables":[]}'})));
});
test('online bundles do not import the local timetable source; offline bundle retains it',async()=>{
 for(const path of ['online/entry.tsx','worker/api.ts']){const result=await build({entryPoints:[path],bundle:true,write:false,metafile:true,platform:path.startsWith('worker')?'neutral':'browser',external:['cloudflare:workers'],define:{__BOOKING_API_BASE__:JSON.stringify('https://api.example'),'process.env.NODE_ENV':JSON.stringify('production')}});assert.ok(!Object.keys(result.metafile.inputs).some(p=>p.endsWith('data/timetables.json')||p.includes('resources/program-plans/')))}
 const offline=await build({entryPoints:['offline/entry.tsx'],bundle:true,write:false,metafile:true,platform:'browser'});assert.ok(Object.keys(offline.metafile.inputs).some(p=>p.endsWith('data/timetables.json')));
});
