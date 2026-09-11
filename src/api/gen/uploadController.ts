import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface ResultString {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: string
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

export interface UploadMergeCmd {
  /* 上传任务ID */
  uploadId: string
  /* 文件MD5哈希值 */
  fileHash: string
  /* 文件名 */
  fileName: string
  /* 分片总数 */
  chunkTotal: number
  /* 文件大小（字节） */
  fileSize: number
  /* 文件MIME类型 */
  contentType: string
  /* 上传路径（可选） */
  uploadPath?: string
}

export interface UploadInitCmd {
  /* 文件MD5哈希值 */
  fileHash: string
  /* 文件名 */
  fileName: string
  /* 文件大小（字节） */
  fileSize: number
  /* 分片大小（字节），建议5MB-10MB */
  chunkSize: number
  /* 分片总数 */
  chunkTotal: number
  /* 文件MIME类型 */
  contentType: string
  /* 上传路径（可选） */
  uploadPath?: string
}

export interface ResultBoolean {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: boolean
}

export interface UploadChunkBatchCmd {
  /* 上传任务ID */
  uploadId: string
  /* 文件MD5哈希值 */
  fileHash: string
  /* 分片索引（从0开始） */
  chunkIndex: number
  /* 分片总数 */
  chunkTotal: number
  /* 分片大小（字节） */
  chunkSize: number
  /* 分片数据的Base64编码 */
  chunkData: string
}

export interface ResultListBoolean {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: boolean[]
}

export interface UploadCheckCmd {
  /* 文件MD5哈希值 */
  fileHash: string
  /* 文件名 */
  fileName: string
  /* 文件大小（字节） */
  fileSize: number
  /* 分片大小（字节） */
  chunkSize: number
  /* 分片总数 */
  chunkTotal: number
}

export interface UploadCheckVO {
  /* 是否需要上传（false表示已存在，可秒传） */
  needUpload?: boolean
  /* 文件是否已存在 */
  fileExists?: boolean
  /* 如果文件已存在，返回文件URL（秒传） */
  fileUrl?: string
  /* 已上传的分片索引列表 */
  uploadedChunks?: number[]
}

export interface ResultUploadCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: UploadCheckVO
}

export interface UploadStatusVO {
  /* 上传任务ID */
  uploadId?: string
  /* 文件哈希 */
  fileHash?: string
  /* 文件名 */
  fileName?: string
  /* 文件大小（字节） */
  fileSize?: number
  /* 上传状态：INIT-初始化, UPLOADING-上传中, COMPLETED-已完成, CANCELLED-已取消 */
  status?: string
  /* 分片总数 */
  chunkTotal?: number
  /* 已上传分片数 */
  uploadedCount?: number
  /* 上传进度（0-100） */
  progress?: number
  /* 创建时间 */
  createTime?: number
  /* 更新时间 */
  updateTime?: number
  /* 已上传的分片索引列表 */
  uploadedChunks?: number[]
}

export interface ResultUploadStatusVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: UploadStatusVO
}

/**
 * 普通文件上传（小文件）
 * 普通文件上传（小文件）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultString>
 */
export const postUploadSimpleApi = (params?: {
  file: File,
  uploadPath?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultString>('/upload/simple', params, config)
}

/**
 * 合并分片
 * 合并分片
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultString>
 */
export const postUploadMergeApi = (data: UploadMergeCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultString>('/upload/merge', data, config)
}

/**
 * 初始化分片上传
 * 初始化分片上传
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultString>
 */
export const postUploadInitApi = (data: UploadInitCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultString>('/upload/init', data, config)
}

/**
 * 上传单个分片
 * 上传单个分片
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultBoolean>
 */
export const postUploadChunkApi = (params?: {
  uploadId: string,
  fileHash: string,
  chunkIndex: number,
  chunkTotal: number,
  chunkSize: number,
  file: File
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultBoolean>('/upload/chunk', params, config)
}

/**
 * 批量上传分片
 * 批量上传分片
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListBoolean>
 */
export const postUploadChunkBatchApi = (data: UploadChunkBatchCmd[], config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultListBoolean>('/upload/chunk/batch', data, config)
}

/**
 * 校验文件是否已上传（秒传）
 * 校验文件是否已上传（秒传）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultUploadCheckVO>
 */
export const postUploadCheckApi = (data: UploadCheckCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultUploadCheckVO>('/upload/check', data, config)
}

/**
 * 查询上传进度
 * 查询上传进度
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultUploadStatusVO>
 */
export const getUploadStatusApi = (params?: {
  uploadId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultUploadStatusVO>('/upload/status', { params, ...config })
}

/**
 * 取消上传任务
 * 取消上传任务
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteUploadCancelApi = (params?: {
  uploadId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/upload/cancel', { params, ...config })
}

