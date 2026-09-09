import { test as setup } from '@playwright/test'
import { login, BASE_URL } from './utils'

setup('登录并保存会话状态', async ({ page }) => {
  // 预热：dev 首次访问会触发依赖预构建与整页刷新
  await page.goto(BASE_URL + '/login', { waitUntil: 'load' }).catch(() => {})
  await page.waitForTimeout(2000)
  await login(page)
  await page.context().storageState({ path: '.auth/user.json' })
})

