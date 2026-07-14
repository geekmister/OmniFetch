/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface IpcResult {
  success: boolean
  code?: string
  message?: string
  hint?: string
  data?: any
  cancelled?: boolean
  deleted?: boolean
}

interface BinaryUpdateInfo {
  name: 'yt-dlp' | 'ffmpeg'
  currentVersion: string | null
  bundledVersion: string | null
  isLatest: boolean
}

interface BinaryUpdateResult {
  success: boolean
  updated: ('yt-dlp' | 'ffmpeg')[]
  failed: ('yt-dlp' | 'ffmpeg')[]
  error?: string
}

interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<IpcResult & { data?: VideoInfo }>
  selectOutputPath: (defaultName: string) => Promise<string | null>
  startDownload: (url: string, formatId: string, outputPath: string) => Promise<IpcResult & { data?: any }>
  pauseDownload: () => Promise<IpcResult>
  resumeDownload: () => Promise<IpcResult>
  cancelDownload: () => Promise<IpcResult>
  updateBinaries: () => Promise<BinaryUpdateResult>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
  onBinaryUpdateAvailable: (callback: (updates: BinaryUpdateInfo[]) => void) => void
  removeDownloadProgressListener: () => void
  removeBinaryUpdateListener: () => void
}

interface VideoFormat {
  formatId: string
  resolution: string
  ext: string
  filesize: number | null
  filesizeApprox: number | null
  tbr: number | null
  vbr: number | null
  abr: number | null
  fps: number | null
  vcodec: string
  acodec: string
  protocol: string
  note: string
}

interface VideoInfo {
  title: string
  duration: number
  thumbnail: string
  webpageUrl: string
  formats: VideoFormat[]
}

interface DownloadProgress {
  percent: number
  speed: string
  eta: string
}

interface Window {
  electronAPI: ElectronAPI
}
