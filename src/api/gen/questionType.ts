import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface QuestionTypeCmd {
  /* 学科枚举（1~11） */
  subjectCode: number
  /* 题型枚举值（docx） */
  typeCode: number
  /* 题型名 */
  typeName: string
  /* 排序 */
  sortNo?: number
  /* 状态：1-启用，0-停用 */
  status?: number
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

export interface QuestionTypeVO {
  id?: string
  /* 学科枚举（1~11） */
  subjectCode?: number
  /* 题型枚举值（docx） */
  typeCode?: number
  /* 题型名 */
  typeName?: string
  /* 排序 */
  sortNo?: number
}

export interface ResultListQuestionTypeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionTypeVO[]
}

/**
 * 更新标签题型
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putQuestionTypeUpdateApi = (data: QuestionTypeCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/question-type/update/${params.id}`, data, config)
}

/**
 * 新增标签题型
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postQuestionTypeCreateApi = (data: QuestionTypeCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/question-type/create', data, config)
}

/**
 * 按学科查询标签题型（不传 subjectCode 返回全部）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionTypeVO>
 */
export const getQuestionTypeListApi = (params?: {
  subjectCode?: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionTypeVO>('/question-type/list', { params, ...config })
}

/**
 * 删除标签题型
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteQuestionTypeDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/question-type/delete/${params.id}`, config)
}

