<template>
  <div class="h-screen flex flex-col">
    <!-- 标题栏 -->
    <header class="drag-region flex items-center justify-between px-5 py-3 border-b border-surface-border shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-7 h-7 rounded-lg bg-accent-muted flex items-center justify-center">
          <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <h1 class="text-sm font-semibold text-text-primary tracking-tight">OmniFetch</h1>
      </div>
      <span class="text-2xs text-text-muted">v1.0.0</span>
    </header>

    <!-- 主内容 -->
    <main class="flex-1 overflow-y-auto p-6">
      <HomeView />
    </main>
  </div>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue'
</script>
