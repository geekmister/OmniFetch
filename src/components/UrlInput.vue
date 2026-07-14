<template>
    <div class="url-input-card">
        <div class="url-input-row">
            <t-input
                v-model="localUrl"
                type="url"
                placeholder="粘贴视频链接，例如 https://twitter.com/xxx/status/..."
                size="large"
                class="url-input-field"
                @enter="handleSubmit"
                :disabled="store.isParsing"
            >
                <template #prefixIcon>
                    <link-icon />
                </template>
            </t-input>
            <t-button
                theme="primary"
                size="large"
                class="url-input-submit"
                @click="handleSubmit"
                :disabled="!store.isValidUrl || store.isParsing"
            >
                {{ store.isParsing ? '解析中...' : '解析' }}
            </t-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { LinkIcon } from 'tdesign-icons-vue-next';
import { useDownloadStore } from '../stores/download';

const store = useDownloadStore();
const localUrl = ref(store.url);

watch(localUrl, (val) => {
    store.setUrl(val);
});

function handleSubmit() {
    if (store.isValidUrl) {
        store.parseUrl();
    }
}
</script>

<style scoped>
.url-input-card {
    background-color: var(--td-bg-color-container);
    border: 1px solid var(--td-component-border);
    border-radius: var(--td-radius-medium, 9px);
    padding: 16px;
}
.url-input-row {
    display: flex;
    gap: 12px;
}
.url-input-field {
    flex: 1;
}
.url-input-submit {
    flex-shrink: 0;
}
</style>
