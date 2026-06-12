import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url: string) => ipcRenderer.invoke('get-video-info', url),
  selectOutputPath: (defaultName: string) => ipcRenderer.invoke('select-output-path', defaultName),
  startDownload: (url: string, formatId: string, outputPath: string) =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
})
