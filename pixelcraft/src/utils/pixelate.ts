// ============================================================
// PixelCraft 像素化核心引擎 v2
// 支持：全局像素化 + 蒙版局部像素化 + 高清放大导出
// ============================================================

export interface PixelateOptions {
  blockSize: number;
  clarity: number;
  transition: TransitionType;
}

/** 过渡类型 */
export type TransitionType = 'hard' | 'slight' | 'medium' | 'smooth' | 'gaussian';

// ── 过渡半径映射 ─────────────────────────────────────
const RADIUS_MAP: Record<TransitionType, number> = {
  hard: 0,
  slight: 1,
  medium: 2,
  smooth: 3,
  gaussian: 4,
};

// ── 全局像素化 ─────────────────────────────────────
/**
 * 将 canvas 内容像素化，返回 ImageData
 */
export function pixelate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: PixelateOptions
): ImageData {
  const src = ctx.getImageData(0, 0, width, height);
  return applyPixelation(src, width, height, options);
}

// ── 蒙版局部像素化 ─────────────────────────────────
/**
 * 在 srcCtx 之上叠加蒙版（mask：白色=像素化区域，黑色=保留原图）
 * 返回组合后的 ImageData
 *
 * @param srcCtx      源图画布上下文（未处理）
 * @param maskCtx     蒙版画布上下文（白色=像素化区域）
 * @param width       画布宽
 * @param height      画布高
 * @param options     像素化参数
 */
export function pixelateWithMask(
  srcCtx: CanvasRenderingContext2D,
  maskCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: PixelateOptions
): ImageData {
  const src = srcCtx.getImageData(0, 0, width, height);
  const mask = maskCtx.getImageData(0, 0, width, height);
  return applyPixelationWithMask(src, mask, width, height, options);
}

// ── 放大导出（2x / 3x / 4x）──────────────────────────
/**
 * 将 srcCtx 内容放大 scale 倍，像素化后输出
 * 返回放大后的 canvas（用于导出）
 */
export function pixelateAndScale(
  srcCtx: CanvasRenderingContext2D,
  srcW: number,
  srcH: number,
  scale: number,
  options: PixelateOptions
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const canvas = document.createElement('canvas');
  canvas.width = srcW * scale;
  canvas.height = srcH * scale;
  const ctx = canvas.getContext('2d')!;

  // 放大原图
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    srcCtx.canvas as HTMLCanvasElement,
    0, 0, srcW, srcH,
    0, 0, canvas.width, canvas.height
  );

  // 对放大后的图做像素化
  const result = pixelate(ctx, canvas.width, canvas.height, options);
  ctx.putImageData(result, 0, 0);

  return { canvas, width: canvas.width, height: canvas.height };
}

// ── 核心像素化算法 ─────────────────────────────────
function applyPixelation(
  src: ImageData,
  width: number,
  height: number,
  options: PixelateOptions
): ImageData {
  const { blockSize, clarity, transition } = options;
  const dst = new ImageData(width, height);
  const srcData = src.data;
  const dstData = dst.data;
  const radius = RADIUS_MAP[transition];

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const color = sampleBlock(srcData, width, bx, by, blockSize, clarity);
      const ex = Math.min(bx + blockSize, width);
      const ey = Math.min(by + blockSize, height);

      if (radius === 0) {
        fillBlock(dstData, width, bx, by, ex, ey, color);
      } else {
        fillBlockSmooth(dstData, width, bx, by, ex, ey, color, blockSize, radius);
      }
    }
  }
  return dst;
}

