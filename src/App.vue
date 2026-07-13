<template>
  <div class="app-layout">
    <!-- 标题栏（macOS hiddenInset 红绿灯按钮在左侧占据约 70px） -->
    <header class="drag-region app-header">
      <!-- 左侧留空给红绿灯按钮 -->
      <div class="header-spacer"></div>
      <!-- 居中：Logo + 名称 -->
      <div class="header-title">
        <img src="./assets/logo.png" alt="OmniFetch" class="logo" />
        <h1 class="app-name">视频下载器</h1>
      </div>
      <!-- 右侧与左侧等宽，保持对称 -->
      <div class="header-spacer"></div>
    </header>

    <!-- 主内容 -->
    <main class="app-main">
      <HomeView />
    </main>

    <!-- 底部免责声明 -->
    <footer class="app-footer">
      <p class="disclaimer">
        本工具仅供学习交流使用，禁止用于任何非法用途。使用者需自行承担相关责任。
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import HomeView from './views/HomeView.vue'
</script>

<style scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.app-header {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--td-component-border);
  flex-shrink: 0;
}
.header-spacer {
  width: 70px;
  flex-shrink: 0;
}
.header-title {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.logo {
  width: 28px;
  height: 28px;
}
.app-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  letter-spacing: -0.01em;
}
.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.app-footer {
  flex-shrink: 0;
  padding: 12px 24px 24px;
  text-align: center;
}
.disclaimer {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  user-select: none;
}
</style>
