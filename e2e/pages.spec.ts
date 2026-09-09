import { test, expect } from '@playwright/test'
import { watchErrors, waitReady, applyThemeMode, BASE_URL } from './utils'

const PAGES: { path: string; name: string; marker?: string }[] = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/task/list', name: 'task-list', marker: '标注任务' },
  { path: '/task/review', name: 'task-review', marker: '审核任务' },
  { path: '/system/user', name: 'system-user', marker: '用户管理' },
  { path: '/system/role', name: 'system-role', marker: '角色管理' },
  { path: '/system/theme', name: 'system-theme', marker: '主题设置' },
  { path: '/profile', name: 'profile' },
]

async function visit(page: import('@playwright/test').Page, path: string) {
  await page.goto(BASE_URL + path, { waitUntil: 'networkidle' })
  await waitReady(page)
  await expect(page.locator('#app')).toBeVisible()
}

test.describe('页面渲染（浅色）', () => {
  for (const p of PAGES) {
    test(p.name, async ({ page }) => {
      const errors = watchErrors(page)
      await visit(page, p.path)
      await expect(page).toHaveURL(new RegExp(p.path.replace(/\//g, '\\/')))
      if (p.marker) await expect(page.getByText(p.marker).first()).toBeVisible({ timeout: 15_000 })
      await page.screenshot({ path: 'screenshots/light/' + p.name + '.png', fullPage: true })
      expect(errors, '页面无运行时错误').toEqual([])
    })
  }
})

test.describe('页面渲染（深色）', () => {
  for (const p of PAGES) {
    test(p.name, async ({ page }) => {
      const errors = watchErrors(page)
      await visit(page, '/dashboard')
      await applyThemeMode(page, 'dark')
      await expect(page.locator('html.dark')).toHaveCount(1)
      await page.goto(BASE_URL + p.path, { waitUntil: 'networkidle' })
      await waitReady(page)
      await expect(page.locator('html.dark')).toHaveCount(1)
      if (p.marker) await expect(page.getByText(p.marker).first()).toBeVisible({ timeout: 15_000 })
      await page.screenshot({ path: 'screenshots/dark/' + p.name + '.png', fullPage: true })
      expect(errors, '页面无运行时错误').toEqual([])
    })
  }
})

test('标注工作台可从任务列表进入', async ({ page }) => {
  const errors = watchErrors(page)
  await visit(page, '/task/list')
  const rows = page.locator('.el-table__body tr')
  test.skip((await rows.count()) === 0, '任务列表为空，跳过')
  await page.getByRole('button', { name: /开始标注|继续标注/ }).first().click()
  await expect(page).toHaveURL(/\/annotation\//, { timeout: 20_000 })
  await waitReady(page)
  await page.screenshot({ path: 'screenshots/light/annotation.png', fullPage: true })
  // 书页图片来自外部 OSS，其 CORS 白名单只配了 5173，dev 跑在 5174 会被拦（Electron 内不受影响）
  const appErrors = errors.filter((e) => !e.includes('cccyc.51shazhu.com'))
  expect(appErrors, '页面无运行时错误').toEqual([])
})
