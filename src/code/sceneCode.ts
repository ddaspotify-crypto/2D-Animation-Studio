import { parse, type Node } from 'acorn';
import { z } from 'zod';
import { animationPropertySchema, cameraSchema,cameraTrackSchema,defaultCamera,easingSchema, keyframeSchema, getScene, layerSchema, motionPathSchema, poseSetSchema, poseTrackSchema, sceneSchema, validateProject, type Project, type Scene } from '../../shared/model.js';

type Ast = Node & Record<string, unknown>;
function ast(value: unknown): Ast {
  if (!value || typeof value !== 'object' || !('type' in value)) throw new Error('AST không hợp lệ.');
  return value as Ast;
}
function fail(n: Ast, message: string): never {
  throw new Error(`Dòng ${n.loc?.start.line ?? 1}: ${message}`);
}
function literal(value: unknown): unknown {
  const n = ast(value);
  if (n.type === 'Literal' && (n.value === null || ['string', 'number', 'boolean'].includes(typeof n.value))) return n.value;
  if (n.type === 'UnaryExpression' && n.operator === '-' && ast(n.argument).type === 'Literal' && typeof ast(n.argument).value === 'number') return -(ast(n.argument).value as number);
  if (n.type === 'ArrayExpression') return (n.elements as unknown[]).map(item => literal(item));
  if (n.type === 'ObjectExpression') {
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    for (const item of n.properties as unknown[]) {
      const p = ast(item);
      if (p.type !== 'Property' || p.kind !== 'init' || p.computed || p.method || p.shorthand) fail(p, 'Chỉ hỗ trợ thuộc tính literal, không hỗ trợ spread/getter/computed.');
      const key = ast(p.key);
      const name = key.type === 'Identifier' ? String(key.name) : String(key.value);
      if (['__proto__', 'prototype', 'constructor'].includes(name) || Object.hasOwn(result, name)) fail(p, `Thuộc tính bị cấm hoặc trùng: ${name}`);
      result[name] = literal(p.value);
    }
    return result;
  }
  fail(n, 'Chỉ hỗ trợ string, number, boolean và object literal; không thực thi JavaScript.');
}
const sceneOptions = sceneSchema.omit({layers: true, animations: true,motionPaths:true,poseSets:true,poseTracks:true}).extend({camera:cameraSchema.optional()}).strict();
const animationOptions = z.object({
  id: z.string().optional(), property: animationPropertySchema, startTime: z.number().default(0), duration: z.number().optional(),
  easing: easingSchema.default('linear'), loop: z.enum(['none','repeat','pingPong']).default('none'),
  keyframes: z.array(keyframeSchema.omit({id: true}).extend({id: z.string().optional()}).strict()).min(1).max(2000),
}).strict();
const imageOptions = z.object({
  id: z.string(), name: z.string().optional(), asset: z.string(),
  x: z.number().default(0), y: z.number().default(0), width: z.number().optional(), height: z.number().optional(),
  scale: z.number().optional(), scaleX: z.number().optional(), scaleY: z.number().optional(), rotation: z.number().default(0),
  anchorX: z.number().default(0), anchorY: z.number().default(0),
  opacity: z.number().default(1), visible: z.boolean().default(true), locked: z.boolean().default(false),
  zIndex: z.number().int().nonnegative().optional(),
  skewX:z.number().optional(),attachments:layerSchema.shape.attachments,
  flipX:z.boolean().optional(),flipY:z.boolean().optional(),drawing:layerSchema.shape.drawing,codeFrames:layerSchema.shape.codeFrames,
}).strict();