function applyPixelationWithMask(
  src: ImageData,
  mask: ImageData,
  width: number,
  height: number,
  options: PixelateOptions
): ImageData {
  const { blockSize, clarity, transition } = options;
  const dst = new ImageData(width, height);
  const srcData = src.data;
  const maskData = mask.data;
  const dstData = dst.data;
  const radius = RADIUS_MAP[transition];

  for (let by = 0; by < height; by += blockSize) {
    for (let bx = 0; bx < width; bx += blockSize) {
      const ex = Math.min(bx + blockSize, width);
      const ey = Math.min(by + blockSize, height);

      // 判断蒙版白色占比（>=50% 则整块像素化）
      let maskSum = 0;
      for (let y = by; y < ey; y++) {
        for (let x = bx; x < ex; x++) {
          const mi = (y * width + x) * 4;
          maskSum += maskData[mi]; // R 通道（灰度）
        }
      }
      const coverage = maskSum / (255 * (ex - bx) * (ey - by));

      if (coverage >= 0.3) {
        // 蒙版覆盖区域 → 像素化
        const color = sampleBlock(srcData, width, bx, by, blockSize, clarity);
        if (radius === 0) {
          fillBlock(dstData, width, bx, by, ex, ey, color);
        } else {
          fillBlockSmooth(dstData, width, bx, by, ex, ey, color, blockSize, radius);
        }
      } else {
        // 保留原图
        for (let y = by; y < ey; y++) {
          for (let x = bx; x < ex; x++) {
            const si = (y * width + x) * 4;
            const di = (y * width + x) * 4;
            dstData[di]     = srcData[si];
            dstData[di + 1] = srcData[si + 1];
            dstData[di + 2] = srcData[si + 2];
            dstData[di + 3] = srcData[si + 3];
          }
        }
      }
    }
  }
  return dst;
}

// ── 辅助函数 ─────────────────────────────────────

function sampleBlock(
  data: Uint8ClampedArray,
  imgW: number,
  bx: number,
  by: number,
  blockSize: number,
  clarity: number
): [number, number, number, number] {
  const ex = Math.min(bx + blockSize, imgW);
  const ey = Math.min(by + blockSize, Infinity); // 高度由外层控制

  let r = 0, g = 0, b = 0, a = 0;
  let count = 0;

  // 采样所有像素（平均）
  for (let y = by; y < ey; y++) {
    for (let x = bx; x < ex; x++) {
      const i = (y * imgW + x) * 4;
      r += data[i]; g += data[i + 1]; b += data[i + 2]; a += data[i + 3];
      count++;
    }
  }

  const avgR = r / count, avgG = g / count, avgB = b / count, avgA = a / count;

  if (clarity > 0) {
    const cx = Math.min(bx + Math.floor(blockSize / 2), imgW - 1);
    const cy = Math.min(by + Math.floor(blockSize / 2), Infinity);
    const ci = (cy * imgW + cx) * 4;
    const t = clarity;
    return [
      avgR * (1 - t) + data[ci] * t,
      avgG * (1 - t) + data[ci + 1] * t,
      avgB * (1 - t) + data[ci + 2] * t,
      avgA * (1 - t) + data[ci + 3] * t,
    ];
  }

  return [avgR, avgG, avgB, avgA];
}

function fillBlock(
  data: Uint8ClampedArray,
  imgW: number,
  bx: number,
  by: number,
  ex: number,
  ey: number,
  color: [number, number, number, number]
) {
  const [r, g, b, a] = color;
  for (let y = by; y < ey; y++) {
    for (let x = bx; x < ex; x++) {
      const i = (y * imgW + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = a;
    }
  }
}

function fillBlockSmooth(
  data: Uint8ClampedArray,
  imgW: number,
  bx: number,
  by: number,
  ex: number,
  ey: number,
  color: [number, number, number, number],
  _blockSize: number,
  radius: number
) {
  const [r, g, b, a] = color;
  const bw = ex - bx;
  const bh = ey - by;

  for (let y = by; y < ey; y++) {
    for (let x = bx; x < ex; x++) {
      const distX = Math.min(x - bx, ex - 1 - x);
      const distY = Math.min(y - by, ey - 1 - y);
      const dist = Math.max(distX, distY) / Math.max(bw, bh);
      const alpha = Math.pow(Math.min(1, dist * 2 + 0.5), 1 / Math.max(radius, 1));
      const i = (y * imgW + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b;
      data[i + 3] = Math.min(255, a * alpha);
    }
  }
}

// ── 导出 & 加载 ─────────────────────────────────────

export async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

export async function exportCanvas(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpeg',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('导出失败')), `image/${format}`, quality / 100);
  });
}


