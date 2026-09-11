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

export interface AnnotationUpdate2Cmd {
  /* 标注ID */
  annotationId: string
  /* 分析内容（用户编辑后的文本结果） */
  analysisContent: string
  /* 题类：题干-1，题干图-2，选项-3，选项图-4，解析-5，解析图-6，答案-7，答案图-8，表格-9 */
  type: number
  /* 输入类型：1-图片，2-文本，3-表格（可选，不传则根据type自动判断） */
  inputType: number
  /* 输入token数量 */
  inputToken?: number
  /* 输出token数量 */
  outputToken?: number
}

export interface AnnotationRectUpdateCmd {
  /* 标注ID */
  annotationId: string
  /* 左上角x坐标 */
  topLeftX: number
  /* 左上角y坐标 */
  topLeftY: number
  /* 右下角x坐标 */
  bottomRightX: number
  /* 右下角y坐标 */
  bottomRightY: number
}

export interface AnnotationUpdateCmd {
  /* 标注ID */
  annotationId: string
  /* 分析内容（用户编辑后的文本结果） */
  analysisContent: string
  /* 输入token数量 */
  inputToken?: number
  /* 输出token数量 */
  outputToken?: number
}

export interface ProcessAnnotationCmd {
  /* 标注ID */
  annotationId: string
  /* 解析结果：0-进行中，1-解析完成，2-解析失败 */
  result: number
}

export interface AnnotationCreateCmd {
  /* 项目ID */
  projectId: string
  /* 题目ID */
  questionId: string
  /* 所在页码 */
  page: number
  /* 题类：题干-1，题干图-2，选项-3，选项图-4，解析-5，解析图-6，答案-7，答案图-8 */
  type: number
  /* 左上角x坐标 */
  topLeftX: number
  /* 左上角y坐标 */
  topLeftY: number
  /* 右下角x坐标 */
  bottomRightX: number
  /* 右下角y坐标 */
  bottomRightY: number
}

export interface ResultLong {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: number
}

export interface AnnotationSimpleVO {
  /* 标注ID */
  id: string
  /* 项目ID */
  projectId: string
  /* 题目ID */
  questionId: string
  /* 所在页码 */
  page: number
  /* 题类：题干-1，题干图-2，选项-3，选项图-4，解析-5，解析图-6，答案-7，答案图-8，表格-9 */
  type: number
  /* 解析内容：如果是图片则为存储路径，如果是文本则为AI分析结果 */
  analysisContent?: string
  /* 解析结果：0-进行中，1-解析完成，2-解析失败 */
  result?: number
  /* 解析内容URL（仅图片类型有值） */
  url?: string
  /* 输入类型：1-图片，2-文本，3-表格 */
  inputType?: number
}

export interface ResultListAnnotationSimpleVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: AnnotationSimpleVO[]
}

export interface AnnotationStatusVO {
  /* 标注ID */
  id: string
  /* 题目ID */
  questionId: string
  /* 创建时间 */
  result?: number
}

export interface ResultListAnnotationStatusVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: AnnotationStatusVO[]
}

export interface AnnotationVO {
  /* 标注ID */
  id: string
  /* 项目ID */
  projectId: string
  /* 题目ID */
  questionId: string
  /* 输入类型 */
  inputType?: number
  /* 所在页码 */
  page: number
  /* 题类：题干-1，题干图-2，选项-3，选项图-4，解析-5，解析图-6，答案-7，答案图-8 */
  type: number
  /* 左上角x坐标 */
  topLeftX: number
  /* 左上角y坐标 */
  topLeftY: number
  /* 右下角x坐标 */
  bottomRightX: number
  /* 右下角y坐标 */
  bottomRightY: number
  /* 题目排序号 */
  sortNum?: number
  /* 目录ID */
  catalogueId?: string
}

export interface ResultListAnnotationVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: AnnotationVO[]
}

/**
 * 更新标注类型
 * 更新标注类型
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAnnotationUpdateTypeApi = (params?: {
  annotationId: string,
  type: number,
  file?: File,
  inputType?: number,
  model?: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.putForm<ResultVoid>('/annotation/updateType', params, config)
}

/**
 * 更新标注类型
 * 更新标注类型
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAnnotationUpdateTypeToTextApi = (data: AnnotationUpdate2Cmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/annotation/updateTypeToText', data, config)
}

/**
 * 更新标注矩形坐标
 * 更新标注矩形坐标
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAnnotationUpdateRectApi = (data: AnnotationRectUpdateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/annotation/updateRect', data, config)
}

/**
 * 更新分析结果
 * 更新分析结果
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAnnotationUpdateAnalysisResultApi = (data: AnnotationUpdateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/annotation/updateAnalysisResult', data, config)
}

/**
 * 修改解析状态
 * 修改解析状态
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAnnotationProcessAnnotationApi = (data: ProcessAnnotationCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/annotation/processAnnotation', data, config)
}

/**
 * 解析标注
 * 解析标注
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAnnotationParseApi = (params?: {
  annotationId: string,
  inputType: number,
  model: number,
  file: File
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultVoid>('/annotation/parse', params, config)
}

/**
 * 创建标注
 * 创建标注
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultLong>
 */
export const postAnnotationCreateApi = (data: AnnotationCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultLong>('/annotation/create', data, config)
}

/**
 * 查询标注列表（不含坐标）
 * 查询标注列表（不含坐标）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListAnnotationSimpleVO>
 */
export const getAnnotationListApi = (params?: {
  questionId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListAnnotationSimpleVO>('/annotation/list', { params, ...config })
}

/**
 * 查询项目进行中和失败的标注
 * 查询项目进行中和失败的标注
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListAnnotationStatusVO>
 */
export const getAnnotationListPendingAndFailedApi = (params?: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListAnnotationStatusVO>('/annotation/listPendingAndFailed', { params, ...config })
}

/**
 * 通过题目ID查询标注列表
 * 通过题目ID查询标注列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListAnnotationVO>
 */
export const getAnnotationListByQuestionApi = (params?: {
  questionId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListAnnotationVO>('/annotation/listByQuestion', { params, ...config })
}

/**
 * 通过项目ID和页码查询标注列表
 * 通过项目ID和页码查询标注列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListAnnotationVO>
 */
export const getAnnotationListByProjectAndPageApi = (params?: {
  projectId: string,
  page: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListAnnotationVO>('/annotation/listByProjectAndPage', { params, ...config })
}

/**
 * 删除标注
 * 删除标注
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAnnotationDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/annotation/delete/${params.id}`, config)
}

