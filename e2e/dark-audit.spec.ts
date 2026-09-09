import { test, expect } from '@playwright/test'
import { waitReady, applyThemeMode, BASE_URL } from './utils'

const PAGES: { path: string; name: string }[] = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/task/list', name: 'task-list' },
  { path: '/task/review', name: 'task-review' },
  { path: '/system/user', name: 'system-user' },
  { path: '/system/role', name: 'system-role' },
  { path: '/system/theme', name: 'system-theme' },
  { path: '/profile', name: 'profile' },
]

test.describe('深色模式适配审计', () => {
  for (const p of PAGES) {
    test(p.name, async ({ page }) => {
      await page.goto(BASE_URL + p.path, { waitUntil: 'networkidle' })
      await waitReady(page)
      await applyThemeMode(page, 'dark')
      await expect(page.locator('html.dark')).toHaveCount(1)
      await waitReady(page)

      const report = await page.evaluate(() => {
        const parse = (c: string) => (c.match(/[\d.]+/g) || []).map(Number)
        const lum = (rgb: number[]) => (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255
        const bodyStyle = getComputedStyle(document.body)
        const lightBlocks: { cls: string; bg: string; area: number }[] = []
        const seen = new Set<string>()
        document.querySelectorAll<HTMLElement>('*').forEach((el) => {
          const s = getComputedStyle(el)
          const rgba = parse(s.backgroundColor)
          if (rgba.length < 3 || (rgba[3] !== undefined && rgba[3] === 0)) return
          if (lum(rgba) < 0.75) return
          const rect = el.getBoundingClientRect()
          const area = rect.width * rect.height
          if (area < 20000) return
          const cls = (el.className || '').toString().slice(0, 60)
          const key = cls + '|' + s.backgroundColor
          if (seen.has(key)) return
          seen.add(key)
          lightBlocks.push({ cls, bg: s.backgroundColor, area: Math.round(area) })
        })
        return {
          bodyBg: bodyStyle.backgroundColor,
          bodyColor: bodyStyle.color,
          lightBlocks: lightBlocks.slice(0, 20),
        }
      })

      console.log('[dark-audit] ' + p.path + ' ' + JSON.stringify(report))
      const bodyLum = (report.bodyBg.match(/[\d.]+/g) || []).map(Number).slice(0, 3)
      const bodyBrightness = (0.2126 * bodyLum[0] + 0.7152 * bodyLum[1] + 0.0722 * bodyLum[2]) / 255
      expect(bodyBrightness, 'body 背景应为深色，实际 ' + report.bodyBg).toBeLessThan(0.5)
      expect(report.lightBlocks, '未适配深色的大块浅色背景').toEqual([])
    })
  }
})

