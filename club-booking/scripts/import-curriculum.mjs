import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {build} from 'esbuild';

const root=resolve(import.meta.dirname,'..');
const remote=process.argv.includes('--remote');
if(process.argv.slice(2).some(arg=>!['--remote','--local','--public'].includes(arg)))throw new Error('Use --remote or --local, optionally --public');
if(remote&&process.argv.includes('--local'))throw new Error('Choose one database target');
const compiled=await build({absWorkingDir:root,entryPoints:['app/curriculum.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateCurriculum}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const input=validateCurriculum(JSON.parse(await readFile(resolve(root,'data/timetables.json'),'utf8')));
// Persist only the timetable schema, never arbitrary source metadata.
const document={version:1,timetables:input.timetables.map(t=>({id:t.id,label:t.label,term:t.term,...(t.grade?{grade:t.grade}:{}),week1Monday:t.week1Monday,...(t.note?{note:t.note}:{}),courses:t.courses.map(c=>({id:c.id,name:c.name,weekday:c.weekday,weeks:c.weeks,start:c.start,end:c.end,location:c.location,...(c.category?{category:c.category}:{}),...(c.audiences?{audiences:c.audiences.map(a=>({major:a.major,group:a.group,requirement:a.requirement}))}:{})})),overrides:t.overrides.map(o=>({date:o.date,sourceDate:o.sourceDate}))}))};
const data=JSON.stringify(document),quote=value=>"'"+value.replaceAll("'","''")+"'";
const timestamp=new Date().toISOString();
const visibility=process.argv.includes('--public')?'public':'private';
const sql=`INSERT INTO curriculum_documents (id,data,visibility,updated_at) VALUES ('current-term',${quote(data)},${quote(visibility)},${quote(timestamp)}) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at${process.argv.includes('--public')?',visibility=excluded.visibility':''};`;
const directory=resolve(root,'outputs/deployment');await mkdir(directory,{recursive:true});
const sqlPath=resolve(directory,'private-curriculum.sql');await writeFile(sqlPath,sql+'\n',{mode:0o600});
function execute(args){
 const result=spawnSync(process.execPath,[resolve(root,'node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB',remote?'--remote':'--local','--config','wrangler.api.jsonc',...args],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024});
 if(result.status!==0)throw new Error(result.stderr||result.stdout||String(result.error));
 return result.stdout;
}
execute(['--file',sqlPath,'--yes']);
const result=JSON.parse(execute(['--command',"SELECT data,visibility FROM curriculum_documents WHERE id='current-term'",'--json']));
const row=result[0]?.results?.[0];
if(row?.data!==data)throw new Error('Timetable database readback mismatch');
const receipt={target:remote?'remote':'local',id:'current-term',visibility:row.visibility,timetables:document.timetables.length,courseRules:document.timetables.reduce((n,t)=>n+t.courses.length,0),sha256:createHash('sha256').update(data).digest('hex'),verifiedAt:new Date().toISOString()};
await writeFile(resolve(directory,`curriculum-import-${remote?'remote':'local'}.json`),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify(receipt));
