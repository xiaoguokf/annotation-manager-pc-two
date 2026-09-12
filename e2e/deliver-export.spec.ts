import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { BASE_URL, login } from './utils'

/**
 * 交付导出端到端：登录 → 审核详情页「导出JSON」→ 下载 zip → 解压校验。
 *
 * 走业务里原有的导出入口（task/review-detail.vue），不额外新增页面。
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

  test('审核详情页导出 zip', async ({ page }) => {
    // playwright 的 setup 工程已登录并写入 storageState，这里只在会话失效时按环境变量重新登录
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    if (page.url().includes('/login')) {
      await login(page, BASE_URL, USERNAME as string, PASSWORD as string)
    }

    await page.goto(`${BASE_URL}/task/review/${PROJECT_ID}`, { waitUntil: 'networkidle' })

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60_000 }),
      page.getByRole('button', { name: '导出JSON' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/\.zip$/)

    // 解压校验：zip 内只有一个 json，且含 docx 顶层字段
    // 中文条目名用 unzip 解压会按本地编码破坏文件名，交给 python zipfile 处理
    const dir = mkdtempSync(path.join(tmpdir(), 'docx-export-'))
    const zipPath = path.join(dir, 'export.zip')
    await download.saveAs(zipPath)

    const script = [
      'import zipfile,sys,json',
      'z = zipfile.ZipFile(sys.argv[1])',
      'z.extractall(sys.argv[2])',
      "print(json.dumps([n for n in z.namelist() if n.endswith('.json')]))",
    ].join('\n')
    const listed = execFileSync('python3', ['-c', script, zipPath, dir]).toString()
    const jsonFiles: string[] = JSON.parse(listed)

    expect(jsonFiles).toHaveLength(1)

    const payload = JSON.parse(readFileSync(path.join(dir, jsonFiles[0] as string), 'utf-8'))
    expect(payload.supTreeDetail).toBeTruthy()
  })
})
