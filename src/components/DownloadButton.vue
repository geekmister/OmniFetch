<template>
  <div class="space-y-3">
    <!-- 下载中：暂停/继续 + 取消 -->
    <div v-if="store.isDownloading" class="flex gap-3">
      <button
        class="btn-secondary flex-1 flex items-center justify-center gap-2 py-3"
        @click="store.isPaused ? store.resume() : store.pause()"
      >
        <component :is="store.isPaused ? Play : Pause" class="w-4 h-4" />
        <span>{{ store.isPaused ? '继续' : '暂停' }}</span>
      </button>
      <button
        class="btn-danger flex-1 flex items-center justify-center gap-2 py-3"
        @click="store.cancelDownload()"
      >
        <X class="w-4 h-4" />
        <span>取消</span>
      </button>
    </div>

    <!-- 空闲：开始下载（包括下载完成后可重新下载） -->
    <button
      v-else
      class="btn-primary w-full flex items-center justify-center gap-2 py-3"
      :disabled="!store.selectedFormat"
      @click="store.startDownload()"
    >
      <Download class="w-4 h-4" />
      <span>{{ store.downloadComplete ? '重新下载' : '开始下载' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { Download, Pause, Play, X } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
</script>
