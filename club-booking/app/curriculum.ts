import {addDays,overlaps,type Booking} from './schedule';
export const MAJORS={physics:'物理学',optical:'光信'} as const;
export const GROUPS={elite:'拔尖班',theory:'理论物理国际班'} as const;
export const COURSE_TYPES={required:'必修',elective:'选修',activity:'班级活动',unknown:'待核对'} as const;
export type Major=keyof typeof MAJORS;
export type ClassGroup=keyof typeof GROUPS;
export type CourseType=keyof typeof COURSE_TYPES;
// Each audience row is an alternative; major + group within a row must both match.
// Requirement belongs to the audience because one course can have different status in different programs.
export type CourseAudience={major:Major|'all';group:ClassGroup|'all';requirement:'required'|'elective'|'unknown'};
export type CourseFilter={majors:Major[];groups:ClassGroup[];types:CourseType[]};
export type CourseFilters=Record<string,CourseFilter>;
export function tableGrade(t:Timetable){return t.grade??({'大一':1,'大二':2,'大三':3,'大四':4}[t.label]||0)}
export function availableGroups(t:Timetable):ClassGroup[]{const grade=tableGrade(t);return grade===1?[]:grade===2?['elite']:['elite','theory']}
export function defaultCourseFilter(t:Timetable):CourseFilter{return {majors:['physics','optical'],groups:[],types:['required','elective','activity','unknown']}}
export function validCourseFilters(value:unknown,data:Curriculum):boolean{
 if(value===undefined)return true;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>20)return false;
 return Object.entries(value).every(([id,f])=>{
  const t=data.timetables.find(t=>t.id===id);if(!t||!f||typeof f!=='object')return false;
  const list=(v:unknown,allowed:string[]):boolean=>Array.isArray(v)&&v.length<=allowed.length&&new Set(v).size===v.length&&v.every(x=>typeof x==='string'&&allowed.includes(x));
  return list(f.majors,Object.keys(MAJORS))&&list(f.groups,availableGroups(t))&&list(f.types,Object.keys(COURSE_TYPES));
 });
}
function matchedAudiences(c:CourseRule,t:Timetable,f:CourseFilter){return (c.audiences??[]).filter(a=>(tableGrade(t)===1||a.major==='all'||f.majors.includes(a.major))&&(a.group==='all'||f.groups.includes(a.group))&&f.types.includes(c.category==='activity'?'activity':a.requirement))}
export function courseTone(c:CourseRule,t:Timetable,filter?:CourseFilter):'required'|'elective'|'special'|'activity'|'unknown'{
 const audiences=matchedAudiences(c,t,filter??defaultCourseFilter(t));
 if(audiences.length&&audiences.every(a=>a.group!=='all'))return 'special';
 if(c.category==='activity')return 'activity';
 const common=audiences.filter(a=>a.group==='all');
 if(common.some(a=>a.requirement==='required'))return 'required';
 if(common.some(a=>a.requirement==='elective'))return 'elective';
 return 'unknown';
}
export function matchedCourseTypes(c:CourseRule,t:Timetable,filter?:CourseFilter):CourseType[]{
 if(c.hiddenReason==='public-elective')return [];
 const f=filter??defaultCourseFilter(t);
 // An unclassified legacy course remains visible as pending review, never inferred as common or required.
 if(!c.audiences?.length)return f.types.includes(c.category==='activity'?'activity':'unknown')?[c.category==='activity'?'activity':'unknown']:[];
 const types=matchedAudiences(c,t,f).map(a=>c.category==='activity'?'activity' as const:a.requirement);
 return [...new Set(types)].filter(type=>f.types.includes(type));
}
export type CourseRule={id:string;name:string;weekday:number;weeks:number[];start:string;end:string;location:string;category?:'course'|'activity';hiddenReason?:'public-elective';audiences?:CourseAudience[]};
export type Timetable={id:string;label:string;term:string;week1Monday:string;note?:string;grade?:number;courses:CourseRule[];overrides:{date:string;sourceDate:string|null}[]};
export type Curriculum={version:number;timetables:Timetable[]};
export type CalendarEntry=Booking & {kind?:'course';gradeId?:string;term?:string;week?:number;confirmationKey?:string;courseTypes?:CourseType[];courseTone?:ReturnType<typeof courseTone>;audienceLabel?:string;hideLocation?:boolean};
export const CURRICULUM_KEY='physics-club-curriculum-v1';
const validDate=(v:unknown):v is string=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v+'T00:00:00Z'))&&new Date(v+'T00:00:00Z').toISOString().slice(0,10)===v;
const validTime=(v:unknown):v is string=>typeof v==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function validateCurriculum(value:unknown):Curriculum{
 const d=value as Curriculum;if(!d||d.version!==1||!Array.isArray(d.timetables)||d.timetables.length>20)throw new Error('课表文件须包含 version: 1 和 timetables，最多 20 份年级课表');
 const ids=new Set<string>();
 for(const t of d.timetables){
  if(!t||typeof t.id!=='string'||!t.id||t.id.length>80||ids.has(t.id)||typeof t.label!=='string'||!t.label.trim()||t.label.length>30||typeof t.term!=='string'||!t.term.trim()||t.term.length>80)throw new Error('年级标识不可重复，年级和学期名称不能为空');ids.add(t.id);
  if(t.grade!==undefined&&(!Number.isInteger(t.grade)||t.grade<1||t.grade>4))throw new Error('年级须为 1–4');
  if(t.note!==undefined&&(typeof t.note!=='string'||t.note.length>500))throw new Error('课表备注须为500字以内的文本');
  if(!validDate(t.week1Monday)||new Date(t.week1Monday+'T00:00:00Z').getUTCDay()!==1)throw new Error(`${t.label}：第 1 周开始日期必须是星期一`);
  if(!Array.isArray(t.courses)||t.courses.length>300||!Array.isArray(t.overrides)||t.overrides.length>366)throw new Error('课程或调课记录格式无效');
  const courseIds=new Set<string>();for(const c of t.courses){
   if(!c||typeof c.id!=='string'||!c.id||c.id.length>80||courseIds.has(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.location!=='string'||c.location.length>120)throw new Error(`${t.label}：课程名称、地点或标识无效`);courseIds.add(c.id);
   if(c.hiddenReason!==undefined&&c.hiddenReason!=='public-elective')throw new Error('隐藏原因须为公共选修课');
   if(c.category!==undefined&&!['course','activity'].includes(c.category))throw new Error('条目类型须为课程或班级活动');
   if(c.audiences!==undefined&&(!Array.isArray(c.audiences)||c.audiences.length>20||c.audiences.some(a=>!a||!['all',...Object.keys(MAJORS)].includes(a.major)||!['all',...availableGroups(t)].includes(a.group)||!['required','elective','unknown'].includes(a.requirement)||(tableGrade(t)===1&&a.major!=='all'))))throw new Error(`${c.name}：专业、班型或课程性质无效`);
   if(!Number.isInteger(c.weekday)||c.weekday<1||c.weekday>7||!Array.isArray(c.weeks)||!c.weeks.length||c.weeks.length>53||c.weeks.some(w=>!Number.isInteger(w)||w<1||w>53)||!validTime(c.start)||!validTime(c.end)||c.start>=c.end)throw new Error(`${c.name}：请检查星期、周次和起止时间`);
  }
  const dates=new Set<string>();for(const o of t.overrides){if(!o||!validDate(o.date)||(o.sourceDate!==null&&!validDate(o.sourceDate))||dates.has(o.date))throw new Error('调课日期格式错误或重复');dates.add(o.date)}
 }
 return d;
}
export function parseWeeks(input:string){
 const weeks=new Set<number>();for(const token of input.replaceAll('，',',').split(',').map(s=>s.trim())){
  const m=/^(\d{1,2})(?:\s*-\s*(\d{1,2}))?$/.exec(token);if(!m)throw new Error('周次请填写如 1-8,10-17 或 1,3,5');const a=Number(m[1]),b=Number(m[2]||m[1]);if(a<1||b>53||a>b)throw new Error('周次范围须为 1–53');for(let w=a;w<=b;w++)weeks.add(w);
 }return [...weeks].sort((a,b)=>a-b);
}
export function courseEntries(data:Curriculum,selected:string[],dates:string[],filters:CourseFilters={}):CalendarEntry[]{
 const entries:CalendarEntry[]=[];
 for(const t of data.timetables.filter(t=>selected.includes(t.id)))for(const date of dates){
  const override=t.overrides.find(o=>o.date===date);const scheduleDate=override?override.sourceDate:date;if(!scheduleDate)continue;
  const delta=Math.round((Date.parse(scheduleDate+'T00:00:00Z')-Date.parse(t.week1Monday+'T00:00:00Z'))/86400000);if(delta<0)continue;
  const week=Math.floor(delta/7)+1,weekday=delta%7+1;
  for(const c of t.courses.filter(c=>c.weekday===weekday&&c.weeks.includes(week))){
   const courseTypes=matchedCourseTypes(c,t,filters[t.id]);if(!courseTypes.length)continue;
   const audienceLabel=c.audiences?.length?[...new Set(c.audiences.map(a=>`${a.major==='all'?(tableGrade(t)===1?'未分专业':'各专业'):MAJORS[a.major]} · ${a.group==='all'?'各班型':GROUPS[a.group]}${c.category==='activity'?'':` · ${COURSE_TYPES[a.requirement]}`}`))].join('；'):'适用专业 / 班型待核对';
   const hideLocation=/^体育(?:$|[-—－（(])/.test(c.name.trim());
   const activity=hideLocation?'体育':c.name,location=hideLocation?'':c.location;
   const id=`course:${t.id}:${c.id}:${date}`;const confirmationKey=JSON.stringify([id,activity,c.start,c.end,location,courseTypes,audienceLabel]);
   entries.push({id,kind:'course',gradeId:t.id,club:t.label,term:t.term,week,activity,location,hideLocation,date,start:c.start,end:c.end,confirmationKey,courseTypes,audienceLabel,courseTone:courseTone(c,t,filters[t.id])});
  }
 }
 // Multiple personal timetables may describe the same session in different classrooms.
 // Merge only after audience filtering, so unselected majors never contribute a location.
 const groups=new Map<string,CalendarEntry[]>();
 for(const entry of entries){
  const key=JSON.stringify([entry.gradeId,entry.date,entry.activity,entry.start,entry.end,entry.courseTone,[...(entry.courseTypes??[])].sort()]);
  groups.set(key,[...(groups.get(key)??[]),entry]);
 }
 return [...groups.values()].map(group=>{
  if(group.length===1)return group[0];
  const first=group[0];
  const location=[...new Set(group.map(e=>e.location).filter(Boolean))].sort().join(' / ');
  const audienceLabel=[...new Set(group.flatMap(e=>(e.audienceLabel??'').split('；')).filter(Boolean))].sort().join('；');
  return {...first,location,audienceLabel,confirmationKey:JSON.stringify([first.id,first.activity,first.start,first.end,location,first.courseTypes,audienceLabel])};
 });
}
export function findCourseConflicts(data:Curriculum,selected:string[],booking:Pick<Booking,'date'|'start'|'end'>,filters:CourseFilters={}){return courseEntries(data,selected,[booking.date],filters).filter(c=>overlaps(c,booking))}
export function curriculumForBrowser(fallback:Curriculum){
 const raw=localStorage.getItem(CURRICULUM_KEY);if(!raw)return fallback;
 const saved=validateCurriculum(JSON.parse(raw));
 // Preserve stored rows and edits, fill missing labels, and append newly supplied source rules/grades.
 const tables=saved.timetables.map(t=>{const source=fallback.timetables.find(x=>x.id===t.id&&x.term===t.term);return {...t,...(source&&['两份物理学专业个人课表合并，不代表全年级完整课表；同课程同时间同教室去重，不同教室保留。仅物理学排课，光信与国际班专属排课待补。','个人选课课表，尚不代表全年级。已按2024级物理学及拔尖计划方案核对必修/选修；当前仅录入物理学上课时间，光信及国际班专属课表待补。'].includes(t.note??'')?{note:source.note}:{}),...(!t.courses.length&&source?{note:source.note}:{}),courses:[...t.courses.map(c=>{
  const known=source?.courses.find(x=>x.id===c.id&&x.name===c.name);
  // Add a newly supplied major only for the unchanged shared session; keep local edits and explicit requirements.
  if(c.audiences?.length&&known&&c.weekday===known.weekday&&c.start===known.start&&c.end===known.end&&c.location===known.location&&JSON.stringify(c.weeks)===JSON.stringify(known.weeks)&&c.hiddenReason===undefined&&c.category!=='activity'){
   return {...c,audiences:[...c.audiences,...(known.audiences??[]).filter(a=>!c.audiences!.some(saved=>saved.major===a.major))]};
  }
  if(c.audiences!==undefined||c.hiddenReason!==undefined||c.category==='activity')return c;
  return known?{...c,...(known.audiences?{audiences:known.audiences}:{}),...(known.hiddenReason?{hiddenReason:known.hiddenReason}:{})}:c;
 }),...(source?.courses??[]).filter(c=>!t.courses.some(saved=>saved.id===c.id)).slice(0,300-t.courses.length)]}});
 return {...saved,timetables:[...tables,...fallback.timetables.filter(t=>!tables.some(s=>s.id===t.id||tableGrade(s)===tableGrade(t))).slice(0,20-tables.length)]};
}
export function dateRange(start:string,end:string){const dates:string[]=[];for(let date=start;date<=end;date=addDays(date,1))dates.push(date);return dates}
