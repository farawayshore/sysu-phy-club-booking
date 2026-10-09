import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const built=await build({entryPoints:['app/live-updates.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {updateRevision,coalescedRefresh}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
test('only versioned booking invalidations trigger a refresh',()=>{
 assert.equal(updateRevision(JSON.stringify({payload:{type:'booking-state-changed',revision:9}})),9);
 assert.equal(updateRevision({payload:JSON.stringify({type:'booking-state-changed',revision:7})}),7);
 for(const message of ['{',null,{type:'other',revision:9},{type:'booking-state-changed',revision:-1},{type:'booking-state-changed',revision:'9'}])assert.equal(updateRevision(message),null);
});
test('bursts coalesce and a notification during a read is not dropped',async()=>{
 let count=0,release;
 const refresh=coalescedRefresh(async()=>{count++;if(count===1)await new Promise(r=>release=r)});
 const first=refresh();refresh();refresh();await Promise.resolve();assert.equal(count,1);
 refresh();refresh();release();await first;assert.equal(count,2);
 await refresh();assert.equal(count,3);
});

test('offline closes a half-open transport before the SDK reconnects',async()=>{
 const bundle=await build({entryPoints:['online/unipush-web-adapter.ts'],bundle:true,write:false,format:'esm',platform:'node'});
 const before=Object.fromEntries(['window','navigator','WebSocket'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const sockets=[];const net={onLine:true,language:'zh-CN'};
 class Socket extends EventTarget {constructor(){super();sockets.push(this)}close(){this.closed=true;this.dispatchEvent(new Event('close'))}send(){}}
 try{
  Object.defineProperty(globalThis,'window',{value:new EventTarget(),configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:net,configurable:true});
  Object.defineProperty(globalThis,'WebSocket',{value:Socket,configurable:true});
  const {pushWebAdapter:a}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
  const states=[];a.onNetworkStatusChange(state=>states.push(state.isConnected));a.connectSocket({url:'wss://test.invalid'});
  net.onLine=false;window.dispatchEvent(new Event('offline'));assert.equal(sockets[0].closed,true);
  net.onLine=true;window.dispatchEvent(new Event('online'));assert.deepEqual(states,[false,true]);
 }finally{for(const [key,descriptor]of Object.entries(before)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key]}}
});
