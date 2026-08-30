/**
 * 阶段 4：controller.ts 模板生成
 *
 * 职责：把 OperationSpec 渲染成文件内容。
 * 本模块不做任何业务判定（形态、参数、类型均已由阶段 2/3 决定），
 * 只负责：函数签名拼接 + 调用表达式拼接 + 注释与 import。
 */

import { SchemaRegistry } from './schema'
import { slotType } from './types'
import type { ArgSlot, OperationSpec } from './types'

const HTTP_IMPORT = `import http from '@/utils/http'\n`
const CONFIG_IMPORT = `import type { SshineAdminRequestConfig } from '@/utils/http'\n`

/** 渲染单个 controller 模块文件 */
export function renderControllerModule(
  specs: OperationSpec[],
  usedTypes: Set<string>,
  registry: SchemaRegistry,
): string {
  return [
    HTTP_IMPORT,
    CONFIG_IMPORT,
    '\n',
    registry.renderDefinitions(usedTypes),
    ...specs.map(renderOperation),
  ].join('')
}

/** 渲染单个 API 方法：JSDoc + 签名 + 调用体 */
function renderOperation(spec: OperationSpec): string {
  return [renderDoc(spec), renderSignature(spec), renderBody(spec)].join('')
}

function renderDoc(spec: OperationSpec): string {
  const lines = ['/**']
  if (spec.summary) lines.push(` * ${spec.summary}`)
  if (spec.description) lines.push(` * ${spec.description}`)
  lines.push(' * @param config 可选配置，包含 timeout、loading 等选项')
  lines.push(` * @returns Promise<${spec.responseType}>`)
  lines.push(' */')
  return `${lines.join('\n')}\n`
}

/** 函数签名：由槽位按顺序拼接 */
function renderSignature(spec: OperationSpec): string {
  const args = spec.slots.map(renderArg).join(', ')
  return `export const ${spec.name} = (${args}) => {\n`
}

function renderArg(slot: ArgSlot): string {
  const optionalMark = slot.required ? '' : '?'

  switch (slot.role) {
    case 'body':
      return `data: ${slot.type}`
    case 'params':
      return `params${optionalMark}: ${slot.type}`
    case 'config':
      return `config${optionalMark}: ${slot.type}`
    case 'options':
      return `options: ${slot.type}`
  }
}

/** 调用体：} 闭合与空行 */
function renderBody(spec: OperationSpec): string {
  return `  return ${renderCall(spec)}\n}\n\n`
}

/**
 * 生成调用表达式。
 *
 * 本函数不判断 HTTP 方法、也不判断 REST 语义 —— 参数该放哪
 * 已由阶段 2 固化在 spec.bodyPlacement / spec.paramsPlacement 中，
 * 这里只按落位描述把实参拼出来。
 */
function renderCall(spec: OperationSpec): string {
  switch (spec.kind) {
    case 'sse':
      return renderSseCall(spec)
    case 'download':
      return renderDownloadCall(spec)
    default:
      return renderJsonCall(spec)
  }
}

/**
 * SSE：http.sse<R, D>(url, data, options)
 *
 * sse 是多个 HTTP 方法共用的封装，因此必须显式声明 method。
 * GET / HEAD 无法携带请求体，body 会被并入 config.params。
 */
function renderSseCall(spec: OperationSpec): string {
  const bodyType = slotType(spec, 'body') ?? 'any'
  const data = spec.bodyPlacement === 'argument' ? 'data' : 'null'
  const args = [spec.urlTemplate, data]
  args.push(renderSseOptions(spec))

  return `http.sse<${spec.responseType}, ${bodyType}>(${args.join(', ')})`
}

/**
 * 渲染 SSE 的 options 实参：method + 合并后的 config。
 * body 与 params 都要进 config.params 时合并两者。
 */
function renderSseOptions(spec: OperationSpec): string {
  const configMembers: string[] = []

  if (spec.bodyPlacement === 'query') configMembers.push('...data')
  if (spec.paramsPlacement === 'config') configMembers.push('...params')

  if (configMembers.length === 0) {
    return `{ method: '${spec.method.toUpperCase()}', ...options }`
  }

  const mergedParams = `{ ${configMembers.join(', ')} }`
  return (
    `{ method: '${spec.method.toUpperCase()}', ...options, ` +
    `config: options.config ? { params: ${mergedParams}, ...options.config } : { params: ${mergedParams} } }`
  )
}

/** 下载：http.download(url, config)，body 与 params 均落在 config */
function renderDownloadCall(spec: OperationSpec): string {
  return `http.download(${spec.urlTemplate}, ${renderConfigArg(spec)})`
}

/** 普通 JSON / FormData */
function renderJsonCall(spec: OperationSpec): string {
  const { method, transport, responseType, urlTemplate } = spec
  const args = [urlTemplate]

  if (transport === 'form') {
    // 表单数据落在第二参：有 body 用 data，否则参数整体作为表单字段
    args.push(spec.paramsPlacement === 'body' ? 'params' : (slotType(spec, 'body') ? 'data' : 'null'))
  } else if (spec.bodyPlacement === 'argument' || spec.bodyPlacement === 'nullArgument') {
    // 无 body 时也必须传 null 占位，避免 config 左移到 data 位置
    args.push(spec.bodyPlacement === 'argument' ? 'data' : 'null')
  }

  args.push(renderConfigArg(spec))

  const methodName = transport === 'form' ? `${method}Form` : method
  return `http.${methodName}<${responseType}>(${args.join(', ')})`
}

/**
 * 渲染最后的 config 实参。
 * 组成完全由落位描述决定：
 * - bodyPlacement === 'configData' 时把 data 写进 config.data
 * - paramsPlacement === 'config' 时把 params 写进 config.params
 */
function renderConfigArg(spec: OperationSpec): string {
  const members: string[] = []

  // download 是多个 HTTP 方法共用的封装，需显式声明方法
  if (spec.kind === 'download') {
    members.push(`method: '${spec.method.toUpperCase()}'`)
  }

  if (spec.bodyPlacement === 'configData') {
    members.push('data')
  } else if (spec.bodyPlacement === 'query') {
    members.push(...renderQueryMember(spec))
  }

  if (spec.paramsPlacement === 'config') members.push('params')

  // 无需合并任何成员时直接传 config，避免生成无意义的 { ...config }
  if (members.length === 0) return 'config'

  const literal = `{ ${members.join(', ')}, ...config }`

  // params 可选且 body 占着独立参数位时，未传参就不该覆盖 config
  const paramsOptional = spec.slots.find((s) => s.role === 'params')?.required === false
  if (spec.paramsPlacement === 'config' && paramsOptional && spec.bodyPlacement === 'argument') {
    return `params ? ${literal} : config`
  }

  return literal
}

/**
 * 渲染 body 数据并入查询参数的成员。
 * 仅 body 时直接作为 params；body 与 params 并存时合并两者。
 */
function renderQueryMember(spec: OperationSpec): string[] {
  if (spec.paramsPlacement !== 'config') return ['params: data']
  return ['params: { ...data, ...params }']
}
