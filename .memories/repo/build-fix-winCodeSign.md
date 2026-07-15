# 构建问题修复：winCodeSign 符号链接权限

## 问题
`npm run electron:build:win` 在 Windows 上失败，报错：
```
ERROR: Cannot create symbolic link : 客户端没有所需的特权。
  ...\winCodeSign\...\darwin\10.12\lib\libcrypto.dylib
  ...\winCodeSign\...\darwin\10.12\lib\libssl.dylib
```

## 根因
electron-builder 在打包 Windows 时需要 `winCodeSign` 工具包（含 rcedit 用于编辑 exe 资源）。
该 `.7z` 包内含 macOS 符号链接（`.dylib`），Windows 上 7zip 解压符号链接需要"创建符号链接"特权，
普通用户无此权限，导致解压退出码 2，electron-builder 判定失败并反复重试下载。

## 修复
以管理员身份将 `winCodeSign-2.6.0.7z` 解压到缓存目录
`%LOCALAPPDATA%/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0`，
使 electron-builder 检测到缓存已就绪而跳过下载/解压。

命令（管理员 PowerShell）：
```powershell
$seven = "node_modules\7zip-bin\win\x64\7za.exe"
$cache = "$env:LOCALAPPDATA\electron-builder\Cache\winCodeSign"
$dir = "$cache\winCodeSign-2.6.0"
New-Item -ItemType Directory -Path $dir -Force > $null
Start-Process -FilePath $seven -ArgumentList "x","-y","-o$dir","$cache\388421203.7z" -Verb RunAs -Wait
```

## 注意
- `win.sign: false` 在 electron-builder 24 是 bug 写法（触发 `Cannot use 'in' operator`）。
- `CSC_IDENTITY_AUTO_DISCOVERY=false` 无法阻止 winCodeSign 下载（rcedit 必需）。
- 缓存目录名是 `winCodeSign-2.6.0`（由工具名+版本决定），不是随机数字。
- 若缓存被清，需重新以管理员解压。或开启 Windows 开发者模式（允许普通用户创建符号链接）。
- `package.json` 已补 `author` 字段消除警告。
