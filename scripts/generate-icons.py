"""从 src/assets/logo.png 生成 Electron 各平台图标"""
from PIL import Image
import subprocess, os, shutil, tempfile

LOGO_PATH = 'src/assets/logo.png'
BUILD_DIR = 'build'
ICONSET_DIR = os.path.join(BUILD_DIR, 'icon.iconset')

img = Image.open(LOGO_PATH).convert('RGBA')
print(f'源图片: {img.size[0]}x{img.size[1]}')

# 1. 复制主 PNG
icon_png = os.path.join(BUILD_DIR, 'icon.png')
img.save(icon_png)
print(f'  ✓ build/icon.png')

# 2. 生成 .iconset 供 iconutil 生成 .icns
if os.path.exists(ICONSET_DIR):
    shutil.rmtree(ICONSET_DIR)
os.makedirs(ICONSET_DIR)

sizes = [16, 32, 128, 256, 512]
for size in sizes:
    # 标准
    resized = img.resize((size, size), Image.LANCZOS)
    path = os.path.join(ICONSET_DIR, f'icon_{size}x{size}.png')
    resized.save(path)
    # Retina (@2x)
    resized2x = img.resize((size * 2, size * 2), Image.LANCZOS)
    path2x = os.path.join(ICONSET_DIR, f'icon_{size}x{size}@2x.png')
    resized2x.save(path2x)

# 3. 生成 .icns (macOS)
subprocess.run([
    'iconutil', '--convert', 'icns',
    '--output', os.path.join(BUILD_DIR, 'icon.icns'),
    ICONSET_DIR
], check=True)
print(f'  ✓ build/icon.icns')

shutil.rmtree(ICONSET_DIR)

# 4. 生成 .ico (Windows)
ico_path = os.path.join(BUILD_DIR, 'icon.ico')
# .ico 包含多个尺寸
ico_sizes = [16, 32, 48, 64, 128, 256]
ico_images = []
for size in ico_sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    ico_images.append(resized)
ico_images[0].save(ico_path, format='ICO', sizes=[(s, s) for s in ico_sizes], append_images=ico_images[1:])
print(f'  ✓ build/icon.ico')

print('\n全部图标生成完成！')
