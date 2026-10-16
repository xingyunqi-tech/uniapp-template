/**
 * 图片压缩
 */

export interface CompressImageOptions {
  /** 最长边上限 (px)，超出时无论体积都缩放；支付宝小程序只能按质量压缩，不限制尺寸 */
  maxSide?: number;
  /** 压缩质量 0-100 */
  quality?: number;
  /** 未超出最长边时，文件小于该字节数不做质量压缩 */
  minSize?: number;
}

type ResolvedOptions = Required<CompressImageOptions>;

export const DEFAULT_COMPRESS_OPTIONS: Readonly<ResolvedOptions> = {
  maxSide: 1600,
  quality: 80,
  minSize: 200 * 1024,
};

const NON_COMPRESSIBLE_EXT = /\.(gif|svg|pdf|docx?|xlsx?|pptx?|txt|csv|zip|rar|7z|mp4|mov|avi|mp3|wav|m4a|aac)$/i;

function isNonCompressible(path: string): boolean {
  if (/^data:image\/gif/i.test(path)) return true;
  return NON_COMPRESSIBLE_EXT.test(path.split('?')[0].split('#')[0]);
}

/** 按最长边限制计算目标尺寸，未超出时返回原尺寸 */
export function getTargetSize(width: number, height: number, maxSide: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (!longest || longest <= maxSide) return { width, height };
  const ratio = maxSide / longest;
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}

function clampQuality(quality: number): number {
  return Math.min(100, Math.max(1, Math.round(quality)));
}

/**
 * 支付宝 compressImage 只有压缩级别，uni 按 floor(quality / 26) 换算：0 低 / 1 中 / 2 高 / 3 不压缩
 */
export function toAlipayQuality(quality: number): number {
  const level = quality >= 60 ? 2 : quality >= 30 ? 1 : 0;
  return Math.max(1, level * 26);
}

// #ifndef H5
function getImageInfo(src: string): Promise<UniApp.GetImageInfoSuccessData> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({ src, success: resolve, fail: reject });
  });
}

function getFileSize(filePath: string): Promise<number | undefined> {
  return new Promise(resolve => {
    uni.getFileInfo({
      filePath,
      success: res => resolve(res.size),
      fail: () => resolve(undefined),
    });
  });
}

/** 原生端可能带透明通道的格式，compressImage 输出格式由平台决定 */
const NATIVE_ALPHA_TYPES = new Set(['png', 'webp']);

function buildCompressArgs(
  src: string,
  info: { width: number; height: number },
  opts: ResolvedOptions,
): { args: UniApp.CompressImageOptions; resized: boolean } {
  const quality = clampQuality(opts.quality);
  // #ifndef MP-ALIPAY
  const target = getTargetSize(info.width, info.height, opts.maxSide);
  const args: UniApp.CompressImageOptions = { src, quality };
  const resized = target.width !== info.width || target.height !== info.height;
  if (resized) {
    if (info.width >= info.height) {
      args.compressedWidth = target.width;
    } else {
      args.compressedHeight = target.height;
    }
  }
  return { args, resized };
  // #endif
  // #ifdef MP-ALIPAY
  return { args: { src, quality: toAlipayQuality(quality) }, resized: false };
  // #endif
}

async function compressNative(path: string, opts: ResolvedOptions): Promise<string> {
  const [info, size] = await Promise.all([getImageInfo(path), getFileSize(path)]);
  const type = (info.type || '').toLowerCase();
  if (type === 'gif') return path;

  const exceedsSide = Math.max(info.width, info.height) > opts.maxSide;
  if (!exceedsSide && (NATIVE_ALPHA_TYPES.has(type) || size === undefined || size < opts.minSize)) return path;

  const { args, resized } = buildCompressArgs(path, info, opts);
  const result = await new Promise<UniApp.CompressImageSuccessResult>((resolve, reject) => {
    uni.compressImage({ ...args, success: resolve, fail: reject });
  });
  if (!result?.tempFilePath) return path;
  if (resized || size === undefined) return result.tempFilePath;

  const compressedSize = await getFileSize(result.tempFilePath);
  if (compressedSize !== undefined && compressedSize >= size) return path;
  return result.tempFilePath;
}
// #endif

// #ifdef H5
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function dataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.floor((base64.length * 3) / 4);
}

/** 输出 data URL，uni.uploadFile 在 H5 上会按其 MIME 生成带扩展名的文件名 */
async function compressInBrowser(path: string, opts: ResolvedOptions): Promise<string> {
  const blob = await fetch(path).then(res => res.blob());
  const mime = blob.type.toLowerCase();
  if (!mime.startsWith('image/') || mime === 'image/gif' || mime === 'image/svg+xml') return path;

  const img = await loadImage(path);
  const exceedsSide = Math.max(img.naturalWidth, img.naturalHeight) > opts.maxSide;
  if (!exceedsSide && (mime === 'image/png' || blob.size < opts.minSize)) return path;
  const outputType = mime === 'image/png' || mime === 'image/webp' ? mime : 'image/jpeg';

  const target = getTargetSize(img.naturalWidth, img.naturalHeight, opts.maxSide);
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return path;
  ctx.drawImage(img, 0, 0, target.width, target.height);

  const dataUrl = canvas.toDataURL(outputType, clampQuality(opts.quality) / 100);
  if (!dataUrl.startsWith('data:image/')) return path;
  if (!exceedsSide && dataUrlSize(dataUrl) >= blob.size) return path;
  return dataUrl;
}
// #endif

/**
 * 压缩图片，返回可直接上传的路径；GIF、非图片、无需压缩或压缩失败时返回原路径
 *
 * 限制：原生端缩放 PNG/WebP 时可能输出 JPEG 并丢失透明通道
 *
 * @example
 * ```ts
 * const path = await compressImage(tempFilePath, { maxSide: 1080, quality: 70 });
 * ```
 */
export async function compressImage(path: string, options: CompressImageOptions = {}): Promise<string> {
  if (!path || isNonCompressible(path)) return path;
  const opts: ResolvedOptions = { ...DEFAULT_COMPRESS_OPTIONS, ...options };

  try {
    // #ifndef H5
    return await compressNative(path, opts);
    // #endif
    // #ifdef H5
    return await compressInBrowser(path, opts);
    // #endif
  } catch (error) {
    console.warn('[compressImage] 压缩失败，使用原图上传:', error);
    return path;
  }
}
