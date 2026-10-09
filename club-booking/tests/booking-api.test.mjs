import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const built=await build({entryPoints:['app/booking-api.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {bookingApiFetch}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
test('only an explicit gateway pre-execution rejection may retry a write',async()=>{const original=global.fetch;try{let n=0;global.fetch=async()=>++n===1?Response.json({error:{code:'InternalBizError',message:'no_matching_function_for_path /test'}},{status:404}):Response.json({id:'ok'},{status:201});assert.equal((await bookingApiFetch('bookings',{method:'POST'})).status,201);assert.equal(n,2);n=0;global.fetch=async()=>{n++;throw new Error('network')};await assert.rejects(bookingApiFetch('bookings',{method:'POST'}));assert.equal(n,1);n=0;global.fetch=async()=>{n++;return Response.json({error:'other'},{status:503})};assert.equal((await bookingApiFetch('bookings',{method:'POST'})).status,503);assert.equal(n,1)}finally{global.fetch=original}});
