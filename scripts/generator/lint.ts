/**
 * REST 风格检测（只提示，不改生成结果）
 *
 * 定位：代码风格建议，不是错误。检测结果仅打印提示，**不会影响生成产物**——
 * 生成代码必须严格服从后端契约，不能因为"不符合 REST"就改动参数落位。
 *
 * 之所以做成独立模块而不是并入阶段 2：阶段 2 的职责是产出 OperationSpec，
 * 风格检查是与之正交的横切关注点，混进去会让阶段 2 既要决策又要挑刺。
 */

import { config } from '../config'
import type { RestLintConfig, RestLintRule } from '../config'
import type { HttpMethod, RawOperation } from './types'

/** 单条检测结果 */
export interface RestIssue {
  rule: RestRule
  method: HttpMethod
  path: string
  message: string
  suggestion?: string
}

/** 规则名，与 scripts/config.ts 中的 RestLintRule 一一对应 */
export type RestRule = RestLintRule

/** 各规则的开关 */
export type RestLintRuleConfig = Partial<Record<RestRule, boolean>>

/**
 * 认证等公认的 RPC 端点。
 * 这些动作没有对应的资源表示，用动词是通行做法，不应当作问题。
 */
const RPC_ENDPOINT_WHITELIST = [
  'login',
  'logout',
  'register',
  'forget',
  'captcha',
  'refresh-token',
  'refreshtoken',
  'gen-secret',
  'gensecret',
  'send-code',
  'verify',
]

/** 查询/子集合性质的名词，容易被误判为动词 */
const NOUN_SEGMENTS = [
  'list',
  'page',
  'all',
  'info',
  'detail',
  'details',
  'selector',
  'options',
  'enabled',
  'account',
  'profile',
  'current',
  'me',
  'count',
  'tree',
  'export',
  'import',
  'batch',
  'status',
  'config',
  'settings',
]

/** 典型动词词根，命中即提示 */
const VERB_PATTERNS = [
  { pattern: /^add$/, suggestion: '改用 POST /资源 创建' },
  { pattern: /^create$/, suggestion: '改用 POST /资源 创建' },
  { pattern: /^save$/, suggestion: '改用 POST /资源 或 PUT /资源/{id}' },
  { pattern: /^update.*/, suggestion: '改用 PUT /资源/{id}' },
  { pattern: /^edit$/, suggestion: '改用 PUT /资源/{id}' },
  { pattern: /^modify$/, suggestion: '改用 PATCH /资源/{id}' },
  { pattern: /^delete$/, suggestion: '改用 DELETE /资源/{id}' },
  { pattern: /^remove$/, suggestion: '改用 DELETE /资源/{id}' },
  { pattern: /^del$/, suggestion: '改用 DELETE /资源/{id}' },
  { pattern: /^disable$/, suggestion: '改用 PATCH /资源/{id} 修改状态字段' },
  { pattern: /^enable$/, suggestion: '改用 PATCH /资源/{id} 修改状态字段' },
  { pattern: /^change.*/, suggestion: '改用 PATCH /资源/{id} 局部更新' },
  { pattern: /^reset.*/, suggestion: '改用 PATCH /资源/{id} 局部更新' },
  { pattern: /^assign.*/, suggestion: '改用 PUT /资源/{id}/子资源 维护关联' },
  { pattern: /^bind.*/, suggestion: '改用 PUT /资源/{id}/子资源 维护关联' },
  { pattern: /^unbind.*/, suggestion: '改用 DELETE /资源/{id}/子资源 解除关联' },
  { pattern: /^get.*/, suggestion: '改用 GET /资源 或 GET /资源/{id}' },
  { pattern: /^query.*/, suggestion: '改用 GET /资源' },
  { pattern: /^search$/, suggestion: '改用 GET /资源 配合查询参数' },
  { pattern: /^send.*/, suggestion: '改用 POST /资源 创建一条发送记录' },
  { pattern: /^check$/, suggestion: '改用 GET /资源/{id}' },
  { pattern: /^sync.*/, suggestion: '改用 POST /资源/sync 明确为作业型端点' },
]

/** 查询语义关键词 */
const QUERY_KEYWORDS = ['list', 'query', 'search', 'page', 'find', 'selector']

