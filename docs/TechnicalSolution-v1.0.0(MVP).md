# Electron 视频下载器 - 完整技术方案

## 一、MVP（最小可行产品）范围

**目标**：用户输入 URL → 解析视频信息 → 选择格式 → 单任务下载 → 显示进度 → 完成通知。

**不做**：队列管理、并行下载、断点续传、历史记录、深色主题切换（后续加）。

---

## 二、项目初始化

### 2.1 创建项目
```bash
npm create vite@latest twitter-downloader -- --template vue-ts
cd twitter-downloader
npm install
```

### 2.2 安装 Electron 相关
```bash
npm install electron electron-builder vite-plugin-electron -D
npm install electron-updater  # 后续版本用
```

### 2.3 安装 UI 依赖
```bash
npm install tailwindcss postcss autoprefixer @primer/primitives @primer/vue lucide-vue-next
npx tailwindcss init -p
```

### 2.4 安装 yt-dlp 运行时依赖
```bash
# 运行时需有 yt-dlp 和 ffmpeg 在 PATH 或打包时内置
npm install @ffmpeg/ffmpeg  # 不推荐，直接用原生 ffmpeg
# 实际使用 child_process 调用系统命令，需要用户自行安装或打包携带
```

---

## 三、目录结构（MVP）

```
twitter-downloader/
├── electron/
│   ├── main.ts          # 主进程入口
│   ├── preload.ts       # 预加载脚本（暴露安全API）
│   └── downloader.ts    # yt-dlp 调用封装
├── src/                  # Vue 渲染进程
│   ├── assets/
│   ├── components/
│   │   ├── UrlInput.vue
│   │   ├── FormatSelect.vue
│   │   ├── DownloadProgress.vue
│   │   └── DownloadButton.vue
│   ├── views/
│   │   └── HomeView.vue
│   ├── stores/
│   │   └── download.ts  # Pinia 下载状态管理
│   ├── App.vue
│   ├── main.ts
│   └── style.css         # Tailwind + Primer tokens
├── tailwind.config.js
├── vite.config.ts        # 集成 Electron 插件
└── package.json
```

---

## 四、核心代码实现（MVP）

### 4.1 Electron 主进程配置 (`electron/main.ts`)

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import { startDownload, getVideoInfo } from './downloader';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: __dirname + '/preload.js',
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset', // macOS 风格
  });
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('dist/index.html');
  }
}

app.whenReady().then(createWindow);

// IPC 处理
ipcMain.handle('get-video-info', async (_, url: string) => {
  return await getVideoInfo(url);
});

ipcMain.handle('start-download', async (_, url: string, formatId: string, outputPath: string) => {
  return await startDownload(url, formatId, outputPath, (progress) => {
    mainWindow?.webContents.send('download-progress', progress);
  });
});
```

### 4.2 预加载脚本 (`electron/preload.ts`)

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  startDownload: (url: string, formatId: string, outputPath: string) =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  onDownloadProgress: (callback: (progress: any) => void) =>
    ipcRenderer.on('download-progress', (_, progress) => callback(progress)),
});
```

### 4.3 yt-dlp 封装 (`electron/downloader.ts`)

```typescript
import { spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';

export async function getVideoInfo(url: string) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', ['-J', url]);
    let output = '';
    ytdlp.stdout.on('data', (data) => (output += data));
    ytdlp.stderr.on('data', (data) => console.error(data.toString()));
    ytdlp.on('close', (code) => {
      if (code === 0) {
        const info = JSON.parse(output);
        const formats = info.formats
          .filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none')
          .map((f: any) => ({
            formatId: f.format_id,
            resolution: f.height ? `${f.height}p` : 'audio',
            ext: f.ext,
            filesize: f.filesize,
          }));
        resolve({ title: info.title, formats });
      } else reject(new Error('yt-dlp failed'));
    });
  });
}

export async function startDownload(
  url: string,
  formatId: string,
  outputPath: string,
  onProgress: (progress: any) => void
) {
  // 确保输出目录存在
  const dir = outputPath.substring(0, outputPath.lastIndexOf('/'));
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const args = [
    '-f', formatId,
    '-o', outputPath,
    '--newline',
    '--progress',
    url,
  ];
  const ytdlp = spawn('yt-dlp', args);
  ytdlp.stdout.on('data', (data) => {
    const text = data.toString();
    // 解析进度: [download] 45.2% of 12.34MiB at  2.34MiB/s ETA 00:05
    const percentMatch = text.match(/(\d+(?:\.\d+)?)%/);
    const speedMatch = text.match(/at\s+([\d\.]+\w*\/s)/);
    if (percentMatch) {
      onProgress({
        percent: parseFloat(percentMatch[1]),
        speed: speedMatch ? speedMatch[1] : '0 B/s',
      });
    }
  });
  return new Promise((resolve, reject) => {
    ytdlp.on('close', (code) => {
      if (code === 0) resolve({ success: true, path: outputPath });
      else reject(new Error('Download failed'));
    });
  });
}
```

### 4.4 Vue 渲染进程关键组件

