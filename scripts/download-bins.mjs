/**
 * 构建时下载 yt-dlp 和 ffmpeg 二进制文件到 bin/ 目录
 * 用法: node scripts/download-bins.mjs
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync, unlinkSync } from 'fs'
import { get } from 'https'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { createUnzip } from 'zlib'
import { pipeline } from 'stream'
import { promisify } from 'util'

const pipe = promisify(pipeline)

const __dirname = dirname(fileURLToPath(import.meta.url))
const BIN_DIR = join(__dirname, '..', 'bin')
const PLATFORM = process.platform // 'darwin' | 'win32' | 'linux'
const ARCH = process.arch       // 'arm64' | 'x64'

// ===== 下载源配置 =====
const SOURCES = {
  ytdlp: {
    darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
    linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
    win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  },
  ffmpeg: {
    darwin_arm64: 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip',
    darwin_x64: 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip',
    linux_x64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    linux_arm64: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz',
    win32_x64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
  },
}

function getYtdlpUrl() {
  return SOURCES.ytdlp[PLATFORM] || SOURCES.ytdlp.linux
}

function getFfmpegUrl() {
  const key = `${PLATFORM}_${ARCH}`
  return SOURCES.ffmpeg[key] || SOURCES.ffmpeg.linux_x64
}

function getYtdlpName() {
  return PLATFORM === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
}

function getFfmpegName() {
  return PLATFORM === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
}

// ===== 下载工具函数 =====
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`  ⬇ 下载: ${url}`)
    const file = createWriteStream(destPath)
    get(url, (response) => {
      // 处理重定向
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close()
        unlinkSync(destPath)
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        file.close()
        unlinkSync(destPath)
        reject(new Error(`HTTP ${response.statusCode}`))
        return
      }
      const total = parseInt(response.headers['content-length'], 10)
      let downloaded = 0
      response.on('data', (chunk) => {
        downloaded += chunk.length
        if (total) {
          const pct = ((downloaded / total) * 100).toFixed(0)
          process.stdout.write(`\r    ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)}MB / ${(total / 1024 / 1024).toFixed(1)}MB)`)
        }
      })
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log(' ✓')
        resolve()
      })
      file.on('error', (err) => {
        file.close()
        unlinkSync(destPath)
        reject(err)
      })
    }).on('error', reject)
  })
}

// ===== 主流程 =====
async function main() {
  console.log('🔧 OmniFetch - 下载运行时二进制文件')
  console.log(`   平台: ${PLATFORM} / ${ARCH}`)
  console.log(`   目标: ${BIN_DIR}\n`)

  // 创建 bin 目录
  if (!existsSync(BIN_DIR)) {
    mkdirSync(BIN_DIR, { recursive: true })
  }

  // 1. 下载 yt-dlp
  const ytdlpName = getYtdlpName()
  const ytdlpPath = join(BIN_DIR, ytdlpName)
  const ytdlpUrl = getYtdlpUrl()

  if (existsSync(ytdlpPath)) {
    console.log(`📦 yt-dlp 已存在，跳过下载`)
  } else {
    console.log(`📦 下载 yt-dlp...`)
    try {
      await downloadFile(ytdlpUrl, ytdlpPath)
      if (PLATFORM !== 'win32') {
        chmodSync(ytdlpPath, 0o755)
      }
      console.log(`   ✅ yt-dlp 就绪: ${ytdlpPath}`)
    } catch (err) {
      console.error(`   ❌ yt-dlp 下载失败: ${err.message}`)
      console.log(`   💡 请手动安装: brew install yt-dlp`)
    }
  }

  // 2. 下载 ffmpeg
  const ffmpegName = getFfmpegName()
  const ffmpegPath = join(BIN_DIR, ffmpegName)
  const ffmpegUrl = getFfmpegUrl()

  if (existsSync(ffmpegPath)) {
    console.log(`📦 ffmpeg 已存在，跳过下载`)
  } else {
    console.log(`📦 下载 ffmpeg...`)
    try {
      // macOS: 直接下载静态二进制
      if (PLATFORM === 'darwin') {
        const zipPath = join(BIN_DIR, 'ffmpeg.zip')
        await downloadFile(ffmpegUrl, zipPath)
        console.log(`   解压中...`)
        execSync(`unzip -o "${zipPath}" -d "${BIN_DIR}"`, { stdio: 'pipe' })
        unlinkSync(zipPath)
        if (PLATFORM !== 'win32') {
          chmodSync(ffmpegPath, 0o755)
        }
      } else {
        // Linux/Windows: 需要解压 tar.xz 或 zip
        console.log(`   ⚠️ 当前平台暂不支持自动下载 ffmpeg`)
        console.log(`   💡 请手动安装: brew install ffmpeg (macOS) / apt install ffmpeg (Linux)`)
      }
      console.log(`   ✅ ffmpeg 就绪: ${ffmpegPath}`)
    } catch (err) {
      console.error(`   ❌ ffmpeg 下载失败: ${err.message}`)
      console.log(`   💡 请手动安装: brew install ffmpeg`)
    }
  }

  console.log(`\n🎉 二进制文件准备完成!`)
}

main().catch((err) => {
  console.error('下载失败:', err.message)
  process.exit(1)
})
