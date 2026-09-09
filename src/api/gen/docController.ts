import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface DocUpdateCmd {
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
  term: number
  /* "期中": 1,"期末": 2,"单元测试": 3,"月考": 4,"竞赛": 5,"开学考": 6,"高考真题": 7,"高考模拟": 8, */
  paperType: number
  /* 学段:1-小学，2-初中，3-高中 */
  stepId: string
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

export interface ResultDocVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DocVO
}

/**
 * 更新试卷
 * 更新试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putDocInfoUpdateApi = (data: DocUpdateCmd, params?: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/doc/info/update/${params?.id}`, data, params ? { params, ...config } : config)
}

/**
 * 查询试卷详情
 * 查询试卷详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultDocVO>
 */
export const getDocInfoDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultDocVO>(`/doc/info/details/${params?.id}`, config)
}

