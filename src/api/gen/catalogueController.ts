import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface CatalogueUpdateCmd {
  /* 目录名称 */
  catalogueName: string
  /* 页码-从目录开始 */
  page?: number
}

export interface ResultVoid {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: any
}

export interface ResultObject {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: any
}

export interface CatalogueParseDTO {
  /* 目录标题 */
  title: string
  /* 页码（空字符串表示无页码） */
  page?: string
  /* 子目录列表 */
  children?: CatalogueParseDTO[]
}

export interface CatalogueParseCmd {
  /* 项目ID */
  projectId: string
  /* 目录数据列表 */
  catalogueList: CatalogueParseDTO[]
}

export interface CatalogueParseResultVO {
  /* 成功创建的目录数量 */
  count?: number
}

export interface ResultCatalogueParseResultVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: CatalogueParseResultVO
}

export interface CatalogueSort {
  /* 目录id */
  catalogueId: string
  /* 排序号 */
  sortNum: number
  /* 子目录 */
  children?: any[]
}

export interface CatalogueChangeCmd {
  catalogues: CatalogueSort[]
}

export interface CatalogueCreateCmd {
  /* 目录名称 */
  catalogueName: string
  /* 层级：1-chapter，2-section，3-lesson，4-sublesson */
  level: number
  /* 书籍ID */
  bookId: string
  /* 父目录ID（顶级目录为0） */
  parentId: string
  /* 页码-从目录开始 */
  page?: number
}

export interface ResultLong {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: number
}

export interface CatalogueVO {
  /* 目录ID */
  id: string
  /* 目录名称 */
  catalogueName: string
  /* 层级：1-chapter，2-section，3-lesson，4-sublesson */
  level: number
  /* 书籍ID */
  bookId: string
  /* 父目录ID */
  parentId?: string
  /* 页码-从目录开始 */
  page?: number
  /* 排序号 */
  sortNum?: number
}

export interface ResultListCatalogueVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: CatalogueVO[]
}

export interface CatalogueCheckVO {
  /* 目录ID */
  id: string
  /* 目录名称 */
  catalogueName?: string
  /* 父目录ID */
  parentId?: string
  /* 题目数量 */
  questionCount?: number
}

export interface ResultListCatalogueCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: CatalogueCheckVO[]
}

/**
 * 更新目录
 * 更新目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putCatalogueUpdateApi = (data: CatalogueUpdateCmd, params?: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/catalogue/update', data, params ? { params, ...config } : config)
}

/**
 * 解析目录JSON并创建目录
 * 解析目录JSON并创建目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultCatalogueParseResultVO>
 */
export const postCatalogueParseApi = (data: CatalogueParseCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultCatalogueParseResultVO>('/catalogue/parse', data, config)
}

/**
 * 改变目录位置
 * 改变目录位置
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postCatalogueLocationChangeApi = (data: CatalogueChangeCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/catalogue/location/change', data, config)
}

/**
 * 创建目录
 * 创建目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultLong>
 */
export const postCatalogueCreateApi = (data: CatalogueCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultLong>('/catalogue/create', data, config)
}

/**
 * 查询书籍的所有目录
 * 查询书籍的所有目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListCatalogueVO>
 */
export const getCatalogueListApi = (params?: {
  bookId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListCatalogueVO>('/catalogue/list', { params, ...config })
}

/**
 * 目录检查：返回每个目录的题目数量
 * 目录检查：返回每个目录的题目数量
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListCatalogueCheckVO>
 */
export const getCatalogueCheckApi = (params?: {
  bookId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListCatalogueCheckVO>('/catalogue/check', { params, ...config })
}

/**
 * 删除目录
 * 删除目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteCatalogueDeleteApi = (params?: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/catalogue/delete', { params, ...config })
}

/**
 * 清空目录
 * 清空目录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteCatalogueClearApi = (params?: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/catalogue/clear', { params, ...config })
}

