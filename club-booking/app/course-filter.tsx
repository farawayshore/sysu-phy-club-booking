'use client';
import {MAJORS,GROUPS,COURSE_TYPES,availableGroups,defaultCourseFilter,tableGrade,type Curriculum,type CourseFilters,type CourseFilter} from './curriculum';
export default function CourseFilterPanel({curriculum,selected,onSelect,filters,onFilters}:{curriculum:Curriculum;selected:string[];onSelect:(ids:string[])=>void;filters:CourseFilters;onFilters:(filters:CourseFilters)=>void}){
 const orderedTables=[...curriculum.timetables].sort((a,b)=>(tableGrade(a)||99)-(tableGrade(b)||99));
 function toggle(id:string,key:keyof CourseFilter,value:string){const t=curriculum.timetables.find(t=>t.id===id)!;const f=filters[id]??defaultCourseFilter(t);const current=f[key] as string[];onFilters({...filters,[id]:{...f,[key]:current.includes(value)?current.filter(v=>v!==value):[...current,value]}})}
 return <div className="course-filter"><div className="filter-heading"><strong>叠加年级课表</strong></div>
 <div className="grade-options"><button type="button" aria-pressed={!selected.length} className={!selected.length?'selected':''} onClick={()=>onSelect([])}>仅社团活动</button>{orderedTables.map(t=><label className={selected.includes(t.id)?'selected':''} key={t.id}><input type="checkbox" checked={selected.includes(t.id)} onChange={e=>onSelect(e.target.checked?[...selected,t.id]:selected.filter(id=>id!==t.id))}/>{t.label}<span>{t.term}</span></label>)}</div>
 {orderedTables.filter(t=>selected.includes(t.id)).map(t=>{const f=filters[t.id]??defaultCourseFilter(t);return <fieldset className="profile-filter" key={t.id}><legend>{t.label} · 课表选项</legend>
 {tableGrade(t)===1?<p className="profile-first-year">大一暂不分专业</p>:<div className="profile-row"><strong>专业</strong><div>{Object.entries(MAJORS).map(([id,label])=><label key={id}><input type="checkbox" aria-label={`${t.label} ${label}`} checked={f.majors.includes(id as keyof typeof MAJORS)} onChange={()=>toggle(t.id,'majors',id)}/>{label}</label>)}</div></div>}
 {tableGrade(t)!==1&&<div className="profile-row"><strong>额外显示</strong><div>{availableGroups(t).map(id=><label key={id}><input type="checkbox" aria-label={`${t.label} ${GROUPS[id]}`} checked={f.groups.includes(id)} onChange={()=>toggle(t.id,'groups',id)}/>{GROUPS[id]}</label>)}</div></div>}
 <div className="profile-row"><strong>显示内容</strong><div>{Object.entries(COURSE_TYPES).map(([id,label])=><label key={id}><input type="checkbox" aria-label={`${t.label} ${label}`} checked={f.types.includes(id as keyof typeof COURSE_TYPES)} onChange={()=>toggle(t.id,'types',id)}/>{label}</label>)}</div></div>
 {tableGrade(t)!==1&&<p className="timetable-note">不勾选特殊班型时，仅显示基础课表；勾选后叠加专属课程和活动。</p>}
 <p className="timetable-note">{t.courses.length?`${t.courses.length} 条课程 / 活动规则`:'暂无课表，待录入'}{t.note?` · ${t.note}`:''}</p>
 {t.courses.some(c=>!c.audiences?.length)&&<p className="timetable-note">部分条目的专业与班型待核对，会保留显示；可取消“待核对”隐藏未分类课程。</p>}
 </fieldset>})}
 <p className="filter-help">{selected.length?'专业可多选，特殊班型可叠加。公共选修不显示；仅检查当前显示的课程 / 班级活动冲突，确认后仍可预约。':'选中年级后，可筛选专业、班型和课程性质。'}</p><div className="course-color-legend" aria-label="课表颜色说明"><span className="course-required">必修</span><span className="course-elective">选修</span><span className="course-special">特殊班型专属</span><span className="course-unknown">待核对 / 班级活动</span><small>由深至浅 · 其他色系为社团活动</small></div>
 </div>
}
