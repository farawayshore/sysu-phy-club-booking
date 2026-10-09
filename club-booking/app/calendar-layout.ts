// Call with the visible entries for one day. Unrelated time intervals use independent columns.
export function placement<T extends {start:string;end:string}>(items:T[]){
 const sorted=[...items].sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end));
 const groups:T[][]=[];
 let groupEnd='';
 for(const item of sorted){
  if(!groups.length||item.start>=groupEnd){groups.push([]);groupEnd=item.end;}
  groups[groups.length-1].push(item);
  if(item.end>groupEnd)groupEnd=item.end;
 }
 return groups.flatMap(group=>{
  const ends:string[]=[];
  const placed=group.map(item=>{
   let lane=ends.findIndex(end=>end<=item.start);
   if(lane<0)lane=ends.length;
   ends[lane]=item.end;
   return {...item,lane};
  });
  return placed.map(item=>{
   let span=1;
   // Fill adjacent free columns, stopping before a column occupied at any point in this interval.
   while(item.lane+span<ends.length&&!placed.some(other=>other.lane===item.lane+span&&other.start<item.end&&item.start<other.end))span++;
   return {...item,lanes:ends.length,span};
  });
 });
}
