import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const provider=process.env.UNICLOUD_PROVIDER||'alipay';
if(!['alipay','aliyun'].includes(provider))throw new Error('Unsupported provider');
const directory=`outputs/unicloud-deploy/uniCloud-${provider}/cloudfunctions/booking-api`;
const pushEnabled=process.env.BOOKING_PUSH_ENABLED!=='0';
await mkdir(directory,{recursive:true});
await build({entryPoints:['unicloud/api.ts'],bundle:true,platform:'node',format:'cjs',target:'node16',define:{__BOOKING_PUSH_ENABLED__:JSON.stringify(pushEnabled)},outfile:directory+'/index.js'});
await writeFile(directory+'/package.json',JSON.stringify({name:'booking-api',version:'1.0.0',private:true,type:'commonjs',main:'index.js',dependencies:{},...(pushEnabled?{extensions:{'uni-cloud-push':{}}}:{}),'cloudfunction-config':{memorySize:128,timeout:10,path:'/booking-api'}},null,2));
