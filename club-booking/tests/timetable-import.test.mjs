import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const built=await build({entryPoints:['app/curriculum.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateCurriculum,courseEntries,curriculumForBrowser,CURRICULUM_KEY}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
import {addDays} from '../app/schedule.ts';
const data=validateCurriculum(JSON.parse(await readFile(new URL('./fixtures/timetables-before-optical.json',import.meta.url),'utf8')));
const g2=data.timetables.find(t=>t.grade===2),g3=data.timetables.find(t=>t.grade===3);
const date=(week,day)=>addDays('2026-09-07',(week-1)*7+day-1);
function entries(t,week,day,major='physics',groups=[]){return courseEntries(data,[t.id],[date(week,day)],{[t.id]:{majors:[major],groups,types:['required','elective','unknown','activity']}})}
test('five screenshot ranges preserve missing classes, room changes and late-week exceptions',()=>{
 assert.equal(g2.courses.length,17);
 for(let week=6;week<=16;week++){
  const all=Array.from({length:7},(_,i)=>entries(g2,week,i+1,'physics',['elite'])).flat();
  assert.equal(all.length,week===9?8:week===15?10:week===16?11:13,`week ${week}`);
 }
 assert.equal(entries(g2,9,5).filter(c=>c.activity==='基础物理实验').length,0);
 for(const [week,room] of [[6,'311'],[8,'311'],[10,'411'],[14,'411'],[15,'104'],[16,'104']])assert.ok(entries(g2,week,5).find(c=>c.activity==='基础物理实验').location.endsWith(room));
 assert.equal(entries(g2,15,1).some(c=>c.activity==='原子物理学'),false);
 assert.equal(entries(g2,10,5).some(c=>c.activity.startsWith('理论力学')),false);
 assert.equal(entries(g2,15,4).some(c=>c.activity.startsWith('人工智能')),false);
 assert.ok(entries(g2,16,4).some(c=>c.activity==='劳动教育'&&c.start==='16:30'&&c.end==='18:10'));
 for(const week of [1,5,17])assert.equal(Array.from({length:7},(_,i)=>entries(g2,week,i+1,'physics',['elite'])).flat().length,0);
});
test('AI is required; modern physics is the only optional elite overlay; neither grade leaks into optical',()=>{
 assert.ok(g2.courses.filter(c=>c.name.startsWith('人工智能')).every(c=>c.audiences[0].requirement==='required'));
 assert.deepEqual(g2.courses.filter(c=>c.audiences[0].group==='elite').map(c=>c.name),['现代物理导论']);
 assert.equal(entries(g2,6,2).some(c=>c.activity==='现代物理导论'),false);
 assert.equal(entries(g2,6,2,'physics',['elite']).find(c=>c.activity==='现代物理导论').courseTone,'special');
 for(const t of [g2,g3])for(let week=1;week<=17;week++)for(let day=1;day<=7;day++)assert.equal(entries(t,week,day,'optical',['elite','theory']).length,0);
});
test('second Word timetable adds nine rules, retains original rules and deduplicates shared events',async()=>{
 const baseline=JSON.parse(await readFile(new URL('./fixtures/timetables-before-second-import.json',import.meta.url),'utf8'));
 assert.deepEqual(g3.courses.slice(0,25),baseline.timetables[0].courses);
 assert.equal(g3.courses.length,34);
 assert.equal(entries(g3,6,4).filter(c=>c.activity==='热力学与统计物理').length,1);
 const solid=entries(g3,6,4).filter(c=>c.activity==='固体物理');assert.equal(solid.length,1);assert.match(solid[0].location,/逸305/);assert.match(solid[0].location,/逸407/);
 assert.ok(entries(g3,6,1).some(c=>c.activity==='生物物理'&&c.start==='10:10'&&c.end==='11:50'));
 assert.ok(entries(g3,10,1).some(c=>c.activity==='原子核物理简介'&&c.start==='14:20'));
 assert.equal(entries(g3,9,2).some(c=>c.activity==='电子技术实验'),false);
});
test('legacy browser caches receive new grades and rules while keeping stored edits and keys',async()=>{
 const saved=JSON.parse(await readFile(new URL('./fixtures/timetables-before-second-import.json',import.meta.url),'utf8'));
 saved.timetables[0].courses[0].location='保留用户修改';const raw=JSON.stringify(saved);
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:key=>key===CURRICULUM_KEY?raw:null}});
 try{const merged=curriculumForBrowser(data);assert.equal(merged.timetables.find(t=>t.grade===2).courses.length,17);assert.equal(merged.timetables[0].courses.length,34);assert.equal(merged.timetables[0].courses[0].location,'保留用户修改');assert.equal(raw,JSON.stringify(saved));}
 finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;}
});
