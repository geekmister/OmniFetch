<p align="center">
	<img width="100%" src="https://capsule-render.vercel.app/api?type=waving&height=220&color=0:4f46e5,50:0ea5e9,100:14b8a6&text=OmniFetch&fontColor=ffffff&fontSize=64" alt="OmniFetch Banner" />
</p>

<p align="center">
	<a href="LICENSE"><img src="https://img.shields.io/badge/许可证-MIT-111827.svg?style=for-the-badge" alt="MIT" /></a>
	<img src="https://img.shields.io/badge/运行时-仅浏览器-0f766e.svg?style=for-the-badge" alt="Browser Only" />
	<img src="https://img.shields.io/badge/隐私-本地处理-1d4ed8.svg?style=for-the-badge" alt="Local Processing" />
	<img src="https://img.shields.io/badge/测试-Playwright-7c3aed.svg?style=for-the-badge" alt="Playwright" />
</p>

<p align="center">
	<a href="https://github.com/Geekmister/OmniFetch/stargazers">
		<img src="https://img.shields.io/github/stars/Geekmister/OmniFetch?style=flat-square&label=Starts&color=f59e0b" alt="GitHub Stars" />
	</a>
	<a href="https://github.com/Geekmister/OmniFetch/network/members">
		<img src="https://img.shields.io/github/forks/Geekmister/OmniFetch?style=flat-square&label=Forks&color=0ea5e9" alt="GitHub Forks" />
	</a>
	<a href="https://github.com/Geekmister/OmniFetch/issues">
		<img src="https://img.shields.io/github/issues/Geekmister/OmniFetch?style=flat-square&label=Issues&color=ef4444" alt="GitHub Issues" />
	</a>
	<a href="https://github.com/Geekmister/OmniFetch/commits">
		<img src="https://img.shields.io/github/last-commit/Geekmister/OmniFetch?style=flat-square&label=Last%20Commit&color=22c55e" alt="Last Commit" />
	</a>
	<img src="https://visitor-badge.laobi.icu/badge?page_id=Geekmister.OmniFetch" alt="Visitors" />
	<a href="https://github.com/Geekmister/OmniFetch/releases">
		<img src="https://img.shields.io/github/downloads/Geekmister/OmniFetch/total?style=flat-square&label=Downloads&color=8b5cf6" alt="Downloads" />
	</a>
</p>

<p align="center">
	<a href="README.md">
		<img src="https://img.shields.io/badge/English-🇺🇸-111827.svg?style=for-the-badge" alt="English Version" />
	</a>
</p>

<p align="center">
	OmniFetch是一个通用视频下载器，基于 Electron、Vue 3 和 yt-dlp，支持 1000+ 网站（YouTube、X、B站、抖音等）。一键解析、格式选择、下载进度显示，开箱即用。
</p>

---

![示例](demo.png)

## 核心功能

| Emoji | 功能 | 描述 |
|---|---|---|
| 🚀 | 全站下载 | 基于 yt-dlp，支持 1000+ 视频站点 |
| 📥 | 一键解析 | 输入视频链接，自动读取可用格式 |
| 🎚️ | 格式选择 | 选择清晰度、音视频编码、容器 |
| ⏱️ | 进度展示 | 实时显示下载百分比、速度和 ETA |
| ⏸️ | 暂停/继续/取消 | 允许控制当前下载任务 |
| ⚙️ | 内置运行时 | 携带 `yt-dlp` 和 `ffmpeg` 二进制文件 |
| 🔒 | 安全 IPC | Electron `contextBridge` + 预加载层，保证渲染器安全 |

## 快速开始

1. 环境要求
   - Node.js >= 18
   - macOS / Windows / Linux

2. 安装依赖
   ```bash
   npm install
   ```

3. 下载运行时二进制
   ```bash
   npm run download:bins
   ```

4. 启动渲染器开发服务
   ```bash
   npm run dev
   ```

5. 启动 Electron 开发模式
   ```bash
   npm run electron:dev
   ```

6. 生成生产构建
   ```bash
   npm run build
   ```

7. 打包发布
   ```bash
   npm run electron:build
   ```

## 使用说明

1. 打开 OmniFetch。
2. 将视频链接粘贴到 URL 输入框。
3. 点击 **Parse** 解析视频信息和可选格式。
4. 从列表中选择下载格式。
5. 选择输出文件夹。
6. 点击 **Download** 开始下载。
7. 界面会显示实时进度、下载速度和剩余时间。
8. 需要时可点击 **Pause**、**Resume** 或 **Cancel**。

> 取消下载时，OmniFetch 会提示是否删除已下载的临时文件。

## 运行时二进制支持

OmniFetch 自带运行时二进制文件，存放于 `bin/`：

- `bin/yt-dlp`
- `bin/ffmpeg`

这些文件会在打包时作为额外资源一起包含。若从源码运行，请先执行 `npm run download:bins`，以确保本地运行环境可用。

Electron 主进程通过 `electron/bin-resolver.ts` 解析内置二进制文件，若本地环境没有匹配版本，则回退到系统 `PATH`。

## 项目结构

```text
OmniFetch/
├── bin/
│   ├── ffmpeg
│   └── yt-dlp
├── electron/
│   ├── bin-resolver.ts
│   ├── downloader.ts
│   ├── main.ts
│   ├── preload.cjs
│   └── ytdlp-updater.ts
├── python-script/
├── scripts/
│   └── download-bins.mjs
├── src/
│   ├── assets/
│   ├── components/
│   ├── stores/
│   ├── views/
│   ├── App.vue
│   └── main.ts
├── docs/
│   └── TechnicalSolution-v1.0.0(MVP).md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.zh-CN.md
```

## 贡献指南

欢迎贡献！请遵循以下规范：

- 使用 Vue 3 和 `<script setup>` 语法。
- 保持组件职责单一。
- 为变量和函数使用清晰的英文命名。
- 提交前运行 `npm run build` 确认构建通过。
- 遇到问题时请先提交 issue，再提交 PR。

### 提交规范

请遵循 Conventional Commits：

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档修改
- `style`: 格式化修改，不影响逻辑
- `refactor`: 重构代码，不新增功能也不修复 Bug
- `chore`: 构建/维护任务

---

## 实时趋势面板

<p align="center">
	<a href="https://star-history.com/#Geekmister/OmniFetch&Date">
		<img alt="Star 历史图表" width="100%" src="https://api.star-history.com/svg?repos=Geekmister/OmniFetch&type=Date" />
	</a>
</p>

<p align="center">
	<img alt="提交活动热力图" src="https://github-readme-activity-graph.vercel.app/graph?username=Geekmister&bg_color=0f172a&color=e2e8f0&line=4f46e5&point=06b6d4&area=true&hide_border=true" />
</p>

<p align="center">
	<a href="https://github.com/Geekmister/IPlay/graphs/contributors"><img src="https://contrib.rocks/image?repo=Geekmister/IPlay" alt="贡献者" /></a>
</p>

---

## 许可证

基于 [MIT 许可证](LICENSE) 发布。
