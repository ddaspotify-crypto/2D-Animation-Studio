import { create } from 'zustand';
import { createProject, getScene, validateProject, type Animation, type AnimationProperty, type Asset, type Keyframe, type Layer, type Project, type Scene } from '../../shared/model.js';
import { generateCode, parseSceneCode } from '../code/sceneCode';
import { usePlayback } from './playbackStore';
import { applyLayerEdits, upsertKeyframe } from '../animation/commands';

interface EditorState {
  project: Project; selectedIds: string[]; past: Project[]; future: Project[];
  revision: number; savedRevision: number; location: string | null;
  code: string; codeDirty: boolean; codeStale: boolean; codeError: string;
  commit: (project: Project) => void;
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
export const useEditor = create<EditorState>((set, get) => ({
  project: initial, selectedIds: [], past: [], future: [], revision: 0, savedRevision: -1, location: null,
  code: generateCode(initial), codeDirty: false, codeStale: false, codeError: '',
  autoKey: false, animationError: '',
  commit(project) {
    const current = get();
    const valid = validateProject(project);
    if (JSON.stringify(valid) === JSON.stringify(current.project)) return;
    usePlayback.getState().configure(getScene(valid).duration);
    set({project: valid, past: [...current.past.slice(-49), current.project], future: [], revision: current.revision + 1, animationError: '',
      selectedIds: current.selectedIds.filter(id => getScene(valid).layers.some(l => l.id === id)), ...synced(current, valid)});
  },
  replace(project, location) {
    const valid = validateProject(project);
    usePlayback.getState().stop(); usePlayback.getState().configure(getScene(valid).duration);
    set({project: valid, selectedIds: [], past: [], future: [], revision: 0, savedRevision: location ? 0 : -1, location: location ?? null, code: generateCode(valid), codeDirty: false, codeStale: false, codeError: '', autoKey: false, animationError: ''});
  },
  select(id, additive) {
    set(state => ({selectedIds: !id ? [] : additive ? state.selectedIds.includes(id) ? state.selectedIds.filter(item => item !== id) : [...state.selectedIds, id] : [id]}));
  },
  updateLayer(id, patch) {
    get().editLayers([{id, patch}]);
  },
  updateScene(patch) {
    const project = get().project;
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
    set({selectedIds: [layer.id]});
  },
  deleteSelected() {
    const {project, selectedIds} = get();
    const scene = getScene(project);
    const layers = scene.layers.filter(l => !selectedIds.includes(l.id) || l.locked);
    get().commit({...project, scenes: [{...scene, layers, animations: scene.animations.filter(a => layers.some(l => l.id === a.layerId))}]});
  },
  duplicate() {
    const {project, selectedIds} = get();
    const copies = getScene(project).layers.filter(l => selectedIds.includes(l.id)).map(l => ({...l, id: crypto.randomUUID(), name: `${l.name} copy`, transform: {...l.transform, x: l.transform.x + 30, y: l.transform.y + 30}}));
    const originals = getScene(project).layers.filter(l => selectedIds.includes(l.id));
    const animations = getScene(project).animations;
    const copiedAnimations = copies.flatMap((copy, index) => animations.filter(a => a.layerId === originals[index].id).map(a => ({...a, id: crypto.randomUUID(), layerId: copy.id, keyframes: a.keyframes.map(k => ({...k, id: crypto.randomUUID(), ...(a.property === 'position' ? {x: k.x!+30, y: k.y!+30} : {})}))})));
    get().commit({...project, scenes: [{...getScene(project), layers: [...getScene(project).layers, ...copies], animations: [...animations, ...copiedAnimations]}]});
    set({selectedIds: copies.map(l => l.id)});
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
    usePlayback.getState().configure(getScene(project).duration);
    set({project, past: current.past.slice(0, -1), future: [current.project, ...current.future], selectedIds: [], revision: current.revision + 1, ...synced(current, project)});
  },
  redo() {
    const current = get(); const project = current.future[0]; if (!project) return;
    usePlayback.getState().configure(getScene(project).duration);
    set({project, past: [...current.past, current.project], future: current.future.slice(1), selectedIds: [], revision: current.revision + 1, ...synced(current, project)});
  },
  editCode(code) {
    const current = get();
    const dirty = code !== generateCode(current.project);
    set({code, codeDirty: dirty, codeStale: dirty && current.codeStale, codeError: ''});
  },
  resetCode() { set({code: generateCode(get().project), codeDirty: false, codeStale: false, codeError: ''}); },
  applyCode() {
    const current = get();
    try {
      const scene = parseSceneCode(current.code, current.project);
      const project = {...current.project, activeSceneId: scene.id, scenes: [scene]};
      // Commit through the same transaction as visual edits. Clear the draft only after validation.
      current.commit(project);
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
