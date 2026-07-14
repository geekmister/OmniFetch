/**
 * 二进制自动更新模块
 * - 同时支持 yt-dlp 与 ffmpeg 的自动更新
 * - 若当前平台-架构的预置二进制已是最新（与 bin/manifest.json 一致），则跳过联网更新
 * - 若检测到上游有更新，则通过 IPC 通知前端，由用户决定是否下载（并警告下载失败率较高，建议使用预置二进制）
 */
import { spawn } from 'child_process'
import {
  createWriteStream,
  existsSync,
  unlinkSync,
  chmodSync,
  renameSync,
  readFileSync,
  writeFileSync,
} from 'fs'
import { get } from 'https'
import { join } from 'path'
import { app, BrowserWindow } from 'electron'
import { getYtdlpPath, getFfmpegPath, getYtdlpDir, getPlatformArchKey, validateBinaries } from './bin-resolver'
import { AppErrorCode } from '../src/shared/error-codes'

const isWin = process.platform === 'win32'
const isMac = process.platform === 'darwin'

// ===== 上游下载源（latest）=====
const YTDLP_URL = isWin
  ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  : isMac
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
    : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'

const FFMPEG_URL = isWin
  ? 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
  : isMac
    ? 'https://evermeet.cx/ffmpeg/ffmpeg-7.0.2.zip'
    : 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz'

type BinaryName = 'yt-dlp' | 'ffmpeg'

interface UpdateInfo {
  name: BinaryName
  currentVersion: string | null
  bundledVersion: string | null
  isLatest: boolean
}

/**
 * 读取 bin/manifest.json 中当前平台-架构的预置版本
 */
function getBundledVersion(name: BinaryName): string | null {
  try {
    const manifestPath = join(getYtdlpDir(), '..', 'manifest.json')
    if (!existsSync(manifestPath)) return null
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
    const entry = manifest.binaries?.[getPlatformArchKey()]
    return entry?.[name] ?? null
  } catch {
    return null
  }
}

/**
 * 获取当前已安装二进制版本号（yt-dlp 支持 --version；ffmpeg 支持 -version）
 */
function getCurrentVersion(binPath: string, name: BinaryName): Promise<string | null> {
  return new Promise((resolve) => {
    const proc = spawn(binPath, ['--version'])
    let output = ''
    proc.stdout.on('data', (data: Buffer) => {
      output += data.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) resolve(output.trim())
      else resolve(null)
    })
    proc.on('error', () => resolve(null))
  })
}

/**
 * 下载最新二进制到临时文件，成功后原子替换
 */
function downloadLatest(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    const tmpPath = destPath + '.tmp'
    const file = createWriteStream(tmpPath)

    const finish = () => {
      try {
        const stat = existsSync(tmpPath) ? require('fs').statSync(tmpPath) : null
        if (!stat || stat.size === 0) {
          console.error(`[update] 下载的文件为空，放弃更新 ${destPath}`)
          cleanupTmp(tmpPath)
          resolve(false)
          return
        }
        if (existsSync(destPath)) unlinkSync(destPath)
        renameSync(tmpPath, destPath)
        if (!isWin) chmodSync(destPath, 0o755)
        console.log(`[update] 更新完成: ${destPath}`)
        resolve(true)
      } catch (err) {
        console.error(`[update] 更新失败:`, err)
        cleanupTmp(tmpPath)
        resolve(false)
      }
    }

    get(url, (response) => {
      if (response.statusCode && response.statusCode >= 400) {
        file.close()
        cleanupTmp(tmpPath)
        console.error(`[update] 下载失败，HTTP ${response.statusCode}`)
        resolve(false)
        return
      }
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close()
        unlinkSync(tmpPath)
        get(response.headers.location, (redirectRes) => {
          redirectRes.pipe(createWriteStream(tmpPath)).on('finish', finish).on('error', () => {
            cleanupTmp(tmpPath)
            resolve(false)
          })
        })
        return
      }
      response.pipe(file)
      file.on('finish', finish)
      file.on('error', () => {
        cleanupTmp(tmpPath)
        resolve(false)
      })
    }).on('error', () => {
      cleanupTmp(tmpPath)
      resolve(false)
    })
  })
}

