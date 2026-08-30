/**
 * 阶段 2：通用方法解析
 *
 * 职责：把 RawOperation 解析成 OperationSpec —— 决定
 * - 用什么 HTTP 方法与传输方式（json / form）
 * - 请求形态（普通 JSON、SSE 流式、文件下载）
 * - 函数签名由哪些参数槽位组成（body / params / config / options）
 * - 各槽位的 TypeScript 类型（委派阶段 3 的 SchemaRegistry）
 *
 * 产出后阶段 4 无需再判断任何业务规则，只做字符串拼接。
 */

import { SchemaRegistry } from './schema'
import { buildUrlTemplate, generateOperationName } from './openapi'
import { toCamelCase } from './naming'
import type {
  ArgSlot,
  BodyPlacement,
  HttpMethod,
  OpenAPIOperation,
  OpenAPIParameter,
  OperationSpec,
  ParamsPlacement,
  RawOperation,
  RequestKind,
  Transport,
} from './types'

/** axios 扩展配置类型名 */
const CONFIG_TYPE = 'SshineAdminRequestConfig<any>'

/** 带 body 参数的方法（put/post/patch 有第三参，get/delete 没有） */
const METHODS_WITH_BODY: HttpMethod[] = ['post', 'put', 'patch']

/** SSE 关键词 */
const SSE_KEYWORDS = ['流式', 'SSE']

/** SSE 响应 Content-Type */
const SSE_CONTENT_TYPES = ['text/event-stream', 'application/stream+json', 'application/x-ndjson']

/** 下载响应 Content-Type */
const DOWNLOAD_CONTENT_TYPES = [
  'application/octet-stream',
  'application/vnd.openxmlformats-officedocument',
  'application/vnd.ms-excel',
  'application/pdf',
  'application/zip',
  'application/csv',
]

/** 是否 SSE 流式接口：靠 summary/description/operationId 关键词或响应 Content-Type 判定 */
function isSseApi(operation: OpenAPIOperation): boolean {
  const texts = [operation.summary, operation.description, operation.operationId]
  const hasKeyword = texts.some(
    (text) =>
      text !== undefined &&
      (SSE_KEYWORDS.some((kw) => text.includes(kw)) || text.includes('stream')),
  )

  const hasSseResponse = Object.values(operation.responses || {}).some((response) =>
    Object.keys(response.content || {}).some((contentType) =>
      SSE_CONTENT_TYPES.some((type) => contentType.includes(type)),
    ),
  )

  return hasKeyword || hasSseResponse
}

/** 是否下载接口：靠关键词或文件类响应 Content-Type 判定 */
function isDownloadApi(operation: OpenAPIOperation): boolean {
  const texts = [operation.summary, operation.description, operation.operationId]
  const hasKeyword = texts.some(
    (text) =>
      text !== undefined && (text.includes('下载') || /download|Export/i.test(text)),
  )

  const hasFileResponse = Object.values(operation.responses || {}).some((response) =>
    Object.keys(response.content || {}).some((contentType) =>
      DOWNLOAD_CONTENT_TYPES.some((type) => contentType.includes(type)),
    ),
  )

  return hasKeyword || hasFileResponse
}

/** 取首选的 content（multipart → json → 第一个） */
function pickContent(content: Record<string, { schema: OpenAPISchemaLike }>) {
  return content['multipart/form-data'] || content['application/json'] || Object.values(content)[0]
}

type OpenAPISchemaLike = import('./types').OpenAPISchema

/** 阶段 2 产出：方法描述 + 过程中引用到的类型 */
export interface ParseResult {
  specs: OperationSpec[]
  usedTypes: Set<string>
}

/** 批量解析，同时收集引用到的类型 */
export function parseOperations(raws: RawOperation[], registry: SchemaRegistry): ParseResult {
  const usedTypes = new Set<string>()
  const specs = raws.map((raw) => parseOperation(raw, registry, usedTypes))
  return { specs, usedTypes }
}