function isEnabled(rule: RestRule, lintConfig: RestLintConfig): boolean {
  return lintConfig.rules?.[rule] !== false
}

/** 通配符匹配 */
function matchPattern(str: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp(`^${regexPattern}$`).test(str)
}

function isIgnored(path: string, lintConfig: RestLintConfig): boolean {
  return (lintConfig.ignore || []).some((pattern) => matchPattern(path, pattern))
}

/** 取路径段（去掉查询串与空段） */
function pathSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

/** 取末段原始值（保留大小写，供 camelCase 检测与分词使用） */
function lastSegment(path: string): string {
  const segments = pathSegments(path)
  return segments[segments.length - 1] ?? ''
}

/**
 * 把路径段拆成词。按 camelCase 边界、连字符、下划线切分：
 * addUser → [add, user]、update-info → [update, info]、del → [del]
 *
 * 直接对整段做正则会因 addUser 匹配不到 ^add$ 而漏检，
 * 分词后只判断首词即可覆盖"动词 + 名词"这类常见命名。
 */
function tokenize(segment: string): string[] {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .map((token) => token.toLowerCase())
    .filter(Boolean)
}

/** 末段是否为"动作"（动词或认证类端点），用于区分动作端点与资源端点 */
function isActionSegment(path: string): boolean {
  const tokens = tokenize(lastSegment(path))
  const head = tokens[0] ?? ''

  return (
    VERB_PATTERNS.some((item) => item.pattern.test(head)) ||
    RPC_ENDPOINT_WHITELIST.includes(head) ||
    RPC_ENDPOINT_WHITELIST.some((word) => tokens.includes(word))
  )
}

/** 检测单个操作 */
function inspect(raw: RawOperation, lintConfig: RestLintConfig): RestIssue[] {
  const { method, path, operation } = raw
  const issues: RestIssue[] = []
  const segments = pathSegments(path)
  const last = lastSegment(path)
  // 分词后取首词判断语义：addUser → add、update-info → update
  const tokens = tokenize(last)
  const head = tokens[0] ?? ''
  const hasBody = Boolean(operation.requestBody?.content)

  const push = (
    rule: RestRule,
    message: string,
    suggestion?: string,
  ) => {
    if (isEnabled(rule, lintConfig)) {
      issues.push({ rule, method, path, message, suggestion })
    }
  }

  // 1. URI 含动词
  const isWhitelisted =
    RPC_ENDPOINT_WHITELIST.includes(head) ||
    RPC_ENDPOINT_WHITELIST.some((word) => tokens.includes(word))
  const isNoun = NOUN_SEGMENTS.includes(head)
  const verb = VERB_PATTERNS.find((item) => item.pattern.test(head))

  if (verb && !isWhitelisted && !isNoun) {
    push('verb-in-uri', `URI 末段 "${last}" 以动词开头，资源应使用名词`, verb.suggestion)
  }

  // 2. POST 用于查询
  const looksLikeQuery = QUERY_KEYWORDS.some((word) => tokens.includes(word))
  if (method === 'post' && looksLikeQuery) {
    push('post-for-query', '查询类接口使用 POST，建议改用 GET + 查询参数', '改用 GET')
  }

  // 3. GET 携带请求体
  if (method === 'get' && hasBody) {
    push(
      'get-with-body',
      'GET 携带请求体，缓存与网关兼容性差',
      '改用查询参数，或改用 POST /资源/search',
    )
  }

  // 4. PUT 无请求体
  if (method === 'put' && !hasBody) {
    push(
      'put-without-body',
      'PUT 未携带请求体，通常是执行动作而非替换资源，且难以保证幂等',
      '改用 POST 表达动作，或 PATCH /资源/{id} 局部更新',
    )
  }

  // 5. 单资源操作把标识放在 query
  const idInQuery = (operation.parameters || []).some(
    (param) => param.in === 'query' && /^(id|.*Id)$/i.test(param.name),
  )
  const isCollectionAction =
    ['delete', 'put', 'patch'].includes(method) && !segments.some((s) => s.startsWith('{'))
  if (idInQuery && isCollectionAction) {
    push('id-in-query', '单资源操作把标识放在 query，资源定位应体现在路径中', '改用 /资源/{id}')
  }

  // 6. URI 段使用 camelCase
  const camelSegment = segments.find(
    (segment) => !segment.startsWith('{') && /[a-z]+[A-Z]/.test(segment),
  )
  if (camelSegment) {
    push(
      'camel-case-in-uri',
      `URI 段 "${camelSegment}" 使用 camelCase，路径建议统一小写连字符`,
      '改用 kebab-case',
    )
  }

  return issues
}

