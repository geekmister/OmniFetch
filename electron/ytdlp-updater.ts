/**
 * yt-dlp 自动更新模块
 * 应用启动时检查 yt-dlp 版本，如有新版本自动下载更新
 */
import { spawn } from 'child_process'
import { createWriteStream, existsSync, unlinkSync, chmodSync, renameSync, readFileSync, writeFileSync } from 'fs'
import { get } from 'https'
import { join } from 'path'
import { getYtdlpPath, getYtdlpDir } from './bin-resolver'

const isWin = process.platform === 'win32'
const YTDLP_UPDATE_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
const YTDLP_UPDATE_URL_WIN = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'

/**
 * 获取当前 yt-dlp 版本号
 */
function getCurrentVersion(ytdlpPath: string): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn(ytdlpPath, ['--version'])
    let output = ''
    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim())
      } else {
        resolve(null)
      }
    })
    proc.on('error', () => resolve(null))
  })
}

/**
 * 下载最新 yt-dlp 二进制
 */
function downloadLatest(destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = isWin ? YTDLP_UPDATE_URL_WIN : YTDLP_UPDATE_URL
    const tmpPath = destPath + '.tmp'
    const file = createWriteStream(tmpPath)

    get(url, (response) => {
      // 处理重定向
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close()
        unlinkSync(tmpPath)
        get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(createWriteStream(tmpPath))
            .on('finish', () => finishUpdate(tmpPath, destPath, resolve))
            .on('error', () => resolve(false))
        })
        return
      }
      response.pipe(file)
      file.on('finish', () => finishUpdate(tmpPath, destPath, resolve))
      file.on('error', () => resolve(false))
    }).on('error', () => resolve(false))
  })
}

function finishUpdate(tmpPath: string, destPath: string, resolve: (ok: boolean) => void) {
  try {
    // 替换旧文件
    if (existsSync(destPath)) {
      unlinkSync(destPath)
    }
    renameSync(tmpPath, destPath)
    if (!isWin) {
      chmodSync(destPath, 0o755)
    }
    console.log('[yt-dlp] 更新完成')
    resolve(true)
  } catch (err) {
    console.error('[yt-dlp] 更新失败:', err)
    resolve(false)
  }
}

/**
 * 检查并更新 yt-dlp（静默执行，不阻塞启动）
 */
export async function checkAndUpdateYtdlp(): Promise<void> {
  const ytdlpPath = getYtdlpPath()

  // 如果使用的是系统 PATH 中的 yt-dlp，不自动更新
  if (ytdlpPath === 'yt-dlp') {
    console.log('[yt-dlp] 使用系统安装版本，跳过自动更新')
    return
  }

  // 如果内置二进制不存在，静默跳过（用户后续可自己运行 npm run download:bins）
  if (!existsSync(ytdlpPath)) {
    console.log('[yt-dlp] 内置二进制不存在，跳过自动更新')
    return
  }

  try {
    const currentVersion = await getCurrentVersion(ytdlpPath)
    if (!currentVersion) {
      console.log('[yt-dlp] 无法获取当前版本，尝试下载最新版...')
      await downloadLatest(ytdlpPath)
      return
    }

    console.log(`[yt-dlp] 当前版本: ${currentVersion}`)

    // 检查上次更新时间（24小时内不重复更新）
    const updateMarker = join(getYtdlpDir(), '.ytdlp_last_update')
    if (existsSync(updateMarker)) {
      const lastUpdate = parseInt(readFileSync(updateMarker, 'utf8'), 10)
      const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60)
      if (hoursSinceUpdate < 24) {
        console.log(`[yt-dlp] 距上次更新仅 ${hoursSinceUpdate.toFixed(1)} 小时，跳过`)
        return
      }
    }

    // 尝试更新
    console.log('[yt-dlp] 检查更新...')
    const updated = await downloadLatest(ytdlpPath)
    if (updated) {
      writeFileSync(updateMarker, String(Date.now()))
    }
  } catch (err) {
    // 静默失败，不影响应用启动
    console.error('[yt-dlp] 更新检查失败:', err)
  }
}
