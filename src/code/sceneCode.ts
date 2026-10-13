import { parse, type Node } from 'acorn';
import { z } from 'zod';
import { animationPropertySchema, easingSchema, keyframeSchema, getScene, sceneSchema, validateProject, type Project, type Scene } from '../../shared/model.js';

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
const sceneOptions = sceneSchema.omit({layers: true, animations: true}).strict();
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
}).strict();

export function generateCode(project: Project): string {
  const scene = getScene(project);
  const {layers, animations, ...options} = scene;
  const lines = ['// Phase 2: API khai báo. Keyframe time tính từ startTime của track.', `const scene = createScene(${JSON.stringify(options, null, 2)});`];
  for (const layer of layers) {
    const asset = project.assets.find(a => a.id === layer.assetId)!;
    const {scaleX, scaleY, ...transform} = layer.transform;
    lines.push(`scene.addImage(${JSON.stringify({id: layer.id, name: layer.name, asset: asset.path, ...transform,
      ...(scaleX === scaleY ? {scale: scaleX} : {scaleX, scaleY}), opacity: layer.opacity, visible: layer.visible, locked: layer.locked}, null, 2)});`);
  }
  for (const animation of animations) {
    const {layerId, ...options} = animation;
    lines.push(`scene.animate(${JSON.stringify(layerId)}, ${JSON.stringify(options, null, 2)});`);
  }
  return lines.join('\n\n') + '\n';
}

export function parseSceneCode(source: string, project: Project): Scene {
  if (source.length > 2_000_000) throw new Error('Code quá lớn (tối đa 2 MB).');
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
  const scene: Scene = {...sceneOptions.parse({id: previous.id, name: previous.name, background: previous.background, ...(options as object)}), layers: [], animations: []};
  const ordering: number[] = [];
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
    if (method === 'animate') {
      if (parameters.length !== 2) fail(call, 'animate nhận layerId và một object literal.');
      const layerId = z.string().parse(literal(parameters[0]));
      const config = animationOptions.parse(literal(parameters[1]));
      const index = scene.animations.length;
      scene.animations.push({...config, layerId, id: config.id ?? `anim-${index}`, duration: config.duration ?? Math.max(.001, ...config.keyframes.map(k => k.time)),
        keyframes: config.keyframes.map((key, i) => ({...key, id: key.id ?? `key-${index}-${i}`}))});
      continue;
    }
    if (method !== 'addImage') fail(n, 'Phase 2 chỉ hỗ trợ addImage/animate; path/pose/bind/camera thuộc phase sau.');
    if (parameters.length !== 1) fail(call, 'addImage nhận một object literal.');
    const config = imageOptions.parse(literal(parameters[0]));
    const asset = project.assets.find(a => a.path === config.asset);
    if (!asset) fail(n, `Asset chưa import: ${config.asset}`);
    if (config.scale !== undefined && (config.scaleX !== undefined || config.scaleY !== undefined)) fail(n, 'Dùng scale hoặc scaleX/scaleY, không dùng đồng thời.');
    ordering.push(config.zIndex ?? scene.layers.length);
    scene.layers.push({id: config.id, name: config.name ?? asset.name, assetId: asset.id, opacity: config.opacity, visible: config.visible, locked: config.locked,
      transform: {x: config.x, y: config.y, width: config.width ?? asset.width, height: config.height ?? asset.height, scaleX: config.scaleX ?? config.scale ?? 1, scaleY: config.scaleY ?? config.scale ?? 1, rotation: config.rotation, anchorX: config.anchorX, anchorY: config.anchorY}});
  }
  if (new Set(ordering).size !== ordering.length) throw new Error('zIndex trùng lặp; hãy dùng thứ tự addImage hoặc zIndex khác nhau.');
  scene.layers = scene.layers.map((layer, index) => ({layer, order: ordering[index]})).sort((a, b) => a.order - b.order).map(item => item.layer);
  return getScene(validateProject({...project, activeSceneId: scene.id, scenes: [scene]}));
}
