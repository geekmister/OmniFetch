import { contextBridge, ipcRenderer } from 'electron'

export interface IpcResult {
  success: boolean
  code?: string
  message?: string
  hint?: string
  data?: any
  cancelled?: boolean
  deleted?: boolean
}

export interface DownloadProgressPayload {
  percent: number
  speed: string
  eta: string
}

export interface BinaryUpdateInfo {
  name: 'yt-dlp' | 'ffmpeg'
  currentVersion: string | null
  bundledVersion: string | null
  isLatest: boolean
}

export interface BinaryUpdateResult {
  success: boolean
  updated: ('yt-dlp' | 'ffmpeg')[]
  failed: ('yt-dlp' | 'ffmpeg')[]
  error?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url: string): Promise<IpcResult & { data?: VideoInfo }> =>
    ipcRenderer.invoke('get-video-info', url),
  selectOutputPath: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('select-output-path', defaultName),
  startDownload: (url: string, formatId: string, outputPath: string): Promise<IpcResult & { data?: any }> =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  pauseDownload: (): Promise<IpcResult> => ipcRenderer.invoke('pause-download'),
  resumeDownload: (): Promise<IpcResult> => ipcRenderer.invoke('resume-download'),
  cancelDownload: (): Promise<IpcResult> => ipcRenderer.invoke('cancel-download'),
  updateBinaries: (): Promise<BinaryUpdateResult> => ipcRenderer.invoke('update-binaries'),
  onDownloadProgress: (callback: (progress: DownloadProgressPayload) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  onBinaryUpdateAvailable: (callback: (updates: BinaryUpdateInfo[]) => void) => {
    ipcRenderer.on('binary-update-available', (_event, updates) => callback(updates))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
  removeBinaryUpdateListener: () => {
    ipcRenderer.removeAllListeners('binary-update-available')
  },
})
