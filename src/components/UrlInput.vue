<template>
  <div class="card p-4">
    <div class="flex gap-3">
      <div class="relative flex-1">
        <Link class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          v-model="localUrl"
          type="url"
          placeholder="粘贴视频链接，例如 https://twitter.com/xxx/status/..."
          class="input-field pl-10 pr-4 text-sm"
          @keydown.enter="handleSubmit"
          :disabled="store.isParsing"
        />
      </div>
      <button
        class="btn-primary shrink-0"
        @click="handleSubmit"
        :disabled="!store.isValidUrl || store.isParsing"
      >
        {{ store.isParsing ? '解析中...' : '解析' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Link } from 'lucide-vue-next'
import { useDownloadStore } from '../stores/download'

const store = useDownloadStore()
const localUrl = ref(store.url)

watch(localUrl, (val) => {
  store.setUrl(val)
})

function handleSubmit() {
  if (store.isValidUrl) {
    store.parseUrl()
  }
}
</script>
