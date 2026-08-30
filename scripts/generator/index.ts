/**
 * 编排层：串联四个阶段并落盘
 *
 * 1. openapi.ts  解析 OpenAPI 文档 → RawOperation 分组
 * 2. operation.ts 解析方法形态 → OperationSpec
 * 3. schema.ts  解析类型与实体定义
 * 4. render.ts  渲染 controller.ts
 */

import fs from 'node:fs'
import path from 'node:path'

import { config } from '../config'
import { SchemaRegistry } from './schema'
import { parseOperations } from './operation'
import { renderControllerModule } from './render'
import { loadOpenApiDocument, groupOperationsByTag, tagToFileName } from './openapi'
import { toCamelCase } from './naming'
import { lintRestStyle, reportRestLint } from './lint'

const API_DIR = path.join(process.cwd(), 'src/api/gen')

/** 生成全部 API 模块文件 */
export async function generateApiModules(baseUrl?: string): Promise<void> {
  console.log('🚀 开始生成 API 模块...')

  // 阶段 1：拉取并解析文档，按 tag 分组
  const doc = await loadOpenApiDocument(baseUrl)
  const groups = groupOperationsByTag(doc)

  // REST 风格检测：横切关注点，只提示不干预生成。关闭时完全静默，避免误导
  if (config.restLint?.enabled) {
    reportRestLint(lintRestStyle(Array.from(groups.values()).flat()))
  }

  // 阶段 3 的依赖：类型注册表（持有 components.schemas）
  const registry = new SchemaRegistry(doc.components?.schemas || {})

  ensureDirectoryExists(API_DIR)
  cleanupObsoleteFiles(new Set(groups.keys()))

  // 阶段 2 + 3 + 4：逐 tag 处理
  let count = 0
  groups.forEach((raws, tag) => {
    const { specs, usedTypes } = parseOperations(raws, registry)
    const content = renderControllerModule(specs, usedTypes, registry)

    const fileName = `${tagToFileName(tag)}.ts`
    fs.writeFileSync(path.join(API_DIR, fileName), content, 'utf-8')
    console.log(`✅ 生成 API 文件: ${fileName}`)
    count += 1
  })

  console.log(`🎉 API 模块生成完成，共生成 ${count} 个文件`)
  console.log('✨ API 模块生成完成！')
}

function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

/** 删除后端已下线（tag 消失）的旧 API 文件 */
function cleanupObsoleteFiles(currentTags: Set<string>): void {
  if (!fs.existsSync(API_DIR)) return

  const existing = fs.readdirSync(API_DIR)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => file.replace('.ts', ''))

  const currentFileNames = Array.from(currentTags).map(toCamelCase)
  const obsolete = existing.filter((file) => !currentFileNames.includes(file))

  obsolete.forEach((file) => {
    fs.unlinkSync(path.join(API_DIR, `${file}.ts`))
    console.log(`🗑️  删除过时的 API 文件: ${file}.ts`)
  })

  if (obsolete.length > 0) {
    console.log(`🧹 清理完成，删除了 ${obsolete.length} 个过时文件`)
  }
}
