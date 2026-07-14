# OmniFetch
**OmniFetch** – Universal video downloader built with Electron, Vue 3, and yt-dlp. Supports 1000+ websites including YouTube, X, Bilibili, Douyin, and more.

<p align="center">
  <a href="README.zh-CN.md"><img src="https://img.shields.io/badge/中文-🇨🇳-111827.svg?style=for-the-badge" alt="中文版本" /></a>
</p>

## Core
Features

| Emoji | Feature | Description |
|---|---|---|
| 🚀 | Universal Download | Download videos from 1000+ websites with yt-dlp compatibility |
| 📥 | One-click Parse | Enter a video URL and inspect available formats |
| 🎚️ | Format Selection | Choose video/audio quality, codec, and output container |
| ⏱️ | Progress & Speed | Show live progress percentage, speed, and ETA |
| ⏸️ | Pause / Resume / Cancel | Control active downloads and recover from interruptions |
| ⚙️ | Bundled Runtime | Includes built-in `yt-dlp` and `ffmpeg` binaries for local use |
| 🔒 | Secure IPC | Uses Electron `contextBridge` with a safe preload API |

## Quick Start

1. Requirements
   - Node.js >= 18
   - macOS / Windows / Linux

2. Install dependencies
   ```bash
   npm install
   ```

3. Download runtime binaries

	> ⚠️ **Note**: Binaries are platform-specific. You **must run `npm run download:bins` on the target platform** to fetch the matching build. Copying binaries across platforms causes incompatibility (e.g. a macOS Mach-O binary cannot run on Windows).

	> ⚠️ **Note**: Unless you specifically need the latest version, avoid frequent online binary updates. Upstream download sources are unstable and may have a high failure rate. Prefer the bundled binaries shipped with the repository.

   ```bash
   npm run download:bins
   ```

4. Start the renderer dev server
   ```bash
   npm run dev
   ```

5. Launch Electron in development mode
   ```bash
   npm run electron:dev
   ```

6. Build the production app
   ```bash
   npm run build
   ```

7. Package the release build
   ```bash
   npm run electron:build
   ```

## Usage

1. Open OmniFetch.
2. Paste a video link into the URL input.
3. Click **Parse** to load metadata and available formats.
4. Select a download format from the list.
5. Choose an output folder.
6. Click **Download**.
7. Watch live progress, speed, and ETA in the UI.
8. Use **Pause**, **Resume**, or **Cancel** as needed.

> When you cancel a download, OmniFetch prompts whether to delete the partial file.

## Runtime Binary Support

OmniFetch ships with bundled runtime binaries, organized by **platform-arch** under `bin/`:

- `bin/win32-x64/yt-dlp.exe` + `ffmpeg.exe`
- `bin/darwin-arm64/yt-dlp` + `ffmpeg` (Apple Silicon)
- `bin/darwin-x64/yt-dlp` + `ffmpeg` (Intel)
- `bin/linux-x64/yt-dlp` + `ffmpeg`

> ⚠️ Binaries are platform-specific. You **must run `npm run download:bins` on the target platform** to fetch the matching build. Copying binaries across platforms causes incompatibility (e.g. a macOS Mach-O binary cannot run on Windows).

These binaries are included as extra resources during packaging. If you run from source, execute `npm run download:bins` first to ensure the local runtime tools are available.

The Electron main process resolves built-in binaries via `electron/bin-resolver.ts` (with magic-number validation to ensure platform match). If no matching built-in binary is found, it falls back to the system `PATH` for `yt-dlp` / `ffmpeg`. If both are missing, the app shows a clear error with a fix hint (run `npm run download:bins`).

#### Bundled versions & auto-update

The app **ships prebuilt binaries for all platforms** in the installer, and `bin/manifest.json` records the bundled version per platform-arch. On startup:

- If the bundled binary for the current platform-arch is already up to date (matches `manifest.json`), the app **skips the online update** and uses the bundled file directly.
- If an upstream update is detected, a warning is shown at the top of the UI, **explicitly noting that online downloads have a high failure rate and recommending the bundled binaries**; whether to update online is left to the user.

#### Binary download links per platform

> These are the exact `latest` sources used by `npm run download:bins`. When bundling manually, place files under `bin/<platform>-<arch>/` and record the actual version in `bin/manifest.json`.

**yt-dlp**

| Platform-arch | Download URL | Stored as |
|---------------|--------------|-----------|
| `win32-x64` | `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe` | `bin/win32-x64/yt-dlp.exe` |
| `darwin-arm64` | `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos` | `bin/darwin-arm64/yt-dlp` |
| `darwin-x64` | `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos` | `bin/darwin-x64/yt-dlp` |
| `linux-x64` | `https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux` | `bin/linux-x64/yt-dlp` |

> Note: the macOS yt-dlp build is a universal binary, so `darwin-arm64` and `darwin-x64` share the same URL.

**ffmpeg**

| Platform-arch | Download URL | Extract to |
|---------------|--------------|------------|
| `win32-x64` | `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip` | extract `bin/ffmpeg.exe` → `bin/win32-x64/ffmpeg.exe` |
| `darwin-arm64` | `https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip` | extract `ffmpeg` → `bin/darwin-arm64/ffmpeg` |
| `darwin-x64` | `https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip` | extract `ffmpeg` → `bin/darwin-x64/ffmpeg` |
| `linux-x64` | `https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz` | extract `ffmpeg-*-static/ffmpeg` → `bin/linux-x64/ffmpeg` |

> Note: Windows/Linux ffmpeg ships as an archive and must be extracted; macOS ships as a bare binary zip.

#### Sync versions to manifest.json

After placing binaries under `bin/<platform>-<arch>/` (either via `npm run download:bins` or manually), run the following to auto-detect and record their actual versions into `bin/manifest.json`:

```bash
npm run sync:bin-versions
```

The script scans each `bin/<platform>-<arch>/` directory, executes `yt-dlp --version` and `ffmpeg -version`, parses the output, and writes the resolved version numbers back to `bin/manifest.json` (preserving other platforms' entries). This keeps the bundled-version record accurate without manual editing.

## Project Structure

```text
OmniFetch/
├── bin/
│   ├── <platform>-<arch>/
│   │   ├── yt-dlp(.exe)
│   │   └── ffmpeg(.exe)
│   └── manifest.json
├── electron/
│   ├── bin-resolver.ts
│   ├── downloader.ts
│   ├── binary-updater.ts
│   ├── main/
│   │   └── index.ts
│   ├── preload/
│   │   └── index.ts
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
├── electron.vite.config.ts
└── README.md
```

## Contributing

Contributions are welcome! Please follow these guidelines:

- Use Vue 3 and `<script setup>` syntax.
- Keep components small and focused.
- Write clear English names for variables and functions.
- Run `npm run build` before submitting changes.
- Open issues for bugs, feature requests, and improvements.

### Commit Messages

Follow Conventional Commits:

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation only
- `style`: formatting, no code change
- `refactor`: code change that neither fixes a bug nor adds a feature
- `chore`: maintenance tasks

## License

MIT License
