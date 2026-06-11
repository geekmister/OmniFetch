<template>
  <div class="card overflow-hidden">
    <!-- 视频信息头 -->
    <div class="p-4 border-b border-surface-border">
      <div class="flex items-start gap-4">
        <!-- 缩略图 -->
        <div class="w-28 h-16 rounded-lg bg-surface shrink-0 overflow-hidden">
          <img
            v-if="videoInfo.thumbnail"
            :src="videoInfo.thumbnail"
            class="w-full h-full object-cover"
            alt=""
          />
          <div v-else class="w-full h-full flex items-center justify-center">
            <Film class="w-5 h-5 text-text-muted" />
          </div>
        </div>
        <div class="flex-1 min-w-0 space-y-1">
          <h3 class="text-sm font-medium text-text-primary truncate">{{ videoInfo.title }}</h3>
          <div class="flex items-center gap-3 text-2xs text-text-muted">
            <span class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ store.formattedDuration }}
            </span>
            <span class="flex items-center gap-1">
              <FileVideo class="w-3 h-3" />
              {{ videoInfo.formats.length }} 种格式
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 格式列表 -->
    <div class="p-4">
      <label class="block text-2xs font-medium text-text-muted uppercase tracking-wider mb-3">
        选择格式
      </label>
      <div class="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        <button
          v-for="fmt in videoInfo.formats"
          :key="fmt.formatId"
          @click="store.selectedFormat = fmt"
          class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left
                 transition-all duration-150 border
                 hover:bg-surface-hover"
          :class="store.selectedFormat?.formatId === fmt.formatId
            ? 'border-accent bg-accent/10'
            : 'border-transparent'"
        >
          <!-- 分辨率标识 -->
          <span
            class="shrink-0 w-16 text-center px-2 py-0.5 rounded text-2xs font-medium"
            :class="fmt.resolution === '音频'
              ? 'bg-warning/15 text-warning'
              : 'bg-accent/15 text-accent'"
          >
            {{ fmt.resolution }}
          </span>

          <!-- 格式详情 -->
          <div class="flex-1 min-w-0">
            <span class="text-xs text-text-primary">{{ fmt.note || fmt.ext }}</span>
          </div>

          <!-- 文件大小 -->
          <span v-if="fmt.filesize" class="text-2xs text-text-muted shrink-0">
            {{ formatSize(fmt.filesize) }}
          </span>

          <!-- 选中标记 -->
          <Check v-if="store.selectedFormat?.formatId === fmt.formatId" class="w-3.5 h-3.5 text-accent shrink-0" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Film, Clock, FileVideo, Check } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
const videoInfo = computed(() => store.videoInfo!)

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
}
</script>
