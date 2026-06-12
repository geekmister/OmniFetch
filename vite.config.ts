import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { copyFileSync, mkdirSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        entry: 'electron/main.ts',
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
            minify: false,
            rollupOptions: {
              external: ['electron'],
              output: {
                format: 'cjs',
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
    ]),
    // 将纯 CommonJS preload.cjs 直接复制到 dist-electron，绕过 ESM 编译
    {
      name: 'copy-preload-cjs',
      buildStart() {
        mkdirSync(resolve(__dirname, 'dist-electron'), { recursive: true })
        copyFileSync(
          resolve(__dirname, 'electron/preload.cjs'),
          resolve(__dirname, 'dist-electron/preload.cjs')
        )
      },
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist-electron'), { recursive: true })
        copyFileSync(
          resolve(__dirname, 'electron/preload.cjs'),
          resolve(__dirname, 'dist-electron/preload.cjs')
        )
        console.log('  ✅ preload.cjs → dist-electron/preload.cjs')
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
