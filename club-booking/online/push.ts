import sdk from './vendor/gtpush.cjs';
import {updateRevision,type LiveCallbacks,type SubscribeUpdates} from '../app/live-updates';
const listeners=new Set<LiveCallbacks>();
let initialized=false;let online=false;
export const subscribeUpdates:SubscribeUpdates=(callbacks)=>{
 listeners.add(callbacks);
 callbacks.status(online?'connected':'connecting');
 if(!initialized){
  initialized=true;
  sdk.init({
   appid:'__UNI__F181DF8',
   onError:()=>{online=false;for(const c of listeners)c.status('disconnected')},
   onClientId:()=>{},
   onlineState:({online:connected})=>{const reconnect=connected&&!online;online=connected;for(const c of listeners){c.status(connected?'connected':'disconnected');if(reconnect)c.connected()}},
   onPushMsg:({message})=>{const revision=updateRevision(message);if(revision!==null)for(const c of listeners)c.change(revision)},
  });
 }else{sdk.enableSocket(true);if(online)callbacks.connected()}
 const resume=()=>{if(!document.hidden)sdk.enableSocket(true)};
 const offline=()=>{online=false;callbacks.status('disconnected')};
 document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);window.addEventListener('offline',offline);
 return()=>{listeners.delete(callbacks);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);window.removeEventListener('offline',offline);if(!listeners.size)sdk.enableSocket(false)};
};
