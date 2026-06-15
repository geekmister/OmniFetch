<template>
  <div class="h-screen flex flex-col">
    <!-- 标题栏（macOS hiddenInset 红绿灯按钮在左侧占据约 70px） -->
    <header class="drag-region flex items-center py-3 border-b border-surface-border shrink-0">
      <!-- 左侧留空给红绿灯按钮 -->
      <div class="w-[70px] shrink-0"></div>
      <!-- 居中：Logo + 名称 -->
      <div class="flex-1 flex items-center justify-center gap-3">
        <img src="./assets/logo.png" alt="OmniFetch" class="w-7 h-7" />
        <h1 class="text-sm font-semibold text-text-primary tracking-tight">视频下载器</h1>
      </div>
      <!-- 右侧与左侧等宽，保持对称 -->
      <div class="w-[70px] shrink-0"></div>
    </header>

    <!-- 主内容 -->
    <main class="flex-1 overflow-y-auto p-6">
      <HomeView />
    </main>

    <!-- 底部免责声明 -->
    <footer class="shrink-0 py-3 px-6 pb-6 text-center">
      <p class="text-[11px] text-text-secondary/50 select-none">
        本工具仅供学习交流使用，禁止用于任何非法用途。使用者需自行承担相关责任。
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue'
</script>
