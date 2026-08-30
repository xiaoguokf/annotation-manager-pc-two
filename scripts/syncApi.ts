/**
 * API 生成入口（旧路径兼容层）。
 *
 * 实现已按阶段拆分到 scripts/generator/：
 *   1. openapi.ts   —— OpenAPI 3.0 解析
 *   2. operation.ts —— 通用方法解析（形态、SSE、下载、参数槽位）
 *   3. schema.ts    —— 实体类处理（类型、注释、interface 定义）
 *   4. render.ts    —— controller.ts 模板生成
 *   index.ts        —— 编排四个阶段并落盘
 *
 * 新代码请直接引用 ./generator/index，本文件仅保留兼容导出。
 */

import { generateApiModules } from './generator/index'

export { generateApiModules }

// 支持直接运行：tsx scripts/syncApi.ts [baseUrl]
if (import.meta.url === `file://${process.argv[1]}`) {
  generateApiModules(process.argv[2]).catch(console.error)
}
