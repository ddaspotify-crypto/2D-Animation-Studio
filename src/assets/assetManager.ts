import type { Asset } from '../../shared/model.js';

const blobs = new Map<string, Blob>();
const urls = new Map<string, string>();
const images = new Map<string, Promise<HTMLImageElement>>();
export function assetBlobs(assets:Asset[]){return assets.map(asset=>{const blob=blobs.get(asset.path);if(!blob)throw Error(`Thiếu dữ liệu ảnh: ${asset.name}`);return {path:asset.path,blob};});}
let generation = 0;
export function assetUrl(path: string): string { return urls.get(path) ?? ''; }
export function clearAssets() {
  generation++;
  urls.forEach(url => URL.revokeObjectURL(url));
  blobs.clear(); urls.clear(); images.clear();
}
export function registerAsset(path: string, blob: Blob) {
  if (urls.has(path)) return;
  blobs.set(path, blob); urls.set(path, URL.createObjectURL(blob));
}
export function loadImage(path: string): Promise<HTMLImageElement> {
  if (!images.has(path)) images.set(path, new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => {images.delete(path); reject(new Error(`Không đọc được ảnh: ${path}`));};
    image.src = assetUrl(path);
  }));
  return images.get(path)!;
}
export async function importImages(files: File[], progress: (count: number) => void): Promise<{assets: Asset[]; errors: string[]}> {
  const epoch = generation; const assets: Asset[] = []; const errors: string[] = [];
  for (const [index, file] of files.entries()) {
    if (epoch !== generation) throw new Error('Project đã thay đổi trong khi import.');
    try {
      const extension = file.name.split('.').at(-1)?.toLowerCase();
      if (!extension || !['png', 'jpg', 'jpeg', 'webp'].includes(extension)) throw new Error('Chỉ hỗ trợ PNG/JPG/JPEG/WebP.');
      if (file.size > 64 * 1024 * 1024) throw new Error('Ảnh vượt 64 MB.');
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const png = [137,80,78,71,13,10,26,10].every((value, index) => bytes[index] === value);
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
      const webp = ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP';
      if (!(extension === 'png' && png || ['jpg','jpeg'].includes(extension) && jpg || extension === 'webp' && webp)) throw new Error('Nội dung ảnh không khớp đuôi file PNG/JPEG/WebP.');
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))].map(v => v.toString(16).padStart(2, '0')).join('');
      // JPEG extensions normalize so identical bytes are never copied twice.
      const normalized = extension === 'jpeg' ? 'jpg' : extension;
      const path = `assets/${hash}.${normalized}`;
      const mime = normalized === 'jpg' ? 'image/jpeg' : `image/${normalized}`;
      const bitmap = await createImageBitmap(file);
      const width = bitmap.width, height = bitmap.height; bitmap.close();
      if (width > 16384 || height > 16384 || width * height > 64_000_000) throw new Error('Ảnh quá lớn (tối đa 16384 px và 64 megapixel).');
      if (epoch !== generation) throw new Error('Project đã thay đổi.');
      registerAsset(path, new Blob([buffer], {type: mime}));
      if (!assets.some(a => a.path === path)) assets.push({id: `asset-${hash.slice(0, 24)}`, name: file.name, path, folder: file.webkitRelativePath?.split('/').slice(0, -1).join('/') ?? '', mime: mime as Asset['mime'], width, height});
    } catch (error) { errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Lỗi ảnh'}`); }
    progress(index + 1);
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
  return {assets, errors};
}
export async function assetUploads(assets: Asset[]): Promise<{path: string; base64: string}[]> {
  const uploads = [];
  for (const asset of assets) {
    const blob = blobs.get(asset.path);
    if (!blob) throw new Error(`Thiếu dữ liệu ảnh: ${asset.name}. Mở lại project hoặc import lại ảnh trước khi lưu.`);
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1]); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob);
    });
    uploads.push({path: asset.path, base64});
  }
  return uploads;
}
export async function fetchAssets(assets: Asset[], folder: string,backup=false): Promise<{asset: Asset; blob: Blob}[]> {
  const result = [];
  for (const asset of assets) {
    const response = await fetch(`/api/assets/${encodeURIComponent(folder)}/${asset.path.slice(7)}${backup?'?backup=1':''}`);
    if (!response.ok) throw new Error(`Thiếu hoặc hỏng ảnh ${asset.name}; giữ nguyên project đang mở.`);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob); bitmap.close();
    result.push({asset, blob});
  }
  return result;
}
