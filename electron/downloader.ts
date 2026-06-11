import { spawn, ChildProcess } from 'child_process'
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

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').substring(0, 200)
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn(getYtdlpPath(), ['-J', '--no-download', url])
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
