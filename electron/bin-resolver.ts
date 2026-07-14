/**
 * 二进制文件路径解析
 * - 开发模式: 使用项目根目录 bin/<platform>-<arch>/ 下的二进制
 * - 打包模式: 使用 app.asar.unpacked 旁 resources/bin/<platform>-<arch>/ 下的二进制
 * - 兜底: 使用系统 PATH 中的命令
 */
import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import { AppErrorCode, AppError, makeError } from '../src/shared/error-codes'

const isDev = process.env.NODE_ENV === 'development'
const isWin = process.platform === 'win32'

/**
 * 平台-架构标识，用于区分不同平台的二进制目录
 * 例如: win32-x64 / darwin-arm64 / linux-x64
 */
export function getPlatformArchKey(): string {
  return `${process.platform}-${process.arch}`
}

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
  return join(getBinDir(), getPlatformArchKey(), binName)
}

/**
 * 获取二进制目录路径（含平台-架构子目录）
 */
export function getYtdlpDir(): string {
  return join(getBinDir(), getPlatformArchKey())
}

/**
 * 读取文件头魔数，判断是否为当前平台可执行格式
 * - Windows PE:   4D 5A (MZ)
 * - macOS Mach-O: CF FA ED FE
 * - Linux ELF:    7F 45 4C 46
 */
function detectBinaryFormat(filePath: string): 'pe' | 'macho' | 'elf' | 'unknown' {
  try {
    const buf = readFileSync(filePath, { start: 0, end: 4 })
    if (buf[0] === 0x4d && buf[1] === 0x5a) return 'pe'
    if (buf[0] === 0xcf && buf[1] === 0xfa && buf[2] === 0xed && buf[3] === 0xfe) return 'macho'
    if (buf[0] === 0x7f && buf[1] === 0x45 && buf[2] === 0x4c && buf[3] === 0x46) return 'elf'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * 校验内置二进制是否与当前平台匹配（按魔数）
 */
function validatePlatformMatch(filePath: string): boolean {
  const fmt = detectBinaryFormat(filePath)
  if (fmt === 'unknown') return false
  if (isWin) return fmt === 'pe'
  if (process.platform === 'darwin') return fmt === 'macho'
  if (process.platform === 'linux') return fmt === 'elf'
  return false
}

/**
 * 获取 yt-dlp 可执行文件路径
 * 优先级: 内置二进制(平台匹配) > 系统 PATH
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
 * 优先级: 内置二进制(平台匹配) > 系统 PATH
 */
export function getFfmpegPath(): string {
  const builtin = getBinPath('ffmpeg')
  if (existsSync(builtin)) {
    return builtin
  }
  // 兜底: 使用系统 PATH 中的 ffmpeg
  return 'ffmpeg'
}

/**
 * 启动前预检：校验内置二进制是否存在且平台匹配
 * 返回每个二进制的问题（AppError），无问题则为 null
 */
export function validateBinaries(): { ytdlp: AppError | null; ffmpeg: AppError | null } {
  const result: { ytdlp: AppError | null; ffmpeg: AppError | null } = {
    ytdlp: null,
    ffmpeg: null,
  }

  const ytdlpBuiltin = getBinPath('yt-dlp')
  const ffmpegBuiltin = getBinPath('ffmpeg')

  // yt-dlp
  if (existsSync(ytdlpBuiltin)) {
    if (!validatePlatformMatch(ytdlpBuiltin)) {
      result.ytdlp = makeError(AppErrorCode.BINARY_WRONG_PLATFORM, 'yt-dlp')
    }
  } else if (getYtdlpPath() === 'yt-dlp') {
    // 内置缺失且系统 PATH 也无
    result.ytdlp = makeError(AppErrorCode.YTDLP_NOT_FOUND)
  }

  // ffmpeg
  if (existsSync(ffmpegBuiltin)) {
    if (!validatePlatformMatch(ffmpegBuiltin)) {
      result.ffmpeg = makeError(AppErrorCode.BINARY_WRONG_PLATFORM, 'ffmpeg')
    }
  } else if (getFfmpegPath() === 'ffmpeg') {
    result.ffmpeg = makeError(AppErrorCode.FFMPEG_NOT_FOUND)
  }

  return result
}
