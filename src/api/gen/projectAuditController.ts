import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface ProjectAuditHandleCmd {
  /* 处理内容 */
  handContent?: string
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

export interface ProjectAuditCreateCmd {
  /* 类型：1-书籍（试卷信息）审核，2-内容页审核，3-目录审核，4-题目审核 */
  type: number
  /* 项目ID */
  projectId: string
  /* 定位ID */
  objectId?: string
  /* 审核反馈内容 */
  content: string
}

export interface ResultLong {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: number
}

export interface ProjectAuditVO {
  /* 审核ID */
  id: string
  /* 类型：1-书籍（试卷信息）审核，2-内容页审核，3-目录审核，4-题目审核 */
  type: number
  /* 项目ID */
  projectId: string
  /* 定位ID */
  objectId?: string
  /* 审核用户ID */
  auditUserId: string
  /* 处理用户ID */
  handUserId?: string
  /* 处理人姓名 */
  nickname?: string
  /* 处理人用户名 */
  username?: string
  /* 审核反馈内容 */
  content?: string
  /* 处理内容 */
  handContent?: string
  /* 创建时间 */
  createTime: string
  /* 处理时间 */
  handTime?: string
  /* 是否已处理 */
  passed: boolean
}

export interface ResultListProjectAuditVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: ProjectAuditVO[]
}

/**
 * 处理审核
 * 处理审核
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAuditProjectHandleApi = (data: ProjectAuditHandleCmd, params: {
  auditId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/audit/project/handle/${params.auditId}`, data, config)
}

/**
 * 创建审核
 * 创建审核
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultLong>
 */
export const postAuditProjectCreateApi = (data: ProjectAuditCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultLong>('/audit/project/create', data, config)
}

/**
 * 查询项目审核列表
 * 查询项目审核列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListProjectAuditVO>
 */
export const getAuditProjectListApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListProjectAuditVO>(`/audit/project/list/${params.projectId}`, config)
}

/**
 * 删除审核
 * 删除审核
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAuditProjectDeleteApi = (params: {
  auditId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/audit/project/delete/${params.auditId}`, config)
}

