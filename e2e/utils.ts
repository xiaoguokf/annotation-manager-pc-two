export const BASE_URL = 'http://localhost:5174'

import { Page, expect } from '@playwright/test'

export const USERNAME = 'xiaoguo'
export const PASSWORD = 'a12345678'

/**
 * 登录并等待跳转首页。
 * 注意：genSecret 很可能在 goto 期间就返回，必须在导航前注册监听，否则会一直等不到。
 */
export async function login(
  page: Page,
  baseURL = BASE_URL,
  username: string = USERNAME,
  password: string = PASSWORD,
) {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const secretPromise = page
        .waitForResponse((r) => r.url().includes('/auth/genSecret'), { timeout: 15_000 })
        .catch(() => null)
      await page.goto(baseURL + '/login', { waitUntil: 'load' })
      await Promise.race([secretPromise, page.waitForTimeout(3000)])

      const usernameInput = page.getByPlaceholder('请输入用户名')
      await usernameInput.waitFor({ state: 'visible', timeout: 15_000 })
      await page.waitForTimeout(1200) // 等 RSA 公钥就绪

      await usernameInput.fill(username)
      await page.getByPlaceholder('请输入密码').fill(password)

      const loginPromise = page.waitForResponse((r) => r.url().includes('/auth/login'), { timeout: 20_000 })
      await page.getByRole('button', { name: '登 录' }).click()
      await loginPromise
      await page.waitForURL(/\/dashboard/, { timeout: 20_000 })
      return
    } catch (error) {
      lastError = error
      await page.waitForTimeout(1500)
    }
  }
  throw lastError
}

/** 收集页面运行期错误（未捕获异常 + console.error + 失败请求） */
export function watchErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('[console.error] ' + m.text())
  })
  page.on('requestfailed', (r) => errors.push('[requestfailed] ' + r.url() + ' ' + (r.failure()?.errorText || '')))
  return errors
}

/** 点击顶部第一个图标（主题切换按钮）展开主题下拉 */
export async function toggleTheme(page: Page) {
  await page.locator('header svg, .el-header svg').first().click()
  await page.waitForTimeout(300)
}

/** 直接写入主题偏好后刷新，用于批量深色/浅色截图 */
export async function applyThemeMode(page: Page, mode: 'light' | 'dark') {
  await page.evaluate((m) => localStorage.setItem('theme_mode', m), mode)
  await page.reload({ waitUntil: 'load' })
  await page.waitForTimeout(800)
}

export async function waitReady(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(600)
}

