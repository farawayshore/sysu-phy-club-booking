import test from 'node:test';
import assert from 'node:assert/strict';
import {today,addDays,monday,bookingEnd,bookingWeekIndex,timeLabel,validate,overlaps,SLOTS} from '../app/schedule.ts';
const now=new Date('2026-10-08T02:00:00Z');
const base={club:'测试社团',activity:'测试活动',location:'活动中心 201',date:'2026-10-09',start:'08:00',end:'09:40'};
const check=b=>validate({...base,...b},now,['测试社团']);
test('Shanghai midnight and calendar boundaries',()=>{assert.equal(today(new Date('2026-10-08T16:00:00Z')),'2026-10-09');assert.equal(addDays('2026-12-25',14),'2027-01-08');assert.equal(monday('2026-10-11'),'2026-10-05');assert.equal(monday('2026-10-12'),'2026-10-12')});
test('two calendar month horizon includes final date and rejects following day',()=>{assert.equal(check({date:'2026-12-08'}),null);assert.ok(check({date:'2026-12-09'}));assert.ok(check({date:'2026-10-07'}));assert.ok(check({date:'2026-10-08',start:'09:59',end:'11:00'}));assert.equal(check({date:'2026-10-08',start:'10:01',end:'11:00'}),null)});
test('minute input, club and activity validation',()=>{assert.equal(check({}),null);for(const b of [{start:'8:00'},{end:'24:00'},{end:'08:00'},{end:'08:60'},{activity:' '},{activity:'a'.repeat(61)},{club:'未配置社团'},{start:'18:00',end:'08:00'}])assert.ok(check(b));assert.ok(validate(null,now))});
test('exact period boundaries use class labels',()=>{assert.equal(timeLabel('08:00','09:40'),'第 1 节课–第 2 节课');assert.equal(timeLabel('08:01','09:40'),'08:01–09:40');assert.equal(timeLabel('20:50','21:35'),'第 11 节课');assert.equal(SLOTS.length,6)});
test('half-open intervals support adjacency and containment',()=>{assert.equal(overlaps({start:'08:00',end:'09:40'},{start:'09:40',end:'10:00'}),false);assert.equal(overlaps({start:'08:00',end:'09:40'},{start:'09:39',end:'10:00'}),true);assert.equal(overlaps({start:'08:00',end:'11:00'},{start:'09:00',end:'10:00'}),true)});

test('location must be nonblank text within 80 characters',()=>{for(const location of [undefined,null,42,'','  ','a'.repeat(81)])assert.ok(check({location}));assert.equal(check({location:'  南校园 · 活动中心 201  '}),null);assert.equal(check({location:'地'.repeat(80)}),null)});

 test('two-month boundary clamps month ends, leap years, and year rollover',()=>{
 for(const [start,end] of [['2026-10-08','2026-12-08'],['2026-12-31','2027-02-28'],['2023-12-31','2024-02-29'],['2026-07-31','2026-09-30'],['2026-01-31','2026-03-31']])assert.equal(bookingEnd(start),end);
 assert.equal(check({date:'2026-11-08'}),null);
 });
 test('week pagination stops at the week containing the inclusive final date',()=>{
 for(const start of ['2026-10-08','2026-10-11','2026-12-31','2023-12-31']){
 const end=bookingEnd(start),last=bookingWeekIndex(start,end),week=addDays(monday(start),last*7);
 assert.ok(week<=end);assert.ok(addDays(week,6)>=end);assert.ok(addDays(week,7)>end);
 }
 assert.equal(bookingWeekIndex('2026-10-08','2026-12-08'),9);
 });
