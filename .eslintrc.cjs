/* eslint-env node */
module.exports = {
    root: true,
    env: {
        browser: true,
        es2023: true,
        node: true,
    },
    extends: ['eslint:recommended', 'plugin:vue/vue3-recommended'],
    parser: 'vue-eslint-parser',
    parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        'vue/multi-word-component-names': 'off',
        'vue/max-attributes-per-line': ['warn', { singleline: 3, multiline: 1 }],
        'vue/singleline-html-element-content-newline': 'off',
        // 与 Prettier 的 tabWidth: 4 保持一致，避免缩进冲突
        'vue/html-indent': ['warn', 4],
        'vue/script-indent': ['warn', 4],
        'no-unused-vars': 'off',
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    },
    globals: {
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        // 全局环境类型声明（src/env.d.ts 中的 ambient interface），
        // ESLint 的 no-undef 不读取 .d.ts，需在此声明以避免误报
        IpcResult: 'readonly',
        BinaryUpdateInfo: 'readonly',
        BinaryUpdateResult: 'readonly',
        ElectronAPI: 'readonly',
        VideoFormat: 'readonly',
        VideoInfo: 'readonly',
        DownloadProgress: 'readonly',
    },
};
