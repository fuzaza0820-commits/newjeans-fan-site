## Member Strip Gallery Implementation

**时间**: 2026-06-04 ~15:45

### 目标
将竖版五成员拼贴图裁剪为5张独立横条图，实现悬停放大+描边动画，并整合完整页面。

### 完成
1. **裁剪5张成员横条图** (1080x384px):
   - member_danielle_strip.jpg (黄色)
   - member_hyein_strip.jpg (紫色)
   - member_hanni_strip.jpg (粉色)
   - member_haerin_strip.jpg (绿色)
   - member_minji_strip.jpg (蓝色)

2. **重写 newjeans-index.html** (47618字节):
   - **Hero**: 8张Pinterest全屏轮播（保留）
   - **Members Section**: 拼贴图横条布局，5张横条叠放为完整拼贴图
     - 悬停放大 (scale 1.15) + 高度展开 (160px -> 220px)
     - 每位成员独立颜色描边 + 闪光动画
     - 点击弹出成员详情（圆形头像+介绍）
   - **Albums Section**: 11张CD光盘左右滑动，悬停旋转，点击跳YouTube搜索
   - **Gallery Section**: 8张图片网格，悬停放大+边框变色
   - **导航栏**: 4个锚点 (HOME/MEMBERS/ALBUMS/GALLERY) + 滚动高亮
   - **所有美学**: 扫描线/VHS/像素漂浮/Glitch/自定义光标/滚动渐入

### 文件
- HTML: C:\Users\1\.qclaw\workspace-agent-5c622325\newjeans-index.html
- 成员横条: C:\Users\1\.qclaw\workspace-agent-5c622325\landscape_final\member_*.jpg
