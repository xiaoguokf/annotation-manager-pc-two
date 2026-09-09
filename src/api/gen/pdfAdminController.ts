import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

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

export interface PdfPageUpdateCmd {
  /* 类型：1-封面(cover)，2-cip，3-目录（catalog），4-后封面（back_cover），5-题目，6-答案，7-其他 */
  type: number
  /* 起始页码 */
  startPage: number
  /* 结束页码（包含此页） */
  endPage: number
}

export interface PdfPageBatchUpdateCmd {
  /* 项目ID */
  projectId: string
  /* PDF页类型范围更新列表 */
  updates: PdfPageUpdateCmd[]
}

export interface PdfCheckCmd {
  /* PDF文件名列表 */
  pdfNames: string[]
}

export interface PdfCheckVO {
  /* PDF文件名 */
  pdfName?: string
  /* 搜索ID列表 */
  searchIds?: string[]
}

export interface ResultListPdfCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PdfCheckVO[]
}

export interface PdfPageVO {
  /* 页ID */
  id: string
  /* PDF ID */
  pdfId: string
  /* 项目ID */
  projectId: string
  /* OSS存储路径 */
  ossPath: string
  /* 类型：0-默认，1-封面,2-cip,3-目录,4-后封面,5-题目,6-答案，7-其他 */
  type: number
  /* 页码 */
  realPage: number
  /* 直接路径 */
  url: string
}

export interface ResultListPdfPageVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PdfPageVO[]
}

export interface PdfQuery {
  /* 项目ID */
  projectId?: string
  /* PDF ID */
  pdfId?: string
}

export interface PdfVO {
  /* PDF ID */
  id: string
  /* 项目ID */
  projectId: string
  /* PDF名称 */
  pdfName: string
  /* 页数 */
  size: number
  /* 状态：0-解析中，1-解析完成,2-解析失败 */
  status: number
  /* 加载完的数据 */
  loadPage?: number
}

export interface ResultListPdfVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PdfVO[]
}

/**
 * 上传PDF
 * 上传PDF
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postPdfUploadApi = (params: {
  /* 项目ID */
  projectId: string
  /* PDF文件 */
  file: File
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultVoid>('/pdf/upload', params, config)
}

/**
 * 通过uploadId上传PDF并解析
 * 通过uploadId上传PDF并解析
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postPdfUploadByUploadIdApi = (params: {
  uploadId: File,
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultVoid>('/pdf/uploadByUploadId', params, config)
}

/**
 * 批量更新PDF页类型范围
 * 批量更新PDF页类型范围
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postPdfPageTypeUpdateApi = (data: PdfPageBatchUpdateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/pdf/pageType/update', data, config)
}

/**
 * 根据PDF文件名列表查询searchId
 * 根据PDF文件名列表查询searchId
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListPdfCheckVO>
 */
export const postPdfCheckApi = (data: PdfCheckCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultListPdfCheckVO>('/pdf/check', data, config)
}

/**
 * 查询PDF页列表
 * 查询PDF页列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListPdfPageVO>
 */
export const getPdfPageListApi = (params?: {
  pdfOrProjectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListPdfPageVO>('/pdf/pageList', { params, ...config })
}

/**
 * 查询PDF列表
 * 查询PDF列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListPdfVO>
 */
export const getPdfListApi = (params?: PdfQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListPdfVO>('/pdf/list', { params, ...config })
}

/**
 * 删除PDF
 * 删除PDF
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deletePdfDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/pdf/delete/${params?.id}`, { ...config })
}

/**
 * 批量删除PDF
 * 批量删除PDF
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deletePdfBatchDeleteApi = (params?: {
  ids: number[]
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/pdf/batchDelete', { params, ...config })
}

