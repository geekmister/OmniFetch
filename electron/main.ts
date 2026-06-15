import { app, BrowserWindow, ipcMain, dialog, Notification, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getVideoInfo, startDownload, pauseDownload, resumeDownload, cancelDownload, getCurrentDownload } from './downloader'
import { checkAndUpdateYtdlp } from './ytdlp-updater'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // preload.cjs 是纯 CommonJS 文件，绕过 ESM 编译问题
  const preloadPath = join(__dirname, 'preload.cjs')

  // 开发模式设置应用图标
  const iconPath = join(__dirname, '..', 'build', process.platform === 'darwin' ? 'icon.icns' : 'icon.png')
  if (!app.isPackaged) {
    // macOS Dock 图标用 PNG 更稳定
    const dockIcon = nativeImage.createFromPath(join(__dirname, '..', 'build', 'icon.png'))
    if (!dockIcon.isEmpty()) {
      app.dock?.setIcon(dockIcon.resize({ width: 256, height: 256 }))
    }
  }

  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 640,
    minHeight: 480,
    icon: !app.isPackaged ? iconPath : undefined,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
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
  if (!mainWindow) return null
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: defaultName,
      filters: [
        { name: '视频文件', extensions: ['mp4', 'webm', 'mkv'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })
    return result.canceled ? null : result.filePath
  } catch {
    return null
  }
})

ipcMain.handle('start-download', async (_event, url: string, formatId: string, outputPath: string) => {
  try {
    const result = await startDownload(url, formatId, outputPath, (progress) => {
      mainWindow?.webContents.send('download-progress', progress)
    })
    // 下载完成通知（用户主动取消的不弹）
    if (result.success && !result.cancelled) {
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

// ===== 暂停/继续/取消下载 =====

ipcMain.handle('pause-download', async () => {
  return { success: pauseDownload() }
})

ipcMain.handle('resume-download', async () => {
  return { success: resumeDownload() }
})

ipcMain.handle('cancel-download', async () => {
  const { process: proc, outputPath } = getCurrentDownload()

  // 没有活跃下载，直接返回
  if (!proc && !outputPath) {
    return { success: true, deleted: false }
  }

  const fileName = outputPath
    ? outputPath.split('/').pop() || outputPath.split('\\').pop()
    : '未保存的文件'

  try {
    const result = await dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: '取消下载',
      message: '确定要取消下载吗？',
      detail: `是否删除已下载的部分文件？\n\n${fileName}`,
      buttons: ['保留文件', '删除文件', '不取消'],
      defaultId: 2,
      cancelId: 2,
    })

    if (result.response === 2) {
      return { success: false, cancelled: true }
    }

    const deleteFile = result.response === 1
    cancelDownload(deleteFile)
    return { success: true, deleted: deleteFile }
  } catch {
    // 对话框异常时默认取消且不删除
    cancelDownload(false)
    return { success: true, deleted: false }
  }
})
