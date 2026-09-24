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
  /* 基础题型：0-填空型，1-选择型（可选；为空时按 typeCode 自动推导：单选/多选=1，其余=0） */
  baseType?: number
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
  /* 主键 */
  id: string
  /* 学科枚举（1~11） */
  subjectCode: number
  /* 题型枚举值（docx） */
  typeCode: number
  /* 题型名 */
  typeName: string
  /* 排序 */
  sortNo: number
  /* 基础题型：0-填空型，1-选择型 */
  baseType: number
  /* 题型大类ID，关联 atd_dic_question_category */
  categoryId: string
  /* 题型大类名（听力/阅读/写作表达/语法词汇/实验探究/综合/基础概念/其他） */
  categoryName: string
  /* 是否选择类型：1-选择型，0-填空型（由 baseType 派生，等于 baseType，仅作兼容暴露） */
  isChoice: number
}

export interface ResultListQuestionTypeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionTypeVO[]
}

export interface BaseQuestionTypeVO {
  /* docx 题型枚举：1~8 为基础题型，0 为其余非基础题型的兜底（默认题） */
  typeCode: number
  /* 题目类型中文：单选题/多选题/填空题/判断题/解答题/完形填空/综合题/连线题/默认题 */
  questionTypeZh: string
}

export interface ResultListBaseQuestionTypeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: BaseQuestionTypeVO[]
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
 * 题目类型默认值表（docx questionTypeZh，前端按标签题型枚举推导）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListBaseQuestionTypeVO>
 */
export const getQuestionTypeBaseTypeApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListBaseQuestionTypeVO>('/question-type/base-type', config)
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

