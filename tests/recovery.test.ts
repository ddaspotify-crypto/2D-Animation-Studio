import { describe,it,expect } from 'vitest';
import { createProject } from '../shared/model.js';
import { validateRecovery,type RecoveryRecord } from '../src/recovery/recoveryDatabase';
function record():RecoveryRecord{const p=createProject();return {id:p.id,project:p,updatedAt:Date.now(),drafts:{[p.activeSceneId]:{code:'// still editing',stale:true}},assets:[]};}
describe('Recovery validation',()=>{
 it('keeps unapplied draft separate from validated scene data',()=>{const r=record();expect(validateRecovery(r)).toEqual(r.project);expect(r.drafts[r.project.activeSceneId].code).toBe('// still editing');});
 it('rejects missing image bytes before replacing the editor',()=>{const r=record();r.project.assets=[{id:'a',name:'lost.png',path:`assets/${'a'.repeat(64)}.png`,folder:'',mime:'image/png',width:1,height:1}];expect(()=>validateRecovery(r)).toThrow('thiếu ảnh');});
 it('rejects unrelated draft scene IDs and malformed metadata',()=>{const r=record();r.drafts['not-a-scene']={code:'bad',stale:false};expect(()=>validateRecovery(r)).toThrow('Draft');const other=record();other.id='other-project';expect(()=>validateRecovery(other)).toThrow('không hợp lệ');});
});
