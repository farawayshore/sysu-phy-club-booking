// Select the official SDK's H5 conditional blocks, as the uni-app compiler does.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const source=await readFile(new URL('../online/vendor/gtpush-source.cjs',import.meta.url),'utf8');
const hash=createHash('sha256').update(source).digest('hex');
const active=[true];const output=[];
for(const line of source.split('\n')){
 const directive=line.trim().match(/^\/\/ #(ifdef|ifndef|endif)\s*(.*)$/);
 if(directive){const [,op,platform]=directive;if(op==='endif')active.pop();else active.push(active.at(-1)&&(op==='ifdef'?platform==='H5':platform!=='H5'));continue;}
 if(active.at(-1))output.push(line);
}
if(active.length!==1)throw new Error('Unbalanced SDK platform directives');
await writeFile(new URL('../online/vendor/gtpush.cjs',import.meta.url),'const uni = require("../unipush-web-adapter.ts").pushWebAdapter;\n'+output.join('\n'));
await writeFile(new URL('../online/vendor/README.md',import.meta.url),`# uni-push Web transport\n\nSource: @dcloudio/uni-push 3.0.0-alpha-5030120260930001, official npm package.\nSHA-256 of unmodified gtpush-source.cjs: ${hash}\n\nRun node scripts/prepare-push-sdk.mjs to select H5 conditional blocks and bind our scoped Web adapter. No uni-app global or UI framework is installed. License files are retained beside the SDK. The SDK is included only in push-enabled online builds, never in offline HTML.\n`);
