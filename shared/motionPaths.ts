import type { MotionPath, Point } from './model.js';

const cache=new WeakMap<MotionPath,{points:Point[];distances:number[];length:number}>();
const lerp=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function pathPolyline(path:MotionPath):Point[] {
  if(cache.has(path)) return cache.get(path)!.points;
  let points:Point[]=[];
  if(path.type==='circle'||path.type==='ellipse') {
    const [a,b]=path.points,rx=path.type==='circle'?Math.hypot(b.x-a.x,b.y-a.y):Math.abs(b.x-a.x),ry=path.type==='circle'?rx:Math.abs(b.y-a.y);
    points=Array.from({length:257},(_,i)=>({x:a.x+rx*Math.cos(i/256*Math.PI*2),y:a.y+ry*Math.sin(i/256*Math.PI*2)}));
  } else if(path.type==='bezier') {
    const steps=Math.max(8,Math.min(64,Math.floor(8192/(path.points.length-1))));
    points.push(path.points[0]);
    for(let i=0;i<path.points.length-1;i++) {
      const a=path.points[i],b=path.points[i+1],c=a.out??lerp(a,b,1/3),d=b.in??lerp(a,b,2/3);
      for(let j=1;j<=steps;j++){const t=j/steps,u=1-t;points.push({x:u*u*u*a.x+3*u*u*t*c.x+3*u*t*t*d.x+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*c.y+3*u*t*t*d.y+t*t*t*b.y});}
    }
  } else points=path.points.map(p=>({x:p.x,y:p.y}));
  const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
  cache.set(path,{points,distances,length:distances.at(-1)!});return points;
}
export function samplePath(path:MotionPath,progress:number):{point:Point;angle:number} {
  pathPolyline(path);const {points,distances,length}=cache.get(path)!;
  const target=Math.max(0,Math.min(1,progress))*length;
  let low=0,high=distances.length-1;while(high-low>1){const mid=(low+high)>>>1;if(distances[mid]<=target)low=mid;else high=mid;}
  const a=points[low],b=points[high],span=distances[high]-distances[low];
  return {point:lerp(a,b,span? (target-distances[low])/span:0),angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI};
}
export function simplifyFreehand(points:Point[],tolerance=2,maxPoints=2000):Point[] {
  if(points.length<=2)return points;
  const keep=new Set([0,points.length-1]),stack:[[number,number]]|[number,number][]=[[0,points.length-1]];
  while(stack.length){const [first,last]=stack.pop()!,a=points[first],b=points[last];let max=tolerance,index=-1;
    for(let i=first+1;i<last;i++){const p=points[i],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l)):0,q=lerp(a,b,t),d=Math.hypot(p.x-q.x,p.y-q.y);if(d>max){max=d;index=i;}}
    if(index>=0){keep.add(index);stack.push([first,index],[index,last]);}
  }
  const result=[...keep].sort((a,b)=>a-b).map(i=>points[i]);
  return result.length<=maxPoints?result:Array.from({length:maxPoints},(_,i)=>result[Math.floor(i*(result.length-1)/(maxPoints-1))]);
}
