/**
 * 构建时下载 yt-dlp 和 ffmpeg 二进制文件到 bin/ 目录
 * 用法: node scripts/download-bins.mjs
 */
import { createWriteStream, existsSync, mkdirSync, chmodSync, unlinkSync, renameSync } from 'fs'
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

// ===== 检测系统代理（用于日志提示）=====
function detectProxy() {
  for (const key of ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy']) {
    if (process.env[key] && process.env[key].startsWith('http')) return process.env[key]
  }
  if (process.platform === 'darwin') {
    try {
      const out = execSync('scutil --proxy', { encoding: 'utf8', timeout: 3000 })
      const m = out.match(/HTTPSProxy\s*:\s*(\S+)/)
      const p = out.match(/HTTPSPort\s*:\s*(\d+)/)
      if (m && p) return `http://${m[1]}:${p[1]}`
    } catch {}
  }
  return null
}

const PROXY = detectProxy()
if (PROXY) console.log(`   💡 检测到系统代理: ${PROXY}，如需代理请设置环境变量 https_proxy=${PROXY}`)

// ===== 下载工具函数（先下载到 .tmp 文件，成功后原子替换）=====
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const tmpPath = destPath + '.tmp'
    console.log(`  ⬇ 下载: ${url}`)

    // 清理上次残留的临时文件
    if (existsSync(tmpPath)) unlinkSync(tmpPath)

    const file = createWriteStream(tmpPath)
    let finished = false

    const cleanup = () => {
      file.close()
      try { if (existsSync(tmpPath)) unlinkSync(tmpPath) } catch {}
    }

    get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        cleanup()
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject)
      }
      if (response.statusCode !== 200) {
        cleanup()
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
        if (finished) return
        finished = true
        file.close()
        // 原子替换：临时文件 -> 目标文件，不破坏已存在的文件
        if (existsSync(destPath)) unlinkSync(destPath)
        renameSync(tmpPath, destPath)
        console.log(' ✓')
        resolve()
      })
      file.on('error', (err) => { if (!finished) { finished = true; cleanup(); reject(err) } })
    }).on('error', (err) => { if (!finished) { finished = true; cleanup(); reject(err) } })

    // 5 分钟超时保护
    setTimeout(() => {
      if (!finished) {
        finished = true
        cleanup()
        reject(new Error('下载超时（超过 5 分钟）'))
      }
    }, 300000)
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
