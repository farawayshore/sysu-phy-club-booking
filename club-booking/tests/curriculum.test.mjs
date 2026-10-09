import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
const built=await build({entryPoints:['app/curriculum.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {validateCurriculum,parseWeeks,courseEntries,findCourseConflicts,defaultCourseFilter,availableGroups,curriculumForBrowser,CURRICULUM_KEY}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const fixture=JSON.parse(await readFile(new URL('./fixtures/timetables-before-second-import.json',import.meta.url),'utf8'));
const id=fixture.timetables[0].id;
const entries=(date,data=fixture,ids=[id])=>courseEntries(data,ids,[date]);
test('imported grade 3 has the 25 source rules and correct teaching-week dates',()=>{
 validateCurriculum(fixture);
 assert.equal(fixture.timetables[0].courses.length,25);
 assert.equal(new Set(fixture.timetables[0].courses.map(c=>c.name)).size,12);
 assert.equal(fixture.timetables[0].week1Monday,'2026-09-07');
 assert.deepEqual(entries('2026-10-08').map(c=>c.activity),['热力学与统计物理','固体物理','形势与政策','拓扑物理学']);
 assert.ok(entries('2026-10-08').every(c=>c.week===5));
 assert.equal(entries('2026-11-02').filter(c=>c.activity==='高等量子力学').length,0);
 const quantum=entries('2026-11-09').find(c=>c.activity==='高等量子力学');
 assert.equal(quantum.start,'10:10');assert.equal(quantum.week,10);
 assert.equal(entries('2026-09-06').length,0);
 assert.ok(entries('2027-01-01').every(c=>c.week===17));
});
test('no filter hides courses; multiple grades retain simultaneous courses',()=>{
 assert.deepEqual(entries('2026-10-08',fixture,[]),[]);
 const data=structuredClone(fixture);data.timetables.push({...structuredClone(data.timetables[0]),id:'grad2',label:'大二'});
 const all=entries('2026-10-08',data,[id,'grad2']);assert.equal(all.length,8);assert.equal(new Set(all.map(c=>c.id)).size,8);
 assert.deepEqual(all.filter(c=>c.start==='08:00').map(c=>c.club),['大三','大二']);
});
test('holiday and makeup overrides use the source day teaching week',()=>{
 const data=structuredClone(fixture);data.timetables[0].overrides=[{date:'2026-10-08',sourceDate:null},{date:'2026-10-10',sourceDate:'2026-10-07'}];validateCurriculum(data);
 assert.deepEqual(entries('2026-10-08',data),[]);
 const makeups=entries('2026-10-10',data);assert.deepEqual(makeups.map(c=>c.activity),entries('2026-10-07').map(c=>c.activity));
 assert.ok(makeups.every(c=>c.date==='2026-10-10'&&c.week===5));
});
test('conflict names, adjacency, gaps and updated confirmation signatures',()=>{
 const booking={date:'2026-10-08',start:'09:40',end:'10:10'};
 assert.deepEqual(findCourseConflicts(fixture,[id],booking),[]);
 const overlapping={...booking,start:'09:30'};
 const first=findCourseConflicts(fixture,[id],overlapping);assert.equal(first.length,1);assert.equal(first[0].activity,'热力学与统计物理');
 assert.deepEqual(findCourseConflicts(fixture,[],overlapping),[]);
 const updated=structuredClone(fixture);updated.timetables[0].courses.find(c=>c.id==='c04').name='更名后的课程';
 assert.notEqual(findCourseConflicts(updated,[id],overlapping)[0].confirmationKey,first[0].confirmationKey);
});
test('editable week ranges and invalid imports',()=>{
 assert.deepEqual(parseWeeks('1-3，5,10-12'),[1,2,3,5,10,11,12]);
 for(const input of ['','0','3-1','1-54','一'])assert.throws(()=>parseWeeks(input));
 for(const change of [d=>d.timetables[0].week1Monday='2026-09-08',d=>d.timetables[0].courses[0].end='07:00',d=>d.timetables[0].courses[0].weeks=[0],d=>d.timetables.push(d.timetables[0]),d=>d.timetables[0].overrides.push({date:'2026-02-30',sourceDate:null})]){
  const d=structuredClone(fixture);change(d);assert.throws(()=>validateCurriculum(d));
 }
});

test('major and class audiences have independent requirements; special classes can overlap',()=>{
 const table={id:'profiles',label:'大三',grade:3,term:'测试',week1Monday:'2026-10-05',overrides:[],courses:[]};
 const rule={id:'shared',name:'同名课程',weekday:4,weeks:[1],start:'08:00',end:'09:40',location:'甲楼'};
 table.courses=[
  {...rule,audiences:[{major:'physics',group:'all',requirement:'required'},{major:'optical',group:'all',requirement:'elective'}]},
  {...rule,id:'optical-time',start:'14:20',end:'16:00',location:'乙楼',audiences:[{major:'optical',group:'all',requirement:'required'}]},
  {...rule,id:'special',name:'专属课程',audiences:[{major:'physics',group:'elite',requirement:'required'},{major:'physics',group:'theory',requirement:'required'}]},
  {...rule,id:'event',name:'国际班活动',category:'activity',audiences:[{major:'all',group:'theory',requirement:'unknown'}]},
  {...rule,id:'pending',name:'旧课表未分类'}
 ];
 const data=validateCurriculum({version:1,timetables:[table]});
 const filter={majors:['physics'],groups:[],types:['required']};
 const get=f=>courseEntries(data,['profiles'],['2026-10-08'],{profiles:f});
 assert.deepEqual(get(filter).map(c=>c.id.split(':')[2]),['shared']);
 assert.equal(get({...filter,types:['elective']}).length,0); // optical's elective status does not leak into physics
 assert.deepEqual(get({...filter,majors:['optical'],types:['required','elective']}).map(c=>[c.location,c.start]),[['甲楼','08:00'],['乙楼','14:20']]);
 const both={...filter,groups:['elite','theory'],types:['required','activity']};
 assert.deepEqual(get(both).map(c=>c.activity),['同名课程','专属课程','国际班活动']);
 assert.equal(get(both).filter(c=>c.activity==='专属课程').length,1);
 assert.deepEqual(get({...filter,types:['unknown']}).map(c=>c.activity),['旧课表未分类']);
 assert.equal(findCourseConflicts(data,['profiles'],{date:'2026-10-08',start:'14:20',end:'15:00'},{profiles:filter}).length,0);
 assert.equal(findCourseConflicts(data,['profiles'],{date:'2026-10-08',start:'14:20',end:'15:00'},{profiles:{...filter,majors:['optical']}}).length,1);
});

test('invalid major/class data is rejected, legacy unclassified courses remain compatible',()=>{
 for(const patch of [{grade:1,major:'physics',group:'all'},{grade:2,major:'all',group:'theory'},{grade:3,major:'other',group:'all'}]){
  const data=structuredClone(fixture);data.timetables[0].grade=patch.grade;
  data.timetables[0].courses[0].audiences=[{major:patch.major,group:patch.group,requirement:'required'}];
  assert.throws(()=>validateCurriculum(data));
 }
 const legacy=structuredClone(fixture);for(const c of legacy.timetables[0].courses)delete c.audiences;
 assert.ok(entries('2026-10-08',legacy).every(c=>c.courseTypes.join(',')==='unknown'));
});


test('year four inherits both special overlays while defaults remain the base timetable',()=>{
 const tables=fixture.timetables;
 assert.deepEqual(availableGroups(tables.find(t=>t.grade===1)),[]);
 assert.deepEqual(availableGroups(tables.find(t=>t.grade===2)),['elite']);
 for(const grade of [3,4])assert.deepEqual(availableGroups(tables.find(t=>t.grade===grade)),['elite','theory']);
 for(const t of tables)assert.deepEqual(defaultCourseFilter(t).groups,[]);
});


test('reviewed current rules distinguish required and elective without hiding ordinary physics electives',()=>{
 const courses=fixture.timetables[0].courses;
 assert.equal(courses.filter(c=>c.audiences?.[0].requirement==='required').length,13);
 assert.equal(courses.filter(c=>c.audiences?.[0].requirement==='elective').length,12);
 assert.ok(courses.every(c=>c.audiences?.[0].major==='physics'&&c.audiences[0].group==='all'));
 const visible=entries('2026-10-08');
 assert.deepEqual(visible.map(c=>c.courseTone),['required','required','required','elective']);
 assert.equal(courseEntries(fixture,[id],['2026-10-08'],{[id]:{majors:['optical'],groups:[],types:['required','elective','unknown','activity']}}).length,0);
});

test('public electives stay stored but do not appear or trigger course conflicts',()=>{
 const data=structuredClone(fixture);data.timetables[0].courses.forEach(c=>c.hiddenReason='public-elective');
 validateCurriculum(data);assert.equal(data.timetables[0].courses.length,25);
 assert.deepEqual(entries('2026-10-08',data),[]);
 assert.deepEqual(findCourseConflicts(data,[id],{date:'2026-10-08',start:'08:00',end:'23:00'}),[]);
 data.timetables[0].courses[0].hiddenReason='unsupported';assert.throws(()=>validateCurriculum(data));
});

test('legacy local labels update without losing stored edits or overriding explicit labels',()=>{
 const saved=structuredClone(fixture);saved.timetables[0].courses.forEach(c=>delete c.audiences);
 saved.timetables[0].courses[0].location='用户修改的地点';
 saved.timetables[0].courses[1].audiences=[];
 saved.timetables[0].courses[2].hiddenReason='public-elective';
 saved.timetables[0].courses[3].name='用户自定义课程';
 const raw=JSON.stringify(saved);const old=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{getItem:key=>key===CURRICULUM_KEY?raw:null,setItem(){assert.fail('Read must not overwrite stored data')}}});
 try{
  const merged=curriculumForBrowser(fixture).timetables[0].courses;
  assert.equal(merged[0].location,'用户修改的地点');assert.equal(merged[0].audiences[0].requirement,'elective');
  assert.deepEqual(merged[1].audiences,[]);assert.equal(merged[2].hiddenReason,'public-elective');assert.equal(merged[3].audiences,undefined);
 }finally{if(old===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',old)}
});