/** 解析单个操作 */
export function parseOperation(
  raw: RawOperation,
  registry: SchemaRegistry,
  usedTypes = new Set<string>(),
): OperationSpec {
  const { method, path, operation } = raw
  const params = operation.parameters || []
  const pathParams = params.filter((p) => p.in === 'path')
  const queryParams = params.filter((p) => p.in === 'query')

  const requestBody = operation.requestBody

  // 上传判定：query 参数含 binary，或请求体是 multipart/含文件字段
  const isUpload = queryParams.some((p) => registry.hasBinaryProperty(p.schema, p.name))
  const isFormData = isFormRequestBody(requestBody, registry) || isUpload

  // 先按固定顺序登记引用类型，再解析类型表达式，保证产物顺序稳定
  collectOperationTypes(raw, registry, isFormData, usedTypes)

  const responseType = resolveResponseType(operation, registry)
  const bodyType = resolveBodyType(operation, registry, isFormData)
  const paramsType = resolveParamsType(params, registry)

  const hasBody = bodyType !== undefined
  const hasParams = paramsType !== undefined
  // 路径参数依赖 params 插值，存在时 params 必填
  const paramsRequired = pathParams.length > 0

  const kind: RequestKind = isSseApi(operation)
    ? 'sse'
    : isDownloadApi(operation)
      ? 'download'
      : 'json'
  const transport: Transport = isFormData ? 'form' : 'request'

  return {
    name: generateOperationName(method, path),
    method,
    summary: operation.summary,
    description: operation.description,
    urlTemplate: buildUrlTemplate(path, pathParams),
    responseType,
    kind,
    transport,
    bodyPlacement: resolveBodyPlacement(method, kind, hasBody),
    paramsPlacement: resolveParamsPlacement(isFormData, hasBody, hasParams, queryParams.length > 0),
    slots: buildSlots({
      kind,
      bodyType,
      paramsType,
      hasBody,
      hasParams,
      paramsRequired,
      responseType,
    }),
  }
}

/** 不能携带请求体的方法（fetch 规范禁止，XHR 会静默丢弃） */
const METHODS_WITHOUT_BODY: HttpMethod[] = ['get', 'head']

/**
 * 决定 body 落位。
 *
 * 契约里有 requestBody 就带过去，不因"GET 应该只用 query"而丢弃；
 * 落位差异取决于两个客观条件：
 * 1. 目标方法在 http 封装里有没有独立的 body 参数位
 * 2. 该 HTTP 方法是否允许携带请求体（GET / HEAD 不允许，只能转 query）
 */
function resolveBodyPlacement(
  method: HttpMethod,
  kind: RequestKind,
  hasBody: boolean,
): BodyPlacement {
  // http.download(url, params, config) 无独立 body 位，数据一律并入 config
  if (kind === 'download') return hasBody ? 'configData' : 'none'

  // http.sse(url, data, options) 有独立 body 位，无 body 时需 null 占位
  if (kind === 'sse') return hasBody ? 'argument' : 'nullArgument'

  // GET / HEAD 无法发请求体，并入查询参数，否则生成的代码不会生效
  if (METHODS_WITHOUT_BODY.includes(method)) return hasBody ? 'query' : 'none'

  // post/put/patch 有独立 body 位，无 body 时必须传 null 占位，
  // 否则 config 会左移到 data 位置造成参数位移
  if (['post', 'put', 'patch'].includes(method)) {
    return hasBody ? 'argument' : 'nullArgument'
  }

  // get/delete/head/options 无第三参，body 走 config.data
  return hasBody ? 'configData' : 'none'
}

/**
 * 决定 params 落位。
 *
 * FormData 且契约没给 requestBody 时，参数本身就是表单字段，整体作为第二参；
 * 否则只有存在 query 参数时才写入 config.params（纯 path 参数已插值进 URL）。
 */
function resolveParamsPlacement(
  isFormData: boolean,
  hasBody: boolean,
  hasParams: boolean,
  hasQueryParams: boolean,
): ParamsPlacement {
  if (!hasParams) return 'urlOnly'
  if (isFormData && !hasBody) return 'body'
  return hasQueryParams ? 'config' : 'urlOnly'
}

interface SlotContext {
  kind: RequestKind
  bodyType?: string
  paramsType?: string
  hasBody: boolean
  hasParams: boolean
  paramsRequired: boolean
  responseType: string
}

/**
 * 构造参数槽位，顺序固定为 body → params → config/options。
 * 必填槽位必须排在可选槽位之前，符合 TS 语法要求。
 */
