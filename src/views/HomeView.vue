<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <!-- 标题描述 -->
    <div class="space-y-1">
      <h2 class="text-lg font-semibold text-text-primary">下载视频</h2>
      <p class="text-sm text-text-secondary">粘贴视频链接，解析后可选择格式下载</p>
    </div>

    <!-- URL 输入 -->
    <UrlInput />

    <!-- 解析错误 -->
    <div v-if="store.parseError" class="card p-4 border-danger/30 bg-danger/5">
      <div class="flex items-start gap-3">
        <AlertCircle class="w-4 h-4 text-danger shrink-0 mt-0.5" />
        <p class="text-sm text-danger">{{ store.parseError }}</p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="store.isParsing" class="card p-8 flex flex-col items-center gap-3">
      <Loader2 class="w-6 h-6 text-accent animate-spin" />
      <p class="text-sm text-text-secondary">正在解析视频信息...</p>
    </div>

    <!-- 视频信息 & 格式选择 -->
    <FormatSelect v-if="store.videoInfo && !store.isParsing" />

    <!-- 下载进度 -->
    <DownloadProgress v-if="store.isDownloading || store.downloadComplete" />

    <!-- 下载错误 -->
    <div v-if="store.error" class="card p-4 border-danger/30 bg-danger/5">
      <div class="flex items-start gap-3">
        <AlertCircle class="w-4 h-4 text-danger shrink-0 mt-0.5" />
        <p class="text-sm text-danger">{{ store.error }}</p>
      </div>
    </div>

    <!-- 下载按钮 -->
    <DownloadButton v-if="store.videoInfo && !store.isParsing && !store.isDownloading" />
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'
import UrlInput from '../components/UrlInput.vue'
import FormatSelect from '../components/FormatSelect.vue'
import DownloadProgress from '../components/DownloadProgress.vue'
import DownloadButton from '../components/DownloadButton.vue'

const store = useDownloadStore()
</script>
