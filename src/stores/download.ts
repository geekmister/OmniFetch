import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useDownloadStore = defineStore('download', () => {
  // 状态
  const url = ref('')
  const videoInfo = ref<VideoInfo | null>(null)
  const selectedFormat = ref<VideoFormat | null>(null)
  const isParsing = ref(false)
  const isDownloading = ref(false)
  const progress = ref(0)
  const speed = ref('')
  const eta = ref('')
  const error = ref('')
  const parseError = ref('')
  const downloadComplete = ref(false)

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
        videoInfo.value = result.data
        if (result.data.formats.length > 0) {
          selectedFormat.value = result.data.formats[0]
        }
      } else {
        parseError.value = result.error || '解析失败，请检查 URL 是否正确'
      }
    } catch (err: any) {
      parseError.value = err.message || '解析请求失败'
    } finally {
      isParsing.value = false
    }
  }

  async function startDownload() {
    if (!selectedFormat.value || !videoInfo.value) return

    isDownloading.value = true
    error.value = ''
    progress.value = 0
    speed.value = ''
    eta.value = ''
    downloadComplete.value = false

    // 注册进度监听
    window.electronAPI.onDownloadProgress((p) => {
      progress.value = p.percent
      speed.value = p.speed
      eta.value = p.eta
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
        progress.value = 100
        downloadComplete.value = true
      } else {
        error.value = result.error || '下载失败'
      }
    } catch (err: any) {
      error.value = err.message || '下载请求失败'
    } finally {
      isDownloading.value = false
      window.electronAPI.removeDownloadProgressListener()
    }
  }

  function reset() {
    url.value = ''
    videoInfo.value = null
    selectedFormat.value = null
    isParsing.value = false
    isDownloading.value = false
    progress.value = 0
    speed.value = ''
    eta.value = ''
    error.value = ''
    parseError.value = ''
    downloadComplete.value = false
  }

  return {
    url,
    videoInfo,
    selectedFormat,
    isParsing,
    isDownloading,
    progress,
    speed,
    eta,
    error,
    parseError,
    downloadComplete,
    isValidUrl,
    formattedDuration,
    formattedFilesize,
    setUrl,
    parseUrl,
    startDownload,
    reset,
  }
})
