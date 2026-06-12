const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVideoInfo: (url) => ipcRenderer.invoke('get-video-info', url),
  selectOutputPath: (defaultName) => ipcRenderer.invoke('select-output-path', defaultName),
  startDownload: (url, formatId, outputPath) =>
    ipcRenderer.invoke('start-download', url, formatId, outputPath),
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, progress) => callback(progress))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
  },
})
