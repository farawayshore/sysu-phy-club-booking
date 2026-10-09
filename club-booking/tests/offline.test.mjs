import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {webcrypto} from 'node:crypto';
import {build} from 'esbuild';
import {today,addDays,bookingEnd} from '../app/schedule.ts';
const source=(await readFile(new URL('../offline/entry.tsx',import.meta.url),'utf8')).replace(/^import .*react-dom\/client.*\n/m,'').replace(/^import Home.*\n/m,'').replace(/^createRoot.*\n/m,'');
const compiled=await build({stdin:{contents:source,resolveDir:fileURLToPath(new URL('../offline/',import.meta.url)),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser'});
function context(store=new Map(),blocked=false){
 const window={fetch:()=>{throw new Error('Unexpected network call')},addEventListener(){},dispatchEvent(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(blocked)throw new Error('Quota exceeded');store.set(k,v)}};
 vm.runInNewContext(compiled.outputFiles[0].text,{window,localStorage,navigator:{},Response,crypto:webcrypto,Event,console});
 return {window,store};
}
const base={club:'SPS',activity:'离线测试',location:'活动中心 201',date:addDays(today(),1),start:'08:00',end:'09:40'};
const post=(app,data)=>app.window.fetch('/api/bookings',{method:'POST',body:JSON.stringify(data)});
test('local save, reopen, location and same/other club conflict flow',async()=>{
 const app=context();
 const first=await post(app,base);assert.equal(first.status,201);const {id}=await first.json();
 const reopened=context(app.store);const list=await (await reopened.window.fetch('/api/bookings')).json();assert.equal(list.bookings.length,1);assert.equal(list.bookings[0].location,base.location);
 assert.equal((await post(app,{...base,accepted:[id]})).status,409);
 const second={...base,club:'torchwood',location:'图书馆 202'};
 const conflict=await post(app,second);assert.equal(conflict.status,409);assert.equal((await conflict.json()).conflicts[0].location,base.location);
 assert.equal((await post(app,{...second,accepted:[id]})).status,201);
 assert.equal((await post(app,{...base,club:'学生会',accepted:[id]})).status,409);
 assert.equal((await post(app,{...base,start:'09:40',end:'10:00'})).status,201);
});
test('invalid location and unavailable storage never claim success',async()=>{
 const app=context();assert.equal((await post(app,{...base,location:'  '})).status,400);
 const unavailable=context(new Map(),true);assert.equal((await post(unavailable,base)).status,503);
});
const cancel=(app,id,confirmed=true)=>app.window.fetch('/api/bookings',{method:'DELETE',body:JSON.stringify({id,confirmed})});
test('cancellation requires confirmation, deletes only selected booking and persists',async()=>{
 const app=context();const {id}=await (await post(app,base)).json();
 const {id:other}=await (await post(app,{...base,club:'学生会',accepted:[id]})).json();
 assert.equal((await cancel(app,id,false)).status,400);
 let list=await (await app.window.fetch('/api/bookings')).json();assert.equal(list.bookings.length,2);
 assert.equal((await cancel(app,id)).status,200);
 list=await (await context(app.store).window.fetch('/api/bookings')).json();assert.deepEqual(list.bookings.map(b=>b.id),[other]);
 assert.equal((await cancel(app,id)).status,200); // safe retry
 assert.equal((await cancel(app,other)).status,200);
 assert.equal((await post(app,base)).status,201); // released time is bookable again
});
test('failed cancellation preserves the booking',async()=>{
 const app=context();const {id}=await (await post(app,base)).json();
 assert.equal((await cancel(context(app.store,true),id)).status,503);
 const list=await (await app.window.fetch('/api/bookings')).json();assert.equal(list.bookings[0].id,id);
});

const curriculumKey='physics-club-curriculum-v1';
function withCourses(){
 const date=base.date;const weekday=(new Date(date+'T00:00:00Z').getUTCDay()+6)%7+1;
 const table={id:'test-grade',label:'测试年级',term:'测试学期',week1Monday:addDays(date,1-weekday),courses:[{id:'test-course',name:'冲突课程',weekday,weeks:[1],start:base.start,end:base.end,location:'教学楼'}],overrides:[]};
 const data={version:1,timetables:[table,{...structuredClone(table),id:'another-grade',label:'另一年级'}]};
 const app=context(new Map([[curriculumKey,JSON.stringify(data)]]));return {app,data};
}
test('selected grades require named course confirmation before saving; no selection does not',async()=>{
 const {app}=withCourses();const payload={...base,selectedGrades:['test-grade','another-grade']};
 let response=await post(app,payload);assert.equal(response.status,409);let result=await response.json();assert.equal(result.kind,'course_conflict');assert.equal(result.conflicts.length,2);assert.equal(result.conflicts[0].activity,'冲突课程');
 assert.equal((await (await app.window.fetch('/api/bookings')).json()).bookings.length,0);
 response=await post(app,{...payload,acceptedCourses:result.conflicts.map(c=>c.confirmationKey)});assert.equal(response.status,201);
 assert.equal((await post(withCourses().app,base)).status,201);
});
test('course and other-club confirmations are both required; edited timetable invalidates acceptance',async()=>{
 const {app,data}=withCourses();const {id}=await (await post(app,base)).json();
 const payload={...base,club:'学生会',selectedGrades:['test-grade']};
 const warning=await (await post(app,payload)).json();assert.equal(warning.kind,'course_conflict');
 const acceptedCourses=warning.conflicts.map(c=>c.confirmationKey);
 const activityWarning=await (await post(app,{...payload,acceptedCourses})).json();assert.equal(activityWarning.kind,'conflict');assert.equal(activityWarning.conflicts[0].id,id);
 data.timetables[0].courses[0].name='更新的课程名称';app.store.set(curriculumKey,JSON.stringify(data));
 const recheck=await (await post(app,{...payload,acceptedCourses,accepted:[id]})).json();assert.equal(recheck.kind,'course_conflict');assert.equal(recheck.conflicts[0].activity,'更新的课程名称');
 assert.equal((await post(app,{...payload,accepted:[id],acceptedCourses:recheck.conflicts.map(c=>c.confirmationKey)})).status,201);
 assert.equal((await post(app,{...payload,accepted:[id],acceptedCourses:recheck.conflicts.map(c=>c.confirmationKey)})).status,409);
});

test('offline storage includes the last permitted date and rejects the next day',async()=>{
 const app=context(),end=bookingEnd(today());
 assert.equal((await post(app,{...base,date:end})).status,201);
 const list=await (await context(app.store).window.fetch('/api/bookings')).json();assert.equal(list.bookings[0].date,end);
 assert.equal((await post(app,{...base,date:addDays(end,1)})).status,400);
});

test('local booking uses the same major/type filter as calendar and rejects malformed filters',async()=>{
 const {app,data}=withCourses();const t=data.timetables[0];t.grade=3;t.courses[0].audiences=[{major:'optical',group:'elite',requirement:'required'}];app.store.set(curriculumKey,JSON.stringify(data));
 const payload={...base,selectedGrades:['test-grade'],courseFilters:{'test-grade':{majors:['optical'],groups:['elite','theory'],types:['required']}}};
 assert.equal((await post(app,payload)).status,409);
 for(const courseFilters of [null,[],{'test-grade':{majors:['bogus'],groups:['elite'],types:['required']}},{unknown:{majors:[],groups:[],types:[]}}])assert.equal((await post(app,{...payload,courseFilters})).status,400);
 payload.courseFilters['test-grade'].majors=['physics'];
 assert.equal((await post(app,payload)).status,201);
});
