import { contextBridge, ipcRenderer } from 'electron'

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

export interface ElectronAPI {
  getVideoInfo: (url: string) => Promise<{ success: boolean; data?: VideoInfo; error?: string }>
  selectOutputPath: (defaultName: string) => Promise<string | null>
  startDownload: (url: string, formatId: string, outputPath: string) => Promise<{ success: boolean; data?: any; error?: string }>
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void
  removeDownloadProgressListener: () => void
}

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  selectOutputPath: (defaultName: string) => ipcRenderer.invoke('select-output-path', defaultName),
  startDownload: (url: string, formatId: string, outputPath: string) =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
})
