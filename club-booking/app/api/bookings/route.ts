import { env } from 'cloudflare:workers';
import {allowedOrigin} from '../../request-origin';
import { today,bookingEnd,validate,cancellationId, type Booking } from '../../schedule';
import {publicCurriculum} from '../../../db/curriculum';
import {validCourseFilters,findCourseConflicts} from '../../curriculum';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try{const t=today();const result=await env.DB!.prepare('SELECT id, club, activity, location, date, start, end FROM bookings WHERE date BETWEEN ? AND ? ORDER BY date,start,created_at').bind(t,bookingEnd(t)).all();return reply({bookings:result.results,today:t})}catch{return reply({error:'暂时无法读取预约，请稍后重试'},503)}}
export async function POST(request:Request){
 try{
  if(!allowedOrigin(request,env.ALLOWED_ORIGINS))return reply({error:'请求来源无效'},403);
  if(Number(request.headers.get('content-length')||0)>8192)return reply({error:'请求内容过长'},413);
  const raw=await request.text();if(raw.length>8192)return reply({error:'请求内容过长'},413);
  const body=JSON.parse(raw);const err=validate(body);if(err)return reply({error:err},400);
  const b=body as Booking;const accepted=Array.isArray(body.accepted)?body.accepted.filter((x:unknown)=>typeof x==='string').slice(0,100):[];
  const selected=body.selectedGrades??[];
  const initialCurriculum=await publicCurriculum(env.DB!);
  if(!Array.isArray(selected)||selected.length>20||selected.some((id:unknown)=>typeof id!=='string'||!initialCurriculum.timetables.some(t=>t.id===id)))return reply({error:'请选择有效的年级课表'},400);
     if(!validCourseFilters(body.courseFilters,initialCurriculum))return reply({error:'课表筛选选项无效'},400);
  const courseConflicts=findCourseConflicts(initialCurriculum,selected,b,body.courseFilters);const acceptedCourses=Array.isArray(body.acceptedCourses)?body.acceptedCourses:[];
  if(courseConflicts.some(c=>!acceptedCourses.includes(c.confirmationKey))){
   const own=await env.DB!.prepare('SELECT id FROM bookings WHERE date=? AND start<? AND end>? AND club=? LIMIT 1').bind(b.date,b.end,b.start,b.club).first();
   if(own)return reply({error:'您的社团已经预约相同时段，请勿重复预约',kind:'duplicate'},409);
   return reply({kind:'course_conflict',conflicts:courseConflicts},409);
  }
  const id=crypto.randomUUID();
  // One atomic conditional insertion rechecks every current conflict, including concurrent submissions.
  const result=await env.DB!.prepare(`INSERT INTO bookings (id,club,activity,location,date,start,end,created_at)
   SELECT ?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE date=? AND start<? AND end>? AND (club=? OR id NOT IN (SELECT value FROM json_each(?))))`)
   .bind(id,b.club,b.activity.trim(),b.location.trim(),b.date,b.start,b.end,new Date().toISOString(),b.date,b.end,b.start,b.club,JSON.stringify(accepted)).run();
  if(result.meta.changes===1)return reply({id},201);
  const conflicts=await env.DB!.prepare('SELECT id,club,activity,location,date,start,end FROM bookings WHERE date=? AND start<? AND end>?').bind(b.date,b.end,b.start).all<Booking>();
  if(conflicts.results.some(x=>x.club===b.club))return reply({error:'您的社团已经预约相同时段，请勿重复预约',kind:'duplicate'},409);
  return reply({kind:'conflict',conflicts:conflicts.results},409);
 }catch{return reply({error:'预约未成功，请检查输入或稍后重试'},503)}
}

export async function DELETE(request:Request){
 if(!allowedOrigin(request,env.ALLOWED_ORIGINS))return reply({error:'请求来源无效'},403);
 if(Number(request.headers.get('content-length')||0)>1024)return reply({error:'请求内容过长'},413);
 let id:string|null;
 try{const raw=await request.text();if(raw.length>1024)return reply({error:'请求内容过长'},413);id=cancellationId(JSON.parse(raw))}catch{return reply({error:'取消预约信息无效'},400)}
 if(!id)return reply({error:'请确认要取消的预约'},400);
 try{await env.DB!.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();return reply({id,cancelled:true})}
 catch{return reply({error:'取消预约失败，请稍后重试'},503)}
}
