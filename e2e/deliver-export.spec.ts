import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { BASE_URL, login } from './utils'

/**
 * 交付导出端到端：登录 → 交付预览页 → 预览 JSON → 导出 zip → 解压校验。
 *
 * 账号与项目来自环境变量，未配置时跳过，避免污染通用 e2e：
 *   E2E_USERNAME / E2E_PASSWORD / E2E_PROJECT_ID
 */
const USERNAME = process.env.E2E_USERNAME
const PASSWORD = process.env.E2E_PASSWORD
const PROJECT_ID = process.env.E2E_PROJECT_ID

test.describe('交付导出（docx 新格式）', () => {
  test.skip(
    !USERNAME || !PASSWORD || !PROJECT_ID,
    '未配置 E2E_USERNAME / E2E_PASSWORD / E2E_PROJECT_ID，跳过导出端到端',
  )

  test('预览并导出 zip', async ({ page }) => {
    await login(page, BASE_URL, USERNAME as string, PASSWORD as string)

    await page.goto(`${BASE_URL}/deliver/docx-preview`, { waitUntil: 'networkidle' })
    await page.getByPlaceholder('请输入项目ID').fill(PROJECT_ID as string)
    await page.getByRole('button', { name: '预览' }).click()

    // 预览区出现完整 docx 结构
    const json = await page.locator('.json-area textarea').inputValue()
    expect(json).toContain('supTreeName')
    expect(json).toContain('supTreeDetail')

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: '导出ZIP' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.zip$/)

    // 解压校验：zip 内只有一个 json，且含 docx 顶层字段
    const dir = mkdtempSync(path.join(tmpdir(), 'docx-export-'))
    const zipPath = path.join(dir, download.suggestedFilename())
    await download.saveAs(zipPath)
    execFileSync('unzip', ['-o', zipPath, '-d', dir])

    const jsonFiles = readdirSync(dir).filter((file) => file.endsWith('.json'))
    expect(jsonFiles).toHaveLength(1)

    const payload = JSON.parse(readFileSync(path.join(dir, jsonFiles[0] as string), 'utf-8'))
    expect(payload.supTreeDetail).toBeTruthy()
  })
})
