/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<{ success: boolean; data?: VideoInfo; error?: string }>
  selectOutputPath: (defaultName: string) => Promise<string | null>
  startDownload: (url: string, formatId: string, outputPath: string) => Promise<{ success: boolean; data?: any; error?: string }>
  pauseDownload: () => Promise<{ success: boolean }>
  resumeDownload: () => Promise<{ success: boolean }>
  cancelDownload: () => Promise<{ success: boolean; deleted?: boolean; cancelled?: boolean }>
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
