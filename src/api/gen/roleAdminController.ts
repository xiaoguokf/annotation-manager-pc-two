import http from '@/utils/http'
import type { ShortClipRequestConfig } from '@/utils/http'

export interface RoleUpdateCmd {
  id: string
  name?: string
  remark?: string
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

export interface RoleQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 角色名称 */
  name?: string
  /* 角色编码 */
  code?: string
}

export interface RoleInfoVO {
  /* 角色id */
  id?: string
  /* 角色名称 */
  name?: string
  /* 角色编码 */
  code?: string
  /* 角色描述 */
  remark?: string
  /* 创建时间 */
  createTime?: string
}

export interface PageVORoleInfoVO {
  /* 记录数据 */
  records?: RoleInfoVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVORoleInfoVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVORoleInfoVO
}

export interface ResultListRoleInfoVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: RoleInfoVO[]
}

/**
 * 修改角色消息
 * 修改角色消息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminRoleUpdateApi = (data: RoleUpdateCmd, config?: ShortClipRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/role/update', data, config)
}

/**
 * 获取角色列表
 * 获取角色列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVORoleInfoVO>
 */
export const getAdminRoleListApi = (params?: RoleQuery, config?: ShortClipRequestConfig<any>) => {
  return http.get<ResultPageVORoleInfoVO>('/admin/role/list', { params, ...config })
}

/**
 * 获取角色列表
 * 获取角色列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListRoleInfoVO>
 */
export const getAdminRoleAllApi = (config?: ShortClipRequestConfig<any>) => {
  return http.get<ResultListRoleInfoVO>('/admin/role/all', config)
}

