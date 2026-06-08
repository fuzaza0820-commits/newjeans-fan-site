from PIL import Image
import os

# 9张图片路径
images = [
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394690607_irfnnf.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394700609_7agu0w.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394708607_txye0e.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394720156_1ubbpt.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394735273_cw12sc.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394745673_4342an.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394760409_zok0pe.jpg",
    r"C:\Users\1\.qclaw\media\inbound\paste_1780394775325_h4cld4.jpg",
    r"F:\本地资源库\VB素材\收藏到 潮流风向标.jpg",
]

output_dir = r"C:\Users\1\.qclaw\workspace-agent-5c622325\landscape"
os.makedirs(output_dir, exist_ok=True)

for img_path in images:
    if not os.path.exists(img_path):
        print(f"文件不存在: {img_path}")
        continue

    img = Image.open(img_path)
    w, h = img.size
    print(f"\n处理: {os.path.basename(img_path)} | 原始尺寸: {w}x{h}")

    # 目标比例 16:9（横屏）
    target_ratio = 16 / 9

    if w / h >= target_ratio:
        # 图片够宽，裁上下
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        crop_box = (0, top, w, top + new_h)
        cropped = img.crop(crop_box)
        print(f"  裁上下 -> {cropped.size}")
    else:
        # 图片太高，裁左右
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        crop_box = (left, 0, left + new_w, h)
        cropped = img.crop(crop_box)
        print(f"  裁左右 -> {cropped.size}")

    # 保存
    out_name = os.path.splitext(os.path.basename(img_path))[0] + "_landscape.jpg"
    out_path = os.path.join(output_dir, out_name)
    cropped.save(out_path, "JPEG", quality=92)
    print(f"  已保存: {out_path}")

print("\n全部完成！")
