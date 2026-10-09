// Narrow browser implementation of the uni APIs used by the pinned push SDK.
// In-memory identity gives each open page its own connection, including two tabs.
// No database access or administrator credential is exposed to this adapter.
const values = new Map<string, unknown>();
const sockets = new Set<WebSocket>();
type Result = { data?: unknown; errMsg?: string };
type StorageOptions = { key: string; data?: unknown; success?: (result: Result) => void; fail?: (result: Result) => void };
export const pushWebAdapter = {
 getSystemInfoSync: () => ({platform:'web',language:navigator.language,version:'1.0',model:'',brand:'',system:''}),
 getAccountInfoSync: () => ({miniProgram:{appId:''}}),
 getNetworkType: ({success}:{success:(r:{networkType:string})=>void}) => success({networkType:navigator.onLine?'unknown':'none'}),
 onNetworkStatusChange(callback:(r:{isConnected:boolean;networkType:string})=>void){
  const update=()=>{
   callback({isConnected:navigator.onLine,networkType:navigator.onLine?'unknown':'none'});
   // Browsers can emit offline while retaining a half-open socket. Close it so
   // the SDK cannot mistake that connection for a healthy one after resuming.
   if(!navigator.onLine)for(const socket of sockets)socket.close(1000,'offline');
  };
  window.addEventListener('online',update);window.addEventListener('offline',update);
 },
 setStorageSync(key:string,data:unknown){values.set(key,data)},
 getStorageSync(key:string){return values.get(key)??''},
 setStorage({key,data,success}:StorageOptions){values.set(key,data);success?.({})},
 getStorage({key,success,fail}:StorageOptions){if(values.has(key))success?.({data:values.get(key)});else fail?.({errMsg:'not found'})},
 connectSocket({url,success}:{url:string;success?:()=>void}){
  const socket=new WebSocket(url);socket.binaryType='arraybuffer';
  sockets.add(socket);socket.addEventListener('close',()=>sockets.delete(socket));
  // uni.connectSocket's success means task creation, not handshake completion.
  queueMicrotask(()=>success?.());
  return {
   send({data,success,fail}:{data:string|ArrayBuffer;success?:()=>void;fail?:(error:unknown)=>void}){try{socket.send(data);success?.()}catch(error){fail?.(error)}},
   close({code=1000,reason='',success,fail}:{code?:number;reason?:string;success?:()=>void;fail?:(error:unknown)=>void}){try{socket.close(code,reason);success?.()}catch(error){fail?.(error)}},
   onOpen(callback:()=>void){socket.addEventListener('open',callback)},
   onClose(callback:(e:CloseEvent)=>void){socket.addEventListener('close',callback)},
   onError(callback:(e:Event)=>void){socket.addEventListener('error',callback)},
   onMessage(callback:(e:{data:unknown})=>void){socket.addEventListener('message',callback)},
  };
 },
};
