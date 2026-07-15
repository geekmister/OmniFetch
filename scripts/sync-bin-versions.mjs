/**
 * 同步预置二进制版本号到 bin/manifest.json
 *
 * 用法: node scripts/sync-bin-versions.mjs
 *
 * 扫描 bin/<platform>-<arch>/ 下的 yt-dlp 与 ffmpeg，
 * 分别执行 --version / -version 获取实际版本号，
 * 写入 bin/manifest.json 的对应条目（不覆盖其他平台）。
 *
 * 适用场景: 你已手动把各平台二进制下载并放入对应目录后，
 * 运行本脚本即可自动回填版本号，无需逐个手填。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { spawnSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN_DIR = join(__dirname, '..', 'bin');
const MANIFEST_PATH = join(BIN_DIR, 'manifest.json');

const isWin = process.platform === 'win32';

function binName(name) {
    return isWin ? `${name}.exe` : name;
}

/**
 * 解析二进制实际文件名，兼容两种命名约定：
 * - 纯名: yt-dlp / yt-dlp.exe / ffmpeg / ffmpeg.exe
 * - 带平台后缀: yt-dlp_macos / yt-dlp_linux / yt-dlp.exe（手动预置常见命名）
 * 返回目录中实际存在的文件路径，都不存在则返回纯名路径。
 */
function resolveBinFile(dir, name) {
    const plain = isWin ? `${name}.exe` : name;
    const suffix = isWin ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
    const suffixed = `${name}_${suffix}${isWin ? '.exe' : ''}`;
    if (existsSync(join(dir, plain))) return join(dir, plain);
    if (existsSync(join(dir, suffixed))) return join(dir, suffixed);
    return join(dir, plain);
}

/**
 * 获取二进制版本号
 * yt-dlp: --version ; ffmpeg: -version（首行含版本）
 */
function getVersion(platform, binPath) {
    const flag = binPath.includes('yt-dlp') ? '--version' : '-version';
    try {
        const res = spawnSync(binPath, [flag], { encoding: 'utf8', timeout: 15000 });
        if (res.status !== 0) return null;
        const out = (res.stdout || '').trim();
        if (!out) return null;
        // ffmpeg -version 首行形如:
        //   官方构建: ffmpeg version 7.0.2-...
        //   BtbN 构建: ffmpeg version N-125573-g90436de5e1-20260713 ...
        if (binPath.includes('ffmpeg')) {
            const m = out.match(/version\s+([^\s]+)/i);
            if (!m) return out.split('\n')[0];
            const ver = m[1];
            // BtbN 的 N-<commit>-<date> 形式，取末尾日期作为可读版本
            if (ver.startsWith('N-')) {
                const dateMatch = ver.match(/(\d{8})$/);
                return dateMatch ? `N-${dateMatch[1]}` : ver;
            }
            return ver;
        }
        return out.split('\n')[0];
    } catch {
        return null;
    }
}

function main() {
    if (!existsSync(BIN_DIR)) {
        console.error('未找到 bin/ 目录');
        process.exit(1);
    }

    // 读取已有 manifest（保留 comment 与其他平台条目）
    let manifest = {
        comment:
            'OmniFetch 预置二进制清单。由 npm run download:bins 自动生成/更新。记录各平台-架构内置二进制的版本，用于启动时判断是否需要联网更新。',
        generatedAt: '',
        binaries: {},
    };
    if (existsSync(MANIFEST_PATH)) {
        try {
            manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
            manifest.binaries = manifest.binaries || {};
        } catch {
            console.warn('manifest.json 解析失败，将重建');
        }
    }

    const dirs = readdirSync(BIN_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name.includes('-'))
        .map((d) => d.name);

    if (dirs.length === 0) {
        console.log('bin/ 下未找到 <platform>-<arch> 目录，无需同步');
        return;
    }

    let changed = 0;
    for (const key of dirs) {
        const dir = join(BIN_DIR, key);
        const ytPath = resolveBinFile(dir, 'yt-dlp');
        const ffPath = resolveBinFile(dir, 'ffmpeg');

        const entry = manifest.binaries[key] || {};
        if (existsSync(ytPath)) {
            const v = getVersion(key, ytPath);
            if (v) {
                entry['yt-dlp'] = v;
                changed++;
                console.log(`✅ ${key}/yt-dlp -> ${v}`);
            } else {
                console.warn(`⚠️  ${key}/yt-dlp 无法获取版本（可能平台不匹配或非可执行文件）`);
            }
        }
        if (existsSync(ffPath)) {
            const v = getVersion(key, ffPath);
            if (v) {
                entry['ffmpeg'] = v;
                changed++;
                console.log(`✅ ${key}/ffmpeg -> ${v}`);
            } else {
                console.warn(`⚠️  ${key}/ffmpeg 无法获取版本（可能平台不匹配或非可执行文件）`);
            }
        }
        manifest.binaries[key] = entry;
    }

    manifest.generatedAt = new Date().toISOString().slice(0, 10);
    writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`\n🎉 已同步 ${changed} 个版本号到 bin/manifest.json`);
}

main();
