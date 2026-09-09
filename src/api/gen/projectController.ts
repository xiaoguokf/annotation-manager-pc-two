import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface ProjectProblemSubmitCmd {
  /* 问题类型：no_answer-无答案，missing_page-缺页，no_questions-整本无题，listening-听力相关，other-其他 */
  problemType: string
  /* 问题备注（当问题类型为other时必填） */
  problemRemark?: string
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

export interface ProjectReviewCmd {
  /* 是否通过 */
  pass: boolean
}

export interface ProjectReassignCmd {
  /* 项目ID */
  projectId: string
  /* 目标用户ID */
  userId: string
}

export interface MaterialReviewCmd {
  /* 是否通过 */
  pass: boolean
}

export interface ProjectChangeSearchIdCmd {
  /* 项目ID */
  projectId: string
  /* 新的SearchId */
  newSearchId: string
}

export interface ProjectPublishCmd {
  /* 项目ID（AtdBook或AtdDoc的ID） */
  projectId: string
  /* 类型：0-书籍，1-试卷 */
  type: number
}

export interface SubmitMaterialReviewCmd {
  /* 项目ID */
  projectId: string
}

export interface ProjectReviewQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功 */
  status?: number
  /* 搜索id */
  searchId?: string
  /* 标题 */
  title?: string
}

export interface ProjectReviewListVO {
  /* 项目ID */
  projectId: string
  /* 搜索id */
  searchId: string
  /* 项目名称 */
  title: string
  /* 类型：0-书籍，1-试卷 */
  type: number
  /* 审核领取时间 */
  reviewClaimTime: string
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功 */
  status: number
}

export interface PageVOProjectReviewListVO {
  /* 记录数据 */
  records?: ProjectReviewListVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOProjectReviewListVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOProjectReviewListVO
}

export interface IsbnCheckVO {
  /* ISBN编号 */
  isbn: string
  /* 是否重复（true-书籍已存在，false-书籍不存在） */
  isbnDuplicate: boolean
  /* 检查时间 */
  checkTime: string
}

export interface ResultIsbnCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: IsbnCheckVO
}

export interface ProjectClaimQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 状态：1-已领取，2-已提交(审核中)，3-中途提交，4-审核失败，5-审核通过，6-问题提交,7-管理员回收 */
  status?: number
  /* 搜索id */
  searchId?: string
  /* 标题 */
  title?: string
}

export interface ProjectClaimListVO {
  /* 项目ID */
  projectId: string
  /* 搜索id */
  searchId: string
  /* 项目名称 */
  title: string
  /* 类型：0-书籍，1-试卷 */
  type: number
  /* 领取时间 */
  createTime: string
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功，7-已回传，8-解析中，9-解析失败，10-问题提交,11-回传失败,12-管理员打回,13-回传中 */
  status: number
  /* 状态：1-已领取，2-已提交(审核中)，3-中途提交，4-审核失败，5-审核通过，6-问题提交,7-管理员回收 */
  taskStatus: number
  /* 管理员回传阶段：1-书籍信息已回传成功，2-内容页已回传成功 */
  summitStep?: number
}

export interface PageVOProjectClaimListVO {
  /* 记录数据 */
  records?: ProjectClaimListVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOProjectClaimListVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOProjectClaimListVO
}

export interface ProjectClaimHistoryQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 项目ID */
  projectId?: string
}

export interface ProjectClaimHistoryVO {
  /* 领取记录ID */
  id: string
  /* 项目ID */
  projectId: string
  /* 姓名 */
  nickname: string
  /* 用户名 */
  username: string
  /* 领取时间 */
  createTime: string
  /* 状态：1-已领取，2-已提交(审核中)，3-中途提交，4-审核失败，5-审核通过，6-问题提交,7-管理员回收 */
  status: number
}

export interface PageVOProjectClaimHistoryVO {
  /* 记录数据 */
  records?: ProjectClaimHistoryVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOProjectClaimHistoryVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOProjectClaimHistoryVO
}