export function generateCode(project: Project): string {
  const scene = getScene(project);
  const {layers, animations,motionPaths,poseSets,poseTracks,groups,camera, ...options} = scene;
  const lines = ['// Scene đang mở: Vector + Code Frames. Pose time toàn scene; animation/key time tính từ startTime. Code Frames dùng chỉ số frame theo FPS.', `const scene = createScene(${JSON.stringify({...options,...(groups?.length===0?{groups:[]}: {})}, null, 2)});`];
  for (const layer of layers) {
    const asset = project.assets.find(a => a.id === layer.assetId)!;
    const {scaleX, scaleY, ...transform} = layer.transform;
    lines.push(`scene.${layer.drawing?'addVector':'addImage'}(${JSON.stringify({id: layer.id, name: layer.name, asset: asset.path, ...transform,
      ...(scaleX === scaleY ? {scale: scaleX} : {scaleX, scaleY}), opacity: layer.opacity, visible: layer.visible, locked: layer.locked,...(layer.drawing?{drawing:layer.drawing}:{}),...(layer.codeFrames?{codeFrames:layer.codeFrames}:{}),...(layer.attachments?{attachments:layer.attachments}:{})}, null, 2)});`);
  }
  for(const path of motionPaths){const {layerId,...options}=path;lines.push(`scene.motionPath(${JSON.stringify(layerId)}, ${JSON.stringify(options,null,2)});`);}
  for(const group of groups??[])lines.push(`scene.group(${JSON.stringify({...group,layerIds:layers.filter(l=>l.groupId===group.id).map(l=>l.id)},null,2)});`);
  const {animations:cameraTracks,...cameraBase}=camera;lines.push(`scene.camera(${JSON.stringify(cameraBase,null,2)});`);for(const track of cameraTracks)lines.push(`scene.cameraAnimate(${JSON.stringify(track,null,2)});`);
  for(const set of poseSets)lines.push(`scene.poseSet(${JSON.stringify(set,null,2)});`);
  for(const track of poseTracks){const {layerId,...options}=track;lines.push(`scene.poseTrack(${JSON.stringify(layerId)}, ${JSON.stringify(options,null,2)});`);}
  for(const layer of layers)if(layer.binding)lines.push(`scene.bind(${JSON.stringify(layer.id)}, ${JSON.stringify(layer.binding,null,2)});`);
  for (const animation of animations) {
    const {layerId, ...options} = animation;
    lines.push(`scene.animate(${JSON.stringify(layerId)}, ${JSON.stringify(options, null, 2)});`);
  }
  return lines.join('\n\n') + '\n';
}

