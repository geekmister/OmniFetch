<template>
  <div class="download-button-group">
    <!-- 下载中：暂停/继续 + 取消 -->
    <div v-if="store.isDownloading" class="download-button-row">
      <t-button
        theme="default"
        variant="outline"
        class="download-button-item"
        :loading="store.isTogglingPause"
        :disabled="store.isTogglingPause"
        @click="store.isPaused ? store.resume() : store.pause()"
      >
        <template #icon>
          <component :is="store.isPaused ? PlayCircleIcon : PauseIcon" />
        </template>
        {{ store.isPaused ? '继续' : '暂停' }}
      </t-button>
      <t-button
        theme="danger"
        variant="outline"
        class="download-button-item"
        @click="store.cancelDownload()"
      >
        <template #icon>
          <close-icon />
        </template>
        取消
      </t-button>
    </div>

    <!-- 空闲：开始下载（包括下载完成后可重新下载） -->
    <t-button
      v-else
      theme="primary"
      block
      size="large"
      :disabled="!store.selectedFormat"
      @click="store.startDownload()"
    >
      <template #icon>
        <download-icon />
      </template>
      {{ store.downloadComplete ? '重新下载' : '开始下载' }}
    </t-button>
  </div>
</template>

<script setup lang="ts">
import {
  DownloadIcon,
  PauseIcon,
  PlayCircleIcon,
  CloseIcon,
} from 'tdesign-icons-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
</script>

<style scoped>
.download-button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.download-button-row {
  display: flex;
  gap: 12px;
}
.download-button-item {
  flex: 1;
}
</style>
