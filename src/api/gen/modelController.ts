import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface ModelArgVO {
  /* 参数ID */
  id?: number
  /* 模型ID */
  modelId?: string
  /* 模型角色 */
  role?: string
  /* 输入类型：text，image */
  inputType?: string
  /* 输入内容 */
  context?: string
  /* 使用类型：1-文本ocr，2-表格ocr，3-学科（其中extId为学科名称） */
  type?: number
  /* 扩展id用于二次查找 */
  extId?: string
}

export interface ModelVO {
  /* 模型ID */
  id: string
  /* 显示名称 */
  name?: string
  /* 模型参数 */
  model?: string
  /* 模型描述 */
  description?: string
  /* 密钥 */
  apiKey?: string
  /* 服务商地址 */
  baseUrl?: string
  /* 是否默认模型 */
  isDefault?: boolean
  /* 模型参数列表 */
  args?: ModelArgVO[]
}

export interface ResultListModelVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: ModelVO[]
}

export interface ResultObject {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: any
}

export interface ResultVoid {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: any
}

/**
 * 查询模型列表
 * 查询模型列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListModelVO>
 */
export const getModelListApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListModelVO>('/model/list', config)
}

