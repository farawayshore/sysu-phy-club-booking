import test from 'node:test';
import assert from 'node:assert/strict';
import {timelineSegments,timelineScale,minutes,validate,today,addDays} from '../app/schedule.ts';
test('timeline covers every minute of the day without gaps or overlaps',()=>{
 const segments=timelineSegments();assert.equal(segments[0].start,'00:00');assert.equal(segments.at(-1).end,'24:00');
 for(let i=1;i<segments.length;i++)assert.equal(segments[i-1].end,segments[i].start);
 assert.equal(segments.filter(s=>s.isClass).length,11);
 assert.ok(segments.some(s=>s.label==='午饭 / 午休'&&s.start==='11:50'&&s.end==='14:20'));
 assert.ok(segments.some(s=>s.label==='课间'&&s.start==='08:45'&&s.end==='08:55'));
 assert.ok(segments.some(s=>s.label==='晚饭时间'&&s.start==='18:10'&&s.end==='19:00'));
 assert.equal(segments.reduce((sum,s)=>sum+minutes(s.end)-minutes(s.start),0),1440);
});
test('equal durations have equal height throughout the day; lunch stays proportional',()=>{
 const s=timelineScale([]);
 for(const [start,end] of [['00:00','00:45'],['08:00','08:45'],['12:00','12:45'],['20:50','21:35']])assert.equal(s.span(start,end),90);
 assert.equal(s.span('08:45','08:55'),20);assert.equal(s.span('11:50','14:20'),300);assert.equal(s.height,2880);
 assert.equal(s.span('12:00','12:01'),2);assert.equal(s.expanded,false);
});
test('only overflowing occupied intervals expand and remain aligned across boundaries',()=>{
 const items=[{id:'short',start:'12:00',end:'12:01'},{id:'next',start:'12:01',end:'12:46'}];
 const s=timelineScale(items,{short:100,next:70});
 assert.equal(s.span('12:00','12:01'),100);assert.equal(s.span('12:01','12:46'),90);
 assert.equal(s.y('12:01'),s.y('12:00')+100);assert.equal(s.span('08:00','08:45'),90);
 assert.equal(s.height,2978);assert.equal(s.expanded,true);
 const restored=timelineScale([items[1]],{short:100,next:70});assert.equal(restored.height,2880);
 const overlap=timelineScale([...items,{id:'overlap',start:'12:00',end:'12:02'}],{short:100,overlap:240});
 assert.ok(overlap.span('12:00','12:02')>=240);assert.ok(overlap.span('12:00','12:01')>=100);
});
test('non-class custom bookings including midnight and meal times are accepted',()=>{
 const now=new Date();const base={id:'test',club:'SPS',activity:'活动',location:'物院',date:addDays(today(now),1)};
 for(const [start,end] of [['00:00','00:30'],['08:45','08:55'],['12:00','13:00'],['18:10','18:50'],['23:00','23:59']])assert.equal(validate({...base,start,end},now),null);
});
