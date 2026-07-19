import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { config } from './config'

// OpenAPI 3.0 规范类型定义
interface OpenAPISchema {
  type: string
  properties?: Record<string, any>
  required?: string[]
  items?: any
  $ref?: string
  enum?: any[]
  format?: string
  description?: string
}

interface OpenAPIParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required?: boolean
  schema?: OpenAPISchema
  description?: string
}

interface OpenAPIRequestBody {
  description?: string
  content?: Record<string, { schema: OpenAPISchema }>
  required?: boolean
}

interface OpenAPIResponse {
  description: string
  content?: Record<string, { schema: OpenAPISchema }>
}

interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses: Record<string, OpenAPIResponse>
  deprecated?: boolean
}

interface OpenAPIPathItem {
  get?: OpenAPIOperation
  post?: OpenAPIOperation
  put?: OpenAPIOperation
  delete?: OpenAPIOperation
  patch?: OpenAPIOperation
  head?: OpenAPIOperation
  options?: OpenAPIOperation
}

interface OpenAPIDoc {
  openapi: string
  info: { title: string; version: string }
  paths: Record<string, OpenAPIPathItem>
  components?: {
    schemas?: Record<string, OpenAPISchema>
  }
}

class ApiGenerator {
  private openApiDoc: OpenAPIDoc | null = null
  private apiDir = path.join(process.cwd(), 'src/api/gen')

  // 检查 URL 是否应该被过滤
  private shouldFilterUrl(url: string): boolean {
    const { exclude, include } = config.urlFilters

    // 检查是否在排除列表中
    for (const pattern of exclude) {
      if (this.matchPattern(url, pattern)) {
        return true
      }
    }

    // 如果设置了包含列表，检查是否在包含列表中
    if (include && include.length > 0) {
      let isIncluded = false
      for (const pattern of include) {
        if (this.matchPattern(url, pattern)) {
          isIncluded = true
          break
        }
      }
      return !isIncluded
    }

    return false
  }

  // 简单的模式匹配（支持 * 通配符）
  private matchPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.')