**下载 Store** (`src/stores/download.ts`)
```typescript
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useDownloadStore = defineStore('download', () => {
  const currentTask = ref<any>(null);
  const progress = ref(0);
  const speed = ref('');
  const isDownloading = ref(false);

  const startNewTask = (url: string, formatId: string) => {
    currentTask.value = { url, formatId };
    isDownloading.value = true;
    progress.value = 0;
    speed.value = '';
    // 调用 electronAPI.startDownload...
  };
  return { currentTask, progress, speed, isDownloading, startNewTask };
});
```

**主视图** (`src/views/HomeView.vue`)
```vue
<template>
  <div class="max-w-2xl mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-6">Twitter/X 视频下载器</h1>
    <UrlInput @url-submit="handleUrlSubmit" />
    <FormatSelect v-if="formats.length" :formats="formats" v-model="selectedFormat" />
    <DownloadProgress v-if="store.isDownloading" :progress="store.progress" :speed="store.speed" />
    <DownloadButton @click="handleDownload" :disabled="!selectedFormat" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDownloadStore } from '../stores/download';

const store = useDownloadStore();
const formats = ref([]);
const selectedFormat = ref('');

const handleUrlSubmit = async (url: string) => {
  const info = await window.electronAPI.getVideoInfo(url);
  formats.value = info.formats;
};

const handleDownload = async () => {
  const outputPath = await window.electronAPI.showSaveDialog(); // 需扩展
  await window.electronAPI.startDownload(url, selectedFormat.value, outputPath);
};
</script>
```

### 4.5 Tailwind + Primer 配置

`tailwind.config.js` 引入 Primer 设计令牌：
```js
const primer = require('@primer/primitives');

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ...primer.colors.light,
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
```

### 4.6 构建脚本 (`package.json` scripts)
```json
{
  "scripts": {
    "dev": "vite",
    "electron:dev": "cross-env NODE_ENV=development electron electron/main.js",
    "build": "vite build && electron-builder",
    "preview": "vite preview"
  }
}
```

需要配合 `vite-plugin-electron` 简化开发流程：
```ts
// vite.config.ts
import electron from 'vite-plugin-electron';

export default {
  plugins: [
    vue(),
    electron({
      entry: 'electron/main.ts',
      vite: { build: { outDir: 'dist-electron' } },
    }),
  ],
};
```

---

## 五、后续版本（V1.1+）计划

### 5.1 V1.1 - 体验优化
- [ ] 深色模式 + 主题切换（基于 Primer 的 `colorMode`）
- [ ] 下载队列（最多同时 3 个任务）
- [ ] 暂停/恢复下载（yt-dlp 支持 `--continue`）
- [ ] 历史记录（SQLite 存储）
- [ ] 拖拽 URL 到窗口自动解析

### 5.2 V1.2 - 功能扩展
- [ ] 播放列表/多视频批量解析
- [ ] 内置视频预览（使用 HTML5 video 播放下载中的片段）
- [ ] 格式详情展示（编码、帧率、文件大小）
- [ ] 自定义输出路径 + 文件名模板
- [ ] 下载完成后自动打开文件夹

### 5.3 V2.0 - 高级特性
- [ ] 社交媒体登录获取更高质量视频（需 Cookie）
- [ ] 内置 FFmpeg 二进制（避免用户安装）
- [ ] 视频转码/提取音频
- [ ] 订阅管理器（定期检查新视频）
- [ ] Electron 自动更新（electron-updater）

### 5.4 技术债务清理（V1.1 前完成）
- [ ] 错误边界和用户友好提示
- [ ] 单元测试（Vitest + @vue/test-utils）
- [ ] 日志系统（electron-log）
- [ ] 打包配置优化（减少安装包体积）

---

## 六、打包与分发（MVP 后做）

使用 `electron-builder` 配置 `electron-builder.json`：
```json
{
  "appId": "com.yourcompany.twitterdownloader",
  "productName": "Twitter Downloader",
  "directories": { "output": "release" },
  "files": ["dist/**/*", "dist-electron/**/*"],
  "extraResources": [
    {
      "from": "bin/",
      "to": "bin/",
      "filter": ["yt-dlp.exe", "ffmpeg.exe"]
    }
  ],
  "win": { "target": "nsis" },
  "mac": { "target": "dmg" }
}
```

需要在打包时将 `yt-dlp` 和 `ffmpeg` 二进制文件放在 `bin/` 目录，并在代码中通过 `process.resourcesPath` 获取路径。

---

## 七、MVP 验收标准

1. 输入 `https://twitter.com/xxx/status/123456` 能正确解析出视频标题和可选格式列表。
2. 选择一个格式点击下载，弹出系统保存对话框。
3. 下载过程中显示进度百分比和实时速度。
4. 下载完成系统通知。
5. 应用窗口尺寸合理，界面风格接近 GitHub（浅色模式即可）。

---

## 八、开始 Vibe Coding 的命令行

```bash
# 一条龙创建并运行 MVP
npm create vite@latest twitter-downloader -- --template vue-ts
cd twitter-downloader
npm install
npm install electron vite-plugin-electron electron-builder -D
npm install tailwindcss postcss autoprefixer @primer/primitives @primer/vue lucide-vue-next pinia
npx tailwindcss init -p
mkdir electron
touch electron/main.ts electron/preload.ts electron/downloader.ts
# 然后按上述代码填充，最后执行
npm run dev
# 另开终端
npm run electron:dev
```