function cleanupTmp(tmpPath: string) {
  try {
    if (existsSync(tmpPath)) unlinkSync(tmpPath)
  } catch {}
}

/**
 * 检查单个二进制是否需要更新
 * 返回 null 表示无需/无法更新（系统 PATH、平台不匹配、已是最新等）
 */
async function checkOne(
  name: BinaryName,
  binPath: string
): Promise<UpdateInfo | null> {
  // 系统 PATH 中的命令，不自动更新
  if (binPath === name) {
    console.log(`[update] ${name} 使用系统安装版本，跳过自动更新`)
    return null
  }
  // 内置二进制不存在
  if (!existsSync(binPath)) {
    console.log(`[update] 内置 ${name} 不存在，跳过自动更新`)
    return null
  }
  // 平台不匹配
  const check = validateBinaries()
  const err = name === 'yt-dlp' ? check.ytdlp : check.ffmpeg
  if (err && err.code === AppErrorCode.BINARY_WRONG_PLATFORM) {
    console.log(`[update] 内置 ${name} 平台不匹配，跳过自动更新`)
    return null
  }

  const currentVersion = await getCurrentVersion(binPath, name)
  const bundledVersion = getBundledVersion(name)

  // 预置二进制已是最新（与 manifest 一致），无需联网更新
  if (bundledVersion && currentVersion === bundledVersion) {
    console.log(`[update] ${name} 预置版本(${bundledVersion})已是最新，跳过联网更新`)
    return null
  }

  return {
    name,
    currentVersion,
    bundledVersion,
    isLatest: false,
  }
}

/**
 * 启动检查：检测 yt-dlp 与 ffmpeg 是否有更新
 * 若有更新，通过 IPC 通知前端（不自动下载，由用户决定）
 */
export async function checkBinaryUpdates(mainWindow: BrowserWindow | null): Promise<void> {
  console.log(`[update] 当前平台-架构: ${getPlatformArchKey()}`)
  try {
    const results = await Promise.all([
      checkOne('yt-dlp', getYtdlpPath()),
      checkOne('ffmpeg', getFfmpegPath()),
    ])
    const updates = results.filter((r): r is UpdateInfo => r !== null)
    if (updates.length > 0) {
      console.log(`[update] 检测到 ${updates.length} 个二进制有可用更新`)
      mainWindow?.webContents.send('binary-update-available', updates)
    } else {
      console.log('[update] 无可用更新')
    }
  } catch (err) {
    console.error('[update] 更新检查失败:', err)
  }
}

/**
 * 用户确认后执行更新（前端调用）
 * 警告：联网下载失败率较高，建议优先使用仓库预置二进制
 */
export async function applyBinaryUpdates(): Promise<{ success: boolean; updated: BinaryName[]; failed: BinaryName[] }> {
  const targets: { name: BinaryName; url: string; path: string }[] = []
  const ytPath = getYtdlpPath()
  const ffPath = getFfmpegPath()
  if (ytPath !== 'yt-dlp' && existsSync(ytPath)) {
    targets.push({ name: 'yt-dlp', url: YTDLP_URL, path: ytPath })
  }
  if (ffPath !== 'ffmpeg' && existsSync(ffPath)) {
    targets.push({ name: 'ffmpeg', url: FFMPEG_URL, path: ffPath })
  }

  const updated: BinaryName[] = []
  const failed: BinaryName[] = []
  for (const t of targets) {
    const ok = await downloadLatest(t.url, t.path)
    if (ok) updated.push(t.name)
    else failed.push(t.name)
  }
  return { success: failed.length === 0, updated, failed }
}
