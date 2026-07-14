import { app, BrowserWindow, ipcMain, dialog, Notification, nativeImage, Menu } from 'electron';
import { join } from 'path';
import {
    getVideoInfo,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    getCurrentDownload,
} from '../downloader';
import { checkBinaryUpdates, applyBinaryUpdates } from '../binary-updater';
import { validateBinaries } from '../bin-resolver';
import { AppError, toAppError } from '../../src/shared/error-codes';

let mainWindow: BrowserWindow | null = null;

// 启动预检结果缓存，供 IPC 复用，避免每次解析都做文件校验
let binaryCheck: { ytdlp: AppError | null; ffmpeg: AppError | null } | null = null;

/**
 * 将异常统一包装为结构化 IPC 返回
 */
function failResult(err: unknown) {
    const e: AppError = toAppError(err);
    return { success: false, code: e.code, message: e.message, hint: e.hint };
}

function createWindow() {
    // electron-vite 编译 preload，输出至 out/preload/index.mjs（package.json type=module）
    const preloadPath = join(__dirname, '../preload/index.mjs');

    // 开发模式设置应用图标
    const iconPath = join(
        __dirname,
        '../../build',
        process.platform === 'darwin' ? 'icon.icns' : 'icon.png',
    );
    if (!app.isPackaged) {
        // macOS Dock 图标用 PNG 更稳定
        const dockIcon = nativeImage.createFromPath(join(__dirname, '../../build', 'icon.png'));
        if (!dockIcon.isEmpty()) {
            app.dock?.setIcon(dockIcon.resize({ width: 256, height: 256 }));
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
        autoHideMenuBar: true,
        backgroundColor: '#0d1117',
        show: false,
    });

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    // electron-vite 在开发模式下注入 ELECTRON_RENDERER_URL（含实际端口，如 5174）
    const devServerUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL(devServerUrl);
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }
}

app.whenReady().then(() => {
    // 移除默认菜单栏
    Menu.setApplicationMenu(null);
    // 启动预检二进制（缓存结果供 IPC 复用）
    binaryCheck = validateBinaries();
    if (binaryCheck.ytdlp || binaryCheck.ffmpeg) {
        console.warn('[bin] 二进制预检异常:', binaryCheck.ytdlp?.code, binaryCheck.ffmpeg?.code);
    }
    createWindow();
    // 后台检查二进制更新（不阻塞窗口显示），有更新时通知前端
    checkBinaryUpdates(mainWindow);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ===== IPC Handlers =====

ipcMain.handle('get-video-info', async (_event, url: string) => {
    // 启动前预检：二进制缺失直接返回对应 code，避免进入 spawn 才报错
    if (binaryCheck?.ytdlp) {
        return failResult(binaryCheck.ytdlp);
    }
    try {
        const info = await getVideoInfo(url);
        return { success: true, data: info };
    } catch (err: any) {
        return failResult(err);
    }
});

ipcMain.handle('select-output-path', async (_event, defaultName: string) => {
    if (!mainWindow) return null;
    try {
        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultName,
            filters: [
                { name: '视频文件', extensions: ['mp4', 'webm', 'mkv'] },
                { name: '所有文件', extensions: ['*'] },
            ],
        });
        return result.canceled ? null : result.filePath;
    } catch {
        return null;
    }
});

ipcMain.handle(
    'start-download',
    async (_event, url: string, formatId: string, outputPath: string) => {
        // 启动前预检：二进制缺失直接返回对应 code
        if (binaryCheck?.ytdlp) {
            return failResult(binaryCheck.ytdlp);
        }
        if (binaryCheck?.ffmpeg) {
            return failResult(binaryCheck.ffmpeg);
        }
        try {
            const result = await startDownload(url, formatId, outputPath, (progress) => {
                mainWindow?.webContents.send('download-progress', progress);
            });
            // 下载完成通知（用户主动取消的不弹）
            if (result.success && !result.cancelled) {
                new Notification({
                    title: '下载完成',
                    body: `视频已保存到 ${result.path}`,
                }).show();
            }
            return { success: true, data: result };
        } catch (err: any) {
            return failResult(err);
        }
    },
);

// ===== 暂停/继续/取消下载 =====

ipcMain.handle('pause-download', async () => {
    return { success: pauseDownload() };
});

ipcMain.handle('resume-download', async () => {
    return { success: resumeDownload() };
});

ipcMain.handle('cancel-download', async () => {
    const { process: proc, outputPath } = getCurrentDownload();

    // 没有活跃下载，直接返回
    if (!proc && !outputPath) {
        return { success: true, deleted: false };
    }

    const fileName = outputPath
        ? outputPath.split('/').pop() || outputPath.split('\\').pop()
        : '未保存的文件';

    try {
        const result = await dialog.showMessageBox(mainWindow!, {
            type: 'warning',
            title: '取消下载',
            message: '确定要取消下载吗？',
            detail: `是否删除已下载的部分文件？\n\n${fileName}`,
            buttons: ['保留文件', '删除文件', '不取消'],
            defaultId: 2,
            cancelId: 2,
        });

        if (result.response === 2) {
            return { success: false, cancelled: true };
        }

        const deleteFile = result.response === 1;
        cancelDownload(deleteFile);
        return { success: true, deleted: deleteFile };
    } catch {
        // 对话框异常时默认取消且不删除
        cancelDownload(false);
        return { success: true, deleted: false };
    }
});

// ===== 二进制更新 =====

// 前端请求执行二进制更新（用户确认后）
ipcMain.handle('update-binaries', async () => {
    try {
        const result = await applyBinaryUpdates();
        return { success: result.success, updated: result.updated, failed: result.failed };
    } catch (err: any) {
        return { success: false, updated: [], failed: ['yt-dlp', 'ffmpeg'], error: err.message };
    }
});
