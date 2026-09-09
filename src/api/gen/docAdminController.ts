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

export interface DocCreateCmd {
  /* 试卷名称 */
  title: string
  /* 试卷ID */
  docId: string
}

export interface ResultLong {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: number
}

export interface DocQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 试卷名称 */
  title?: string
  /* 试卷ID */
  docId?: string
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功，7-已回传，8-解析中，9-解析失败 */
  status?: number
}

export interface DocVO {
  /* 试卷ID */
  id: string
  /* 试卷ID */
  docId: string
  /* 试卷名称 */
  title: string
  /* 所属省/市 */
  provinceId?: string
  /* 所属市/区 */
  cityId?: string
  /* 年级id */
  gradeId?: string
  /* 学科 */
  subjectId?: string
  /* 年份（4位） */
  year?: number
  /* 学期：1-上，2-下 */
  term?: number
  /* 试卷类型 */
  paperType?: number
  /* 学段:1-小学，2-初中，3-高中 */
  stepId?: string
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功，7-已回传，8-解析中，9-解析失败 */
  status?: number
  /* 创建人 */
  createBy?: string
  /* 更新人 */
  updateBy?: string
  /* 创建时间 */
  createTime?: string
  /* 更新时间 */
  updateTime?: string
  /* 是否问题提交 */
  isProblemSubmit?: boolean
  /* 问题类型：no_answer-无答案，missing_page-缺页，no_questions-整本无题，listening-听力相关，other-其他 */
  problemType?: string
  /* 问题备注 */
  problemRemark?: string
}

export interface PageVODocVO {
  /* 记录数据 */
  records?: DocVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVODocVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVODocVO
}

export interface ResultDocVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DocVO
}

/**
 * 导入试卷
 * 导入试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postDocAdminImportApi = (data: {
  /* Excel文件 */
  file: File
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultVoid>('/doc/admin/import', data, config)
}

/**
 * 创建试卷
 * 创建试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultLong>
 */
export const postDocAdminCreateApi = (data: DocCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultLong>('/doc/admin/create', data, config)
}

/**
 * 查询试卷列表（分页）
 * 查询试卷列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVODocVO>
 */
export const getDocAdminListApi = (params?: DocQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVODocVO>('/doc/admin/list', { params, ...config })
}

/**
 * 下载试卷导入模板
 * 下载试卷导入模板
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<any>
 */
export const getDocAdminExportTemplateApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.download('/doc/admin/exportTemplate', config)
}

/**
 * 根据ID查询试卷详情
 * 根据ID查询试卷详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultDocVO>
 */
export const getDocAdminDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultDocVO>(`/doc/admin/details/${params?.id}`, config)
}

/**
 * 批量删除试卷
 * 批量删除试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteDocAdminBatchDeleteApi = (params?: {
  ids: number[]
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/doc/admin/batchDelete', { params, ...config })
}

