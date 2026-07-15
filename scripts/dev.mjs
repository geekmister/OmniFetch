/**
 * 开发模式启动脚本
 * - Windows 控制台默认代码页为 GBK(936)，会导致 Electron 主进程输出的中文日志乱码。
 *   因此在启动 electron-vite 前将控制台代码页切换为 UTF-8(65001)。
 * - macOS / Linux 终端默认即为 UTF-8，无需处理。
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

const isWin = process.platform === 'win32';

if (isWin) {
    // 在统一 cmd 会话中切换代码页后再启动，electron-vite 继承该控制台（UTF-8）
    spawn('cmd', ['/c', 'chcp 65001 > nul && electron-vite dev'], {
        stdio: 'inherit',
        env: process.env,
    });
} else {
    spawn('electron-vite', ['dev'], { stdio: 'inherit', shell: true, env: process.env });
}
