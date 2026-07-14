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

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url: string): Promise<IpcResult> => ipcRenderer.invoke('get-video-info', url),
  selectOutputPath: (defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('select-output-path', defaultName),
  startDownload: (url: string, formatId: string, outputPath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  pauseDownload: (): Promise<IpcResult> => ipcRenderer.invoke('pause-download'),
  resumeDownload: (): Promise<IpcResult> => ipcRenderer.invoke('resume-download'),
  cancelDownload: (): Promise<IpcResult> => ipcRenderer.invoke('cancel-download'),
  onDownloadProgress: (callback: (progress: DownloadProgressPayload) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
})
