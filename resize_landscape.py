from PIL import Image
import os

input_dir = r"C:\Users\1\.qclaw\workspace-agent-5c622325\landscape"
output_dir = r"C:\Users\1\.qclaw\workspace-agent-5c622325\landscape_final"
os.makedirs(output_dir, exist_ok=True)

# 最大尺寸：宽度不超过1920，保持16:9
MAX_WIDTH = 1920
TARGET_RATIO = 16 / 9

for fname in os.listdir(input_dir):
    if not fname.endswith(".jpg"):
        continue
    img_path = os.path.join(input_dir, fname)
    img = Image.open(img_path)
    w, h = img.size
    print(f"{fname}: {w}x{h}", end=" -> ")

    # 如果高度超过1080，或者宽度超过1920，缩放
    if w > MAX_WIDTH or h > 1080:
        # 以宽度为基准缩放到1920，然后裁到16:9
        scale = MAX_WIDTH / w
        new_w = MAX_WIDTH
        new_h = int(h * scale)
        img = img.resize((new_w, new_h), Image.LANCZOS)
        print(f"缩放 {new_w}x{new_h}", end=" -> ")

        # 裁到16:9
        if new_w / new_h > TARGET_RATIO:
            target_h = new_h
            target_w = int(target_h * TARGET_RATIO)
        else:
            target_w = new_w
            target_h = int(target_w / TARGET_RATIO)

        left = (new_w - target_w) // 2
        top = (new_h - target_h) // 2
        img = img.crop((left, top, left + target_w, top + target_h))
        print(f"裁至 {img.size}", end="")

    out_path = os.path.join(output_dir, fname)
    img.save(out_path, "JPEG", quality=90)
    print(f" 保存: {out_path}")

print("\n全部完成！输出目录:", output_dir)
