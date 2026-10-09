"""Extract anonymous course rows from the registrar's Flat OPC Word export."""
import argparse,json,re,xml.etree.ElementTree as E
from pathlib import Path

def parse(path):
 root=E.parse(path).getroot();W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
 rows=root.findall('.//'+W+'tbl/'+W+'tr');days=[];x=0
 def width(cell):
  span=cell.find(W+'tcPr/'+W+'gridSpan');return int(span.get(W+'val')) if span is not None else 1
 def text(cell):return ''.join(t.text or '' for t in cell.iter(W+'t'))
 for cell in rows[0].findall(W+'tc'):
  n=width(cell);name=text(cell)
  if name.startswith('星期'):days.append((x,x+n,{'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'日':7}[name[-1]]))
  x+=n
 records=[];active={}
 for row in rows[1:]:
  cells=row.findall(W+'tc');time=re.search(r'(\d{2}:\d{2})~(\d{2}:\d{2})',text(cells[0]));assert time,'Missing period time'
  start,end=time.groups();x=0
  for cell in cells:
   n=width(cell);key=(x,x+n);vm=cell.find(W+'tcPr/'+W+'vMerge')
   if vm is not None and vm.get(W+'val')!='restart':
    if key in active:active[key]['end']=end
   else:
    active.pop(key,None);parts=text(cell).split('/')
    if len(parts)>=5 and '每周' in parts[0]:
     match=re.fullmatch(r'(\d+)(?:-(\d+))?每周',parts[0]);assert match,'Unsupported week format'
     a,b=int(match[1]),int(match[2] or match[1]);kind,name=parts[1].split(')',1)
     c={'name':name,'weekday':next(d for lo,hi,d in days if lo<=x and x+n<=hi),'weeks':list(range(a,b+1)),'start':start,'end':end,'location':parts[3],'sourceCategory':kind+')'}
     records.append(c);active[key]=c
   x+=n
 return records
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('file',type=Path);ap.add_argument('output',type=Path);args=ap.parse_args();args.output.write_text(json.dumps(parse(args.file),ensure_ascii=False,indent=2)+'\n')
