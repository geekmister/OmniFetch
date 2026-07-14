import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { AppErrorCode } from '../shared/error-codes'

export const useDownloadStore = defineStore('download', () => {
  // 状态
  const url = ref('')
  const videoInfo = ref<VideoInfo | null>(null)
  const selectedFormat = ref<VideoFormat | null>(null)
  const isParsing = ref(false)
  const isDownloading = ref(false)
  const isPaused = ref(false)
  // 暂停/继续操作进行中，防止重复点击
  const isTogglingPause = ref(false)
  const progress = ref(0)
  const speed = ref('')
  const eta = ref('')
  const error = ref('')
  const parseError = ref('')
  const downloadComplete = ref(false)

  // 二进制更新提示（启动检查后由主进程推送）
  const binaryUpdateNotice = ref<BinaryUpdateInfo[] | null>(null)
  const isUpdatingBinaries = ref(false)
  const binaryUpdateResult = ref<{ success: boolean; updated: string[]; failed: string[] } | null>(null)

  // 计算属性
  const isValidUrl = computed(() => {
    return url.value.trim().length > 0 && /^https?:\/\/.+/.test(url.value.trim())
  })

  const formattedDuration = computed(() => {
    if (!videoInfo.value?.duration) return ''
    const d = videoInfo.value.duration
    const h = Math.floor(d / 3600)
    const m = Math.floor((d % 3600) / 60)
    const s = Math.floor(d % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${m}:${String(s).padStart(2, '0')}`
  })

  const formattedFilesize = computed(() => {
    if (!selectedFormat.value?.filesize) return '未知大小'
    const bytes = selectedFormat.value.filesize
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
  })

  // 动作
  function setUrl(value: string) {
    url.value = value
    error.value = ''
    parseError.value = ''
  }

  async function parseUrl() {
    if (!isValidUrl.value) {
      parseError.value = '请输入有效的 URL'
      return
    }

    isParsing.value = true
    parseError.value = ''
    videoInfo.value = null
    selectedFormat.value = null
    downloadComplete.value = false

    try {
      const result = await window.electronAPI.getVideoInfo(url.value.trim())
      if (result.success && result.data) {
        if (result.data.formats.length === 0) {
          parseError.value = '未找到可下载的视频格式'
          return
        }
        videoInfo.value = result.data
        selectedFormat.value = result.data.formats[0]
      } else {
        // 按 code 展示精准提示（含 hint 修复指引）
        parseError.value = formatError(result)
      }
    } catch (err: any) {
      parseError.value = err.message || '解析请求失败'
    } finally {
      isParsing.value = false
    }
  }

  async function startDownload() {
    // 防止重复点击
    if (isDownloading.value) return
    if (!selectedFormat.value || !videoInfo.value) return

    isDownloading.value = true
    isPaused.value = false
    isTogglingPause.value = false
    error.value = ''
    progress.value = 0
    speed.value = ''
    eta.value = ''
    downloadComplete.value = false

    // 注册进度监听
    window.electronAPI.onDownloadProgress((p) => {
      progress.value = p.percent
      if (p.speed) speed.value = p.speed
      if (p.eta) eta.value = p.eta
    })

    try {
      // 选择保存路径
      const ext = selectedFormat.value.ext || 'mp4'
      const defaultName = `${videoInfo.value.title}.${ext}`
      const outputPath = await window.electronAPI.selectOutputPath(defaultName)

      if (!outputPath) {
        // 用户取消
        isDownloading.value = false
        window.electronAPI.removeDownloadProgressListener()
        return
      }

      const result = await window.electronAPI.startDownload(
        url.value.trim(),
        selectedFormat.value.formatId,
        outputPath
      )

      if (result.success) {
        // 检查 cancelled 标记：用户主动取消时不覆盖 cancelDownload() 的状态
        if (result.data && result.data.cancelled) {
          return
        }
        progress.value = 100
        downloadComplete.value = true
      } else {
        error.value = formatError(result)
      }
    } catch (err: any) {
      // 用户主动取消时不显示错误
      if (!downloadComplete.value) {
        error.value = err.message || '下载请求失败'
      }
    } finally {
      isDownloading.value = false
      isPaused.value = false
      window.electronAPI.removeDownloadProgressListener()
    }
  }

  /**
   * 暂停/继续操作极快（仅挂起/恢复进程），loading 状态会一闪而过。
   * 这里保证交互状态至少展示 MIN_TOGGLE_DURATION，提供可见的反馈并防止重复点击。
   */
  const MIN_TOGGLE_DURATION = 400
  async function withToggleGuard(action: () => Promise<void>) {
    if (isTogglingPause.value) return
    isTogglingPause.value = true
    const start = Date.now()
    try {
      await action()
    } finally {
      const elapsed = Date.now() - start
      if (elapsed < MIN_TOGGLE_DURATION) {
        await new Promise((r) => setTimeout(r, MIN_TOGGLE_DURATION - elapsed))
      }
      isTogglingPause.value = false
    }
  }

  async function pause() {
    await withToggleGuard(async () => {
      try {
        const result = await window.electronAPI.pauseDownload()
        if (result.success) {
          isPaused.value = true
        }
      } catch (err: any) {
        console.warn('暂停操作异常:', err)
      }
    })
  }

  async function resume() {
    await withToggleGuard(async () => {
      try {
        const result = await window.electronAPI.resumeDownload()
        if (result.success) {
          isPaused.value = false
        }
      } catch (err: any) {
        console.warn('继续操作异常:', err)
      }
    })
  }

  async function cancelDownload() {
    // 防止重复点击
    if (!isDownloading.value && !isPaused.value) return

    try {
      const result = await window.electronAPI.cancelDownload()
      if (result.success) {
        isDownloading.value = false
        isPaused.value = false
        if (result.deleted) {
          // 删除了文件，重置状态让用户可以重新开始
          progress.value = 0
          speed.value = ''
          eta.value = ''
          downloadComplete.value = false
        } else {
          // 保留了文件，标记为完成
          downloadComplete.value = true
        }
      }
      // 如果 result.cancelled，用户点了"不取消"，什么都不做
    } catch (err: any) {
      console.warn('取消操作异常:', err)
      // 保险：即使 IPC 失败也重置状态
      isDownloading.value = false
      isPaused.value = false
    }
  }

  /**
   * 将 IPC 返回的结构化错误格式化为用户可读提示
   * 优先展示 message，若有 hint 则追加可操作建议
   */
  function formatError(result: { code?: string; message?: string; hint?: string } | null): string {
    if (!result) return '操作失败'
    const msg = result.message || '操作失败'
    if (result.hint) return `${msg}。${result.hint}`
    return msg
  }

  function reset() {
    url.value = ''
    videoInfo.value = null
    selectedFormat.value = null
    isParsing.value = false
    isDownloading.value = false
    isTogglingPause.value = false
    isPaused.value = false
    progress.value = 0
    speed.value = ''
    eta.value = ''
    error.value = ''
    parseError.value = ''
    downloadComplete.value = false
  }

  /**
   * 注册二进制更新监听（应用启动时调用一次）
   * 主进程检测到上游有更新时推送通知，前端展示警告并建议优先使用预置二进制
   */
  function setupBinaryUpdateListener() {
    window.electronAPI.onBinaryUpdateAvailable((updates) => {
      binaryUpdateNotice.value = updates
    })
  }

  /**
   * 用户确认后执行二进制更新（联网下载，失败率较高）
   */
  async function applyBinaryUpdate() {
    if (isUpdatingBinaries.value) return
    isUpdatingBinaries.value = true
    binaryUpdateResult.value = null
    try {
      const result = await window.electronAPI.updateBinaries()
      binaryUpdateResult.value = {
        success: result.success,
        updated: result.updated,
        failed: result.failed,
      }
      if (result.success) {
        // 更新成功，清除提示
        binaryUpdateNotice.value = null
      }
    } catch (err: any) {
      binaryUpdateResult.value = { success: false, updated: [], failed: ['yt-dlp', 'ffmpeg'] }
    } finally {
      isUpdatingBinaries.value = false
    }
  }

  /**
   * 忽略更新提示
   */
  function dismissBinaryUpdate() {
    isTogglingPause,
    binaryUpdateNotice.value = null
  }

  return {
    url,
    videoInfo,
    selectedFormat,
    isParsing,
    isDownloading,
    isPaused,
    progress,
    speed,
    eta,
    error,
    parseError,
    downloadComplete,
    binaryUpdateNotice,
    isUpdatingBinaries,
    binaryUpdateResult,
    isValidUrl,
    formattedDuration,
    formattedFilesize,
    setUrl,
    parseUrl,
    startDownload,
    pause,
    resume,
    cancelDownload,
    reset,
    setupBinaryUpdateListener,
    applyBinaryUpdate,
    dismissBinaryUpdate,
  }
})
