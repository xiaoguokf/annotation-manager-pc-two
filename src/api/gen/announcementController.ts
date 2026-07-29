import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

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

export interface PageQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
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

/**
 * 获取公告详情
 * 获取公告详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultAnnouncementVO>
 */
export const getAnnouncementApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultAnnouncementVO>('/announcement/{id}', config)
}

/**
 * 分页获取启用的公告列表
 * 分页获取启用的公告列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOAnnouncementVO>
 */
export const getAnnouncementListApi = (params?: PageQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOAnnouncementVO>('/announcement/list', { params, ...config })
}

