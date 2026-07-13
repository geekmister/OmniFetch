<template>
  <div class="home-view">
    <!-- 标题描述 -->
    <div class="home-header">
      <h2 class="home-title">下载视频</h2>
      <p class="home-subtitle">粘贴视频链接，解析后可选择格式下载</p>
    </div>

    <!-- URL 输入 -->
    <UrlInput />

    <!-- 解析错误 -->
    <t-alert v-if="store.parseError" theme="error" :message="store.parseError" class="home-block" />

    <!-- 加载中 -->
    <t-loading v-if="store.isParsing" :text="'正在解析视频信息...'" class="home-loading" />

    <!-- 视频信息 & 格式选择 -->
    <FormatSelect v-if="store.videoInfo && !store.isParsing" />

    <!-- 下载进度 -->
    <DownloadProgress v-if="store.isDownloading || store.downloadComplete" />

    <!-- 下载错误 -->
    <t-alert v-if="store.error" theme="error" :message="store.error" class="home-block" />

    <!-- 下载按钮 -->
    <DownloadButton v-if="store.videoInfo && !store.isParsing" />
  </div>
</template>

<script setup lang="ts">
import { useDownloadStore } from '../stores/download'
import UrlInput from '../components/UrlInput.vue'
import FormatSelect from '../components/FormatSelect.vue'
import DownloadProgress from '../components/DownloadProgress.vue'
import DownloadButton from '../components/DownloadButton.vue'

const store = useDownloadStore()
</script>

<style scoped>
.home-view {
  max-width: 42rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.home-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.home-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}
.home-subtitle {
  font-size: 14px;
  color: var(--td-text-color-secondary);
}
.home-block {
  margin-top: 0;
}
.home-loading {
  padding: 32px 0;
}
</style>
