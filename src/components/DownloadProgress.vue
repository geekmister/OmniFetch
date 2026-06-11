<template>
  <div class="card p-5 space-y-4">
    <!-- 进度信息 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div v-if="store.downloadComplete" class="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
          <Check class="w-3 h-3 text-success" />
        </div>
        <div v-else class="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
          <Loader2 class="w-3 h-3 text-accent animate-spin" />
        </div>
        <span class="text-sm font-medium text-text-primary">
          {{ store.downloadComplete ? '下载完成' : '正在下载...' }}
        </span>
      </div>
      <span class="text-sm font-mono text-text-secondary">{{ Math.round(store.progress) }}%</span>
    </div>

    <!-- 进度条 -->
    <div class="relative h-2 rounded-full bg-surface overflow-hidden">
      <div
        class="absolute inset-y-0 left-0 rounded-full transition-all duration-300 ease-out"
        :class="store.downloadComplete ? 'bg-success' : 'bg-accent'"
        :style="{ width: `${store.progress}%` }"
      />
    </div>

    <!-- 速度 & ETA -->
    <div v-if="!store.downloadComplete" class="flex items-center justify-between text-2xs text-text-muted">
      <span class="flex items-center gap-1">
        <Gauge class="w-3 h-3" />
        {{ store.speed || '--' }}
      </span>
      <span class="flex items-center gap-1">
        <Timer class="w-3 h-3" />
        {{ store.eta ? `剩余 ${store.eta}` : '--' }}
      </span>
    </div>

    <!-- 完成提示 -->
    <div v-if="store.downloadComplete" class="pt-2 border-t border-surface-border">
      <p class="text-xs text-text-secondary">文件已保存到您选择的位置</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check, Loader2, Gauge, Timer } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
</script>
