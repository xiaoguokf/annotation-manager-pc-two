/**
 * 阶段 3：实体类（类型）处理
 *
 * 职责：
 * - OpenAPI Schema → TypeScript 类型表达式（含注释、枚举、雪花 ID、数组元素推断）
 * - 识别 binary/file 字段，供上传接口生成 File 类型
 * - 收集被引用到的类型，拓扑排序后渲染成 interface 定义
 *
 * 说明：本阶段不感知 HTTP 方法与 URL，只处理"类型"。
 */

import type { OpenAPISchema } from './types'

/** 无语义的元素名，出现时按 ID 列表推断，保证 int64 雪花 ID 生成 string */
const GENERIC_ITEM_NAMES = ['requestbody', 'response', 'request', 'data', 'result']

export class SchemaRegistry {
  constructor(private readonly schemas: Record<string, OpenAPISchema> = {}) {}

  /** 按类型名取 schema */
  getSchema(name: string): OpenAPISchema | undefined {
    return this.schemas[name]
  }

  /** 解析 $ref 指向的 schema */
  private resolveRef(ref: string): OpenAPISchema | undefined {
    const name = ref.replace('#/components/schemas/', '')
    return this.schemas[name]
  }

  /** 推断数组元素名：顶层数组没有语义化名字时按 ID 处理 */
  private inferItemName(name: string): string {
    if (GENERIC_ITEM_NAMES.includes(name.toLowerCase())) return 'id'
    return name.endsWith('s') ? name.slice(0, -1) : name
  }

  /** 雪花 ID 判定：id 结尾 + int64/long 格式 */
  private isSnowflakeId(fieldName: string, format?: string): boolean {
    return /id$/i.test(fieldName) && (format === 'int64' || format === 'long')
  }

  /**
   * 递归检查是否包含 binary（文件）字段，用于识别上传接口。
   * $ref 会被展开解析，visitedRefs 防止循环引用。
   */
  hasBinaryProperty(
    schema: OpenAPISchema | undefined,
    propertyName = '',
    visitedRefs = new Set<string>(),
  ): boolean {
    if (!schema) return false

    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      if (visitedRefs.has(refName)) return false
      visitedRefs.add(refName)

      const refSchema = this.resolveRef(schema.$ref)
      return refSchema ? this.hasBinaryProperty(refSchema, propertyName, visitedRefs) : false
    }

    if (schema.format === 'binary') return true

    // 字段名以 file / upload 结尾也视为文件
    if (/file$|upload$/i.test(propertyName)) return true

    if (schema.type === 'object' && schema.properties) {
      return Object.entries(schema.properties).some(([key, prop]) =>
        this.hasBinaryProperty(prop, key, visitedRefs),
      )
    }

    if (schema.type === 'array' && schema.items) {
      return this.hasBinaryProperty(schema.items, propertyName, visitedRefs)
    }

