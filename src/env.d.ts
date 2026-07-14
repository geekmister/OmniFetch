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

interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<IpcResult & { data?: VideoInfo }>
  selectOutputPath: (defaultName: string) => Promise<string | null>
  startDownload: (url: string, formatId: string, outputPath: string) => Promise<IpcResult & { data?: any }>
  pauseDownload: () => Promise<IpcResult>
  resumeDownload: () => Promise<IpcResult>
  cancelDownload: () => Promise<IpcResult>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
  removeDownloadProgressListener: () => void
}

interface VideoFormat {
  formatId: string
  resolution: string
  ext: string
  filesize: number | null
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
