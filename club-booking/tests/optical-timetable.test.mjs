import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {addDays} from '../app/schedule.ts';
const built=await build({entryPoints:['app/curriculum.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateCurriculum,courseEntries,curriculumForBrowser,CURRICULUM_KEY}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const load=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const current=validateCurriculum(await load('../data/timetables.json')),before=await load('./fixtures/timetables-before-optical.json');
const table=current.timetables.find(t=>t.grade===3),id=table.id;
const get=(data,week,day,majors)=>courseEntries(data,[id],[addDays('2026-09-07',(week-1)*7+day-1)],{[id]:{majors,groups:[],types:['required','elective','unknown','activity']}});
const opt=(w,d)=>get(current,w,d,['optical']);
test('optical timetable preserves independent practical and digital electronics sessions',()=>{
 assert.equal(table.courses.length,40);
 assert.ok(opt(6,3).some(c=>c.activity==='电子技术实验'&&c.start==='14:20'&&c.end==='18:10'));
 assert.equal(opt(6,2).some(c=>c.activity==='电子技术实验'),false);
 assert.equal(opt(9,3).some(c=>c.activity==='电子技术实验'),false);
 assert.ok(opt(10,3).some(c=>c.activity==='电子技术实验'));
 const digital=opt(6,5).find(c=>c.activity==='数字电子技术');assert.equal(digital.start,'10:10');assert.ok(digital.location.includes('逸406'));
 for(let week=1;week<=17;week++)for(const day of [3,5])assert.equal(opt(week,day).filter(c=>c.activity==='高等光学导论').length,1);
});
test('physics sessions remain unchanged across all teaching weeks',()=>{
 const project=rows=>rows.map(({id,activity,date,start,end,location,courseTypes})=>({id,activity,date,start,end,location,courseTypes}));
 for(let w=1;w<=17;w++)for(let d=1;d<=7;d++)assert.deepEqual(project(get(current,w,d,['physics'])),project(get(before,w,d,['physics'])));
});
test('shared sessions render once when both majors are selected; public elective stays hidden',()=>{
 assert.equal(table.courses.filter(c=>c.audiences?.length===2).length,12);
 const quantum=table.courses.find(c=>c.name==='量子光学');assert.equal(quantum.hiddenReason,'public-elective');
 for(let w=1;w<=17;w++)for(let d=1;d<=7;d++){
  const both=get(current,w,d,['physics','optical']);assert.ok(both.every(c=>c.activity!=='量子光学'));
  const keys=both.map(c=>JSON.stringify([c.activity,c.start,c.end,c.location]));assert.equal(new Set(keys).size,keys.length);
 }
});
test('existing local cache receives optical audiences without overwriting manual course edits',()=>{
 const saved=structuredClone(before);saved.timetables[0].courses.find(c=>c.id==='c08').location='个人调整地点';
 saved.timetables[0].courses.find(c=>c.id==='c15').audiences[0].requirement='unknown';
 const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:k=>k===CURRICULUM_KEY?JSON.stringify(saved):null}});
 try{
  const merged=curriculumForBrowser(current);const courses=merged.timetables[0].courses;
  assert.equal(courses.length,40);assert.equal(courses.find(c=>c.id==='c08').location,'个人调整地点');assert.equal(courses.find(c=>c.id==='c08').audiences.length,1);
  const policy=courses.find(c=>c.id==='c15');assert.equal(policy.audiences[0].requirement,'unknown');assert.equal(policy.audiences[1].major,'optical');
  assert.ok(get(merged,6,3,['optical']).some(c=>c.activity==='电子技术实验'));
 }finally{if(old)Object.defineProperty(globalThis,'localStorage',old);else delete globalThis.localStorage;}
});
test('same-time solid physics appears once with selected classrooms, including conflict confirmation',()=>{
 const solid=majors=>get(current,6,4,majors).filter(c=>c.activity==='固体物理');
 const both=solid(['physics','optical']);assert.equal(both.length,1);assert.match(both[0].location,/逸305/);assert.match(both[0].location,/逸407/);
 const optical=solid(['optical']);assert.equal(optical.length,1);assert.match(optical[0].location,/逸305/);assert.doesNotMatch(optical[0].location,/逸407/);
 assert.notEqual(both[0].confirmationKey,optical[0].confirmationKey);
 const different=structuredClone(current);const g=different.timetables.find(t=>t.id===id);const other=structuredClone(g.courses.find(c=>c.id==='g3-second-09'));other.id='different-time';other.start='12:00';other.end='13:00';g.courses.push(other);
 assert.equal(get(different,6,4,['physics']).filter(c=>c.activity==='固体物理').length,2);
});
test('PE projects and venues merge into one 体育 per grade and time after major filtering',()=>{
 const data=structuredClone(current);
 const g=data.timetables.find(t=>t.id===id);
 for(const c of g.courses.filter(c=>c.name.startsWith('体育')))c.location='不应显示的体育场地';
 for(const majors of [['physics'],['optical'],['physics','optical']]){
  const pe=get(data,6,1,majors).filter(c=>c.activity==='体育');
  assert.equal(pe.length,1);assert.equal(pe[0].location,'');assert.equal(pe[0].hideLocation,true);
  assert.equal(pe[0].start,'14:20');assert.equal(pe[0].end,'16:00');
  assert.ok(!pe[0].confirmationKey.includes('不应显示'));
 }
 const other={...structuredClone(g.courses.find(c=>c.name.startsWith('体育'))),id:'pe-later',start:'16:30',end:'18:10'};
 g.courses.push(other);
 assert.equal(get(data,6,1,['physics','optical']).filter(c=>c.activity==='体育').length,2);
 const nextGrade=structuredClone(g);nextGrade.id='other-grade';nextGrade.grade=4;nextGrade.label='大四';nextGrade.courses=[other];data.timetables.push(nextGrade);
 const both=courseEntries(data,[id,nextGrade.id],['2026-10-12']).filter(c=>c.activity==='体育');assert.equal(both.length,3);
 assert.ok(g.courses.some(c=>c.name==='体育-体能'&&c.location==='不应显示的体育场地'));
});
test('actual Monday higher quantum mechanics uses the full day column',async()=>{
 const {placement}=await import('../app/calendar-layout.ts');
 const placed=placement(get(current,6,1,['physics','optical']));
 const quantum=placed.find(c=>c.activity==='高等量子力学');assert.ok(quantum);assert.equal(quantum.lanes,1);assert.equal(quantum.span,1);
});
