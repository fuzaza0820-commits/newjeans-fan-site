# Artifact: 批量图片横屏裁剪处理
## 时间
2026-06-02 18:10 GMT+8

## 目标
将用户提供的9张图片（含 NewJeans 成员/专辑参考图）全部调整为横屏 16:9 格式，用于网页 Hero 照片墙。

## 输入文件
1. `C:\Users\1\.qclaw\media\inbound\paste_1780394690607_irfnnf.jpg` (736×552)
2. `C:\Users\1\.qclaw\media\inbound\paste_1780394700609_7agu0w.jpg` (960×641)
3. `C:\Users\1\.qclaw\media\inbound\paste_1780394708607_txye0e.jpg` (736×471)
4. `C:\Users\1\.qclaw\media\inbound\paste_1780394720156_1ubbpt.jpg` (1200×800)
5. `C:\Users\1\.qclaw\media\inbound\paste_1780394735273_cw12sc.jpg` (1200×800)
6. `C:\Users\1\.qclaw\media\inbound\paste_1780394745673_4342an.jpg` (735×541)
7. `C:\Users\1\.qclaw\media\inbound\paste_1780394760409_zok0pe.jpg` (2160×3840, 竖屏)
8. `C:\Users\1\.qclaw\media\inbound\paste_1780394775325_h4cld4.jpg` (720×1275, 竖屏)
9. `F:\本地资源库\VB素材\收藏到 潮流风向标.jpg` (720×1275, 竖屏)

## 处理方式
- 使用 Python + Pillow 批量处理
- 策略：以中心为基准，裁切至 16:9（宽 > 高×16/9 则裁上下，反之裁左右）
- 超大尺寸图片（>1920×1080）先缩放到 1920×1080 再裁切

## 输出结果
输出目录：`C:\Users\1\.qclaw\workspace-agent-5c622325\landscape_final\`

| 文件 | 输出尺寸 |
|------|---------|
| paste_1780394690607_irfnnf_landscape.jpg | 981×552 |
| paste_1780394700609_7agu0w_landscape.jpg | 1139×641 |
| paste_1780394708607_txye0e_landscape.jpg | 837×471 |
| paste_1780394720156_1ubbpt_landscape.jpg | 1422×800 |
| paste_1780394735273_cw12sc_landscape.jpg | 1422×800 |
| paste_1780394745673_4342an_landscape.jpg | 961×541 |
| paste_1780394760409_zok0pe_landscape.jpg | 1920×1080 |
| paste_1780394775325_h4cld4_landscape.jpg | 1920×1080 |
| 收藏到 潮流风向标_landscape.jpg | 1920×1080 |

## 下一步
等待用户确认是否将处理后的图片嵌入 `newjeans-index.html` 的 Hero 照片墙。