export function parseSceneCode(source: string, project: Project): Scene {
  if (source.length > 8_000_000) throw new Error('Code quá lớn (tối đa 8 MB).');
  const program = ast(parse(source, {ecmaVersion: 'latest', sourceType: 'script', locations: true}));
  const body = program.body as unknown[];
  if (!body.length) throw new Error('Cần khai báo const scene = createScene({...}).');
  const first = ast(body[0]);
  if (first.type !== 'VariableDeclaration' || first.kind !== 'const') fail(first, 'Lệnh đầu phải là const scene = createScene({...}).');
  const declarations = first.declarations as unknown[];
  if (declarations.length !== 1) fail(first, 'Chỉ hỗ trợ một biến scene.');
  const declaration = ast(declarations[0]);
  const identifier = ast(declaration.id);
  const init = ast(declaration.init);
  if (identifier.type !== 'Identifier' || identifier.name !== 'scene' || init.type !== 'CallExpression' || ast(init.callee).type !== 'Identifier' || ast(init.callee).name !== 'createScene') fail(first, 'Cần const scene = createScene({...}).');
  const args = init.arguments as unknown[];
  if (args.length !== 1) fail(init, 'createScene nhận một object literal.');
  const options = literal(args[0]);
  const previous = getScene(project);
  const parsedOptions=sceneOptions.parse({id: previous.id, name: previous.name, background: previous.background, ...(options as object)});
  const scene: Scene = {...parsedOptions,camera:parsedOptions.camera??defaultCamera(parsedOptions.width,parsedOptions.height), layers: [], animations: [],motionPaths:[],poseSets:[],poseTracks:[]};
  const ordering: number[] = [];
  const bindings:{layerId:string;binding:NonNullable<Scene['layers'][number]['binding']>}[]=[];
  for (const statement of body.slice(1)) {
    const n = ast(statement);
    if (n.type === 'EmptyStatement') continue;
    if (n.type !== 'ExpressionStatement') fail(n, 'Không hỗ trợ vòng lặp, import, hàm hoặc lệnh tùy ý.');
    const call = ast(n.expression);
    if (call.type !== 'CallExpression') fail(n, 'Chỉ hỗ trợ scene.addImage({...}).');
    const member = ast(call.callee);
    if (member.type !== 'MemberExpression' || member.computed || ast(member.object).type !== 'Identifier' || ast(member.object).name !== 'scene') fail(n, 'Chỉ hỗ trợ scene.addImage hoặc scene.animate.');
    const parameters = call.arguments as unknown[];
    const method = ast(member.property).name;
    if(method==='camera'||method==='cameraAnimate'){if(parameters.length!==1)fail(call,`${method} nhận một object literal.`);const config=literal(parameters[0]);if(method==='camera')scene.camera={...cameraSchema.omit({animations:true}).parse(config),animations:scene.camera.animations};else scene.camera.animations.push(cameraTrackSchema.parse(config));continue;}
    if(method==='group'){
      if(parameters.length!==1)fail(call,'group nhận một object literal.');
      const config=z.object({id:z.string(),name:z.string(),layerIds:z.array(z.string())}).strict().parse(literal(parameters[0]));
      if(new Set(config.layerIds).size!==config.layerIds.length||config.layerIds.some(id=>!scene.layers.some(l=>l.id===id)||scene.layers.find(l=>l.id===id)?.groupId))fail(call,'Group cần Layer tồn tại và mỗi Layer chỉ thuộc một Group.');
      scene.groups=[...(scene.groups??[]),{id:config.id,name:config.name}];scene.layers=scene.layers.map(l=>config.layerIds.includes(l.id)?{...l,groupId:config.id}:l);continue;
    }
    if(method==='poseSet'){
      if(parameters.length!==1)fail(call,'poseSet nhận một object literal.');
      scene.poseSets.push(poseSetSchema.parse(literal(parameters[0])));continue;
    }
    if(method==='motionPath'||method==='poseTrack'||method==='bind'){
      if(parameters.length!==2)fail(call,`${method} nhận layerId và một object literal.`);
      const layerId=z.string().parse(literal(parameters[0])),config=literal(parameters[1]);
      if(method==='motionPath')scene.motionPaths.push(motionPathSchema.parse({...config as object,layerId}));
      if(method==='poseTrack')scene.poseTracks.push(poseTrackSchema.parse({...config as object,layerId}));
      if(method==='bind'){const binding=layerSchema.shape.binding.parse(config);if(!binding)fail(call,'bind cần parentId/mode.');bindings.push({layerId,binding});}
      continue;
    }
    if (method === 'animate') {
      if (parameters.length !== 2) fail(call, 'animate nhận layerId và một object literal.');
      const layerId = z.string().parse(literal(parameters[0]));
      const config = animationOptions.parse(literal(parameters[1]));
      const index = scene.animations.length;
      scene.animations.push({...config, layerId, id: config.id ?? `anim-${index}`, duration: config.duration ?? Math.max(.001, ...config.keyframes.map(k => k.time)),
        keyframes: config.keyframes.map((key, i) => ({...key, id: key.id ?? `key-${index}-${i}`}))});
      continue;
    }
    if (method !== 'addImage' && method !== 'addVector') fail(n, 'Phase 3 chỉ hỗ trợ addImage/animate/motionPath/poseSet/poseTrack/bind/group; camera thuộc Phase 4.');
    if (parameters.length !== 1) fail(call, 'addImage nhận một object literal.');
    const config = imageOptions.parse(literal(parameters[0]));if(method==='addVector'&&!config.drawing)fail(n,'addVector cần dữ liệu drawing.');
    const asset = project.assets.find(a => a.path === config.asset);
    if (!asset) fail(n, `Asset chưa import: ${config.asset}`);
    if (config.scale !== undefined && (config.scaleX !== undefined || config.scaleY !== undefined)) fail(n, 'Dùng scale hoặc scaleX/scaleY, không dùng đồng thời.');
    ordering.push(config.zIndex ?? scene.layers.length);
    scene.layers.push({id: config.id, name: config.name ?? asset.name, assetId: asset.id, opacity: config.opacity, visible: config.visible, locked: config.locked,...(config.drawing?{drawing:config.drawing}:{}),...(config.codeFrames?{codeFrames:config.codeFrames}:{}),...(config.attachments?{attachments:config.attachments}:{}),
      transform: {x: config.x, y: config.y, width: config.width ?? asset.width, height: config.height ?? asset.height, scaleX: config.scaleX ?? config.scale ?? 1, scaleY: config.scaleY ?? config.scale ?? 1, rotation: config.rotation, anchorX: config.anchorX, anchorY: config.anchorY,...(config.skewX!==undefined?{skewX:config.skewX}:{}),...(config.flipX!==undefined?{flipX:config.flipX}:{}),...(config.flipY!==undefined?{flipY:config.flipY}:{})}});
  }
  if(new Set(bindings.map(b=>b.layerId)).size!==bindings.length)throw new Error('Mỗi Child chỉ có một binding.');
  for(const {layerId,binding} of bindings){const layer=scene.layers.find(l=>l.id===layerId);if(!layer)throw new Error('Child binding không tồn tại.');layer.binding=binding;}
  if (new Set(ordering).size !== ordering.length) throw new Error('zIndex trùng lặp; hãy dùng thứ tự addImage hoặc zIndex khác nhau.');
  scene.layers = scene.layers.map((layer, index) => ({layer, order: ordering[index]})).sort((a, b) => a.order - b.order).map(item => item.layer);
  return getScene(validateProject({...project, activeSceneId: scene.id, scenes: [scene]}));
}
