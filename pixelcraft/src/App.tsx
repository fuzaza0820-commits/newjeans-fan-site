import { useState, useCallback } from 'react';
import { PixelCanvas, type PixelParams, type TransitionType } from './components/PixelCanvas';
import { ControlPanel } from './components/ControlPanel';

const DEFAULT_PARAMS: PixelParams = {
  blockSize: 8,
  clarity: 0.5,
  transition: 'medium' as TransitionType,
  outputFormat: 'png',
  outputQuality: 90,
  outputScale: 1,
};

function App() {
  const [params, setParams] = useState<PixelParams>(DEFAULT_PARAMS);
  const [downloadSignal, setDownloadSignal] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // undo/redo 事件由 PixelCanvas 监听处理
  const handleUndo = useCallback(() => window.dispatchEvent(new CustomEvent('pixelcraft:undo')), []);
  const handleRedo = useCallback(() => window.dispatchEvent(new CustomEvent('pixelcraft:redo')), []);
  const handleDownload = useCallback(() => setDownloadSignal(s => s + 1), []);

  return (
    <div className="min-h-screen bg-surface text-slate-200 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold grid grid-cols-2 gap-[2px] p-1">
              <span className="bg-white/80 w-1 h-1 block rounded-sm" />
              <span className="bg-white/40 w-1 h-1 block rounded-sm" />
              <span className="bg-white/40 w-1 h-1 block rounded-sm" />
              <span className="bg-white/80 w-1 h-1 block rounded-sm" />
            </span>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">PixelCraft</h1>
          <span className="hidden sm:inline text-xs text-slate-600 ml-2 border-l border-border pl-2">
            在线像素化工具
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="hidden md:inline">✦ 纯本地处理</span>
          <span className="hidden md:inline">✦ 画笔局部处理</span>
          <span className="hidden md:inline">✦ 高清放大导出</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-screen-2xl mx-auto w-full">

        {/* 左侧预览区 */}
        <section className="flex-1 min-h-[400px] lg:min-h-0 bg-panel rounded-2xl border border-border overflow-hidden p-4">
          <PixelCanvas
            downloadSignal={downloadSignal}
            params={params}
            onParamsChange={setParams}
            onHistoryChange={(u, r) => { setCanUndo(u); setCanRedo(r); }}
          />
        </section>

        {/* 右侧控制面板 */}
        <aside className="lg:w-[340px] flex-shrink-0">
          <div className="bg-panel rounded-2xl border border-border p-5 h-full">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">参数控制</h2>
            </div>
            <ControlPanel
              params={params}
              onChange={setParams}
              onDownload={handleDownload}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
            />
          </div>
        </aside>
      </main>

      <footer className="text-center py-3 text-xs text-slate-600">
        图片完全在本地处理，不上传至任何服务器 · Ctrl+Z 撤销 · Ctrl+Shift+Z 重做
      </footer>
    </div>
  );
}

export default App;
