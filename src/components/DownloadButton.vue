<template>
  <button
    class="btn-primary w-full flex items-center justify-center gap-2 py-3"
    :disabled="!store.selectedFormat || store.isDownloading"
    @click="store.startDownload()"
  >
    <Download class="w-4 h-4" />
    <span>开始下载</span>
  </button>
</template>

<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
</script>
