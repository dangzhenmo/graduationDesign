from PIL import Image
import os

# 各图片文件路径
image_paths = [
    r"C:\Homework\paper\project\dist\icons\2-1.jpg"
]

# 目标宽高
target_size = (300, 200)

# 调整每张图片的大小
for img_path in image_paths:
    img = Image.open(img_path)
    img_resized = img.resize(target_size, Image.LANCZOS)
    img_resized.save(img_path)  # 可以保存为新的文件或覆盖原文件



