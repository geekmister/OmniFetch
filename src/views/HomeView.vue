<template>
  <div class="home-view">
    <!-- 标题描述 -->
    <div class="home-header">
      <h2 class="home-title">下载视频</h2>
      <p class="home-subtitle">粘贴视频链接，解析后可选择格式下载</p>
    </div>

    <!-- 使用前须知：本地网络需可访问视频站点（解析/下载前告知） -->
    <t-alert
      v-if="showNetworkHint"
      theme="info"
      :close-btn="true"
      class="home-block"
      @close="showNetworkHint = false"
    >
      <template #title>使用前须知</template>
      <p>
        解析与下载依赖你本地网络可正常访问视频站点（如 B 站、YouTube 等）。若你的网络无法在浏览器中打开这些站点，OmniFetch 将无法解析视频信息，也无法下载视频。建议先确认可在浏览器中打开目标链接后再使用本工具。
      </p>
    </t-alert>

    <!-- 二进制更新提示（警告：联网下载失败率较高，建议用预置二进制） -->
    <t-alert
      v-if="store.binaryUpdateNotice && store.binaryUpdateNotice.length"
      theme="warning"
      class="home-block"
    >
      <template #title>
        检测到二进制有可用更新（{{ store.binaryUpdateNotice.map((u) => u.name).join('、') }}）
      </template>
      <p>
        联网下载失败率较高，建议优先使用仓库预置的二进制文件（已随安装包提供，无需下载）。
      </p>
      <p v-if="!store.binaryUpdateResult">
        <t-button
          size="small"
          theme="warning"
          :loading="store.isUpdatingBinaries"
          :disabled="store.isUpdatingBinaries"
          @click="store.applyBinaryUpdate()"
        >
          仍要联网更新
        </t-button>
        <t-button size="small" variant="text" :disabled="store.isUpdatingBinaries" @click="store.dismissBinaryUpdate()">
          忽略
        </t-button>
      </p>
      <p v-else-if="store.binaryUpdateResult.success" class="update-ok">
        更新成功：{{ store.binaryUpdateResult.updated.join('、') }}
      </p>
      <p v-else class="update-fail">
        更新失败（{{ store.binaryUpdateResult.failed.join('、') }}），请使用预置二进制或手动更新。
      </p>
    </t-alert>

    <!-- URL 输入 -->
    <UrlInput />

    <!-- 解析错误 -->
    <t-alert
      v-if="store.parseError"
      theme="error"
      :message="store.parseError"
      :close-btn="false"
      class="home-block"
    />

    <!-- 加载中 -->
    <t-loading v-if="store.isParsing" :text="'正在解析视频信息...'" class="home-loading" />

    <!-- 视频信息 & 格式选择 -->
    <FormatSelect v-if="store.videoInfo && !store.isParsing" />

    <!-- 下载进度 -->
    <DownloadProgress v-if="store.isDownloading || store.downloadComplete" />

    <!-- 下载错误 -->
    <t-alert
      v-if="store.error"
      theme="error"
      :message="store.error"
      :close-btn="false"
      class="home-block"
    />

    <!-- 下载按钮 -->
    <DownloadButton v-if="store.videoInfo && !store.isParsing" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDownloadStore } from '../stores/download'
import UrlInput from '../components/UrlInput.vue'
import FormatSelect from '../components/FormatSelect.vue'
import DownloadProgress from '../components/DownloadProgress.vue'
import DownloadButton from '../components/DownloadButton.vue'

const store = useDownloadStore()

// 使用前须知：本地网络需可访问视频站点（解析/下载前告知，可关闭）
const showNetworkHint = ref(true)
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
.update-ok {
  color: var(--td-success-color);
}
.update-fail {
  color: var(--td-error-color);
}
.home-loading {
  padding: 32px 0;
}
</style>
