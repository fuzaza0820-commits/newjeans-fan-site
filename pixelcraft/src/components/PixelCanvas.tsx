import { useEffect, useRef, useState, useCallback } from 'react';
import { ImageUploader } from './ImageUploader';
import {
  pixelate,
  pixelateWithMask,
  pixelateAndScale,
  loadImage,
  exportCanvas,
} from '../utils/pixelate';
import type { TransitionType } from '../utils/pixelate';
import { HistoryManager } from '../utils/HistoryManager';

export interface PixelParams {
  blockSize: number;
  clarity: number;
  transition: TransitionType;
  outputFormat: 'png' | 'jpeg';
  outputQuality: number;
  outputScale: number;
}

export type { TransitionType };

interface Props {
  onParamsChange: (p: PixelParams) => void;
  params: PixelParams;
  downloadSignal: number;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
}

type BrushTool = 'brush' | 'eraser';

export const PixelCanvas: React.FC<Props> = ({
  params,
  downloadSignal,
  onHistoryChange,
}) => {
  const srcCanvasRef  = useRef<HTMLCanvasElement>(null);
  const dstCanvasRef  = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const srcCtxRef    = useRef<CanvasRenderingContext2D | null>(null);
  const maskCtxRef   = useRef<CanvasRenderingContext2D | null>(null);
  const histRef      = useRef<HistoryManager>(new HistoryManager());

  const [hasImage, setHasImage]    = useState(false);
  const [isProcessing, setProc]    = useState(false);
  const [imgSize, setImgSize]      = useState({ w: 0, h: 0 });
  const [brushActive, setBrush]    = useState(false);
  const [brushTool, setBrushTool]  = useState<BrushTool>('brush');
  const [brushSize, setBrushSize]  = useState(20);
  const [showMask, setShowMask]    = useState(false);

  // ── 加载图片 ──────────────────────────────────────────
  const handleImageLoaded = useCallback(async (file: File) => {
    const img = await loadImage(file);
    const maxW = 1200, maxH = 800;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > maxW || h > maxH) {
      const r = Math.min(maxW / w, maxH / h);
      w = Math.floor(w * r); h = Math.floor(h * r);
    }
    const srcCanvas = srcCanvasRef.current!;
    srcCanvas.width = w; srcCanvas.height = h;
    srcCtxRef.current = srcCanvas.getContext('2d')!;
    srcCtxRef.current.drawImage(img, 0, 0, w, h);

    const maskCanvas = maskCanvasRef.current!;
    maskCanvas.width = w; maskCanvas.height = h;
    maskCtxRef.current = maskCanvas.getContext('2d')!;
    maskCtxRef.current.fillStyle = 'black';
    maskCtxRef.current.fillRect(0, 0, w, h);

    setImgSize({ w, h });
    setHasImage(true);
    histRef.current.clear();
    applyPixelation(false);
  }, []);

  // ── 像素化核心 ────────────────────────────────────────
  const applyPixelation = useCallback((saveHistory: boolean) => {
    if (!srcCtxRef.current || !dstCanvasRef.current) return;
    const srcCanvas = srcCanvasRef.current!;
    const dstCanvas = dstCanvasRef.current!;
    const w = srcCanvas.width, h = srcCanvas.height;
    dstCanvas.width = w; dstCanvas.height = h;
    const dstCtx = dstCanvas.getContext('2d')!;

    setProc(true);
    requestAnimationFrame(() => {
      const maskData = maskCtxRef.current?.getImageData(0, 0, w, h);
      const hasMask = maskData && maskData.data.some((v, i) => i % 4 === 0 && v > 30);
      const opts = { blockSize: params.blockSize, clarity: params.clarity, transition: params.transition };

      const result = (hasMask && maskCtxRef.current)
        ? pixelateWithMask(srcCtxRef.current!, maskCtxRef.current, w, h, opts)
        : pixelate(srcCtxRef.current!, w, h, opts);

      dstCtx.putImageData(result, 0, 0);
      if (saveHistory) {
        histRef.current.push(result, params);
        onHistoryChange(histRef.current.canUndo(), histRef.current.canRedo());
      }
      setProc(false);
    });
  }, [params, onHistoryChange]);

  // ── 撤销 / 重做 ──────────────────────────────────────
  const applySnapshot = useCallback((snap: ImageData | null) => {
    if (!snap || !dstCanvasRef.current) return;
    const dstCtx = dstCanvasRef.current.getContext('2d')!;
    dstCtx.putImageData(snap, 0, 0);
    onHistoryChange(histRef.current.canUndo(), histRef.current.canRedo());
  }, [onHistoryChange]);

  const handleUndo = useCallback(() => applySnapshot(histRef.current.undo()), [applySnapshot]);
  const handleRedo = useCallback(() => applySnapshot(histRef.current.redo()), [applySnapshot]);

  // ── 下载 ──────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!dstCanvasRef.current || !srcCtxRef.current) return;
    const scale = params.outputScale;
    let canvas: HTMLCanvasElement;
    let w: number, h: number;
    if (scale > 1) {
      const r = pixelateAndScale(srcCtxRef.current, imgSize.w, imgSize.h, scale, {
        blockSize: params.blockSize, clarity: params.clarity, transition: params.transition,
      });
      canvas = r.canvas; w = r.width; h = r.height;
    } else {
      canvas = dstCanvasRef.current; w = canvas.width; h = canvas.height;
    }
    const blob = await exportCanvas(canvas, params.outputFormat, params.outputQuality);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `pixelcraft-${params.blockSize}px${scale > 1 ? `@${scale}x` : ''}-${w}x${h}.${params.outputFormat}`;
    a.click(); URL.revokeObjectURL(url);
  }, [params, imgSize]);

  // ── Effects ───────────────────────────────────────────
  // 1. 监听参数变化 → 重新像素化
  useEffect(() => {
    if (!hasImage) return;
    applyPixelation(true);
  }, [params, hasImage]);

  // 2. 监听下载信号
  useEffect(() => {
    if (downloadSignal <= 0 || !hasImage) return;
    handleDownload();
  }, [downloadSignal, hasImage]);

  // 3. 监听键盘 + 外部 undo/redo 事件
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasImage) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      }
    };
    const onUndo = () => { if (hasImage) handleUndo(); };
    const onRedo = () => { if (hasImage) handleRedo(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pixelcraft:undo', onUndo);
    window.addEventListener('pixelcraft:redo', onRedo);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pixelcraft:undo', onUndo);
      window.removeEventListener('pixelcraft:redo', onRedo);
    };
  }, [hasImage, handleUndo, handleRedo]);

  // ── 画笔 ──────────────────────────────────────────────
  const getBrushPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const drawBrush = (x: number, y: number) => {
    const ctx = maskCtxRef.current!;
    ctx.globalCompositeOperation = brushTool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.fillStyle = brushTool === 'brush' ? '#ffffff' : '#000000';
    ctx.beginPath(); ctx.arc(x, y, brushSize, 0, Math.PI * 2); ctx.fill();
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasImage || !brushActive) return;
    const { x, y } = getBrushPos(e); drawBrush(x, y);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hasImage || !brushActive || !(e.buttons & 1)) return;
    const { x, y } = getBrushPos(e); drawBrush(x, y);
  };
  const onMouseUp = () => { if (hasImage && brushActive) applyPixelation(true); };

  const clearMask = () => {
    if (!maskCtxRef.current) return;
    maskCtxRef.current.fillStyle = 'black';
    maskCtxRef.current.fillRect(0, 0, maskCtxRef.current.canvas.width, maskCtxRef.current.canvas.height);
    applyPixelation(true);
  };

  // ── 渲染 ──────────────────────────────────────────────
  if (!hasImage) return <ImageUploader onImageLoaded={handleImageLoaded} />;

  return (
    <div className="relative w-full h-full flex flex-col gap-3 select-none">
      {isProcessing && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 rounded-2xl">
          <span className="text-indigo-300 text-sm animate-pulse font-medium">处理中...</span>
        </div>
      )}

      <canvas ref={srcCanvasRef}  className="hidden" />
      <canvas ref={maskCanvasRef} className="hidden" />

      <div className="relative flex-1">
        <canvas
          ref={dstCanvasRef}
          className="w-full h-full object-contain rounded-xl"
          style={{ imageRendering: 'pixelated' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        />

        {showMask && (
          <canvas
            ref={maskCanvasRef}
            className="absolute top-0 left-0 w-full h-full object-contain rounded-xl opacity-40 pointer-events-none"
          />
        )}

        {/* 画笔浮动工具栏 */}
        {brushActive && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur rounded-full px-4 py-2 border border-white/10 shadow-xl">
            <button onClick={() => setBrushTool('brush')}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${brushTool === 'brush' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
              title="涂抹像素化">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={() => setBrushTool('eraser')}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${brushTool === 'eraser' ? 'bg-white text-black' : 'text-white/50 hover:text-white'}`}
              title="恢复原图">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-xs text-white/50">{brushSize}px</span>
            <input type="range" min={5} max={80} value={brushSize}
              onChange={e => setBrushSize(Number(e.target.value))} className="w-20" />
            <div className="w-px h-4 bg-white/20" />
            <button onClick={clearMask} className="text-xs text-white/50 hover:text-white transition-colors">清空</button>
            <button onClick={() => setBrush(false)} className="text-white/50 hover:text-white transition-colors ml-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1 flex-wrap gap-2">
        <span>原图：{imgSize.w} × {imgSize.h} px</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMask(v => !v)}
            className={`${showMask ? 'text-indigo-400' : 'text-slate-500'} hover:text-white transition-colors`}>
            {showMask ? '隐藏蒙版' : '显示蒙版'}
          </button>
          <button onClick={() => setBrush(v => !v)}
            className={`px-3 py-1 rounded-full border text-xs transition-all ${
              brushActive ? 'border-indigo-400 bg-indigo-400/20 text-indigo-300' : 'border-border text-slate-500 hover:border-white/30'
            }`}>
            {brushActive ? '✓ 画笔模式' : '画笔模式'}
          </button>
          <button onClick={() => { setHasImage(false); histRef.current.clear(); onHistoryChange(false, false); }}
            className="text-indigo-400 hover:text-indigo-300 transition-colors">更换图片</button>
        </div>
      </div>
    </div>
  );
};
