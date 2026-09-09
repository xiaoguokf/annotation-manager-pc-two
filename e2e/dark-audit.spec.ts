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
        const isRgb = (c: string) => c.startsWith('rgb(')
        const rel = (v: number) => {
          const x = v / 255
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
        }
        const lum = (rgb: number[]) => 0.2126 * rel(rgb[0]) + 0.7152 * rel(rgb[1]) + 0.0722 * rel(rgb[2])
        const contrast = (a: number[], b: number[]) => {
          const l1 = lum(a)
          const l2 = lum(b)
          const hi = Math.max(l1, l2)
          const lo = Math.min(l1, l2)
          return (hi + 0.05) / (lo + 0.05)
        }
        const effectiveBg = (el: HTMLElement) => {
          let cur: HTMLElement | null = el
          while (cur) {
            const c = getComputedStyle(cur).backgroundColor
            if (isRgb(c)) {
              const rgba = parse(c)
              if (rgba[3] === undefined || rgba[3] > 0.1) return rgba
            }
            cur = cur.parentElement
          }
          return [26, 26, 46]
        }

        const bodyStyle = getComputedStyle(document.body)
        const lightBlocks: { cls: string; bg: string; area: number }[] = []
        const lowContrast: { cls: string; text: string; color: string; bg: string; ratio: number }[] = []
        const seenBlocks = new Set<string>()
        const seenText = new Set<string>()

        Array.from(document.querySelectorAll<HTMLElement>('*')).forEach((el) => {
          const s = getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          if (rect.width < 2 || rect.height < 2) return
          const bgRgba = parse(s.backgroundColor)
          const hasBg = isRgb(s.backgroundColor) && (bgRgba[3] === undefined || bgRgba[3] > 0)
          if (hasBg) {
            const L = (0.2126 * bgRgba[0] + 0.7152 * bgRgba[1] + 0.0722 * bgRgba[2]) / 255
            if (L > 0.75 && rect.width * rect.height > 20000) {
              const cls = (el.className || '').toString().slice(0, 50)
              const key = cls + '|' + s.backgroundColor
              if (!seenBlocks.has(key)) {
                seenBlocks.add(key)
                lightBlocks.push({ cls, bg: s.backgroundColor, area: Math.round(rect.width * rect.height) })
              }
            }
          }
          // 叶子节点的文字对比度（只处理 rgb 颜色，跳过 oklch 等）
          if (isRgb(s.color) && el.children.length === 0 && (el.textContent || '').trim()) {
            const bgc = hasBg ? bgRgba : effectiveBg(el)
            const ratio = contrast(parse(s.color).slice(0, 3), bgc.slice(0, 3))
            if (ratio < 2.2) {
              const cls = (el.className || '').toString().slice(0, 40)
              const text = (el.textContent || '').trim().slice(0, 20)
              const key = cls + '|' + text
              if (!seenText.has(key)) {
                seenText.add(key)
                lowContrast.push({
                  cls,
                  text,
                  color: s.color,
                  bg: 'rgb(' + bgc.slice(0, 3).join(',') + ')',
                  ratio: +ratio.toFixed(2),
                })
              }
            }
          }
        })

        return {
          bodyBg: bodyStyle.backgroundColor,
          lightBlocks: lightBlocks.slice(0, 10),
          lowContrast: lowContrast.slice(0, 10),
        }
      })

      console.log('[dark-audit] ' + p.path + ' ' + JSON.stringify(report))
      const bodyLum = (report.bodyBg.match(/[\d.]+/g) || []).map(Number).slice(0, 3)
      const bodyBrightness = (0.2126 * bodyLum[0] + 0.7152 * bodyLum[1] + 0.0722 * bodyLum[2]) / 255
      expect(bodyBrightness, 'body 背景应为深色，实际 ' + report.bodyBg).toBeLessThan(0.5)
      expect(report.lightBlocks, '未适配深色的大块浅色背景').toEqual([])
      expect(report.lowContrast, '深色下文字对比度过低').toEqual([])
    })
  }
})

