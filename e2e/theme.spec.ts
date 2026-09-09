import { test, expect } from '@playwright/test'
import { waitReady, toggleTheme, BASE_URL } from './utils'

test('顶部主题按钮可切换到深色模式并持久化', async ({ page }) => {
  await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' })
  await waitReady(page)
  await expect(page.locator('html.dark')).toHaveCount(0)

  await toggleTheme(page)
  await page.getByText('深色模式', { exact: true }).first().click()
  await expect(page.locator('html.dark')).toHaveCount(1)
  expect(await page.evaluate(() => localStorage.getItem('theme_mode'))).toBe('dark')

  await page.reload({ waitUntil: 'networkidle' })
  await waitReady(page)
  await expect(page.locator('html.dark')).toHaveCount(1)
})

