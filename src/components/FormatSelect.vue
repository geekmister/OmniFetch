<template>
  <t-card class="format-card" :bordered="true">
    <!-- 视频信息头 -->
    <div class="video-header">
      <div class="video-header-main">
        <!-- 缩略图 -->
        <div class="thumbnail">
          <img
            v-if="videoInfo.thumbnail"
            :src="videoInfo.thumbnail"
            class="thumbnail-img"
            alt=""
          />
          <div v-else class="thumbnail-empty">
            <film-icon class="thumbnail-icon" />
          </div>
        </div>
        <div class="video-meta">
          <h3 class="video-title">{{ videoInfo.title }}</h3>
          <div class="video-stats">
            <span class="video-stat">
              <time-icon class="stat-icon" />
              {{ store.formattedDuration }}
            </span>
            <span class="video-stat">
              <video-icon class="stat-icon" />
              {{ videoInfo.formats.length }} 种格式
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 格式列表 -->
    <div class="format-body">
      <label class="format-label">选择格式</label>
      <t-radio-group
        :value="store.selectedFormat?.formatId"
        direction="vertical"
        class="format-list"
        @change="(val: string) => onSelect(val)"
      >
        <t-radio-button
          v-for="fmt in videoInfo.formats"
          :key="fmt.formatId"
          :value="fmt.formatId"
          class="format-item"
        >
          <div class="format-item-inner">
            <!-- 分辨率标识 -->
            <t-tag
              :theme="fmt.resolution === '音频' ? 'warning' : 'primary'"
              variant="light"
              size="small"
              class="format-resolution"
            >
              {{ fmt.resolution }}
            </t-tag>

            <!-- 格式详情 -->
            <div class="format-detail">
              <span class="format-note">{{ fmt.note || fmt.ext }}</span>
            </div>

            <!-- 右侧常驻信息：码率 + 文件大小 -->
            <div class="format-meta">
              <span class="meta-bitrate">{{ bitrateText(fmt) }}</span>
              <span class="meta-divider">·</span>
              <span class="meta-size">{{ sizeText(fmt) }}</span>
            </div>
          </div>
        </t-radio-button>
      </t-radio-group>
    </div>
  </t-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  VideoIcon,
  FilmIcon,
  TimeIcon,
} from 'tdesign-icons-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
const videoInfo = computed(() => store.videoInfo!)

function onSelect(formatId: string) {
  const fmt = videoInfo.value.formats.find((f) => f.formatId === formatId)
  if (fmt) store.selectedFormat = fmt
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`
}

function bitrateText(fmt: VideoFormat): string {
  // 视频优先总码率/视频码率，音频用 abr
  const br = fmt.resolution === '音频' ? fmt.abr : (fmt.tbr ?? fmt.vbr)
  if (br == null) return '—'
  return `${Math.round(br)}kbps`
}

function sizeText(fmt: VideoFormat): string {
  if (fmt.filesize) return formatSize(fmt.filesize)
  if (fmt.filesizeApprox) return `约 ${formatSize(fmt.filesizeApprox)}`
  return '大小未知'
}
</script>

<style scoped>
.format-card {
  overflow: hidden;
}
.video-header {
  padding: 16px;
  border-bottom: 1px solid var(--td-component-border);
}
.video-header-main {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}
.thumbnail {
  width: 112px;
  height: 64px;
  border-radius: var(--td-radius-medium, 9px);
  background-color: var(--td-bg-color-secondarycontainer);
  flex-shrink: 0;
  overflow: hidden;
}
.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.thumbnail-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumbnail-icon {
  width: 20px;
  height: 20px;
  color: var(--td-text-color-placeholder);
}
.video-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.video-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.video-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}
.video-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}
.stat-icon {
  width: 12px;
  height: 12px;
}
.format-body {
  padding: 16px;
}
.format-label {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--td-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}
.format-list {
  display: flex !important;
  flex-direction: column;
  width: 100%;
  /* max-height: 256px;
  overflow-y: auto; */
  padding-right: 4px;
}
.format-list :deep(.t-radio-group) {
  display: flex !important;
  flex-direction: column;
  width: 100%;
}
.format-list :deep(.t-radio-button) {
  width: 100%;
  display: flex !important;
  flex: unset;
  padding: 5px 0;
}
.format-list :deep(.t-radio-button__label) {
  flex: 1;
  display: flex !important;
  align-items: center;
  width: 100%;
}
.format-item {
  width: 100%;
}
.format-item-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.format-resolution {
  flex-shrink: 0;
  width: 64px;
  text-align: center;
}
.format-detail {
  flex: 1;
  min-width: 0;
}
.format-note {
  font-size: 12px;
  color: var(--td-text-color-primary);
}
.format-meta {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.meta-bitrate {
  font-size: 12px;
  color: var(--td-text-color-primary);
}
.meta-divider {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}
.meta-size {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}
</style>
