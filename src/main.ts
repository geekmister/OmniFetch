import { createApp } from 'vue';
import { createPinia } from 'pinia';
import TDesign from 'tdesign-vue-next';
import 'tdesign-vue-next/es/style/index.css';
import App from './App.vue';
import './style.css';

// 启用 TDesign 暗色模式（配合 index.css 中 :root[theme-mode='dark'] 变量）
document.documentElement.setAttribute('theme-mode', 'dark');

const app = createApp(App);
app.use(createPinia());
app.use(TDesign);
app.mount('#app');
