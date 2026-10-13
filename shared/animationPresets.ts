import { libraryMotionSchema,type LibraryMotion,type LibraryCategory } from './animationLibrary.js';
import type { AnimationProperty } from './model.js';
function preset(id:string,name:string,category:LibraryCategory,property:AnimationProperty,values:Record<string,number>[],duration:number,loop:'none'|'repeat'='repeat'):LibraryMotion{
  return libraryMotionSchema.parse({format:'studio-animation',version:1,id,name,category,description:category==='weapon'?'Đặt Pivot tại chuôi/khớp trước khi dùng. Chuyển động tương đối giữ vị trí và binding hiện tại.':'Chuyển động tương đối theo setup hiện tại. Chỉnh độ mạnh và thời lượng trước khi Apply.',duration,roles:[{id:'main',name:category==='background'?'Background':category==='weapon'?'Vũ khí':'Nhân vật',pivot:{x:.5,y:category==='background'?.5:1}}],tracks:[{roleId:'main',property,startTime:0,duration,easing:'easeInOut',loop,keyframes:values.map((v,i)=>({id:`key-${i}`,time:i===values.length-1?duration:duration*i/(values.length-1),...v}))}],paths:[]});
}
export const animationPresets:LibraryMotion[]=[
 preset('builtin-bg-drift','Background · Trôi nhẹ','background','position',[{x:0,y:0},{x:.1,y:0},{x:0,y:0}],6),
 preset('builtin-bg-zoom','Background · Zoom nhẹ','background','scale',[{scaleX:1,scaleY:1},{scaleX:1.08,scaleY:1.08},{scaleX:1,scaleY:1}],8),
 preset('builtin-bg-shake','Background · Rung','background','position',[{x:0,y:0},{x:-.01,y:.01},{x:.01,y:-.01},{x:0,y:0}],.4),
 preset('builtin-bg-fade','Background · Xuất hiện','background','opacity',[{opacity:-1},{opacity:0}],1,'none'),
 preset('builtin-breath','Nhân vật · Đứng thở','character','scale',[{scaleX:1,scaleY:1},{scaleX:1.015,scaleY:1.03},{scaleX:1,scaleY:1}],2.4),
 preset('builtin-walk-bob','Nhân vật · Nhấp nhô','character','position',[{x:0,y:0},{x:0,y:-.04},{x:0,y:0}],.8),
 preset('builtin-jump','Nhân vật · Nhảy','character','position',[{x:0,y:0},{x:0,y:-.4},{x:0,y:0}],.8,'none'),
 preset('builtin-lean','Nhân vật · Nghiêng','character','rotation',[{rotation:0},{rotation:5},{rotation:0}],1.4),
 preset('builtin-hit','Nhân vật · Trúng đòn','character','rotation',[{rotation:0},{rotation:-7},{rotation:5},{rotation:0}],.4,'none'),
 preset('builtin-sword-sway','Vũ khí · Đung đưa quanh chuôi','weapon','rotation',[{rotation:0},{rotation:-6},{rotation:0}],1.2),
 preset('builtin-sword-lift','Vũ khí · Nâng / hạ','weapon','rotation',[{rotation:0},{rotation:-20},{rotation:0}],1.4),
 preset('builtin-sword-slash','Vũ khí · Chém','weapon','rotation',[{rotation:0},{rotation:-25},{rotation:40},{rotation:0}],.6,'none'),
 preset('builtin-recoil','Vũ khí · Giật lùi','weapon','position',[{x:0,y:0},{x:-.05,y:0},{x:0,y:0}],.3,'none'),
 preset('builtin-weapon-shake','Vũ khí · Rung nhẹ','weapon','rotation',[{rotation:0},{rotation:-2},{rotation:2},{rotation:0}],.35),
];
