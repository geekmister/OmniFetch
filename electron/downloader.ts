import { spawn, ChildProcess, execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import { getYtdlpPath, getFfmpegPath } from './bin-resolver'

export interface VideoFormat {
  formatId: string
  resolution: string
  ext: string
  filesize: number | null
  note: string
}

export interface VideoInfo {
  title: string
  duration: number
  thumbnail: string
  webpageUrl: string
  formats: VideoFormat[]
}

export interface DownloadProgress {
  percent: number
  speed: string
  eta: string
}

/**
 * 自动探测代理地址
 * 优先级:
 *   1. HTTPS_PROXY / HTTP_PROXY 环境变量
 *   2. macOS 系统代理设置 (networksetup / scutil)
 * 
 * 如果你的 VPN/代理未通过环境变量暴露，请在启动前设置:
 *   export HTTPS_PROXY=http://127.0.0.1:7890   # Clash 默认端口
 */
function detectProxy(): string | null {
  // 1. 从环境变量读取
  const envVars = ['HTTPS_PROXY', 'HTTP_PROXY', 'https_proxy', 'http_proxy', 'ALL_PROXY', 'all_proxy']
  for (const key of envVars) {
    const val = process.env[key]
    if (val && (val.startsWith('http://') || val.startsWith('socks5://'))) {
      return val
    }
  }

  // 2. macOS: 读取系统代理设置
  if (process.platform === 'darwin') {
    try {
      const output = execSync('scutil --proxy', { encoding: 'utf8', timeout: 3000 })
      const httpsPort = output.match(/HTTPSPort\s*:\s*(\d+)/)
      const httpsProxy = output.match(/HTTPSProxy\s*:\s*(\S+)/)
      if (httpsPort && httpsProxy) {
        const proxy = `http://${httpsProxy[1]}:${httpsPort[1]}`
        console.log(`[proxy] 检测到 macOS 系统代理: ${proxy}`)
        return proxy
      }
      // 回退到 HTTP 代理
      const httpPort = output.match(/HTTPPort\s*:\s*(\d+)/)
      const httpProxy = output.match(/HTTPProxy\s*:\s*(\S+)/)
      if (httpPort && httpProxy) {
        const proxy = `http://${httpProxy[1]}:${httpPort[1]}`
        console.log(`[proxy] 检测到 macOS 系统代理: ${proxy}`)
        return proxy
      }
    } catch {
      // scutil 不可用时静默跳过
    }
  }

  return null
}

/**
 * 如果检测到代理，返回 yt-dlp --proxy 参数
 */
function getProxyArgs(): string[] {
  const proxy = detectProxy()
  if (proxy) {
    console.log(`[proxy] 使用代理: ${proxy}`)
    return ['--proxy', proxy]
  }
  console.log('[proxy] 未检测到代理环境变量，直连网络')
  return []
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 200)
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const args = ['-J', '--no-download', ...getProxyArgs(), url]
    const ytdlp = spawn(getYtdlpPath(), args)
    let stdout = ''
    let stderr = ''

    ytdlp.stdout.on('data', (data: Buffer) => {
      stdout += data.toString()
    })

    ytdlp.stderr.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ytdlp.on('error', (err) => {
      reject(new Error(`无法启动 yt-dlp: ${err.message}。请确保已安装 yt-dlp。`))
    })

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`yt-dlp 解析失败 (退出码 ${code}): ${stderr.trim() || '未知错误'}`))
        return
      }

      try {
        const info = JSON.parse(stdout)
        const formats: VideoFormat[] = info.formats
          .filter((f: any) => {
            // 过滤掉纯视频无音频或纯音频无视频的格式，除非是音频格式
            if (f.vcodec === 'none' && f.acodec === 'none') return false
            return true
          })
          .map((f: any) => {
            let resolution = '音频'
            let note = ''
            if (f.height) {
              resolution = `${f.height}p`
              if (f.fps && f.fps > 30) note += `${f.fps}fps `
            } else if (f.acodec !== 'none' && f.vcodec === 'none') {
              resolution = '音频'
              note = f.abr ? `${f.abr}kbps` : ''
            }
            if (f.ext) note += `${f.ext}`
            if (f.vcodec && f.vcodec !== 'none') note += ` ${f.vcodec}`

            return {
              formatId: f.format_id,
              resolution,
              ext: f.ext,
              filesize: f.filesize || null,
              note: note.trim(),
            }
          })
          // 按分辨率排序（从高到低），音频放最后
          .sort((a: VideoFormat, b: VideoFormat) => {
            const aHeight = parseInt(a.resolution) || 0
            const bHeight = parseInt(b.resolution) || 0
            return bHeight - aHeight
          })

        // 去重：相同分辨率+格式只保留一个
        const seen = new Set<string>()
        const uniqueFormats = formats.filter((f) => {
          const key = `${f.resolution}-${f.ext}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })

        resolve({
          title: info.title || '未知标题',
          duration: info.duration || 0,
          thumbnail: info.thumbnail || '',
          webpageUrl: info.webpage_url || url,
          formats: uniqueFormats,
        })
      } catch (e: any) {
        reject(new Error(`解析视频信息失败: ${e.message}`))
      }
    })
  })
}

export async function startDownload(
  url: string,
  formatId: string,
  outputPath: string,
  onProgress: (progress: DownloadProgress) => void
): Promise<{ success: boolean; path: string }> {
  // 确保输出目录存在
  const dir = dirname(outputPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  return new Promise((resolve, reject) => {
    const args = [
      '-f', formatId,
      '-o', outputPath,
      '--newline',
      '--progress',
      '--no-playlist',
      ...getProxyArgs(),
      url,
    ]

    const ytdlp: ChildProcess = spawn(getYtdlpPath(), args)
    let stderr = ''

    ytdlp.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      const progress: DownloadProgress = { percent: 0, speed: '', eta: '' }

      // 解析进度: [download] 45.2% of 12.34MiB at 2.34MiB/s ETA 00:05
      const percentMatch = text.match(/(\d+(?:\.\d+)?)%/)
      const speedMatch = text.match(/at\s+([\d.]+[KMG]?B\/s)/)
      const etaMatch = text.match(/ETA\s+(\d{2}:\d{2})/)

      if (percentMatch) progress.percent = parseFloat(percentMatch[1])
      if (speedMatch) progress.speed = speedMatch[1]
      if (etaMatch) progress.eta = etaMatch[1]

      if (percentMatch) {
        onProgress(progress)
      }
    })

    ytdlp.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString()
    })

    ytdlp.on('error', (err) => {
      reject(new Error(`无法启动 yt-dlp: ${err.message}。请确保已安装 yt-dlp。`))
    })

    ytdlp.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, path: outputPath })
      } else {
        reject(new Error(`下载失败 (退出码 ${code}): ${stderr.trim() || '未知错误'}`))
      }
    })
  })
}
