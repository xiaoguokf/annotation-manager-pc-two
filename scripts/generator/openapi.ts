/**
 * 阶段 1：OpenAPI 3.0 解析
 *
 * 职责：
 * - 拉取 OpenAPI 文档（dev server 代理 / 直连后端两种地址回退）
 * - 按 URL 规则过滤、按自定义配置跳过
 * - 按 tag 分组为 controller
 * - 补齐后端未声明的路径参数，生成 URL 模板
 *
 * 产出：RawOperation 集合（仍是 OpenAPI 结构，未做方法形态判定）
 */

import axios from 'axios'
import { config } from '../config'
import { toPascalCase, toCamelCase } from './naming'
import type {
  HttpMethod,
  OpenAPIDoc,
  OpenAPIOperation,
  OpenAPIParameter,
  RawOperation,
} from './types'

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const

/** 类型守卫：判断 pathItem 的 key 是否为 HTTP 方法 */
function isHttpMethod(key: string): key is HttpMethod {
  return (HTTP_METHODS as readonly string[]).includes(key)
}

/** 匹配 URL 中的 {id} 占位符（只认合法标识符，避免误匹配已插值的 ${params.id}） */
const PATH_PARAM_PATTERN = /\{([A-Za-z_][A-Za-z0-9_]*)\}/g

/** 按 tag 分组后的操作集合 */
export type OperationGroup = Map<string, RawOperation[]>

/** 生成方法名：HTTP 方法 + 路径（忽略路径参数段）的 PascalCase 拼接 */
export function generateOperationName(method: string, path: string): string {
  const methodCamel = toCamelCase(method)
  const pathParts = path.split('/').filter((part) => part && !part.startsWith('{'))

  if (pathParts.length === 0) return `${methodCamel}Api`

  const pathName = pathParts.map((part) => toPascalCase(part)).join('')
  return `${methodCamel}${pathName}Api`
}

/** 从 URL 模板中提取路径参数名，如 /a/{id}/status → ['id'] */
export function extractPathParamNames(path: string): string[] {
  const names: string[] = []
  const regex = new RegExp(PATH_PARAM_PATTERN)
  let match: RegExpExecArray | null

  while ((match = regex.exec(path)) !== null) {
    if (!names.includes(match[1])) {
      names.push(match[1])
    }
  }
  return names
}

/**
 * 生成 URL 模板：把 {id} 替换为模板字符串插值。
 * 必填路径参数用 params.id，可选参数用 params?.id 避免拼出 undefined。
 */
export function buildUrlTemplate(path: string, pathParams: OpenAPIParameter[]): string {
  if (pathParams.length === 0) return `'${path}'`

  let processedPath = path
  pathParams.forEach((param) => {
    const camelName = toCamelCase(param.name)
    const accessor = param.required === false ? `params?.${camelName}` : `params.${camelName}`
    processedPath = processedPath.replace(`{${param.name}}`, `\${${accessor}}`)
  })

  // 兜底告警：仍有未替换的占位符说明参数名与 URL 不匹配
  const unresolved = extractPathParamNames(processedPath)
  if (unresolved.length > 0) {
    console.warn(`⚠️  路径参数未解析: ${path} → ${unresolved.join(', ')}`)
  }

  return `\`${processedPath}\``
}

/**
 * 合并 operation.parameters 与 URL 模板中的路径参数。
 *
 * 后端未声明 @Parameter 时 OpenAPI 中不含 in:'path' 的参数，
 * 这里按 URL 占位符兜底补齐，避免生成带 {id} 字面量的死链。
 */
function resolveParameters(path: string, operation: OpenAPIOperation): OpenAPIParameter[] {
  const declared = (operation.parameters || []).filter(
    (param) => param.in === 'query' || param.in === 'path',
  )
  const declaredPathNames = new Set(
    declared.filter((param) => param.in === 'path').map((param) => param.name),
  )

  const missing = extractPathParamNames(path)
    .filter((name) => !declaredPathNames.has(name))
    .map<OpenAPIParameter>((name) => ({
      name,
      in: 'path',
      required: true,
      // 后端 ID 为雪花 ID（long），按项目约定统一用 string 承载
      schema: { type: 'string' },
    }))

  if (missing.length > 0) {
    console.log(`⚠️  补齐未声明的路径参数: ${path} → ${missing.map((p) => p.name).join(', ')}`)
  }

  return [...missing, ...declared]
}

