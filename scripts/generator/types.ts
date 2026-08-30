/**
 * 共享类型定义。
 *
 * 两类：
 * 1. OpenAPI 3.0 文档结构 —— 阶段 1（openapi.ts）的输入。
 * 2. OperationSpec —— 阶段 2（operation.ts）产出的中间表示，
 *    阶段 4（render.ts）只消费它做模板渲染，不再接触 OpenAPI 结构。
 */

// ============ OpenAPI 3.0 规范类型 ============

export interface OpenAPISchema {
  type: string
  properties?: Record<string, OpenAPISchema>
  required?: string[]
  items?: OpenAPISchema
  $ref?: string
  enum?: unknown[]
  format?: string
  description?: string
}

export interface OpenAPIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  schema?: OpenAPISchema
  description?: string
}

export interface OpenAPIRequestBody {
  description?: string
  content?: Record<string, { schema: OpenAPISchema }>
  required?: boolean
}

export interface OpenAPIResponse {
  description: string
  content?: Record<string, { schema: OpenAPISchema }>
}

export interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses: Record<string, OpenAPIResponse>
  deprecated?: boolean
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options'

export type OpenAPIPathItem = Partial<Record<HttpMethod, OpenAPIOperation>>

export interface OpenAPIDoc {
  openapi: string
  info: { title: string; version: string }
  paths: Record<string, OpenAPIPathItem>
  components?: {
    schemas?: Record<string, OpenAPISchema>
  }
}

// ============ 阶段 2 产出的中间表示 ============

/** 请求形态：普通 JSON、SSE 流式、文件下载 */
export type RequestKind = 'json' | 'sse' | 'download'

/** 传输方式：普通 JSON 请求体 或 multipart/form-data */
export type Transport = 'request' | 'form'

/**
 * 函数签名中的参数槽位，按数组顺序渲染。
 * 阶段 2 决定有哪些槽位，阶段 4 只负责拼接。
 */
export type ArgSlot =
  /** 请求体，存在即必填（无 body 时不产生该槽位） */
  | { role: 'body'; type: string; required: true }
  /** path + query 合并的参数对象 */
  | { role: 'params'; type: string; required: boolean }
  /** axios 扩展配置，恒为可选 */
  | { role: 'config'; type: string; required: false }
  /** SSE 回调集合，恒为必填 */
  | { role: 'options'; type: string; required: true }

export type ArgRole = ArgSlot['role']

/**
 * body 实参的落位方式。
 *
 * 依据的是 axios 方法签名的客观能力（哪些方法有第三个参数位），
 * 而非"GET 就该走 query"这类 REST 约定 —— 契约里给了 body 就照样带过去。
 * - argument：有请求体，且方法签名有独立的 body 参数位
 * - nullArgument：无请求体，但方法签名有 body 参数位，必须传 null 占位。
 *   否则 config 会左移到 data 位置，导致参数位移（请求体变成配置对象）
 * - configData：无独立 body 参数位，塞进 config.data
 * - query：GET / HEAD 无法携带请求体（fetch 规范禁止、XHR 静默丢弃），
 *          此时把 body 数据并入查询参数，避免生成无效的死代码
 * - none：无请求体，且签名无需 body 占位
 */
export type BodyPlacement =
  | 'argument'
  | 'nullArgument'
  | 'configData'
  | 'query'
  | 'none'

/**
 * params 实参的落位方式。
 * - config：写入 config.params
 * - body：整体作为第二参（FormData 且无独立 body 时，参数即表单字段）
 * - urlOnly：仅有 path 参数，已插值进 URL，调用中不再出现
 */
export type ParamsPlacement = 'config' | 'body' | 'urlOnly'

/**
 * 单个 API 方法的完整描述。
 * 阶段 2 之后，生成逻辑所需的一切信息都已在此，不再回溯 OpenAPI 文档。
 */
export interface OperationSpec {
  /** 导出的方法名，如 getAdminUserListApi */
  name: string
  method: HttpMethod
  summary?: string
  description?: string
  /** 已完成路径参数插值的 URL 模板，带反引号或单引号 */
  urlTemplate: string
  responseType: string
  kind: RequestKind
  transport: Transport
  /** body 实参落在哪个位置 */
  bodyPlacement: BodyPlacement
  /** params 实参落在哪个位置 */
  paramsPlacement: ParamsPlacement
  slots: ArgSlot[]
}

/** 从 OpenAPI 文档中提取出的原始操作，参数已按 URL 占位符补齐 */
export interface RawOperation {
  method: HttpMethod
  path: string
  operation: OpenAPIOperation
}

/** 取指定角色的槽位类型，不存在返回 undefined */
export function slotType(spec: OperationSpec, role: ArgRole): string | undefined {
  const slot = spec.slots.find((item) => item.role === role)
  return slot?.type
}
