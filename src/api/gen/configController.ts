import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface AtdNode {
  id?: string
  /* 节点编码 */
  code?: string
  /* 服务地址 */
  url?: string
}

export interface ConfigVO {
  /* 切图端点 */
  sliceEndpoint: string
  /* PDF图片端点 */
  pdfImageEndpoint: string
  /* 备用节点列表 */
  workers?: AtdNode[]
}

export interface ResultConfigVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: ConfigVO
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

export interface Image {
  url?: string
}

export interface ModelContentVO {
  type: string
  text?: string
  image_url?: Image
}

export interface ModelMessagesVO {
  role: string
  content: ModelContentVO[]
}

export interface DouBaoConfigVO {
  text: ModelMessagesVO[]
  table: ModelMessagesVO[]
  baseUrl: string
  model: string
  apiKey: string
}

export interface ResultDouBaoConfigVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DouBaoConfigVO
}

/**
 * 获取配置信息
 * 获取配置信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultConfigVO>
 */
export const getConfigApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultConfigVO>('/config', config)
}

/**
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultDouBaoConfigVO>
 */
export const getConfigDoubaoApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultDouBaoConfigVO>('/config/doubao', config)
}

