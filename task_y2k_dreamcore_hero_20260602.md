# Artifact: NewJeans 网页改版 - 梦核千禧年像素风格
## 时间
2026-06-02 18:20 GMT+8

## 目标
将 `newjeans-index.html` 的 Hero 区域改造为照片墙背景，并整体注入梦核（Dreamcore）/ 千禧年（Y2K）像素与点阵设计美学。

## 核心改造

### Hero 照片墙
- 9张处理后的横屏图片（landscape_final 目录）以 4×3 网格铺满 Hero 全屏
- 叠加层：VHS 故障条纹 + 粉蓝紫渐变 overlay（mix-blend-mode: overlay）
- 照片整体压暗至 brightness(0.35)，突出前景文字
- 鼠标移动触发视差位移（photoWall 跟随鼠标轻微平移）

### 梦核 / Y2K 像素美学要点
| 元素 | 实现方式 |
|------|---------|
| 扫描线 | 固定全屏 `scanlines` 层，repeating-linear-gradient 4px 周期 |
| Glitch 文字 | `::before` / `::after` 伪元素色偏 + `clip-path` 分半动画 |
| 像素光标 | 24×24px 方格棋盘图案，hover 放大 1.8× |
| 像素字体 | 全局导航、标题、按钮改用 `Press Start 2P` |
| 步进动画 | 所有 transition/animation 加 `steps(4~8)` 实现像素卡顿感 |
| 漂浮像素方块 | 10 个 `.dream-block` 从底部飘到顶部，随机颜色/大小 |
| 方形瞳孔眼睛 | `.pixel-eye::after` 用 `clip-path` 裁成方形瞳孔 |
| Loading 屏 | 像素进度条 + `steps(10)` 步进填充动画 |
| 霓虹绿均衡器 | 音乐区 `.bar` 用 `--neon-green` + `box-shadow` 发光 |
| 点阵背景 | Members/Albums 区用 `radial-gradient` 1px 点阵 |

### 保留元素
- 村上隆太阳花 SVG（三朵，固定定位，旋转动画）
- 飞天小女警配色体系（pink/blue/yellow/green/purple）
- 成员卡片悬停动效、专辑轮播、音乐均衡器功能

## 文件
- 输出：`C:\Users\1\.qclaw\workspace-agent-5c622325\newjeans-index.html`（45,385 bytes）
- 图片引用：本地 `file:///` 协议，需本地浏览器打开预览

## 已知限制
- `file:///` 路径在部分浏览器（Firefox）可能被 CORS 阻止
- 建议后续将图片上传图床后替换为 http(s) URL
