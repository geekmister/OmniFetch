# Contributing to OmniFetch

感谢你考虑为 **OmniFetch** 做出贡献！本文档说明如何搭建开发环境、管理运行时二进制、提交代码与发起 Pull Request。

> 中文版见下方 [中文贡献指南](#中文贡献指南)。

---

## English Guide

### 1. Development Setup

Requirements:

- **Node.js >= 18**
- **Git** with [Git LFS](https://git-lfs.com/) installed (`git lfs install`)
- macOS / Windows / Linux

```bash
# 1. Fork and clone (include Git LFS)
git clone https://github.com/<your-username>/OmniFetch.git
cd OmniFetch
git lfs install

# 2. Install dependencies
npm install

# 3. Fetch runtime binaries for YOUR platform
npm run download:bins

# 4. Start the renderer dev server (terminal A)
npm run dev

# 5. Launch Electron in development mode (terminal B)
npm run electron:dev
```

> ⚠️ **Platform-specific binaries**: You **must run `npm run download:bins` on the target platform** to fetch the matching build. Copying binaries across platforms causes incompatibility (e.g. a macOS Mach-O binary cannot run on Windows).

### 2. Runtime Binaries & Git LFS

The bundled `yt-dlp` and `ffmpeg` binaries live under `bin/<platform>-<arch>/` and are **tracked via Git LFS** because some exceed GitHub's 100 MB file limit (e.g. `win32-x64/ffmpeg.exe` is ~137 MB).

Rules for contributors:

- **Never commit raw binaries without LFS.** The repo's `.gitattributes` already routes `bin/**/ffmpeg*`, `bin/**/yt-dlp*` through LFS. As long as Git LFS is installed, `git add` will store a pointer automatically.
- After adding or updating a binary under `bin/<platform>-<arch>/`, sync its version into `bin/manifest.json`:
  ```bash
  npm run sync:bin-versions
  ```
- Prefer the bundled binaries over frequent online updates — upstream sources are unstable and may fail.
- If you clone and only see small pointer files (not real binaries), run `git lfs pull`.

### 3. Project Layout (key paths)

| Path | Purpose |
|------|---------|
| `src/` | Renderer (Vue 3 + TDesign Vue Next) |
| `electron/main/` | Electron main process entry |
| `electron/preload/` | Secure `contextBridge` preload API |
| `electron/bin-resolver.ts` | Resolves built-in binaries (with magic-number validation) |
| `electron/downloader.ts` | Download orchestration |
| `electron/binary-updater.ts` | Auto-update logic for binaries |
| `scripts/download-bins.mjs` | Fetches binaries per platform |
| `bin/<platform>-<arch>/` | Bundled runtime binaries (Git LFS) |
| `bin/manifest.json` | Records bundled binary versions |

### 4. Branching & Pull Requests

- Create feature branches from `main`: `git checkout -b feat/your-feature` or `fix/your-bug`.
- Keep PRs focused — one logical change per PR.
- Ensure `npm run build` passes and `npm run typecheck` is clean before pushing.
- Link related issues (e.g. `Closes #123`) in the PR description.
- For UI changes, include a short before/after note or screenshot.

### 5. Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/). Format:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

Types:

| Type | Meaning |
|------|---------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, deps, or maintenance tasks |
| `ci` | CI configuration |
| `revert` | Revert a previous commit |

Scopes (suggested): `frontend`, `api`/`electron`, `bin`, `config`, `deps`, `docs`.

Example:

```text
feat(frontend): 添加格式列表右侧留白自适应

- 根据容器宽度动态计算列数
- 修复窄屏下格式卡片被压缩的问题

Closes #42
```

### 6. Code Style

- **Frontend**: Vue 3 `<script setup>` SFCs; use TDesign Vue Next components; keep components small and single-purpose.
- **Naming**: Clear English names for variables and functions; Chinese is acceptable in comments/UI copy.
- **TypeScript**: Strict mode is on; avoid `any` where feasible.
- **Formatting**: Run the project's formatter/linter before committing.

### 7. Reporting Issues

- Search [existing issues](https://github.com/Geekmister/OmniFetch/issues) first.
- Include: OS + version, Node.js version, app version, steps to reproduce, expected vs actual behavior, and logs (if any).
- For download failures, mention the target site and whether your network can open it in a browser.

---

# 中文贡献指南

感谢你为 **OmniFetch** 做出贡献！本文档介绍如何搭建开发环境、管理运行时二进制、提交代码并发起 Pull Request。

## 1. 开发环境搭建

环境要求：

- **Node.js >= 18**
- 已安装 [Git LFS](https://git-lfs.com/) 的 **Git**（`git lfs install`）
- macOS / Windows / Linux

```bash
# 1. Fork 并克隆（包含 Git LFS）
git clone https://github.com/<your-username>/OmniFetch.git
cd OmniFetch
git lfs install

# 2. 安装依赖
npm install

# 3. 下载当前平台的运行时二进制
npm run download:bins

# 4. 启动渲染器开发服务（终端 A）
npm run dev

# 5. 启动 Electron 开发模式（终端 B）
npm run electron:dev
```

> ⚠️ **二进制是平台相关的**：**必须在目标平台执行 `npm run download:bins`** 以获取对应版本。跨平台直接拷贝会导致不兼容（如 macOS 的 Mach-O 二进制无法在 Windows 上运行）。

## 2. 运行时二进制与 Git LFS

预置的 `yt-dlp` 与 `ffmpeg` 二进制存放在 `bin/<platform>-<arch>/` 下，因部分文件超过 GitHub 100MB 限制（如 `win32-x64/ffmpeg.exe` 约 137MB），**统一通过 Git LFS 管理**。

贡献者须知：

- **切勿在未经 LFS 的情况下直接提交原始二进制**。仓库 `.gitattributes` 已把 `bin/**/ffmpeg*`、`bin/**/yt-dlp*` 路由到 LFS，只要安装了 Git LFS，`git add` 会自动存储为指针文件。
- 在 `bin/<platform>-<arch>/` 新增或更新二进制后，请将版本号同步到 `bin/manifest.json`：
  ```bash
  npm run sync:bin-versions
  ```
- 建议优先使用仓库预置二进制，避免频繁联网更新（上游源不稳定，失败率较高）。
- 若克隆后只看到小指针文件（而非真实二进制），请执行 `git lfs pull`。

## 3. 项目结构（关键路径）

| 路径 | 作用 |
|------|------|
| `src/` | 渲染进程（Vue 3 + TDesign Vue Next） |
| `electron/main/` | Electron 主进程入口 |
| `electron/preload/` | 安全的 `contextBridge` 预加载层 |
| `electron/bin-resolver.ts` | 解析内置二进制（含魔数校验） |
| `electron/downloader.ts` | 下载编排 |
| `electron/binary-updater.ts` | 二进制自动更新逻辑 |
| `scripts/download-bins.mjs` | 按平台拉取二进制 |
| `bin/<platform>-<arch>/` | 预置运行时二进制（Git LFS） |
| `bin/manifest.json` | 记录预置二进制版本 |

## 4. 分支与 Pull Request

- 从 `main` 切出功能分支：`git checkout -b feat/your-feature` 或 `fix/your-bug`。
- 保持 PR 聚焦——一个 PR 只做一类逻辑改动。
- 推送前确保 `npm run build` 通过、`npm run typecheck` 无报错。
- 在 PR 描述中关联相关 issue（如 `Closes #123`）。
- 涉及 UI 改动时，附上简要的前后对比说明或截图。

## 5. 提交规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/)。格式：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：

| Type | 含义 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 仅文档修改 |
| `style` | 格式化修改，不影响逻辑 |
| `refactor` | 重构代码，不新增功能也不修复 Bug |
| `perf` | 性能优化 |
| `test` | 新增/更新测试 |
| `chore` | 构建、依赖或维护任务 |
| `ci` | CI 配置 |
| `revert` | 回滚某次提交 |

作用域（scope，建议）：`frontend`、`api`/`electron`、`bin`、`config`、`deps`、`docs`。

示例：

```text
feat(frontend): 添加格式列表右侧留白自适应

- 根据容器宽度动态计算列数
- 修复窄屏下格式卡片被压缩的问题

Closes #42
```

## 6. 代码风格

- **前端**：使用 Vue 3 `<script setup>` 单文件组件；优先使用 TDesign Vue Next 组件；保持组件职责单一。
- **命名**：变量与函数使用清晰的英文命名；注释与界面文案可使用中文。
- **TypeScript**：开启严格模式，尽量避免 `any`。
- **格式化**：提交前运行项目的格式化/校验工具。

## 7. 提交 Issue

- 先搜索 [已有 issue](https://github.com/Geekmister/OmniFetch/issues)。
- 请包含：操作系统及版本、Node.js 版本、应用版本、复现步骤、预期与实际表现、相关日志。
- 下载失败类问题，请说明目标站点以及本地网络是否能在浏览器中打开该站点。
