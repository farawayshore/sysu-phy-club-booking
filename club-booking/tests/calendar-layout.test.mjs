import test from 'node:test';
import assert from 'node:assert/strict';
import {placement} from '../app/calendar-layout.ts';
const event=(id,start,end)=>({id,start,end});
test('isolated morning courses keep full width despite afternoon overlaps',()=>{
 const input=[event('morning','08:00','09:40'),event('next','10:10','11:50'),...['a','b','c','d'].map(id=>event(id,'14:20','16:00'))];
 const result=placement(input);
 for(const id of ['morning','next']){const item=result.find(x=>x.id===id);assert.equal(item.lane,0);assert.equal(item.lanes,1);assert.equal(item.span,1);}
 assert.equal(result.find(x=>x.id==='a').lanes,4);
 assert.equal(placement(input.filter(x=>!['b','c','d'].includes(x.id))).every(x=>x.lanes===1),true);
});
test('connected overlaps expand into free columns without covering other entries',()=>{
 const result=placement([event('long','08:00','12:00'),event('a','08:00','09:00'),event('b','08:00','09:30'),event('later','09:30','11:00'),event('touching','12:00','13:00')]);
 assert.equal(result.find(x=>x.id==='later').span,2);
 assert.equal(result.find(x=>x.id==='touching').lanes,1);
 for(const a of result)for(const b of result){if(a.id===b.id||a.start>=b.end||b.start>=a.end)continue;assert.ok(a.lane+a.span<=b.lane||b.lane+b.span<=a.lane);}
 assert.deepEqual(placement([]),[]);
});
