#!/bin/bash

# 下载 yt-dlp 二进制到 bin/ 目录（简单可靠版）
mkdir -p bin
cd bin

echo "正在下载 yt-dlp..."
curl -L -o yt-dlp https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos
chmod +x yt-dlp

if [ -f yt-dlp ]; then
  echo "✅ yt-dlp 下载成功！"
  ./yt-dlp --version
else
  echo "❌ yt-dlp 下载失败，请稍后重试"
  exit 1
fi