    return false
  }

  /**
   * Schema → TypeScript 类型表达式。
   * 传入 usedTypes 时顺带登记引用到的类型（含 $ref 内部引用），
   * 供阶段 4 生成 interface 定义。
   */
  resolveType(
    schema: OpenAPISchema | undefined,
    name: string,
    usedTypes?: Set<string>,
  ): string {
    if (schema && usedTypes) this.collect(schema, usedTypes)

    if (!schema) return 'any'

    if (schema.$ref) {
      return schema.$ref.replace('#/components/schemas/', '')
    }

    switch (schema.type) {
      case 'string':
        return this.resolveStringType(schema, name)

      case 'number':
      case 'integer':
        // 雪花 ID 用 string 承载，避免 JS number 精度丢失
        return this.isSnowflakeId(name, schema.format) ? 'string' : 'number'

      case 'boolean':
        return 'boolean'

      case 'array':
        return `${this.resolveType(schema.items, this.inferItemName(name))}[]`

      case 'object':
        return this.resolveObjectType(schema, (prop, key) =>
          this.resolveType(prop, key),
        )

      default:
        return 'any'
    }
  }

  /**
   * 上传接口专用：file/upload 字段解析为 File，id 字段解析为 string。
   * 与 resolveType 的区别在于字符串字段的处理策略。
   */
  resolveUploadType(
    schema: OpenAPISchema | undefined,
    name: string,
    usedTypes?: Set<string>,
  ): string {
    if (schema && usedTypes) this.collect(schema, usedTypes)

    if (!schema) return 'any'

    // 内联展开 $ref，确保 File 字段能被识别
    if (schema.$ref) {
      const refSchema = this.resolveRef(schema.$ref)
      return refSchema ? this.resolveUploadType(refSchema, name, usedTypes) : name
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) return this.renderEnum(schema.enum)
        // ID 优先于 file 判定，避免 xxxId 被误判为文件
        if (/id$/i.test(name)) return 'string'
        if (schema.format === 'binary' || /file$|upload$/i.test(name)) return 'File'
        return 'string'

      case 'number':
      case 'integer':
        return this.isSnowflakeId(name, schema.format) ? 'string' : 'number'

      case 'boolean':
        return 'boolean'

      case 'array':
        return `${this.resolveUploadType(schema.items, this.inferItemName(name))}[]`

      case 'object':
        return this.resolveObjectType(schema, (prop, key) => {
          const isFile =
            /file$|upload$/i.test(key) || prop.format === 'binary'
          return isFile ? 'File' : this.resolveUploadType(prop, key)
        })

      default:
        return 'any'
    }
  }

  private resolveStringType(schema: OpenAPISchema, name: string): string {
    if (schema.enum) return this.renderEnum(schema.enum)
    // 上传场景的 file 字段由 resolveUploadType 处理
    if (schema.format === 'binary' && /file$|upload$/i.test(name)) return 'File'
    return 'string'
  }

  private renderEnum(values: unknown[]): string {
    return values.map((v) => `'${String(v)}'`).join(' | ')
  }

  /** 对象类型：统一处理注释、可选性与属性拼接 */
  private resolveObjectType(
    schema: OpenAPISchema,
    resolveProp: (prop: OpenAPISchema, key: string) => string,
  ): string {
    if (!schema.properties) return 'Record<string, any>'

    const properties = Object.entries(schema.properties).map(([key, prop]) => {
      const optional = !schema.required?.includes(key)
      const comment = prop.description ? `  /* ${prop.description} */\n` : ''
      return `${comment}  ${key}${optional ? '?' : ''}: ${resolveProp(prop, key)}`
    })

    return `{\n${properties.join('\n')}\n}`
  }

  /** 递归收集 schema 引用到的所有类型名 */
  collect(schema: OpenAPISchema | undefined, usedTypes: Set<string>): void {
    if (!schema) return

    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      if (!usedTypes.has(refName)) {
        usedTypes.add(refName)
        this.collect(this.resolveRef(schema.$ref), usedTypes)
      }
    }

    if (schema.type === 'array' && schema.items) {
      this.collect(schema.items, usedTypes)
    }

    if (schema.type === 'object' && schema.properties) {
      Object.values(schema.properties).forEach((prop) => this.collect(prop, usedTypes))
    }
  }

  /** 渲染 interface 定义，按依赖顺序输出（被依赖的在前） */
  renderDefinitions(usedTypes: Set<string>): string {
    if (usedTypes.size === 0) return ''

    const sorted = this.topologicalSort(Array.from(usedTypes))
    return sorted
      .filter((name) => this.schemas[name])
      .map((name) => `export interface ${name} ${this.resolveType(this.schemas[name], name)}\n\n`)
      .join('')
  }

  /** 拓扑排序，避免类型定义出现"使用前未声明" */
  private topologicalSort(types: string[]): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (type: string) => {
      if (visited.has(type)) return
      visited.add(type)

      const schema = this.schemas[type]
      if (schema) {
        this.extractDependencies(schema).forEach((dep) => {
          if (types.includes(dep)) visit(dep)
        })
      }

      result.push(type)
    }

    types.forEach(visit)
    return result
  }

  /** 提取 schema 直接引用的类型名 */
  private extractDependencies(schema: OpenAPISchema): string[] {
    const deps: string[] = []

    const walk = (s: OpenAPISchema) => {
      if (s.$ref) deps.push(s.$ref.replace('#/components/schemas/', ''))
      if (s.type === 'array' && s.items) walk(s.items)
      if (s.type === 'object' && s.properties) Object.values(s.properties).forEach(walk)
    }

    walk(schema)
    return deps
  }
}
