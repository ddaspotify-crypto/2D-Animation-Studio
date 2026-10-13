import { create } from 'zustand';
import { createProject, defaultCamera,getScene, validateProject, type Animation, type AnimationProperty, type Asset, type Keyframe, type Layer, type Project, type Scene } from '../../shared/model.js';
import { generateCode, parseSceneCode } from '../code/sceneCode';
import { usePlayback } from './playbackStore';
import { applyLayerEdits, upsertKeyframe } from '../animation/commands';
import { evaluateSceneAtTime } from '../../shared/animationEngine.js';
import { changeBinding } from '../advanced/commands';
import { usePathEditor } from './pathEditorStore';
import { cloneLayers } from '../advanced/cloneLayers';
import { newScene,duplicateScene } from '../scene/sceneCommands';
import { useTimeline } from './timelineStore';
import { useCameraView } from './cameraViewStore';

interface EditorState {
  project: Project; selectedIds: string[]; past: Project[]; future: Project[];
  selectedGroupId: string|null;
  selectGroup:(id:string)=>void; groupSelected:()=>void; renameGroup:(id:string,name:string)=>void; ungroup:(id:string)=>void;
  revision: number; savedRevision: number; location: string | null;
  code: string; codeDirty: boolean; codeStale: boolean; codeError: string;
  commit: (project: Project,replaceScenes?:boolean) => void;
  sceneTimes:Record<string,number>;drafts:Record<string,{code:string;stale:boolean}>;
  switchScene:(id:string)=>void;createScene:()=>void;duplicateScene:()=>void;deleteScene:()=>void;
  replace: (project: Project, location?: string) => void;
  select: (id?: string, additive?: boolean) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  updateScene: (patch: Partial<Omit<Scene, 'layers'>>) => void;
  addAssets: (assets: Asset[]) => void;
  addImage: (assetId: string, x: number, y: number) => void;
  deleteSelected: () => void; duplicate: () => void;
  reorder: (id: string, index: number) => void;
  undo: () => void; redo: () => void;
  editCode: (code: string) => void; resetCode: () => void; applyCode: () => boolean;
  markSaved: (revision: number, location: string) => void;
  autoKey: boolean; setAutoKey: (enabled: boolean) => void; editLayers: (edits: {id: string; patch: Partial<Layer>}[]) => void;
  addKeyframe: (layerId: string, property: AnimationProperty) => void;
  setAnimation: (animation: Animation) => void; removeAnimation: (id: string) => void;
  editKeyframe: (animationId: string, frameId: string, patch: Partial<Keyframe>) => void;
  removeKeyframe: (animationId: string, frameId: string) => void;
  animationError: string;
}
const initial = createProject();
function synced(state: EditorState, project: Project) {
  return state.codeDirty ? {code: state.code, codeDirty: true, codeStale: true, codeError: state.codeError}
    : {code: generateCode(project), codeDirty: false, codeStale: false, codeError: ''};
}
function restoreContext(current:EditorState,project:Project){const drafts={...current.drafts};if(current.project.activeSceneId===project.activeSceneId)return {...synced(current,project),drafts};if(current.codeDirty)drafts[current.project.activeSceneId]={code:current.code,stale:true};else delete drafts[current.project.activeSceneId];const draft=drafts[project.activeSceneId];return {drafts,code:draft?.code??generateCode(project),codeDirty:!!draft,codeStale:!!draft,codeError:''};}
export const useEditor = create<EditorState>((set, get) => ({
  project: initial, selectedIds: [], selectedGroupId:null, past: [], future: [], revision: 0, savedRevision: -1, location: null,
  code: generateCode(initial), codeDirty: false, codeStale: false, codeError: '',
  autoKey: false, animationError: '',
  sceneTimes:{},drafts:{},
  commit(project,replaceScenes=false) {
    const current = get();
    if(!replaceScenes&&project.scenes.length===1&&current.project.scenes.length>1)project={...project,scenes:current.project.scenes.map(s=>s.id===current.project.activeSceneId?project.scenes[0]:s)};
    const valid = validateProject(project);
    if (JSON.stringify(valid) === JSON.stringify(current.project)) return;
    usePlayback.getState().configure(getScene(valid).duration);
    set({project: valid, past: [...current.past.slice(-49), current.project], future: [], revision: current.revision + 1, animationError: '',
      selectedGroupId:getScene(valid).groups?.some(g=>g.id===current.selectedGroupId)?current.selectedGroupId:null,
      selectedIds: current.selectedIds.filter(id => getScene(valid).layers.some(l => l.id === id)), ...synced(current, valid)});
  },
  replace(project, location) {
    const valid = validateProject(project);
    usePlayback.getState().stop(); usePlayback.getState().configure(getScene(valid).duration);
    usePathEditor.setState({drawLayerId:null,pointIndex:0});
    useCameraView.setState({output:false,edit:false});
    set({selectedGroupId:null});
    useTimeline.getState().select(null);set({sceneTimes:{},drafts:{}});
    set({project: valid, selectedIds: [], past: [], future: [], revision: 0, savedRevision: location ? 0 : -1, location: location ?? null, code: generateCode(valid), codeDirty: false, codeStale: false, codeError: '', autoKey: false, animationError: ''});
  },
  select(id, additive) {
    set({selectedGroupId:null});
    set(state => ({selectedIds: !id ? [] : additive ? state.selectedIds.includes(id) ? state.selectedIds.filter(item => item !== id) : [...state.selectedIds, id] : [id]}));
  },
  switchScene(id){const current=get();if(id===current.project.activeSceneId||!current.project.scenes.some(s=>s.id===id))return;
    const drafts={...current.drafts};if(current.codeDirty)drafts[current.project.activeSceneId]={code:current.code,stale:current.codeStale};else delete drafts[current.project.activeSceneId];
    const sceneTimes={...current.sceneTimes,[current.project.activeSceneId]:usePlayback.getState().time},project={...current.project,activeSceneId:id},draft=drafts[id];usePlayback.getState().configure(getScene(project).duration);usePlayback.getState().seek(sceneTimes[id]??0);useTimeline.getState().select(null);usePathEditor.setState({drawLayerId:null,pointIndex:0});
    set({project,drafts,sceneTimes,selectedIds:[],selectedGroupId:null,code:draft?.code??generateCode(project),codeDirty:!!draft,codeStale:draft?.stale??false,codeError:'',animationError:'',revision:current.revision+1});
  },
  createScene(){const current=get(),scene=newScene(getScene(current.project),`Scene ${String(current.project.scenes.length+1).padStart(2,'0')}`);current.commit({...current.project,scenes:[...current.project.scenes,scene]},true);get().switchScene(scene.id);},
  duplicateScene(){const current=get(),scene=duplicateScene(getScene(current.project));current.commit({...current.project,scenes:[...current.project.scenes,scene]},true);get().switchScene(scene.id);},
  deleteScene(){const current=get();if(current.project.scenes.length===1){set({animationError:'Project cần ít nhất một Scene.'});return;}const id=current.project.activeSceneId,index=current.project.scenes.findIndex(s=>s.id===id),scenes=current.project.scenes.filter(s=>s.id!==id),next=scenes[Math.min(index,scenes.length-1)],project={...current.project,activeSceneId:next.id,scenes},context=restoreContext(current,project);current.commit(project,true);usePlayback.getState().seek(current.sceneTimes[next.id]??0);useTimeline.getState().select(null);usePathEditor.setState({drawLayerId:null,pointIndex:0});set({...context,selectedIds:[],selectedGroupId:null});},
  selectGroup(id){set({selectedGroupId:id,selectedIds:getScene(get().project).layers.filter(l=>l.groupId===id).map(l=>l.id)});},
  groupSelected(){const state=get(),scene=getScene(state.project);if(!state.selectedIds.length)return;const id=crypto.randomUUID();state.commit({...state.project,scenes:[{...scene,groups:[...(scene.groups??[]),{id,name:'Group'}],layers:scene.layers.map(l=>state.selectedIds.includes(l.id)?{...l,groupId:id}:l)}]});set({selectedGroupId:id});},
  renameGroup(id,name){const state=get(),scene=getScene(state.project);if(!name.trim())return;state.commit({...state.project,scenes:[{...scene,groups:scene.groups?.map(g=>g.id===id?{...g,name:name.trim()}:g)}]});},
  ungroup(id){const state=get(),scene=getScene(state.project);state.commit({...state.project,scenes:[{...scene,groups:scene.groups?.filter(g=>g.id!==id),layers:scene.layers.map(l=>l.groupId===id?{...l,groupId:undefined}:l)}]});set({selectedGroupId:null});},
  updateLayer(id, patch) {
    get().editLayers([{id, patch}]);
  },
  updateScene(patch) {
    const project = get().project;
    const scene=getScene(project);if((patch.width!==undefined||patch.height!==undefined)&&scene.camera.animations.length===0&&scene.camera.x===scene.width/2&&scene.camera.y===scene.height/2&&scene.camera.zoom===1&&scene.camera.rotation===0)patch={...patch,camera:defaultCamera(patch.width??scene.width,patch.height??scene.height)};
    try {get().commit({...project, scenes: project.scenes.map(s => s.id === project.activeSceneId ? {...s, ...patch} : s)}); set({animationError: ''});}
    catch (error) {set({animationError: error instanceof Error ? error.message : 'Scene không hợp lệ.'});}
  },
  addAssets(assets) {
    const project = get().project;
    const paths = new Set(project.assets.map(a => a.path));
    get().commit({...project, assets: [...project.assets, ...assets.filter(a => !paths.has(a.path))]});
  },
  addImage(assetId, x, y) {
    const project = get().project;
    const asset = project.assets.find(a => a.id === assetId);
    if (!asset) return;
    const scene = getScene(project);
    const ratio = Math.min(1, scene.width * .6 / asset.width, scene.height * .6 / asset.height);
    const layer: Layer = {id: crypto.randomUUID(), name: asset.name, assetId, visible: true, locked: false, opacity: 1,
      transform: {x, y, width: asset.width, height: asset.height, scaleX: ratio, scaleY: ratio, rotation: 0, anchorX: 0, anchorY: 0}};
    get().commit({...project, scenes: [{...scene, layers: [...scene.layers, layer]}]});
    set({selectedIds: [layer.id],selectedGroupId:null});
  },
  deleteSelected() {
    const {project, selectedIds} = get();
    const scene = getScene(project);
    const layers = scene.layers.filter(l => !selectedIds.includes(l.id) || l.locked);
    // Detach surviving children before deleting parents, preserving the current world pose.
    let detached=scene;
    for(const layer of layers)if(layer.binding&&!layers.some(p=>p.id===layer.binding!.parentId)){
      if(layer.locked){set({animationError:'Mở khóa Child trước khi xóa Parent của nó.'});return;}
      detached=changeBinding(detached,layer.id,null,usePlayback.getState().time);
    }
    get().commit({...project, scenes: [{...detached, ...(detached.groups?{groups:detached.groups.filter(g=>layers.some(l=>l.groupId===g.id))}:{}),layers:detached.layers.filter(l=>layers.some(a=>a.id===l.id)), animations: detached.animations.filter(a => layers.some(l => l.id === a.layerId)),motionPaths:detached.motionPaths.filter(p=>layers.some(l=>l.id===p.layerId)),poseTracks:detached.poseTracks.filter(p=>layers.some(l=>l.id===p.layerId))}]});
  },
  duplicate() {
    const state=get(),scene=getScene(state.project),copy=cloneLayers(scene,scene,state.selectedIds,usePlayback.getState().time,state.selectedGroupId?[state.selectedGroupId]:[]);
    state.commit({...state.project,scenes:[copy.scene]});set({selectedIds:copy.ids,selectedGroupId:copy.groupId});
  },
  reorder(id, index) {
    const project = get().project;
    const layers = [...getScene(project).layers];
    const previous = layers.findIndex(l => l.id === id);
    if (previous < 0) return;
    const [layer] = layers.splice(previous, 1);
    layers.splice(Math.max(0, Math.min(layers.length, index)), 0, layer);
    get().commit({...project, scenes: [{...getScene(project), layers}]});
  },
  undo() {
    const current = get(); const project = current.past.at(-1); if (!project) return;
    const sceneTimes={...current.sceneTimes,[current.project.activeSceneId]:usePlayback.getState().time};useCameraView.setState({edit:false});
    useTimeline.getState().select(null);usePathEditor.setState({drawLayerId:null,pointIndex:0});
    usePlayback.getState().configure(getScene(project).duration);
    if(current.project.activeSceneId!==project.activeSceneId)usePlayback.getState().seek(sceneTimes[project.activeSceneId]??0);
    set({project,sceneTimes, past: current.past.slice(0, -1), future: [current.project, ...current.future], selectedIds: [], selectedGroupId:null, revision: current.revision + 1, ...restoreContext(current, project)});
  },
  redo() {
    const current = get(); const project = current.future[0]; if (!project) return;
    const sceneTimes={...current.sceneTimes,[current.project.activeSceneId]:usePlayback.getState().time};useCameraView.setState({edit:false});
    useTimeline.getState().select(null);usePathEditor.setState({drawLayerId:null,pointIndex:0});
    usePlayback.getState().configure(getScene(project).duration);
    if(current.project.activeSceneId!==project.activeSceneId)usePlayback.getState().seek(sceneTimes[project.activeSceneId]??0);
    set({project,sceneTimes, past: [...current.past, current.project], future: current.future.slice(1), selectedIds: [], selectedGroupId:null, revision: current.revision + 1, ...restoreContext(current, project)});
  },
  editCode(code) {
    const current = get();
    const dirty = code !== generateCode(current.project);
    set({code, codeDirty: dirty, codeStale: dirty && current.codeStale, codeError: ''});
  },
  resetCode() {const drafts={...get().drafts};delete drafts[get().project.activeSceneId];set({drafts,code: generateCode(get().project), codeDirty: false, codeStale: false, codeError: ''}); },
  applyCode() {
    const current = get();
    try {
      const scene = parseSceneCode(current.code, current.project);
      const project = {...current.project, activeSceneId: scene.id, scenes: [scene]};
      // Commit through the same transaction as visual edits. Clear the draft only after validation.
      current.commit(project);
      const drafts={...current.drafts};delete drafts[current.project.activeSceneId];delete drafts[scene.id];set({drafts});
      set({code: generateCode(project), codeDirty: false, codeStale: false, codeError: ''});
      return true;
    } catch (error) { set({codeError: error instanceof Error ? error.message : 'Code không hợp lệ.'}); return false; }
  },
  markSaved(revision, location) { set({savedRevision: revision, location}); },
  setAutoKey(enabled) {set({autoKey: enabled});},
  editLayers(edits) {
    const current = get(); const scene = applyLayerEdits(getScene(current.project), edits, usePlayback.getState().time, current.autoKey);
    current.commit({...current.project, scenes: [scene]});
  },
  addKeyframe(layerId, property) {
    const current = get(); const scene = upsertKeyframe(getScene(current.project), layerId, property, usePlayback.getState().time);
    current.commit({...current.project, scenes: [scene]});
  },
  setAnimation(animation) {
    const current = get(), scene = getScene(current.project);
    if (scene.layers.find(l => l.id === animation.layerId)?.locked) return;
    try {current.commit({...current.project, scenes: [{...scene, animations: [...scene.animations.filter(a => a.id !== animation.id), animation]}]}); set({animationError: ''});}
    catch (error) {set({animationError: error instanceof Error ? error.message : 'Animation không hợp lệ.'});}
  },
  removeAnimation(id) {
    const current = get(), scene = getScene(current.project);
    if (scene.layers.find(l => l.id === scene.animations.find(a => a.id === id)?.layerId)?.locked) return;
    current.commit({...current.project, scenes: [{...scene, animations: scene.animations.filter(a => a.id !== id)}]});
  },
  editKeyframe(animationId, frameId, patch) {
    const current = get(), animation = getScene(current.project).animations.find(a => a.id === animationId); if (!animation) return;
    current.setAnimation({...animation, keyframes: animation.keyframes.map(k => k.id === frameId ? {...k, ...patch} : k).sort((a,b) => a.time-b.time)});
  },
  removeKeyframe(animationId, frameId) {
    const current = get(), animation = getScene(current.project).animations.find(a => a.id === animationId); if (!animation) return;
    const keyframes = animation.keyframes.filter(k => k.id !== frameId);
    if (!keyframes.length) current.removeAnimation(animationId); else current.setAnimation({...animation, keyframes});
  },
}));
