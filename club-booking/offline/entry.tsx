import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import { today, bookingEnd, validate, overlaps, cancellationId, type Booking } from '../app/schedule';

import initialCurriculum from '../data/timetables.json';
import {curriculumForBrowser,validCourseFilters,findCourseConflicts,CURRICULUM_KEY} from '../app/curriculum';

// The single-file export uses browser-local persistence; hosted code keeps its D1 API.
const KEY = 'gongshi-club-booking-local-v1';
const reply = (data: unknown, status=200) => Response.json(data, {status});
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  if (input !== '/api/bookings') return originalFetch(input, init);
  const operate = () => {
    try {
      const bookings: Booking[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (!Array.isArray(bookings)) throw new Error('Invalid local data');
      if (!init?.method || init.method === 'GET') {
        const date = today();
        return reply({bookings: bookings.filter(b=>b.date>=date && b.date<=bookingEnd(date)).sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)), today:date});
      }
      const body = JSON.parse(String(init.body));
      if(init.method==='DELETE'){
        const id=cancellationId(body);if(!id)return reply({error:'请确认要取消的预约'},400);
        localStorage.setItem(KEY,JSON.stringify(bookings.filter(b=>b.id!==id)));
        return reply({id,cancelled:true});
      }
      if(init.method!=='POST')return reply({error:'不支持的操作'},405);
      const error = validate(body);
      if (error) return reply({error},400);
      const conflicts = bookings.filter(b=>b.date===body.date && overlaps(b,body));
      if (conflicts.some(b=>b.club===body.club)) return reply({kind:'duplicate',error:'您的社团已经预约相同时段，请勿重复预约'},409);
      const curriculum=curriculumForBrowser(initialCurriculum);const selected=body.selectedGrades??[];
      if(!Array.isArray(selected)||selected.length>20||selected.some((id:unknown)=>typeof id!=='string'||!curriculum.timetables.some(t=>t.id===id)))return reply({error:'请选择有效的年级课表'},400);
     if(!validCourseFilters(body.courseFilters,curriculum))return reply({error:'课表筛选选项无效'},400);
      const courses=findCourseConflicts(curriculum,selected,body,body.courseFilters);const acceptedCourses=Array.isArray(body.acceptedCourses)?body.acceptedCourses:[];
      if(courses.some(c=>!acceptedCourses.includes(c.confirmationKey)))return reply({kind:'course_conflict',conflicts:courses},409);
      const accepted = Array.isArray(body.accepted) ? body.accepted : [];
      if (conflicts.some(b=>!accepted.includes(b.id))) return reply({kind:'conflict',conflicts},409);
      const id = crypto.randomUUID();
      const booking: Booking = {id,club:body.club,activity:body.activity.trim(),location:body.location.trim(),date:body.date,start:body.start,end:body.end};
      localStorage.setItem(KEY, JSON.stringify([...bookings,booking]));
      return reply({id},201);
    } catch {
      return reply({error:'无法保存或读取本地预约，请使用允许本地存储的普通浏览器窗口。'},503);
    }
  };
  return navigator.locks ? navigator.locks.request(KEY,operate) : operate();
};
window.addEventListener('storage', e=>{if(e.key===KEY||e.key===CURRICULUM_KEY)window.dispatchEvent(new Event('focus'))});
createRoot(document.getElementById('root')!).render(<Home localOnly initialCurriculum={initialCurriculum}/>);