/** 检测同一资源下同时存在标准端点与动词端点（如 POST /user 与 POST /user/add） */
function detectDuplicates(raws: RawOperation[], lintConfig: RestLintConfig): RestIssue[] {
  if (!isEnabled('duplicate-resource', lintConfig)) return []

  const issues: RestIssue[] = []
  const byParent = new Map<string, RawOperation[]>()

  raws.forEach((raw) => {
    const segments = pathSegments(raw.path)
    if (segments.length < 2) return
    const parent = `/${segments.slice(0, -1).join('/')}`
    const list = byParent.get(parent) || []
    list.push(raw)
    byParent.set(parent, list)
  })

  byParent.forEach((list, parent) => {
    // "标准端点"指末段既非动词、也非认证类动作端点的资源路径。
    // 若把 /user/register 这类动作端点也算作标准端点，会误判其他动作重复。
    const standard = list.filter((raw) => !isActionSegment(lastSegment(raw.path)))
    if (standard.length === 0) return

    list.forEach((raw) => {
      const head = tokenize(lastSegment(raw.path))[0] ?? ''
      const verb = VERB_PATTERNS.find((item) => item.pattern.test(head))
      if (!verb) return
      // 仅当该动词语义与已有标准端点的 HTTP 方法一致时才提示冗余
      const redundant = standard.some((item) => item.method === raw.method)
      if (redundant) {
        issues.push({
          rule: 'duplicate-resource',
          method: raw.method,
          path: raw.path,
          message: `与同资源下的标准端点 ${parent} 语义重复`,
          suggestion: verb.suggestion,
        })
      }
    })
  })

  return issues
}

/** 规则说明，用于汇总输出 */
const RULE_LABELS: Record<RestRule, string> = {
  'verb-in-uri': 'URI 含动词',
  'post-for-query': 'POST 用于查询',
  'get-with-body': 'GET 携带请求体',
  'put-without-body': 'PUT 无请求体',
  'id-in-query': '标识写在 query',
  'camel-case-in-uri': 'URI 使用 camelCase',
  'duplicate-resource': '端点语义重复',
}

export interface RestLintReport {
  issues: RestIssue[]
  /** 按规则分组的计数 */
  counts: Map<RestRule, number>
}

/** 执行检测 */
/** 执行检测。是否执行由编排层按 config.restLint.enabled 决定 */
export function lintRestStyle(raws: RawOperation[]): RestLintReport {
  const lintConfig: RestLintConfig = config.restLint ?? { enabled: true }

  const issues = raws
    .filter((raw) => !isIgnored(raw.path, lintConfig))
    .flatMap((raw) => inspect(raw, lintConfig))
    .concat(detectDuplicates(raws, lintConfig))

  const counts = new Map<RestRule, number>()
  issues.forEach((issue) => counts.set(issue.rule, (counts.get(issue.rule) || 0) + 1))

  return { issues, counts }
}

/** 输出检测报告 */
export function reportRestLint(report: RestLintReport): void {
  const { issues, counts } = report
  if (issues.length === 0) {
    console.log('✨ REST 风格检测通过')
    return
  }

  console.log(`\n⚠️  REST 风格检测：${issues.length} 处提示（不影响生成结果）`)

  counts.forEach((count, rule) => {
    console.log(`\n  【${RULE_LABELS[rule]}】${count} 处`)
    issues
      .filter((issue) => issue.rule === rule)
      .forEach((issue) => {
        console.log(`    ${issue.method.toUpperCase().padEnd(6)} ${issue.path}`)
        console.log(`           ${issue.message}`)
        if (issue.suggestion) console.log(`           建议：${issue.suggestion}`)
      })
  })

  console.log('\n  说明：以上仅为风格建议，生成结果严格以后端契约为准。')
  console.log('        如需关闭，请在 scripts/config.ts 中配置 restLint。\n')
}
