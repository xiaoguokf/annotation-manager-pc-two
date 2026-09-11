import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface UserInfoUpdateCmd {
  id: string
  /* 邮箱 */
  email?: string
  /* 昵称 */
  nickname?: string
  /* 手机 */
  phone?: string
  /* 备注 */
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

export interface DisableUserCmd {
  /* 用户id */
  id: string
  /* 是否启用 */
  enable: boolean
}

export interface ChangePwdCmd {
  /* 用户id */
  id?: string
  /* 新密码 */
  password?: string
}

export interface UserRoleAssignCmd {
  id: string
  roleIds: string[]
}

export interface UserAddCmd {
  /* 用户名 */
  username?: string
  /* 邮箱 */
  email?: string
  /* 是否启用 */
  enable?: boolean
  /* 密码 */
  password?: string
  /* 昵称 */
  nickname?: string
  /* 手机 */
  phone?: string
  /* 备注 */
  remark?: string
}

export interface UserQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 用户名/昵称 */
  keyword?: string
  /* 用户状态 */
  enable?: boolean
  /* 手机号 */
  phone?: string
  /* 邮箱 */
  email?: string
}

export interface UserRoleVO {
  id?: string
  name?: string
  code?: string
}

export interface UserInfoVO {
  id?: string
  /* 用户名 */
  username?: string
  /* 邮箱 */
  email?: string
  /* 角色id */
  roles?: UserRoleVO[]
  /* 是否启用 */
  enable?: boolean
  /* 创建时间 */
  createTime?: string
  /* 昵称 */
  nickname?: string
  /* 手机 */
  phone?: string
  /* 备注 */
  remark?: string
}

export interface PageVOUserInfoVO {
  /* 记录数据 */
  records?: UserInfoVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOUserInfoVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOUserInfoVO
}

/**
 * 修改用户信息
 * 修改用户信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminUserUpdateInfoApi = (data: UserInfoUpdateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/user/update-info', data, config)
}

/**
 * 禁用用户
 * 禁用用户
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminUserDisableApi = (data: DisableUserCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/user/disable', data, config)
}

/**
 * 修改密码
 * 修改密码
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminUserChangePasswordApi = (data: ChangePwdCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/user/change-password', data, config)
}

/**
 * 分配角色
 * 分配角色
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminUserAssignRoleApi = (data: UserRoleAssignCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/admin/user/assign-role', data, config)
}

/**
 * 管理员注册用户
 * 管理员注册用户
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminUserAddApi = (data: UserAddCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/user/add', data, config)
}

/**
 * 获取用户列表
 * 获取用户列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOUserInfoVO>
 */
export const getAdminUserListApi = (params?: UserQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOUserInfoVO>('/admin/user/list', { params, ...config })
}

/**
 * 删除用户
 * 删除用户
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAdminUserApi = (params?: {
  id: string[]
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/admin/user', { params, ...config })
}

