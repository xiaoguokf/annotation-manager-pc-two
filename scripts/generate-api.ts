import { generateApiModules } from './syncApi'

async function main() {
  const baseUrl = process.argv[2] || 'http://localhost:5173'

  try {
    await generateApiModules(baseUrl)
  } catch (error) {
    console.error('API 生成失败:', error)
    process.exit(1)
  }
}

main()
