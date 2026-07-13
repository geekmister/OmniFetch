<template>
  <t-card class="progress-card" :bordered="true">
    <div class="progress-content">
      <!-- 进度信息 -->
      <div class="progress-header">
        <div class="progress-status">
          <check-circle-icon v-if="store.downloadComplete" class="status-icon status-success" />
          <pause-circle-icon v-else-if="store.isPaused" class="status-icon status-warning" />
          <loading-icon v-else class="status-icon status-active" />
          <span
            class="progress-status-text"
            :class="store.isPaused && !store.downloadComplete ? 'text-warning' : ''"
          >
            {{ store.downloadComplete ? '下载完成' : store.isPaused ? '已暂停' : '正在下载...' }}
          </span>
        </div>
        <span class="progress-percent">{{ Math.round(store.progress) }}%</span>
      </div>

      <!-- 进度条 -->
      <t-progress
        theme="line"
        :percentage="Math.round(store.progress)"
        :status="store.downloadComplete ? 'success' : store.isPaused ? 'warning' : 'active'"
        class="progress-bar"
      />

      <!-- 速度 & ETA -->
      <div v-if="!store.downloadComplete" class="progress-meta">
        <span class="progress-meta-item">
          <chart-icon class="meta-icon" />
          {{ store.speed || '--' }}
        </span>
        <span class="progress-meta-item">
          <time-icon class="meta-icon" />
          {{ store.eta ? `剩余 ${store.eta}` : '--' }}
        </span>
      </div>

      <!-- 完成提示 -->
      <div v-if="store.downloadComplete" class="progress-done">
        <p class="progress-done-text">文件已保存到您选择的位置</p>
      </div>
    </div>
  </t-card>
</template>

<script setup lang="ts">
import {
  CheckCircleIcon,
  PauseCircleIcon,
  LoadingIcon,
  ChartIcon,
  TimeIcon,
} from 'tdesign-icons-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
</script>

<style scoped>
.progress-card {
  padding: 20px;
}
.progress-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.progress-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-icon {
  width: 20px;
  height: 20px;
}
.status-success {
  color: var(--td-success-color);
}
.status-warning {
  color: var(--td-warning-color);
}
.status-active {
  color: var(--td-brand-color);
}
.progress-status-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}
.text-warning {
  color: var(--td-warning-color);
}
.progress-percent {
  font-size: 14px;
  font-family: var(--td-font-family-mono, monospace);
  color: var(--td-text-color-secondary);
}
.progress-bar {
  width: 100%;
}
.progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}
.progress-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}
.meta-icon {
  width: 12px;
  height: 12px;
}
.progress-done {
  padding-top: 8px;
  border-top: 1px solid var(--td-component-border);
}
.progress-done-text {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>
