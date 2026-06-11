import { app, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getVideoInfo, startDownload } from './downloader'
import { checkAndUpdateYtdlp } from './ytdlp-updater'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 640,
    minHeight: 480,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d1117',
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(devServerUrl)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  // 后台静默检查 yt-dlp 更新（不阻塞窗口显示）
  checkAndUpdateYtdlp()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// ===== IPC Handlers =====

ipcMain.handle('get-video-info', async (_event, url: string) => {
  try {
    const info = await getVideoInfo(url)
    return { success: true, data: info }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('select-output-path', async (_event, defaultName: string) => {
  const result = await dialog.showSaveDialog(mainWindow!, {
    defaultPath: defaultName,
    filters: [
      { name: '视频文件', extensions: ['mp4', 'webm', 'mkv'] },
      { name: '所有文件', extensions: ['*'] },
    ],
  })
  return result.canceled ? null : result.filePath
})

ipcMain.handle('start-download', async (_event, url: string, formatId: string, outputPath: string) => {
  try {
    const result = await startDownload(url, formatId, outputPath, (progress) => {
      mainWindow?.webContents.send('download-progress', progress)
    })
    // 下载完成通知
    if (result.success) {
      new Notification({
        title: '下载完成',
        body: `视频已保存到 ${result.path}`,
      }).show()
    }
    return { success: true, data: result }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})
