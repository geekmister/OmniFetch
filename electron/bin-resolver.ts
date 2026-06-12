/**
 * 二进制文件路径解析
 * - 开发模式: 使用项目根目录 bin/ 下的二进制
 * - 打包模式: 使用 app.asar.unpacked 旁 resources/bin/ 下的二进制
 * - 兜底: 使用系统 PATH 中的命令
 */
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

const isDev = process.env.NODE_ENV === 'development'
const isWin = process.platform === 'win32'

function getBinDir(): string {
  if (isDev) {
    // 开发模式: 项目根目录/bin
    return join(app.getAppPath(), 'bin')
  }
  // 打包模式: resources/bin (extraResources)
  return join(process.resourcesPath, 'bin')
}

function getBinPath(name: string): string {
  const binName = isWin ? `${name}.exe` : name
  return join(getBinDir(), binName)
}

/**
 * 获取二进制目录路径
 */
export function getYtdlpDir(): string {
  return getBinDir()
}

/**
 * 获取 yt-dlp 可执行文件路径
 * 优先级: 内置二进制 > 系统 PATH
 */
export function getYtdlpPath(): string {
  const builtin = getBinPath('yt-dlp')
  if (existsSync(builtin)) {
    return builtin
  }
  // 兜底: 使用系统 PATH 中的 yt-dlp
  return 'yt-dlp'
}

/**
 * 获取 ffmpeg 可执行文件路径
 * 优先级: 内置二进制 > 系统 PATH
 */
export function getFfmpegPath(): string {
  const builtin = getBinPath('ffmpeg')
  if (existsSync(builtin)) {
    return builtin
  }
  // 兜底: 使用系统 PATH 中的 ffmpeg
  return 'ffmpeg'
}
