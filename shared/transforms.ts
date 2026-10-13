import type { Binding, Layer, Point, Transform } from './model.js';

export type Matrix = [number,number,number,number,number,number];
export const identity: Matrix = [1,0,0,1,0,0];
export function multiply(a:Matrix,b:Matrix):Matrix {return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export function inverse(m:Matrix):Matrix {const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-12) throw new Error('Transform không thể đảo ngược.');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
export function transformPoint(m:Matrix,p:Point):Point {return {x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]};}
export function matrixFromTransform(t:Transform):Matrix {
  const r=t.rotation*Math.PI/180,c=Math.cos(r),s=Math.sin(r),k=t.skewX??0;
  const sx=t.scaleX*(t.flipX?-1:1),sy=t.scaleY*(t.flipY?-1:1);
  return [c*sx,s*sx,(c*k-s)*sy,(s*k+c)*sy,t.x,t.y];
}
export function decompose(m:Matrix,base:Transform):Transform {
  const sx=Math.hypot(m[0],m[1])*(base.flipX?-1:1),det=m[0]*m[3]-m[1]*m[2],sy=det/sx;
  return {...base,x:m[4],y:m[5],rotation:Math.atan2(m[1]/sx,m[0]/sx)*180/Math.PI,scaleX:Math.abs(sx),scaleY:Math.abs(sy),skewX:(m[0]*m[2]+m[1]*m[3])/det,...(sy<0?{flipY:true}:base.flipY!==undefined?{flipY:false}:{})};
}
export function bindingSpace(parent:Layer,binding:Binding):Matrix {
  const p=parent.attachments?.find(a=>a.id===binding.attachmentId);
  const origin=p ? transformPoint(matrixFromTransform(parent.transform),{x:(p.x-parent.transform.anchorX)*parent.transform.width,y:(p.y-parent.transform.anchorY)*parent.transform.height}) : {x:parent.transform.x,y:parent.transform.y};
  const m=binding.mode==='transform' ? matrixFromTransform(parent.transform) : [...identity] as Matrix;
  m[4]=origin.x;m[5]=origin.y;return m;
}