/** 通配符匹配：* 匹配任意字符，? 匹配单个字符 */
function matchPattern(str: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${regexPattern}$`).test(str)
}

/** 按 config.urlFilters 判断是否跳过该 URL */
function shouldFilterUrl(url: string): boolean {
  const { exclude, include } = config.urlFilters

  for (const pattern of exclude) {
    if (matchPattern(url, pattern)) return true
  }

  if (include && include.length > 0) {
    return !include.some((pattern) => matchPattern(url, pattern))
  }

  return false
}

/** 取自定义方法配置，支持按 URL 或 "method url" 两种 key */
function getCustomMethodConfig(url: string, method: string) {
  const key = `${method.toLowerCase()} ${url}`
  return config.customMethods[url] || config.customMethods[key]
}

/**
 * 拉取 OpenAPI 文档。
 * 经 dev server 访问时代理前缀为 /api，直连后端时接口在根路径，两种都尝试。
 */
export async function loadOpenApiDocument(
  baseUrl: string = 'http://localhost:5173',
): Promise<OpenAPIDoc> {
  const candidates = [`${baseUrl}/api/v3/api-docs`, `${baseUrl}/v3/api-docs`]
  let lastError: unknown

  for (const url of candidates) {
    try {
      const response = await axios.get<OpenAPIDoc>(url)
      console.log(`✅ OpenAPI 规范获取成功: ${url}`)
      return response.data
    } catch (error) {
      lastError = error
      console.log(`↩️  ${url} 获取失败，尝试下一个地址`)
    }
  }

  console.error('❌ 获取 OpenAPI 规范失败:', lastError)
  console.log('💡 请确保后端服务已启动，且可以通过 /v3/api-docs 或 /api/v3/api-docs 访问')
  throw lastError
}

/**
 * 将文档解析为按 tag 分组的操作集合。
 * 顺带完成路径参数补齐与方法名冲突检测。
 */
export function groupOperationsByTag(doc: OpenAPIDoc): OperationGroup {
  const groups: OperationGroup = new Map()
  const nameOwners = new Map<string, string>()

  Object.entries(doc.paths).forEach(([path, pathItem]) => {
    if (shouldFilterUrl(path)) {
      console.log(`🚫 跳过 URL: ${path}`)
      return
    }

    // 按文档中方法出现的顺序遍历，保证生成顺序稳定可预期
    Object.entries(pathItem).forEach(([method, operation]) => {
      if (!isHttpMethod(method)) return
      if (!operation?.operationId) return

      if (getCustomMethodConfig(path, method)?.generate === false) {
        console.log(`🚫 跳过自定义方法: ${method} ${path}`)
        return
      }

      // 路径参数补齐后回写，后续阶段统一使用
      const params = resolveParameters(path, operation)
      const normalized: RawOperation = {
        method,
        path,
        operation: { ...operation, parameters: params },
      }

      const tag = operation.tags?.[0] || 'default'
      const list = groups.get(tag) || []
      list.push(normalized)
      groups.set(tag, list)

      detectNameConflict(normalized, nameOwners)
    })
  })

  return groups
}

/** 路径参数段不参与命名，/x/{id} 与 /x/{uid} 会撞名，提前提示 */
function detectNameConflict(raw: RawOperation, nameOwners: Map<string, string>): void {
  const name = generateOperationName(raw.method, raw.path)
  const owner = `${raw.method.toUpperCase()} ${raw.path}`

  if (nameOwners.has(name) && nameOwners.get(name) !== owner) {
    console.warn(
      `⚠️  方法名冲突: ${name}（${owner} 与 ${nameOwners.get(name)}），` +
        `请在 scripts/config.ts 的 customMethods 中配置唯一名称`,
    )
  }
  nameOwners.set(name, owner)
}

/** tag → 文件名（不含扩展名） */
export function tagToFileName(tag: string): string {
  return toCamelCase(tag)
}