/**
 * 问题提交
 * 问题提交
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectSubmitProblemApi = (data: ProjectProblemSubmitCmd, params?: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/submit/problem/${params?.projectId}`, data, params ? { params, ...config } : config)
}

/**
 * 未完成提交审核
 * 未完成提交审核
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectSubmitIncompleteApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/submit/incomplete/${params?.projectId}`, config)
}

/**
 * 完成提交审核
 * 完成提交审核
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectSubmitCompleteApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/submit/complete/${params?.projectId}`, config)
}

/**
 * 审核项目
 * 审核项目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectReviewApi = (data: ProjectReviewCmd, params?: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/review/${params?.projectId}`, data, params ? { params, ...config } : config)
}

/**
 * 管理员打回项目
 * 管理员打回项目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectRejectApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/reject/${params?.projectId}`, config)
}

/**
 * 管理员回收项目
 * 管理员回收项目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectReclaimApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/reclaim/${params?.projectId}`, config)
}

/**
 * 重派发项目
 * 重派发项目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectReassignApi = (data: ProjectReassignCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/project/reassign', data, config)
}

/**
 * 资料审核（审核同学审核）
 * 资料审核（审核同学审核）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectMaterialReviewApi = (data: MaterialReviewCmd, params?: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/project/material/review/${params?.projectId}`, data, params ? { params, ...config } : config)
}

/**
 * 修改项目SearchId
 同时修改对应的Book或Doc的id，并清空回传记录
 * 修改项目SearchId
 同时修改对应的Book或Doc的id，并清空回传记录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putProjectChangeSearchIdApi = (data: ProjectChangeSearchIdCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/project/change-search-id', data, config)
}

/**
 * 领取审核任务
 * 领取审核任务
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectReviewClaimApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/project/review/claim', config)
}

/**
 * 按searchId领取审核任务
 * 按searchId领取审核任务
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectReviewClaimSearchIdApi = (params: {
  searchId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/project/review/claim/search-id/${params?.searchId}`, config)
}

/**
 * 发布书籍/试卷
 * 发布书籍/试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectPublishApi = (data: ProjectPublishCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/project/publish', data, config)
}

/**
 * 提交资料审核
 * 提交资料审核
 用户填写完书籍信息和内容页后，提交进入资料审核状态
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectMaterialSubmitApi = (data: SubmitMaterialReviewCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/project/material/submit', data, config)
}

/**
 * 领取书籍/试卷（自动领取待领取状态中时间最早的第一个项目）
 * 领取书籍/试卷（自动领取待领取状态中时间最早的第一个项目）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectClaimApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/project/claim', config)
}

/**
 * 按searchId领取书籍/试卷
 * 按searchId领取书籍/试卷
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postProjectClaimSearchIdApi = (params: {
  searchId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/project/claim/search-id/${params?.searchId}`, config)
}

/**
 * 查询审核列表
 * 查询审核列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOProjectReviewListVO>
 */
export const getProjectReviewListApi = (params?: ProjectReviewQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOProjectReviewListVO>('/project/review/list', { params, ...config })
}

/**
 * ISBN查重
 * ISBN查重
 单独调用百度查重接口，方便提交资料审核前核对ISBN
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultIsbnCheckVO>
 */
export const getProjectMaterialIsbnCheckApi = (params?: {
  isbn: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultIsbnCheckVO>('/project/material/isbnCheck', { params, ...config })
}

/**
 * 查询领书列表
 * 查询领书列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOProjectClaimListVO>
 */
export const getProjectClaimedListApi = (params?: ProjectClaimQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOProjectClaimListVO>('/project/claimed/list', { params, ...config })
}

/**
 * 查询领取历史
 * 查询领取历史
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOProjectClaimHistoryVO>
 */
export const getProjectClaimHistoryListApi = (params?: ProjectClaimHistoryQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOProjectClaimHistoryVO>('/project/claimHistory/list', { params, ...config })
}

