import { z } from 'zod';
const finite=z.number().finite().min(-1e7).max(1e7),size=z.number().finite().positive().max(16384);
export const transformSchema=z.object({x:finite,y:finite,width:size,height:size,scaleX:z.number().finite().positive().max(100),scaleY:z.number().finite().positive().max(100),rotation:finite,anchorX:z.number().min(0).max(1),anchorY:z.number().min(0).max(1),skewX:finite.optional(),flipX:z.boolean().optional(),flipY:z.boolean().optional()}).strict();
