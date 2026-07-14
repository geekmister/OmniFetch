/**
 * 统一状态码与提示文案（单一事实来源）
 * 同时被 Electron 主进程（bin-resolver / downloader / main）与渲染进程（stores / 组件）引用。
 */

export enum AppErrorCode {
  // 二进制 / 环境
  YTDLP_NOT_FOUND = 'YTDLP_NOT_FOUND',
  FFMPEG_NOT_FOUND = 'FFMPEG_NOT_FOUND',
  BINARY_WRONG_PLATFORM = 'BINARY_WRONG_PLATFORM',
  BINARY_SPAWN_FAILED = 'BINARY_SPAWN_FAILED',
  UNSUPPORTED_PLATFORM = 'UNSUPPORTED_PLATFORM',
  // 解析
  PARSE_FAILED = 'PARSE_FAILED',
  PARSE_NO_FORMAT = 'PARSE_NO_FORMAT',
  // 下载
  DOWNLOAD_FAILED = 'DOWNLOAD_FAILED',
  DOWNLOAD_CANCELLED = 'DOWNLOAD_CANCELLED',
  // 网络 / 代理
  NETWORK_ERROR = 'NETWORK_ERROR',
  PROXY_ERROR = 'PROXY_ERROR',
  // 未知
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  code: AppErrorCode
  message: string
  /** 可选的可操作建议（如"请运行 npm run download:bins"） */
  hint?: string
}

export const ERROR_MESSAGES: Record<AppErrorCode, { message: string; hint?: string }> = {
  YTDLP_NOT_FOUND: {
    message: '未找到 yt-dlp 可执行文件',
    hint: '请运行 npm run download:bins，或将 yt-dlp 加入系统 PATH',
  },
  FFMPEG_NOT_FOUND: {
    message: '未找到 ffmpeg 可执行文件',
    hint: '请运行 npm run download:bins，或将 ffmpeg 加入系统 PATH',
  },
  BINARY_WRONG_PLATFORM: {
    message: '内置二进制与当前平台不匹配',
    hint: '请在本平台重新运行 npm run download:bins 下载对应版本',
  },
  BINARY_SPAWN_FAILED: {
    message: '无法启动下载进程',
    hint: '请检查文件权限，或重新运行 npm run download:bins',
  },
  UNSUPPORTED_PLATFORM: {
    message: '当前操作系统不受支持',
    hint: 'OmniFetch 支持 Windows / macOS / Linux',
  },
  PARSE_FAILED: { message: '解析失败，请检查链接是否正确或视频是否受限' },
  PARSE_NO_FORMAT: { message: '未找到可下载的视频格式' },
  DOWNLOAD_FAILED: { message: '下载失败，请稍后重试' },
  DOWNLOAD_CANCELLED: { message: '下载已取消' },
  NETWORK_ERROR: {
    message: '网络连接失败，请检查网络',
    hint: '若访问的是境外/受限站点，请开启 VPN 或代理，并确保其已写入系统代理或 HTTPS_PROXY 环境变量（如 http://127.0.0.1:7890）',
  },
  PROXY_ERROR: { message: '代理配置无效，请检查 HTTPS_PROXY 环境变量' },
  UNKNOWN: { message: '发生未知错误' },
}

/**
 * 构造结构化错误。detail 用于附加底层细节（如退出码、原始报错）。
 */
export function makeError(code: AppErrorCode, detail?: string): AppError {
  const base = ERROR_MESSAGES[code]
  return {
    code,
    message: detail ? `${base.message}（${detail}）` : base.message,
    hint: base.hint,
  }
}

/**
 * 将任意异常归一化为 AppError（兜底用）。
 */
export function toAppError(err: unknown): AppError {
  if (err && typeof err === 'object' && 'code' in err && (err as any).code in AppErrorCode) {
    return err as AppError
  }
  const message = err instanceof Error ? err.message : String(err)
  return { code: AppErrorCode.UNKNOWN, message }
}
