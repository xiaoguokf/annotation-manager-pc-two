import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface AnnouncementSaveCmd {
  id?: string
  title: string
  content?: string
  status?: boolean
  isTop?: boolean
  startTime?: string
  endTime?: string
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

export interface AnnouncementVO {
  /* 公告id */
  id?: string
  /* 公告标题 */
  title?: string
  /* 公告内容 */
  content?: string
  /* 状态(0-禁用,1-启用) */
  status?: boolean
  /* 是否置顶(0-否,1-是) */
  isTop?: boolean
  /* 生效开始时间 */
  startTime?: string
  /* 生效结束时间 */
  endTime?: string
  /* 创建时间 */
  createTime?: string
  /* 更新时间 */
  updateTime?: string
}

export interface ResultAnnouncementVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: AnnouncementVO
}

export interface AnnouncementQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 公告标题 */
  title?: string
  /* 状态 */
  status?: boolean
}

export interface PageVOAnnouncementVO {
  /* 记录数据 */
  records?: AnnouncementVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOAnnouncementVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOAnnouncementVO
}

export interface PageQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

/**
 * 修改公告
 * 修改公告
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminAnnouncementApi = (data: AnnouncementSaveCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/announcement', data, config)
}

/**
 * 新增公告
 * 新增公告
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminAnnouncementApi = (data: AnnouncementSaveCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/announcement', data, config)
}

/**
 * 切换公告状态(0-禁用,1-启用)
 * 切换公告状态(0-禁用,1-启用)
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminAnnouncementStatusApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/announcement/{id}/status', null, config)
}

/**
 * 根据ID获取公告详情
 * 根据ID获取公告详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultAnnouncementVO>
 */
export const getAdminAnnouncementApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultAnnouncementVO>('/admin/announcement/{id}', config)
}

/**
 * 删除公告
 * 删除公告
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAdminAnnouncementApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/admin/announcement/{id}', config)
}

/**
 * 分页查询公告列表
 * 分页查询公告列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOAnnouncementVO>
 */
export const getAdminAnnouncementListApi = (params?: AnnouncementQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOAnnouncementVO>('/admin/announcement/list', { params, ...config })
}

/**
 * 分页获取启用的公告
 * 分页获取启用的公告
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOAnnouncementVO>
 */
export const getAdminAnnouncementEnabledApi = (params?: PageQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOAnnouncementVO>('/admin/announcement/enabled', { params, ...config })
}

/**
 * 批量删除公告
 * 批量删除公告
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAdminAnnouncementBatchApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/admin/announcement/batch', config)
}

