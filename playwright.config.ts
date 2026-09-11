import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  // 登录含 RSA 公钥获取与重试，单个用例放宽到 2 分钟
  timeout: 120_000,
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    // browser 配置：只起 vite，不拉起 Electron
    command: 'pnpm browser --port 5174',
    url: 'http://localhost:5174',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})

