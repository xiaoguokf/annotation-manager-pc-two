import { fileURLToPath, URL } from 'node:url'
import { readFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { ConfigEnv, UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteMockServe } from 'vite-plugin-mock'
import tailwindcss from '@tailwindcss/vite'
import vitePluginRemoveConsole from 'vite-plugin-remove-console'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

// 从 package.json 读取应用名称，生成全局常量
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const PKG_NAME: string = pkg.name || 'annotation-admin-pc'
// 生成显示名称: annotation-admin-pc → Annotation Admin Pc
const APP_DISPLAY_NAME = PKG_NAME.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

// 后端代理地址：本地联调可用 VITE_PROXY_TARGET=http://127.0.0.1:8080 覆盖
const PROXY_TARGET = process.env.VITE_PROXY_TARGET || 'http://localhost:8080'

// https://vite.dev/config/
export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG
  const lifecycle = process.env.npm_lifecycle_event as string
  const isBrowser = lifecycle && lifecycle.includes('browser')
  if (!isBrowser) {
    rmSync('dist-electron', { recursive: true, force: true })
  }
  return {
    server: {
      allowedHosts: true,
      proxy: {
        '/api': {
          target: PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
        '/dou-bao': {
          target: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ppi2/, ''),
        },
      },
    },
    define: {
      __APP_NAME__: JSON.stringify(APP_DISPLAY_NAME),
    },
    plugins: [
      tailwindcss(),
      vue(),
      vueJsx(),
      vueDevTools({
        launchEditor: 'code',
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
      ...(!isBrowser
        ? [
            electron({
              main: {
                // Shortcut of `build.lib.entry`
                entry: 'electron/main/index.ts',
                onstart({ startup }) {
                  if (process.env.VSCODE_DEBUG) {
                    console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App')
                  } else {
                    startup()
                  }
                },
                vite: {
                  build: {
                    sourcemap,
                    minify: isBuild,
                    outDir: 'dist-electron/main',
                    rollupOptions: {
                      external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                    },
                  },
                },
              },
              preload: {
                input: 'electron/preload/index.ts',
                vite: {
                  build: {
                    sourcemap: sourcemap ? 'inline' : undefined, // #332
                    minify: isBuild,
                    outDir: 'dist-electron/preload',
                    rollupOptions: {
                      external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                    },
                  },
                },
              },
              renderer: {},
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    publicDir: 'public',
    assetsInclude: ['**/*.json'],
  }
}

