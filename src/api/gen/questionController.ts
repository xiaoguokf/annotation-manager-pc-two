import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface QuestionUpdateCmd {
  /* 目录id */
  catalogueId?: string
  /* 题型 */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 标题 */
  question?: string
  /* 选项 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 知识点 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 题目开始页码 */
  page?: number
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 解析 */
  analysis?: string
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

export interface QuestionSortCmd {
  /* 题目ID */
  id: string
  /* 新的排序号 */
  sortNum: number
}

export interface QuestionCreateCmd {
  /* 项目ID */
  projectId: string
  /* 目录ID */
  catalogueId?: string
  /* 0-书籍，1-试卷 */
  type: number
  /* 排序号 */
  sortNum?: number
  /* 题型 */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 标题 */
  question?: string
  /* 选项 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 知识点 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 题目开始页码 */
  page?: number
}

export interface QuestionAutoSortCmd {
  /* 项目ID */
  projectId: string
  /* 目录ID（可选，如果不指定则对整个项目进行排序） */
  catalogueId?: string
}

export interface QuestionQuery {
  /* 项目id */
  projectId: string
  /* 目录ID */
  catalogueId?: string
}

export interface QuestionVO {
  /* 题目ID */
  id: string
  /* 项目ID */
  projectId: string
  /* 目录ID */
  catalogueId?: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题目开始页码 */
  page?: number
  /* 排序数，用户保证同目录下的题目顺序 */
  sortNum?: number
  /* 标注个数 */
  annotationCount?: number
}

export interface ResultListQuestionVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionVO[]
}

export interface QuestionDetailsVO {
  /* 题目ID */
  id: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 知识点-字符串数组 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 标题 */
  question?: string
  /* 选项，字符串数组 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 解析 */
  analysis?: string
  /* 题目开始页码 */
  page?: number
}

export interface ResultQuestionDetailsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionDetailsVO
}

export interface QuestionDetailsListVO {
  /* 题目ID */
  id: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 知识点-字符串数组 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 标题 */
  question?: string
  /* 选项，字符串数组 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 解析 */
  analysis?: string
  /* 题目开始页码 */
  page?: number
  /* 排序数，用户保证同目录下的题目顺序 */
  sortNum?: number
  /* 目录id */
  catalogueId?: string
  /* 创建人姓名 */
  createNickname?: string
  /* 创建人用户名 */
  createUsername?: string
  /* 更新人姓名 */
  updateNickname?: string
  /* 更新人用户名 */
  updateUsername?: string
}

export interface ResultListQuestionDetailsListVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionDetailsListVO[]
}

export interface QuestionCheckVO {
  /* 题目ID */
  id: string
  /* 目录ID */
  catalogueId?: string
  /* 排序数 */
  sortNum?: number
  /* 错误原因 */
  reason: string
}

export interface ResultListQuestionCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionCheckVO[]
}

export interface QuestionCatalogueVO {
  /* 题目ID */
  questionId: string
  /* 目录ID */
  catalogueId: string
  /* 题目开始页码 */
  page: number
}

export interface ResultQuestionCatalogueVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionCatalogueVO
}

/**
 * 更新题目
 * 更新题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putQuestionUpdateApi = (data: QuestionUpdateCmd, params?: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/question/update/${params?.id}`, data, params ? { params, ...config } : config)
}

/**
 * 题目顺序切换
 * 题目顺序切换
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putQuestionSortApi = (data: QuestionSortCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/question/sort', data, config)
}

/**
 * 创建题目
 * 创建题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postQuestionCreateApi = (data: QuestionCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/question/create', data, config)
}

/**
 * 题目自动排序
 * 题目自动排序
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postQuestionAutoSortApi = (data: QuestionAutoSortCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/question/auto-sort', data, config)
}

/**
 * 查询题目列表
 * 查询题目列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionVO>
 */
export const getQuestionListApi = (params?: QuestionQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionVO>('/question/list', { params, ...config })
}

/**
 * 根据ID查询题目详情
 * 根据ID查询题目详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultQuestionDetailsVO>
 */
export const getQuestionDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultQuestionDetailsVO>(`/question/details/${params?.id}`, config)
}

/**
 * 根据项目ID查询题目详情列表
 * 根据项目ID查询题目详情列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionDetailsListVO>
 */
export const getQuestionDetailsListApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionDetailsListVO>(`/question/details/list/${params?.projectId}`, config)
}

/**
 * 题目检查：查询没有通过校验的题目
 * 题目检查：查询没有通过校验的题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionCheckVO>
 */
export const getQuestionCheckApi = (params?: QuestionQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionCheckVO>('/question/check', { params, ...config })
}

/**
 * 根据题目ID获取所在目录ID
 * 根据题目ID获取所在目录ID
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultQuestionCatalogueVO>
 */
export const getQuestionCatalogueIdApi = (params: {
  questionId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultQuestionCatalogueVO>(`/question/catalogueId/${params?.questionId}`, config)
}

/**
 * 删除题目
 * 删除题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteQuestionDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/question/delete/${params?.id}`, { ...config })
}