function buildSlots(ctx: SlotContext): ArgSlot[] {
  const { kind, bodyType, paramsType, hasBody, hasParams, paramsRequired, responseType } = ctx
  const slots: ArgSlot[] = []

  if (hasBody) {
    slots.push({ role: 'body', type: bodyType as string, required: true })
  }

  if (hasParams) {
    slots.push({ role: 'params', type: paramsType as string, required: paramsRequired })
  }

  // SSE 用回调集合收尾，其余用 axios 配置
  slots.push(
    kind === 'sse'
      ? { role: 'options', type: renderSseOptionsType(responseType), required: true }
      : { role: 'config', type: CONFIG_TYPE, required: false },
  )

  return slots
}

/** SSE 回调集合类型 */
function renderSseOptionsType(responseType: string): string {
  return [
    '{',
    `  onMessage: (data: ${responseType}) => void`,
    '  onError?: (error: unknown) => void',
    '  onDone?: () => void',
    `  config?: ${CONFIG_TYPE}`,
    '}',
  ].join('\n')
}

/**
 * 按 parameters → requestBody → responses 的顺序登记引用类型。
 * 顺序会影响阶段 4 输出 interface 的先后，必须固定。
 *
 * 注意：会被内联展开的场景（FormData、含 binary 的参数）不登记，
 * 否则会生成无人使用的 interface。
 */
function collectOperationTypes(
  raw: RawOperation,
  registry: SchemaRegistry,
  isFormData: boolean,
  usedTypes: Set<string>,
): void {
  const { operation } = raw

  operation.parameters?.forEach((param) => {
    if (param.schema && !registry.hasBinaryProperty(param.schema, param.name)) {
      registry.collect(param.schema, usedTypes)
    }
  })

  const content = operation.requestBody?.content
  if (content && !isFormData) {
    Object.values(content).forEach(({ schema }) => registry.collect(schema, usedTypes))
  }

  // 收集全部响应（不只成功响应），错误码引用的类型同样需要
  Object.values(operation.responses || {}).forEach((response) => {
    Object.values(response.content || {}).forEach(({ schema }) =>
      registry.collect(schema, usedTypes),
    )
  })
}

/** 请求体类型；无请求体时返回 undefined */
function resolveBodyType(
  operation: OpenAPIOperation,
  registry: SchemaRegistry,
  isFormData: boolean,
): string | undefined {
  const content = operation.requestBody?.content
  if (!content) return undefined

  const schema = pickContent(content)?.schema

  // FormData 会被内联展开为 File 字段结构
  return isFormData
    ? registry.resolveUploadType(schema, 'RequestBody')
    : registry.resolveType(schema, 'RequestBody')
}

/** path + query 合并的参数类型；无参数时返回 undefined */
function resolveParamsType(
  params: OpenAPIParameter[],
  registry: SchemaRegistry,
): string | undefined {
  if (params.length === 0) return undefined

  // 单参数且为 $ref 时直接复用引用类型（不含 binary 时）
  if (params.length === 1 && params[0].schema?.$ref) {
    const hasBinary = registry.hasBinaryProperty(params[0].schema, params[0].name)
    if (!hasBinary) {
      return registry.resolveType(params[0].schema, params[0].name)
    }
  }

  const fields = params.map((param) => {
    const optional = !param.required
    const paramName = toCamelCase(param.name)
    const hasBinary = registry.hasBinaryProperty(param.schema, param.name)
    const type = hasBinary
      ? registry.resolveUploadType(param.schema, paramName)
      : registry.resolveType(param.schema, paramName)
    return `  ${paramName}${optional ? '?' : ''}: ${type}`
  })

  return `{\n${fields.join(',\n')}\n}`
}

/** 响应类型，取 200/201/首个响应 */
function resolveResponseType(operation: OpenAPIOperation, registry: SchemaRegistry): string {
  const responses = operation.responses || {}
  const success = responses['200'] || responses['201'] || Object.values(responses)[0]
  const content = success?.content

  if (!content) return 'any'

  return registry.resolveType(pickContent(content)?.schema, 'Response')
}

/** 请求体是否为 multipart/form-data 或含 binary 字段 */
function isFormRequestBody(
  requestBody: OpenAPIOperation['requestBody'],
  registry: SchemaRegistry,
): boolean {
  const content = requestBody?.content
  if (!content) return false

  return registry.hasBinaryProperty(pickContent(content)?.schema)
}

/** 该方法调用是否携带 body 参数位 */
export function hasBodyArgument(method: HttpMethod): boolean {
  return METHODS_WITH_BODY.includes(method)
}
