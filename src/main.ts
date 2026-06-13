import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme'
import { useUserStore } from './stores/user'
import { ElMessage } from 'element-plus'

// 浏览器兼容性检测
const checkBrowserCompatibility = () => {
  const userAgent = navigator.userAgent
  const isIE = /MSIE|Trident/.test(userAgent)
  const isOldEdge = /Edge\/\d+\./.test(userAgent)
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/)
  const firefoxMatch = userAgent.match(/Firefox\/(\d+)/)
  const safariMatch = userAgent.match(/Version\/(\d+).*Safari/)

  if (isIE) {
    ElMessage({
      message: '检测到您使用的是IE浏览器，系统部分功能可能无法正常使用。建议使用Chrome、Firefox或Edge等现代浏览器。',
      type: 'warning',
      duration: 10000,
      showClose: true
    })
    return
  }

  if (isOldEdge) {
    ElMessage({
      message: '检测到您使用的是旧版Edge浏览器，建议更新到最新版本以获得更好的体验。',
      type: 'warning',
      duration: 8000,
      showClose: true
    })
    return
  }

  if (chromeMatch && parseInt(chromeMatch[1]!) < 70) {
    ElMessage({
      message: '检测到您的Chrome版本较低，建议更新到最新版本以获得更好的体验。',
      type: 'warning',
      duration: 8000,
      showClose: true
    })
  }

  if (firefoxMatch && parseInt(firefoxMatch[1]!) < 65) {
    ElMessage({
      message: '检测到您的Firefox版本较低，建议更新到最新版本以获得更好的体验。',
      type: 'warning',
      duration: 8000,
      showClose: true
    })
  }

  if (safariMatch && parseInt(safariMatch[1]!) < 12) {
    ElMessage({
      message: '检测到您的Safari版本较低，建议更新到Safari 12或更高版本以获得更好的体验。',
      type: 'warning',
      duration: 8000,
      showClose: true
    })
  }
}

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
})

// 检查浏览器兼容性
checkBrowserCompatibility()

// 初始化主题
const themeStore = useThemeStore()
themeStore.initTheme()

// 初始化用户信息（如果有token）
const userStore = useUserStore()
userStore.initAppUserInfo()

app.mount('#app')
