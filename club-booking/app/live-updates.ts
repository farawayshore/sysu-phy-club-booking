export type LiveStatus = 'connecting'|'connected'|'disconnected';
export type LiveCallbacks = {change:(revision:number)=>void;connected:()=>void;status:(status:LiveStatus)=>void};
export type SubscribeUpdates = (callbacks:LiveCallbacks)=>()=>void;

// Pushes only invalidate data; never trust a push as booking or timetable data.
export function updateRevision(message:unknown):number|null {
 try{
  let value=typeof message==='string'?JSON.parse(message):message;
  if(value && typeof value==='object' && 'payload' in value)value=typeof value.payload==='string'?JSON.parse(value.payload):value.payload;
  return value?.type==='booking-state-changed' && Number.isSafeInteger(value.revision) && value.revision>=0?value.revision:null;
 }catch{return null}
}

// A push received during a GET must schedule another GET, not be dropped.
export function coalescedRefresh(read:()=>Promise<void>){
 let running:Promise<void>|undefined;let pending=false;
 return function refresh():Promise<void>{
  pending=true;
  if(!running)running=Promise.resolve().then(async()=>{try{while(pending){pending=false;await read()}}finally{running=undefined}});
  return running;
 };
}
