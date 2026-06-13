import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteMockServe } from 'vite-plugin-mock'
import vitePluginRemoveConsole from 'vite-plugin-remove-console'

// 从 package.json 读取应用名称，生成全局常量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const PKG_NAME: string = pkg.name || 'sshine-admin'
// 生成显示名称: sshine-admin → Sshine Admin
const APP_DISPLAY_NAME = PKG_NAME.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// https://vite.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'https://sbzj24r8gn-8080.cnb.run/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  define: {
    __APP_NAME__: JSON.stringify(APP_DISPLAY_NAME),
  },
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools({
      launchEditor: "code"
    }),
    viteMockServe({
      mockPath: 'mock', // mock 文件夹的路
    }),
    vitePluginRemoveConsole(),
    // 将 index.html 的 title 替换为应用名称
    {
      name: 'html-inject-app-name',
      transformIndexHtml(html) {
        return html.replace(/<title>.*?<\/title>/, `<title>${APP_DISPLAY_NAME}</title>`)
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