    const regex = new RegExp(`^${regexPattern}$`)
    return regex.test(str)
  }

  // 获取自定义方法配置
  private getCustomMethodConfig(url: string, method: string) {
    const key = `${method.toLowerCase()} ${url}`
    return config.customMethods[url] || config.customMethods[key]
  }

  async fetchOpenApiSpec(baseUrl: string = 'http://localhost:5173'): Promise<void> {
    try {
      const response = await axios.get(`${baseUrl}/api/v3/api-docs`)
      this.openApiDoc = response.data
      console.log('✅ OpenAPI 规范获取成功')
    } catch (error) {
      console.error('❌ 获取 OpenAPI 规范失败:', error)
      console.log('💡 请确保后端服务已启动，且可以通过 /api/v3/api-docs 访问')
      throw error
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/\s/g, '')
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l, i) => (i === 0 ? l.toLowerCase() : l.toUpperCase()))
      .replace(/\s/g, '')
  }

  private generateTypeScriptType(schema: OpenAPISchema, name: string): string {
    if (!schema) return 'any'

    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      return refName
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map((v: string) => `'${v}'`).join(' | ')
        }
        return 'string'
      case 'number':
      case 'integer':
        // 检查是否为雪花ID（id或Id结尾的字段）
        if (this.isSnowflakeIdField(name, schema.format)) {
          return 'string'
        }
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array':
        // 对于数组类型，从字段名中推断是否是 ID 数组（如 ids, userIds）
        const itemName = name.endsWith('s') ? name.slice(0, -1) : name
        const itemType = this.generateTypeScriptType(schema.items || {}, itemName)
        return `${itemType}[]`
      case 'object':
        if (!schema.properties) return 'Record<string, any>'

        const properties = Object.entries(schema.properties).map(([key, prop]) => {
          const optional = !schema.required?.includes(key)
          const propType = this.generateTypeScriptType(prop, key)
          const comment = prop.description ? `  /* ${prop.description} */\n` : ''
          return `${comment}  ${key}${optional ? '?' : ''}: ${propType}`
        })

        return `{\n${properties.join('\n')}\n}`
      default:
        return 'any'
    }
  }

  // 检查是否为雪花ID字段
  private isSnowflakeIdField(fieldName: string, format?: string): boolean {
    // 检查字段名是否以 id 或 Id 结尾
    const isIdField = /id$/i.test(fieldName)
    // 检查格式是否为 int64
    const isInt64 = format === 'int64' || format === 'long'
    return isIdField && isInt64
  }

  private generateSchemaTypes(): string {
    if (!this.openApiDoc?.components?.schemas) return ''

    const schemas = this.openApiDoc.components.schemas
    let types = ''

    Object.entries(schemas).forEach(([name, schema]) => {
      const typeDefinition = this.generateTypeScriptType(schema, name)
      types += `export interface ${name} ${typeDefinition}\n\n`
    })

    return types
  }

  private generateOperationName(
    method: string,
    path: string,
    _operation?: OpenAPIOperation,
  ): string {
    const methodCamel = this.toCamelCase(method)

    // 优先使用路径生成名称，而不是 operationId
    const pathParts = path.split('/').filter((part) => part && !part.startsWith('{'))

    if (pathParts.length === 0) return `${methodCamel}Api`

    // 将所有路径部分转换为 PascalCase 并拼接
    const pathName = pathParts.map((part) => this.toPascalCase(part)).join('')
    return `${methodCamel}${pathName}Api`
  }

  private generateParameterType(parameters: OpenAPIParameter[]): string {
    if (!parameters || parameters.length === 0) return ''

    const filteredParams = parameters.filter((param) => param.in === 'query' || param.in === 'path')

    // 如果只有一个参数且是 $ref 引用，直接返回引用的类型
    if (filteredParams.length === 1 && filteredParams[0].schema?.$ref) {
      const refName = filteredParams[0].schema.$ref.replace('#/components/schemas/', '')
      const refSchema = this.openApiDoc?.components?.schemas?.[refName]
      // 检查引用的 schema 是否包含文件字段
      if (refSchema && this.hasBinaryProperty(refSchema)) {
        // 如果包含文件字段，展开类型以便正确识别 File 类型
        return this.generateTypeScriptTypeForUpload(refSchema, refName)
      }
      return refName
    }

    const params = filteredParams
      .map((param) => {
        const optional = !param.required
        const paramName = this.toCamelCase(param.name)
        // 检查参数是否包含文件字段
        const hasBinary = this.hasBinaryProperty(param.schema || { type: 'object' }, param.name)
        const paramType = hasBinary
          ? this.generateTypeScriptTypeForUpload(param.schema || { type: 'object' }, paramName)
          : this.generateTypeScriptType(param.schema || { type: 'object' }, paramName)
        return `  ${paramName}${optional ? '?' : ''}: ${paramType}`
      })

    return params.length > 0 ? `{\n${params.join(',\n')}\n}` : ''
  }

  // 检查是否为上传接口
  private isUploadApi(operation: OpenAPIOperation): boolean {
    // 检查 query 参数中是否有 binary 格式
    return operation.parameters?.some(param =>
      param.in === 'query' &&
      this.hasBinaryProperty(param.schema || { type: 'string' }, param.name)
    ) || false
  }

  private isFormDataRequest(requestBody?: OpenAPIRequestBody): boolean {
    if (!requestBody?.content) return false

    const content = requestBody.content['multipart/form-data'] ||
      requestBody.content['application/json'] ||
      Object.values(requestBody.content)[0]

    if (!content?.schema) return false

    const schema = content.schema

    // 递归检查 schema 是否包含 binary 格式的属性
    return this.hasBinaryProperty(schema)
  }

  // 递归检查 schema 是否包含 binary 格式的属性
  private hasBinaryProperty(schema: OpenAPISchema, propertyName: string = '', visitedRefs: Set<string> = new Set()): boolean {
    if (!schema) return false

    // 如果是 $ref 引用,解析引用的类型
    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      // 检查是否已经访问过这个引用,避免循环引用
      if (visitedRefs.has(refName)) {
        return false
      }
      visitedRefs.add(refName)

      const refSchema = this.openApiDoc?.components?.schemas?.[refName]
      if (refSchema) {
        return this.hasBinaryProperty(refSchema, propertyName, visitedRefs)
      }
      return false
    }

    // 检查当前节点是否是 binary
    if (schema.format === 'binary' || (schema.type === 'string' && schema.format === 'binary')) {
      return true
    }

    // 检查属性名是否以 file 或 upload 结尾
    if (propertyName &&
        (propertyName.toLowerCase().endsWith('file') || propertyName.toLowerCase().endsWith('upload'))) {
      return true
    }

    // 检查当前对象是否有 binary 格式的属性
    if (schema.type === 'object' && schema.properties) {
      return Object.entries(schema.properties).some(([key, prop]) =>
        prop.format === 'binary' ||
        (prop.type === 'string' && prop.format === 'binary') ||
        this.hasBinaryProperty(prop, key, visitedRefs)
      )
    }

    // 检查数组类型
    if (schema.type === 'array' && schema.items) {
      return this.hasBinaryProperty(schema.items, propertyName, visitedRefs)
    }

    return false
  }

  private generateRequestBodyType(requestBody?: OpenAPIRequestBody, operation?: OpenAPIOperation): string {
    if (!requestBody?.content) return 'any'

    // 检查是否为上传接口
    const isUpload = operation ? this.isUploadApi(operation) : false

    // 检查是否为 FormData
    if (this.isFormDataRequest(requestBody) || isUpload) {
      // 对于 FormData，生成对应的对象类型，包含 File 类型
      const content = requestBody.content['multipart/form-data'] ||
        requestBody.content['application/json'] ||
        Object.values(requestBody.content)[0]
      const schema = content.schema || { type: 'object' }

      // 对于 $ref 引用，也使用 generateTypeScriptTypeForUpload 来处理
      if (schema.$ref) {
        const refName = schema.$ref.replace('#/components/schemas/', '')
        const refSchema = this.openApiDoc?.components?.schemas?.[refName]
        if (refSchema) {
          return this.generateTypeScriptTypeForUpload(refSchema, 'RequestBody')
        }
        return refName
      }

      return this.generateTypeScriptTypeForUpload(schema, 'RequestBody')
    }

    const content = requestBody.content['application/json'] || Object.values(requestBody.content)[0]
    const schema = content.schema || { type: 'object' }
    return this.generateTypeScriptType(schema, 'RequestBody')
  }

  // 专门为上传接口生成类型，将 file 相关字段识别为 File 类型
  private generateTypeScriptTypeForUpload(schema: OpenAPISchema, name: string): string {
    if (!schema) return 'any'

    // 如果是 $ref 引用，递归解析并展开为内联对象类型（而不是返回引用名）
    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      const refSchema = this.openApiDoc?.components?.schemas?.[refName]
      if (refSchema) {
        // 递归解析引用类型，确保 File 字段能被正确识别
        return this.generateTypeScriptTypeForUpload(refSchema, name)
      }
      return refName
    }

    switch (schema.type) {
      case 'string':
        if (schema.enum) {
          return schema.enum.map((v: string) => `'${v}'`).join(' | ')
        }
        // 优先检查是否以 Id 结尾 - 如果是 ID 类字段,返回 string
        if (name.toLowerCase().endsWith('id')) {
          return 'string'
        }
        // 检查是否为文件字段(以 file 或 upload 结尾)
        if (schema.format === 'binary' ||
          name.toLowerCase().endsWith('file') ||
          name.toLowerCase().endsWith('upload')) {
          return 'File'
        }
        return 'string'
      case 'number':
      case 'integer':
        // 检查是否为雪花ID（id或Id结尾的字段）
        if (this.isSnowflakeIdField(name, schema.format)) {
          return 'string'
        }
        return 'number'
      case 'boolean':
        return 'boolean'
      case 'array':
        // 对于数组类型，从字段名中推断是否是 ID 数组（如 ids, userIds）
        const itemName = name.endsWith('s') ? name.slice(0, -1) : name
        const itemType = this.generateTypeScriptTypeForUpload(schema.items || {}, itemName)
        return `${itemType}[]`
      case 'object':
        if (!schema.properties) return 'Record<string, any>'

        const properties = Object.entries(schema.properties).map(([key, prop]) => {
          const optional = !schema.required?.includes(key)
          // 检查属性名是否以 file 或 upload 结尾,或者 format 是 binary
          const isFileField =
            key.toLowerCase().endsWith('file') ||
            key.toLowerCase().endsWith('upload') ||
            prop.format === 'binary'

          let propType: string
          if (isFileField) {
            propType = 'File'
          } else {
            propType = this.generateTypeScriptTypeForUpload(prop, key)
          }

          const comment = prop.description ? `  /* ${prop.description} */\n` : ''
          return `${comment}  ${key}${optional ? '?' : ''}: ${propType}`
        })

        return `{\n${properties.join('\n')}\n}`
      default:
        return 'any'
    }
  }

  private generateResponseType(responses: Record<string, OpenAPIResponse>): string {
    const successResponse = responses['200'] || responses['201'] || Object.values(responses)[0]
    if (!successResponse?.content) return 'any'

    const content =
      successResponse.content['application/json'] || Object.values(successResponse.content)[0]
    return this.generateTypeScriptType(content.schema, 'Response')
  }

  // 收集操作中使用的所有类型
  private collectUsedTypes(operations: Array<{
    method: string
    path: string
    operation: OpenAPIOperation
  }>): Set<string> {
    const usedTypes = new Set<string>()

    operations.forEach(({ operation }) => {
      // 收集参数类型
      if (operation.parameters) {
        operation.parameters.forEach(param => {
          if (param.schema) {
            // 如果参数包含 binary 字段，不收集引用的类型（会被内联展开）
            if (!this.hasBinaryProperty(param.schema, param.name)) {
              this.collectTypesFromSchema(param.schema, usedTypes)
            }
          }
        })
      }

      // 收集请求体类型
      if (operation.requestBody?.content) {
        Object.values(operation.requestBody.content).forEach(content => {
          if (content.schema) {
            // 如果请求体包含 binary 字段，不收集引用的类型（会被内联展开）
            if (!this.isFormDataRequest(operation.requestBody)) {
              this.collectTypesFromSchema(content.schema, usedTypes)
            }
          }
        })
      }

      // 收集响应类型
      if (operation.responses) {
        Object.values(operation.responses).forEach(response => {
          if (response.content) {
            Object.values(response.content).forEach(content => {
              if (content.schema) {
                this.collectTypesFromSchema(content.schema, usedTypes)
              }
            })
          }
        })
      }
    })

    return usedTypes
  }

  // 递归收集 schema 中的所有类型引用
  private collectTypesFromSchema(schema: OpenAPISchema, usedTypes: Set<string>): void {
    if (!schema) return

    if (schema.$ref) {
      const refName = schema.$ref.replace('#/components/schemas/', '')
      if (!usedTypes.has(refName)) {
        usedTypes.add(refName)
        // 递归收集被引用类型的内部类型
        const schemaType = this.openApiDoc?.components?.schemas?.[refName]
        if (schemaType) {
          this.collectTypesFromSchema(schemaType, usedTypes)
        }
      }
    }

    if (schema.type === 'array' && schema.items) {
      this.collectTypesFromSchema(schema.items, usedTypes)
    }

    if (schema.type === 'object' && schema.properties) {
      Object.values(schema.properties).forEach(prop => {
        this.collectTypesFromSchema(prop, usedTypes)
      })
    }
  }

  // 只生成被使用的类型
  private generateUsedSchemaTypes(usedTypes: Set<string>): string {
    if (!this.openApiDoc?.components?.schemas || usedTypes.size === 0) return ''

    const schemas = this.openApiDoc.components.schemas
    let types = ''

    // 按依赖顺序排序类型定义
    const sortedTypes = this.topologicalSortTypes(Array.from(usedTypes), schemas)

    sortedTypes.forEach(name => {
      if (schemas[name]) {
        const typeDefinition = this.generateTypeScriptType(schemas[name], name)
        types += `export interface ${name} ${typeDefinition}\n\n`
      }
    })

    return types
  }

  // 拓扑排序类型定义，确保被依赖的类型先定义
  private topologicalSortTypes(types: string[], schemas: Record<string, OpenAPISchema>): string[] {
    const visited = new Set<string>()
    const result: string[] = []

    const visit = (type: string) => {
      if (visited.has(type)) return
      visited.add(type)

      const schema = schemas[type]
      if (schema) {
        // 先访问依赖的类型
        const dependencies = this.extractDependencies(schema)
        dependencies.forEach(dep => {
          if (types.includes(dep)) {
            visit(dep)
          }
        })
      }

      result.push(type)
    }

    types.forEach(visit)
    return result
  }

  // 提取 schema 的依赖类型
  private extractDependencies(schema: OpenAPISchema): string[] {
    const deps: string[] = []

    const extractFromSchema = (s: OpenAPISchema) => {
      if (s.$ref) {
        const refName = s.$ref.replace('#/components/schemas/', '')
        deps.push(refName)
      }

      if (s.type === 'array' && s.items) {
        extractFromSchema(s.items)
      }

      if (s.type === 'object' && s.properties) {
        Object.values(s.properties).forEach(prop => extractFromSchema(prop))
      }
    }

    extractFromSchema(schema)
    return deps
  }

  // 检查是否为 SSE 流式接口
  private isSseApi(operation: OpenAPIOperation): boolean {
    // 检查描述中是否包含 SSE 关键词
    const hasSseKeyword =
      (operation.summary && operation.summary.includes('流式')) ||
      (operation.description && operation.description.includes('流式')) ||
      (operation.summary && operation.summary.includes('SSE')) ||
      (operation.description && operation.description.includes('SSE')) ||
      (operation.operationId && operation.operationId.includes('stream'))

    // 检查响应类型是否为 text/event-stream
    const hasSseResponse = Object.values(operation.responses || {}).some(response => {
      if (!response.content) return false
      return Object.keys(response.content).some(contentType =>
        contentType.includes('text/event-stream') ||
        contentType.includes('application/stream+json') ||
        contentType.includes('application/x-ndjson')
      )
    })

    return hasSseKeyword || hasSseResponse
  }

  // 检查是否为下载接口
  private isDownloadApi(operation: OpenAPIOperation): boolean {
    // 检查描述中是否包含"下载"关键词
    const hasDownloadKeyword =
      (operation.summary && operation.summary.includes('下载')) ||
      (operation.description && operation.description.includes('下载')) ||
      (operation.operationId && operation.operationId.includes('download')) ||
      (operation.operationId && operation.operationId.includes('Export'))

    // 检查响应类型是否为文件流
    const hasFileResponse = Object.values(operation.responses || {}).some(response => {
      if (!response.content) return false
      return Object.keys(response.content).some(contentType =>
        contentType.includes('application/octet-stream') ||
        contentType.includes('application/vnd.openxmlformats-officedocument') ||
        contentType.includes('application/vnd.ms-excel') ||
        contentType.includes('application/pdf') ||
        contentType.includes('application/zip') ||
        contentType.includes('application/csv')
      )
    })

    return hasDownloadKeyword || hasFileResponse
  }

  private generateApiFile(
    _tag: string,
    operations: Array<{
      method: string
      path: string
      operation: OpenAPIOperation
    }>,
  ): string {
    let content = `import http from '@/utils/http'\n`
    content += `import type { ShortClipRequestConfig } from '@/utils/http'\n\n`

    // 收集当前文件使用的类型
    const usedTypes = this.collectUsedTypes(operations)

    // 只添加被使用的类型定义
    content += this.generateUsedSchemaTypes(usedTypes)

    // 生成 API 函数
    operations.forEach(({ method, path, operation }) => {
      // 检查自定义方法名
      const customConfig = this.getCustomMethodConfig(path, method)
      const operationName =
        customConfig?.name || this.generateOperationName(method, path, operation)
      const parameterType = this.generateParameterType(operation.parameters || [])
      const requestBodyType = this.generateRequestBodyType(operation.requestBody, operation)
      const responseType = this.generateResponseType(operation.responses)

      // 添加注释
      content += `/**\n`
      if (operation.summary) content += ` * ${operation.summary}\n`
      if (operation.description) content += ` * ${operation.description}\n`
      content += ` * @param config 可选配置，包含 timeout、loading 等选项\n`
      content += ` * @returns Promise<${responseType}>\n`
      content += ` */\n`

      // 检查是否为下载接口
      const isDownloadApi = this.isDownloadApi(operation)
      // 检查是否为上传接口
      const isUploadApi = this.isUploadApi(operation) || this.isFormDataRequest(operation.requestBody)
      // 检查是否有路径参数和查询参数
      const pathParams = operation.parameters?.filter(p => p.in === 'path') || []
      const queryParams = operation.parameters?.filter(p => p.in === 'query') || []
      const hasPathParams = pathParams.length > 0
      const hasQueryParams = queryParams.length > 0

      // 处理路径参数，生成 URL 模板
      let urlTemplate = `'${path}'`
      if (hasPathParams) {
        const paramNames = pathParams.map(p => p.name)
        const camelParamNames = paramNames.map(name => this.toCamelCase(name))
        let processedPath = path
        paramNames.forEach((name, index) => {
          processedPath = processedPath.replace(`{${name}}`, `\${params?.${camelParamNames[index]}}`)
        })
        urlTemplate = `\`${processedPath}\``
      }

      // 生成函数签名，支持可选的配置参数
      if (method === 'get') {
        if (isDownloadApi) {
          // 下载接口使用 download 方法
          if (parameterType && requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, { data, params, ...config })\n`
          } else if (parameterType) {
            content += `export const ${operationName} = (params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            if (hasQueryParams) {
              // 有查询参数，需要传递 params
              content += `  return http.download(${urlTemplate}, { params, ...config })\n`
            } else {
              // 只有路径参数，已嵌入 URL，不重复传递
              content += `  return http.download(${urlTemplate}, config)\n`
            }
          } else if (requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, { data, ...config })\n`
          } else {
            content += `export const ${operationName} = (config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, config)\n`
          }
        } else {
          // 普通接口
          if (parameterType && requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.get<${responseType}>(${urlTemplate}, { data, params, ...config })\n`
          } else if (parameterType) {
            // 当有路径参数时，params 是必需的
            const isParamsRequired = hasPathParams
            content += `export const ${operationName} = (params${isParamsRequired ? '' : '?'}: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            if (hasQueryParams) {
              // 有查询参数，需要传递 params
              content += `  return http.get<${responseType}>(${urlTemplate}, { params, ...config })\n`
            } else {
              // 只有路径参数，已嵌入 URL，不重复传递
              content += `  return http.get<${responseType}>(${urlTemplate}, config)\n`
            }
          } else if (requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.get<${responseType}>(${urlTemplate}, { data, ...config })\n`
          } else {
            content += `export const ${operationName} = (config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.get<${responseType}>(${urlTemplate}, config)\n`
          }
        }
      } else if (['post', 'put', 'patch'].includes(method)) {
        // 检查是否为 SSE 流式接口
        const isSseApi = this.isSseApi(operation)

        if (isSseApi) {
          // SSE 流式接口使用 sse 方法，通过回调接收实时数据
          const optionsType = `{\n  onMessage: (data: ${responseType}) => void\n  onError?: (error: any) => void\n  onDone?: () => void\n  config?: ShortClipRequestConfig<any>\n}`
          if (parameterType && requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, options: ${optionsType}) => {\n`
            content += `  return http.sse<${responseType}, ${requestBodyType}>(${urlTemplate}, data, { ...options, config: options.config ? { params, ...options.config } : { params } })\n`
          } else if (requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, options: ${optionsType}) => {\n`
            content += `  return http.sse<${responseType}, ${requestBodyType}>(${urlTemplate}, data, options)\n`
          } else if (parameterType) {
            const isParamsRequired = hasPathParams
            content += `export const ${operationName} = (params${isParamsRequired ? '' : '?'}: ${parameterType}, options: ${optionsType}) => {\n`
            content += `  return http.sse<${responseType}, any>(${urlTemplate}, null, { ...options, config: options.config ? { params, ...options.config } : { params } })\n`
          } else {
            content += `export const ${operationName} = (options: ${optionsType}) => {\n`
            content += `  return http.sse<${responseType}, any>(${urlTemplate}, null, options)\n`
          }
          content += `}\n\n`
          return
        }

        const isFormData = this.isFormDataRequest(operation.requestBody) || isUploadApi

        if (isDownloadApi) {
          // 下载接口使用 download 方法
          if (parameterType && requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, { data, params, ...config })\n`
          } else if (requestBodyType !== 'any') {
            content += `export const ${operationName} = (data: ${requestBodyType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, { data, ...config })\n`
          } else if (parameterType) {
            // 当有路径参数时，params 是必需的
            const isParamsRequired = hasPathParams
            content += `export const ${operationName} = (params${isParamsRequired ? '' : '?'}: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            if (hasQueryParams) {
              // 有查询参数，需要传递 params
              content += `  return http.download(${urlTemplate}, { params, ...config })\n`
            } else {
              // 只有路径参数，已嵌入 URL，不重复传递
              content += `  return http.download(${urlTemplate}, config)\n`
            }
          } else {
            content += `export const ${operationName} = (config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.download(${urlTemplate}, config)\n`
          }
        } else {
          // 普通接口
          if (parameterType && requestBodyType !== 'any') {
            if (isFormData) {
              content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.${method}Form<${responseType}>(${urlTemplate}, data, { params, ...config })\n`
            } else {
              content += `export const ${operationName} = (data: ${requestBodyType}, params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.${method}<${responseType}>(${urlTemplate}, data, params ? { params, ...config } : config)\n`
            }
          } else if (requestBodyType !== 'any') {
            if (isFormData) {
              content += `export const ${operationName} = (data: ${requestBodyType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.${method}Form<${responseType}>(${urlTemplate}, data, config)\n`
            } else {
              content += `export const ${operationName} = (data: ${requestBodyType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.${method}<${responseType}>(${urlTemplate}, data, config)\n`
            }
          } else if (parameterType) {
            // 只有参数，没有 request body
            if (isFormData) {
              // 对于包含文件字段的 query 参数，使用 Form 方法
              content += `export const ${operationName} = (params: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.${method}Form<${responseType}>(${urlTemplate}, params, config)\n`
            } else {
              // 当有路径参数时，params 是必需的
              const isParamsRequired = hasPathParams
              content += `export const ${operationName} = (params${isParamsRequired ? '' : '?'}: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              if (hasQueryParams) {
                // 有查询参数，需要传递 params
                content += `  return http.${method}<${responseType}>(${urlTemplate}, null, { params, ...config })\n`
              } else {
                // 只有路径参数，已嵌入 URL，传入 null 作为 body
                content += `  return http.${method}<${responseType}>(${urlTemplate}, null, config)\n`
              }
            }
          } else {
            content += `export const ${operationName} = (config?: ShortClipRequestConfig<any>) => {\n`
            // 没有 body 也没有参数，传入 null 作为 body
            content += `  return http.${method}<${responseType}>(${urlTemplate}, null, config)\n`
          }
        }
      } else if (method === 'delete') {
        if (parameterType) {
          if (hasPathParams) {
            // 有路径参数的情况
            if (hasQueryParams) {
              // 同时有路径参数和查询参数
              content += `export const ${operationName} = (params: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.delete<${responseType}>(${urlTemplate}, { params, ...config })\n`
            } else {
              // 只有路径参数
              content += `export const ${operationName} = (params: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
              content += `  return http.delete<${responseType}>(${urlTemplate}, { ...config })\n`
            }
          } else {
            // 只有查询参数
            content += `export const ${operationName} = (params?: ${parameterType}, config?: ShortClipRequestConfig<any>) => {\n`
            content += `  return http.delete<${responseType}>(${urlTemplate}, { params, ...config })\n`
          }
        } else {
          content += `export const ${operationName} = (config?: ShortClipRequestConfig<any>) => {\n`
          content += `  return http.delete<${responseType}>(${urlTemplate}, config)\n`
        }
      }

      content += `}\n\n`
    })

    return content
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  // 清理不再存在的 API 文件
  private cleanupObsoleteFiles(currentTags: Set<string>): void {
    if (!fs.existsSync(this.apiDir)) return

    const existingFiles = fs.readdirSync(this.apiDir)
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''))

    // 将 tags 转换为文件名格式进行匹配
    const currentFileNames = Array.from(currentTags).map(tag => this.toCamelCase(tag))
    const obsoleteFiles = existingFiles.filter(file => !currentFileNames.includes(file))

    obsoleteFiles.forEach(file => {
      const filePath = path.join(this.apiDir, `${file}.ts`)
      fs.unlinkSync(filePath)
      console.log(`🗑️  删除过时的 API 文件: ${file}.ts`)
    })

    if (obsoleteFiles.length > 0) {
      console.log(`🧹 清理完成，删除了 ${obsoleteFiles.length} 个过时文件`)
    }
  }

  async generateApiModules(): Promise<void> {
    if (!this.openApiDoc) {
      throw new Error('OpenAPI 规范未加载，请先调用 fetchOpenApiSpec()')
    }

    // 确保 API 目录存在
    this.ensureDirectoryExists(this.apiDir)

    // 按 tag 分组操作
    const tagGroups: Record<
      string,
      Array<{
        method: string
        path: string
        operation: OpenAPIOperation
      }>
    > = {}

    Object.entries(this.openApiDoc.paths).forEach(([path, pathItem]) => {
      // 检查 URL 是否应该被过滤
      if (this.shouldFilterUrl(path)) {
        console.log(`🚫 跳过 URL: ${path}`)
        return
      }

      Object.entries(pathItem).forEach(([method, operation]) => {
        if (typeof operation === 'object' && operation.operationId) {
          // 检查自定义配置
          const customConfig = this.getCustomMethodConfig(path, method)
          if (customConfig?.generate === false) {
            console.log(`🚫 跳过自定义方法: ${method} ${path}`)
            return
          }

          const tags = operation.tags || ['default']
          const tag = tags[0] // 使用第一个 tag 作为分组

          if (!tagGroups[tag]) {
            tagGroups[tag] = []
          }

          tagGroups[tag].push({
            method,
            path,
            operation,
          })
        }
      })
    })

    // 清理过时的 API 文件
    this.cleanupObsoleteFiles(new Set(Object.keys(tagGroups)))

    // 生成每个 tag 的 API 文件
    Object.entries(tagGroups).forEach(([tag, operations]) => {
      const fileName = `${this.toCamelCase(tag)}.ts`
      const filePath = path.join(this.apiDir, fileName)
      const content = this.generateApiFile(tag, operations)

      fs.writeFileSync(filePath, content, 'utf-8')
      console.log(`✅ 生成 API 文件: ${fileName}`)
    })

    console.log(`🎉 API 模块生成完成，共生成 ${Object.keys(tagGroups).length} 个文件`)
  }

  async run(baseUrl?: string): Promise<void> {
    try {
      console.log('🚀 开始生成 API 模块...')
      await this.fetchOpenApiSpec(baseUrl)
      await this.generateApiModules()
      console.log('✨ API 模块生成完成！')
    } catch (error) {
      console.error('❌ 生成失败:', error)
      throw error
    }
  }
}

// 导出函数供外部调用
export async function generateApiModules(baseUrl?: string) {
  const generator = new ApiGenerator()
  await generator.run(baseUrl)
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseUrl = process.argv[2] // 可以通过命令行参数传入 base URL
  generateApiModules(baseUrl).catch(console.error)
}