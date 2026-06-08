import type { PixelParams, TransitionType } from './PixelCanvas';

interface Props {
  params: PixelParams;
  onChange: (p: PixelParams) => void;
  onDownload: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

const transitionOptions: { value: TransitionType; label: string }[] = [
  { value: 'hard',     label: '硬边 · Hard' },
  { value: 'slight',   label: '轻微柔化 · Slight' },
  { value: 'medium',   label: '中等 · Medium' },
  { value: 'smooth',   label: '平滑 · Smooth' },
  { value: 'gaussian', label: '高斯模糊 · Gaussian' },
];

const presets: { label: string; blockSize: number; clarity: number; transition: TransitionType }[] = [
  { label: '复古像素', blockSize: 12, clarity: 0.2, transition: 'hard' },
  { label: '马赛克',   blockSize: 8,  clarity: 0.9, transition: 'hard' },
  { label: '赛博朋克', blockSize: 4,  clarity: 0.5, transition: 'slight' },
  { label: '低多边形', blockSize: 20, clarity: 0.1, transition: 'smooth' },
];

const ScaleButton: React.FC<{ value: number; current: number; onClick: () => void }> = ({ value, current, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
      current === value
        ? 'border-primary bg-primary/20 text-indigo-300'
        : 'border-border text-slate-500 hover:border-primary/50'
    }`}
  >
    {value}×
  </button>
);

export const ControlPanel: React.FC<Props> = ({
  params, onChange, onDownload,
  canUndo, canRedo, onUndo, onRedo,
}) => {
  const up = (patch: Partial<PixelParams>) => onChange({ ...params, ...patch });

  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1">

      {/* 预设 */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 block">预设</label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => up({ blockSize: p.blockSize, clarity: p.clarity, transition: p.transition })}
              className="py-2 px-3 text-sm rounded-lg border border-border bg-surface hover:border-primary transition-all hover:bg-primary/10 text-slate-300"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 像素大小 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">像素大小</label>
          <span className="text-sm text-indigo-400 font-mono">{params.blockSize} px</span>
        </div>
        <input type="range" min={1} max={50} value={params.blockSize}
          onChange={e => up({ blockSize: Number(e.target.value) })} className="w-full" />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>1px</span><span>50px</span>
        </div>
      </div>

      {/* 清晰度 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">清晰度</label>
          <span className="text-sm text-indigo-400 font-mono">{Math.round(params.clarity * 100)}%</span>
        </div>
        <input type="range" min={0} max={100} value={params.clarity * 100}
          onChange={e => up({ clarity: Number(e.target.value) / 100 })} className="w-full" />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>模糊融合</span><span>边缘锐化</span>
        </div>
      </div>

      {/* 过渡效果 */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">过渡效果</label>
        <select
          value={params.transition}
          onChange={e => up({ transition: e.target.value as TransitionType })}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-primary transition-colors"
        >
          {transitionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="border-t border-border" />

      {/* 输出格式 */}
      <div>
        <label className="text-sm font-medium text-slate-300 mb-2 block">输出格式</label>
        <div className="flex gap-2">
          {(['png', 'jpeg'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => up({ outputFormat: fmt })}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                params.outputFormat === fmt
                  ? 'border-primary bg-primary/20 text-indigo-300'
                  : 'border-border text-slate-500 hover:border-primary/50'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* JPG 质量 */}
      {params.outputFormat === 'jpeg' && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-300">JPG 质量</label>
            <span className="text-sm text-indigo-400 font-mono">{params.outputQuality}%</span>
          </div>
          <input type="range" min={10} max={100} value={params.outputQuality}
            onChange={e => up({ outputQuality: Number(e.target.value) })} className="w-full" />
        </div>
      )}

      {/* 高清导出倍率 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-slate-300">导出分辨率</label>
          <span className="text-xs text-slate-500">超出原图尺寸</span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map(s => (
            <ScaleButton
              key={s}
              value={s}
              current={params.outputScale}
              onClick={() => up({ outputScale: s })}
            />
          ))}
        </div>
        {params.outputScale > 1 && (
          <p className="text-xs text-indigo-400/70 mt-1">
            将导出 {params.outputScale}× 高清图 ({params.outputScale}倍像素点)
          </p>
        )}
      </div>

      <div className="border-t border-border" />

      {/* 历史记录 */}
      <div className="flex gap-2">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all"
          title="撤销 (Ctrl+Z)"
        >
          <span>↩</span><span>撤销</span>
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-border text-sm text-slate-400 hover:text-white hover:border-white/30 disabled:opacity-30 transition-all"
          title="重做 (Ctrl+Shift+Z)"
        >
          <span>↪</span><span>重做</span>
        </button>
      </div>

      {/* 下载 */}
      <div className="mt-auto">
        <button
          onClick={onDownload}
          className="w-full py-3 rounded-xl bg-primary hover:bg-indigo-500 text-white font-semibold text-base transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]"
        >
          ⬇ 下载{params.outputScale > 1 ? `${params.outputScale}×高清` : '图片'}
        </button>
        <p className="text-xs text-slate-600 text-center mt-2">
          PNG 保留透明通道 · Ctrl+Z 撤销 · Ctrl+Shift+Z 重做
        </p>
      </div>
    </div>
  );
};
