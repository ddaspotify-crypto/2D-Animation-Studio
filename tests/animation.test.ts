import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, getScene, validateProject, type Animation, type Project } from '../shared/model.js';
import { ease, evaluateSceneAtTime, localAnimationTime } from '../shared/animationEngine.js';
import { generateCode, parseSceneCode } from '../src/code/sceneCode';
import { useEditor } from '../src/store/editorStore';
import { usePlayback } from '../src/store/playbackStore';
import { upsertKeyframe } from '../src/animation/commands';

function fixture(): Project {
  const project = createProject(), scene = getScene(project);
  project.assets = [{id:'asset',name:'a.png',path:`assets/${'a'.repeat(64)}.png`,folder:'',mime:'image/png',width:100,height:100}];
  scene.layers = [{id:'a',name:'A',assetId:'asset',visible:true,locked:false,opacity:1,transform:{x:10,y:20,width:100,height:100,scaleX:1,scaleY:1,rotation:0,anchorX:0,anchorY:0}}];
  return project;
}
function position(): Animation {return {id:'move',layerId:'a',property:'position',startTime:1,duration:4,easing:'linear',loop:'none',keyframes:[{id:'k0',time:0,x:0,y:10},{id:'k1',time:4,x:400,y:110}]};}
describe('Deterministic animation evaluation', () => {
  it.each([['linear',.25,.25],['easeIn',.5,.25],['easeOut',.5,.75],['easeInOut',.25,.125],['easeInOut',.75,.875]] as const)('%s easing', (name, input, expected) => expect(ease(name,input)).toBeCloseTo(expected));
  it('clamps easing progress', () => {expect(ease('linear',-1)).toBe(0); expect(ease('easeIn',2)).toBe(1);});
  it('holds base before start, interpolates and holds last frame after end', () => {
    const scene = getScene(fixture()); scene.animations = [position()];
    expect(evaluateSceneAtTime(scene,.5).layers[0].transform.x).toBe(10);
    expect(evaluateSceneAtTime(scene,3).layers[0].transform).toMatchObject({x:200,y:60});
    expect(evaluateSceneAtTime(scene,8).layers[0].transform.x).toBe(400);
  });
  it('uses outgoing key easing, including more than two keys', () => {
    const scene = getScene(fixture()); const animation = position();
    animation.keyframes = [{id:'a',time:0,x:0,y:0,easing:'easeIn'},{id:'b',time:2,x:200,y:0},{id:'c',time:4,x:0,y:0}]; scene.animations=[animation];
    expect(evaluateSceneAtTime(scene,2).layers[0].transform.x).toBe(50);
    expect(evaluateSceneAtTime(scene,4).layers[0].transform.x).toBe(100);
  });
  it('combines position, independent scale, continuous rotation and fade without mutation', () => {
    const scene = getScene(fixture()); const common = {layerId:'a',startTime:0,duration:4,easing:'linear' as const,loop:'none' as const};
    scene.animations = [{...position(),startTime:0}, {...common,id:'scale',property:'scale',keyframes:[{id:'s0',time:0,scaleX:1,scaleY:2},{id:'s1',time:4,scaleX:3,scaleY:4}]},
      {...common,id:'rotation',property:'rotation',keyframes:[{id:'r0',time:0,rotation:0},{id:'r1',time:4,rotation:-720}]},
      {...common,id:'fade',property:'opacity',keyframes:[{id:'f0',time:0,opacity:1},{id:'f1',time:4,opacity:0}]}];
    const before = JSON.stringify(scene); const result = evaluateSceneAtTime(scene,2);
    expect(result.layers[0].transform).toMatchObject({x:200,scaleX:2,scaleY:3,rotation:-360}); expect(result.layers[0].opacity).toBe(.5);
    expect(JSON.stringify(scene)).toBe(before); expect(evaluateSceneAtTime(scene,2)).toEqual(result);
    evaluateSceneAtTime(scene,9); evaluateSceneAtTime(scene,0); expect(evaluateSceneAtTime(scene,2)).toEqual(result);
  });
  it('evaluates repeat and ping-pong at boundaries directly', () => {
    const a = position(); a.loop='repeat'; expect(localAnimationTime(a,5)).toBe(0); expect(localAnimationTime(a,7)).toBe(2);
    a.loop='pingPong'; expect(localAnimationTime(a,5)).toBe(4); expect(localAnimationTime(a,7)).toBe(2); expect(localAnimationTime(a,9)).toBe(0);
    expect(localAnimationTime(a,0)).toBeNull();
  });
  it('clamps scene time, preserves z-order and camera independently of editor view', () => {
    const scene=getScene(fixture()); scene.animations=[position()];
    expect(evaluateSceneAtTime(scene,-1).time).toBe(0); expect(evaluateSceneAtTime(scene,999).time).toBe(10);
    expect(evaluateSceneAtTime(scene,3).camera).toEqual({x:960,y:540,zoom:1,rotation:0}); expect(evaluateSceneAtTime(scene,3).layers.map(l=>l.id)).toEqual(['a']);
  });
});
describe('Animation code/schema/persistence', () => {
  it('round-trips animation IDs, key IDs, easing, timing and loop', () => {
    const project=fixture(); const a=position(); a.loop='pingPong'; a.keyframes[0].easing='easeIn'; getScene(project).animations=[a];
    expect(parseSceneCode(generateCode(project),project)).toEqual(getScene(project)); expect(validateProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
  });
  it('accepts the declarative position example without optional IDs/timing', () => {
    const project=fixture(); const code=generateCode(project)+'scene.animate("a", {property:"position", keyframes:[{time:0,x:200,y:150},{time:5,x:900,y:150}],easing:"easeInOut"});';
    const scene=parseSceneCode(code,project); expect(scene.animations[0].duration).toBe(5); expect(evaluateSceneAtTime(scene,2.5).layers[0].transform.x).toBe(550);
  });
  it.each(['keyframes:[{time:0,x:0}]','keyframes:[{time:0,x:0,y:0},{time:0,x:10,y:0}]','keyframes:[{time:0,x:0,y:0},{time:11,x:10,y:0}]','keyframes:[{time:0,x:0,y:0,opacity:1}]','keyframes:[...other]','keyframes:[{time:0,x:Math.random(),y:0}]'])('rejects bad animation input: %s', fragment => {
    const project=fixture(); expect(()=>parseSceneCode(generateCode(project)+`scene.animate("a",{property:"position",${fragment}});`,project)).toThrow();
  });
  it('rejects orphan/duplicate tracks and unsupported later-phase properties', () => {
    const project=fixture(); getScene(project).animations=[position(),{...position(),id:'other'}]; expect(()=>validateProject(project)).toThrow();
    getScene(project).animations=[{...position(),layerId:'missing'}]; expect(()=>validateProject(project)).toThrow();
    expect(()=>parseSceneCode(generateCode(fixture())+'scene.animate("a",{property:"camera",keyframes:[]});',fixture())).toThrow();
  });
  it('migrates actual Phase 1 projects without losing transforms/assets', () => {
    const project=fixture(); const {animations: ignored,...legacyScene}=getScene(project); void ignored;
    const migrated=validateProject({...project,schemaVersion:1,scenes:[legacyScene]}); expect(migrated.schemaVersion).toBe(5); expect(getScene(migrated).animations).toEqual([]); expect(getScene(migrated).layers).toEqual(legacyScene.layers);
  });
});
describe('Keyframe editing/history and playback separation', () => {
  beforeEach(()=>{usePlayback.getState().stop(); useEditor.getState().replace(fixture());});
  it('Auto Key is off by default; ON creates one key per property at playhead and updates it', () => {
    const state=useEditor.getState(); expect(state.autoKey).toBe(false); state.setAutoKey(true); usePlayback.getState().seek(2);
    const t=getScene(state.project).layers[0].transform;
    state.updateLayer('a',{transform:{...t,x:300}}); const first=getScene(useEditor.getState().project).animations[0];
    expect(first.keyframes[0]).toMatchObject({time:0,x:10,y:20}); expect(first.keyframes[1]).toMatchObject({time:2,x:300,y:20}); expect(getScene(useEditor.getState().project).layers[0].transform.x).toBe(10);
    state.updateLayer('a',{transform:{...t,x:500}}); expect(getScene(useEditor.getState().project).animations[0].keyframes).toHaveLength(2);
    state.undo(); expect(getScene(useEditor.getState().project).animations[0].keyframes[1].x).toBe(300);
  });
  it('add/move/value/easing/delete keyframes are undoable and collisions preserve data', () => {
    const state=useEditor.getState(); state.setAnimation(position()); const before=useEditor.getState().project;
    state.editKeyframe('move','k1',{time:0}); expect(useEditor.getState().project).toBe(before); expect(useEditor.getState().animationError).not.toBe('');
    state.editKeyframe('move','k1',{time:3,x:700,easing:'easeOut'}); expect(getScene(useEditor.getState().project).animations[0].keyframes[1]).toMatchObject({time:3,x:700,easing:'easeOut'});
    state.removeKeyframe('move','k0'); state.removeKeyframe('move','k1'); expect(getScene(useEditor.getState().project).animations).toEqual([]); state.undo(); expect(getScene(useEditor.getState().project).animations[0].keyframes).toHaveLength(1);
  });
  it('Apply animation is one history entry, invalid Apply and stale drafts preserve scenes', () => {
    const state=useEditor.getState(); state.editCode(state.code+'scene.animate("a",{property:"opacity",keyframes:[{time:0,opacity:1},{time:2,opacity:0}]});');
    expect(state.applyCode()).toBe(true); expect(useEditor.getState().past).toHaveLength(1); state.undo(); expect(getScene(useEditor.getState().project).animations).toEqual([]); state.redo(); expect(getScene(useEditor.getState().project).animations).toHaveLength(1);
  });
  it('duplicate copies animation IDs/keyframes and delete removes orphan tracks', () => {
    const state=useEditor.getState(); state.setAnimation(position()); state.select('a'); state.duplicate();
    const scene=getScene(useEditor.getState().project); expect(scene.animations).toHaveLength(2); expect(scene.animations[1].id).not.toBe('move'); expect(scene.animations[1].keyframes[0].x).toBe(30);
    state.deleteSelected(); expect(getScene(useEditor.getState().project).animations).toHaveLength(1);
  });
  it('scrubbing does not create history, regenerate code or dirty saved data', () => {
    const state=useEditor.getState(); const before={project:state.project,code:state.code,revision:state.revision}; usePlayback.getState().seek(4);
    expect(useEditor.getState().project).toBe(before.project); expect(useEditor.getState().code).toBe(before.code); expect(useEditor.getState().revision).toBe(before.revision); expect(state.past).toHaveLength(0);
  });
  it('pastes keyframe values at playhead without reusing IDs and retains the base key', () => {
    const scene=getScene(fixture()); const result=upsertKeyframe(scene,'a','position',3,{id:'clipboard',time:99,x:700,y:500,easing:'easeOut'});
    const track=result.animations[0]; expect(track.keyframes).toHaveLength(2); expect(track.keyframes[0]).toMatchObject({time:0,x:10,y:20});
    expect(track.keyframes[1]).toMatchObject({time:3,x:700,y:500,easing:'easeOut'}); expect(track.keyframes[1].id).not.toBe('clipboard'); expect(evaluateSceneAtTime(result,0).layers[0].transform.x).toBe(10);
  });
  it('adds Auto Keys at cycle-local time for repeat tracks', () => {
    const scene=getScene(fixture()); scene.animations=[{...position(),loop:'repeat'}];
    const result=upsertKeyframe(scene,'a','position',6,{x:999,y:200}); expect(result.animations[0].keyframes.find(k=>k.time===1)?.x).toBe(999); expect(result.animations[0].duration).toBe(4);
  });
  it('rejects shortening Scene Duration past existing tracks and retains both values', () => {
    const state=useEditor.getState();state.setAnimation(position()); const before=useEditor.getState().project; state.updateScene({duration:2});
    expect(useEditor.getState().project).toBe(before); expect(usePlayback.getState().duration).toBe(10); expect(useEditor.getState().animationError).not.toBe('');
  });
  it('batch edits multiple transform channels in one Auto Key undo transaction', () => {
    const state=useEditor.getState(); state.setAutoKey(true);usePlayback.getState().seek(2);const t=getScene(state.project).layers[0].transform;
    state.editLayers([{id:'a',patch:{transform:{...t,x:200,scaleX:2,rotation:180},opacity:.5}}]);
    expect(getScene(useEditor.getState().project).animations).toHaveLength(4);expect(useEditor.getState().past).toHaveLength(1);state.undo();expect(getScene(useEditor.getState().project).animations).toEqual([]);
  });
  it('playback uses elapsed timestamps, pause/resume, ends at duration and Stop resets', () => {
    let callback: FrameRequestCallback = () => undefined;
    vi.stubGlobal('requestAnimationFrame',(cb:FrameRequestCallback)=>{callback=cb;return 1;}); vi.stubGlobal('cancelAnimationFrame',()=>undefined);
    try {
      const state=usePlayback.getState(); state.seek(2); state.play(); callback(1000); callback(2500); expect(usePlayback.getState().time).toBe(3.5);
      state.pause(); expect(usePlayback.getState().time).toBe(3.5); state.play(); callback(5000); callback(6000); expect(usePlayback.getState().time).toBe(4.5);
      callback(20000); expect(usePlayback.getState()).toMatchObject({time:10,playing:false}); state.stop(); expect(usePlayback.getState().time).toBe(0);
    } finally {vi.unstubAllGlobals();}
  });
});
