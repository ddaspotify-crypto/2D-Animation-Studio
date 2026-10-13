import { beforeEach, describe, expect, it } from 'vitest';
import { createProject, getScene, validateProject, type Project } from '../shared/model.js';
import { generateCode, parseSceneCode } from '../src/code/sceneCode';
import { useEditor } from '../src/store/editorStore';

function fixture(): Project {
  const project = createProject();
  project.assets.push({id: 'asset-1', name: 'bird.png', path: `assets/${'a'.repeat(64)}.png`, folder: 'birds', mime: 'image/png', width: 200, height: 100});
  getScene(project).layers.push({id: 'bird-1', name: 'Bird', assetId: 'asset-1', visible: true, locked: false, opacity: .75,
    transform: {x: -20, y: 100, width: 200, height: 100, scaleX: 1, scaleY: 1, rotation: 45, anchorX: .5, anchorY: .5}});
  return project;
}
describe('Declarative code boundary', () => {
  it('round-trips every Phase 1 scene/layer field', () => {
    const project = fixture(); expect(parseSceneCode(generateCode(project), project)).toEqual(getScene(project));
  });
  it('supports scale shorthand and x changes', () => {
    const project = fixture();
    const code = generateCode(project).replace('"x": -20', '"x": 500').replace('"scale": 1', '"scale": 2');
    expect(parseSceneCode(code, project).layers[0].transform).toMatchObject({x: 500, scaleX: 2, scaleY: 2});
  });
  it('round-trips independent scales and flipped layer visibility', () => {
    const project = fixture(); getScene(project).layers[0].transform.scaleY = .4; getScene(project).layers[0].visible = false;
    expect(parseSceneCode(generateCode(project), project)).toEqual(getScene(project));
  });
  it.each(['while(true) {}', 'fetch("https://example.com")', 'scene.animate("bird-1", {})', 'scene["addImage"]({})', 'const a = 1;', 'scene.addImage({...foo});', 'scene.addImage({id: "bad", asset: "unknown.png"});', 'scene.addImage({get id(){return "x"}});'])('rejects unsupported code: %s', statement => {
    const project = fixture(); expect(() => parseSceneCode(generateCode(project) + statement, project)).toThrow();
  });
  it.each(['"x": Infinity', '"scale": 0', '"opacity": 2', '"width": -10', '"rotation": NaN'])('rejects invalid values %s', replacement => {
    const project = fixture(); const key = replacement.split(':')[0];
    const code = generateCode(project).replace(new RegExp(`${key}: [^,\\n]+`), replacement);
    expect(() => parseSceneCode(code, project)).toThrow();
  });
  it('rejects duplicate IDs and prototype properties', () => {
    const project = fixture(); const code = generateCode(project);
    expect(() => parseSceneCode(code + code.slice(code.indexOf('scene.addImage')), project)).toThrow();
    expect(() => parseSceneCode(code.replace('"x": -20', '"__proto__": {}'), project)).toThrow();
  });
  it('rejects syntax errors', () => {const project = fixture(); expect(() => parseSceneCode(generateCode(project) + '{', project)).toThrow();});
  it('can use declaration order or explicit zIndex', () => {
    const project = fixture();
    const code = generateCode(project).replace('"id": "bird-1"', '"id": "bird-1", "zIndex": 5');
    const second = code.slice(code.indexOf('scene.addImage')).replace('bird-1', 'bird-2').replace('"zIndex": 5', '"zIndex": 0');
    expect(parseSceneCode(code + second, project).layers.map(l => l.id)).toEqual(['bird-2','bird-1']);
  });
});
describe('Scene store transactions', () => {
  beforeEach(() => useEditor.getState().replace(fixture()));
  it('Apply makes one undo transaction and redo restores result', () => {
    const state = useEditor.getState(); state.editCode(state.code.replace('"x": -20', '"x": 500'));
    expect(state.applyCode()).toBe(true); expect(useEditor.getState().past).toHaveLength(1);
    expect(getScene(useEditor.getState().project).layers[0].transform.x).toBe(500);
    state.undo(); expect(getScene(useEditor.getState().project).layers[0].transform.x).toBe(-20);
    state.redo(); expect(getScene(useEditor.getState().project).layers[0].transform.x).toBe(500);
  });
  it('invalid Apply leaves scene/history/draft intact', () => {
    const before = useEditor.getState().project;
    useEditor.getState().editCode('alert("never run")'); expect(useEditor.getState().applyCode()).toBe(false);
    expect(useEditor.getState().project).toBe(before); expect(useEditor.getState().past).toHaveLength(0); expect(useEditor.getState().codeDirty).toBe(true);
  });
  it('preserves draft when Canvas changes and flags conflict', () => {
    const state = useEditor.getState(); state.editCode(state.code + '// my draft');
    const draft = useEditor.getState().code; state.updateLayer('bird-1', {opacity: .5});
    expect(useEditor.getState().code).toBe(draft); expect(useEditor.getState().codeStale).toBe(true);
    state.resetCode(); expect(useEditor.getState().code).toContain('"opacity": 0.5');
  });
  it('visual transform regenerates code automatically', () => {
    const state = useEditor.getState(); const layer = getScene(state.project).layers[0];
    state.updateLayer(layer.id, {transform: {...layer.transform, x: 456}}); expect(useEditor.getState().code).toContain('"x": 456');
  });
  it('clears the stale badge when a draft matches the current scene again', () => {
    const state = useEditor.getState(); state.editCode(state.code + '// draft'); state.updateLayer('bird-1', {opacity: .4});
    expect(useEditor.getState().codeStale).toBe(true);
    state.editCode(generateCode(useEditor.getState().project));
    expect(useEditor.getState().codeDirty).toBe(false); expect(useEditor.getState().codeStale).toBe(false);
  });
  it('locked layers are not deleted; reorder changes only z-order', () => {
    const state = useEditor.getState(); state.select('bird-1'); state.updateLayer('bird-1', {locked: true}); state.deleteSelected();
    expect(getScene(useEditor.getState().project).layers).toHaveLength(1);
    state.duplicate(); const before = getScene(useEditor.getState().project).layers[0].transform; state.reorder('bird-1', 1);
    expect(getScene(useEditor.getState().project).layers[1].transform).toEqual(before);
  });
});
describe('Project schema', () => {
  it('serializes with relative paths and no renderer objects', () => {
    const project = fixture(); expect(validateProject(JSON.parse(JSON.stringify(project)))).toEqual(project);
  });
  it('rejects missing assets, unknown fields and unknown versions', () => {
    const project = fixture(); expect(() => validateProject({...project, assets: []})).toThrow();
    expect(() => validateProject({...project, schemaVersion: 999})).toThrow();
    expect(() => validateProject({...project, arbitrary: true})).toThrow();
  });
  it('performs basic v0 migration and still validates', () => {const project = fixture(); expect(validateProject({...project, schemaVersion: 0})).toEqual(project);});
});
