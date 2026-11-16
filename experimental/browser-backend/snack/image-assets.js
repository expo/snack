export {selectImageAsset} from '../../../runtime/src/worker/image-selection';
export const isImage = file => /\.(png|jpe?g|gif|webp)$/i.test(file);
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function imageFamily(file, files) {
  if (!isImage(file)) return [];
  const explicit=/@([\d.]+)x(?:\.(?:web|ios|android|native))?\.[^.]+$/.exec(file);
  if(explicit)return files.includes(file)?[{file,scale:Number(explicit[1])}]:[];
  const dot = file.lastIndexOf('.');
  const stem=file.slice(0,dot), target=/\.(web|ios|android|native)$/.exec(stem);
  const scale='([1-9](?:\\.\\d+)?)';
  const pattern = new RegExp('^' + (target?escape(stem.slice(0,-target[0].length))+'(?:@'+scale+'x)?'+escape(target[0])+'(?:@'+scale+'x)?':escape(stem)+'(?:@'+scale+'x)?') + escape(file.slice(dot)) + '$');
  const result = files.flatMap(candidate => { const match = pattern.exec(candidate); return match ? [{ file: candidate, scale: match[1]&&match[2]?NaN:Number(match[1] || match[2] || 1) }] : []; }).sort((a, b) => a.scale - b.scale);
  if (result.length > 8 || result.some((item, i) => !Number.isFinite(item.scale) || item.scale > 8 || (i > 0 && item.scale === result[i - 1].scale))) throw Error('Invalid image scale family: ' + file);
  return result;
}
export function imageDimensions(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset, length) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  let width, height;
  if (bytes.length >= 24 && view.getUint32(0) === 0x89504e47 && text(12, 4) === 'IHDR') { width = view.getUint32(16); height = view.getUint32(20); }
  else if (bytes.length >= 10 && /^GIF8[79]a$/.test(text(0, 6))) { width = view.getUint16(6, true); height = view.getUint16(8, true); }
  else if (bytes.length >= 12 && view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset++;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.length) break;
      const size = view.getUint16(offset);
      if (size < 2 || offset + size > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && size >= 7) { height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break; }
      offset += size;
    }
  } else if (bytes.length >= 25 && text(0, 4) === 'RIFF' && text(8, 4) === 'WEBP') {
    const kind = text(12, 4);
    if (kind === 'VP8X' && bytes.length >= 30) { width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16); height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16); }
    else if (kind === 'VP8 ' && bytes.length >= 30 && text(23, 3) === '\x9d\x01\x2a') { width = view.getUint16(26, true) & 0x3fff; height = view.getUint16(28, true) & 0x3fff; }
    else if (kind === 'VP8L' && bytes[20] === 0x2f) { const bits = view.getUint32(21, true); width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; }
  }
  if (!width || !height || width > 32768 || height > 32768) throw Error('Invalid or unsupported image dimensions');
  return { width, height };
}
export function buildImageAsset(file, files, read) {
  const family = imageFamily(file, files);
  if (!family.length) throw Error('Missing image ' + file);
  const variants = family.map(({ file, scale }) => {
    if (!Number.isFinite(scale) || scale <= 0 || scale > 8) throw Error('Invalid image scale');
    let bytes = read(file);
    if (typeof bytes === 'string') { const match = /^data:[^;,]+;base64,([A-Za-z0-9+/]*={0,2})$/.exec(bytes); if (!match) throw Error('Expected a base64 image for ' + file); bytes = Uint8Array.from(atob(match[1]), c => c.charCodeAt(0)); }
    const dimensions = imageDimensions(bytes);
    let binary = ''; for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    const ext = file.split('.').pop().toLowerCase();
    return { mime: { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp' }[ext], base64: btoa(binary), scale, width: dimensions.width / scale, height: dimensions.height / scale };
  });
  const first = variants[0];
  if (variants.some(item => Math.abs(item.width - first.width) > 1 || Math.abs(item.height - first.height) > 1)) throw Error('Image scale variants have inconsistent dimensions');
  return { ...first, variants };
}

export function platformImage(file, files, platform='web') {
  if (!isImage(file)) return null;
  const dot=file.lastIndexOf('.'), stem=file.slice(0,dot), extension=file.slice(dot);
  if (/\.(web|ios|android|native)(?:@[\d.]+x)?$/.test(stem)) return imageFamily(file,files).length?file:null;
  const scale=/(@[\d.]+x)$/.exec(stem);
  const base=scale?stem.slice(0,-scale[0].length):stem;
  for (const target of [platform,...(platform==='web'?[]:['native']),'']) {
    const candidate=base+(target?'.'+target:'')+(scale?.[0]||'')+extension;
    if(imageFamily(candidate,files).length)return candidate;
    if(scale&&target){const alternate=base+scale[0]+'.'+target+extension;if(imageFamily(alternate,files).length)return alternate;}
  }
  return null;
}
