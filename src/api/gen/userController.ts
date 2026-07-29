import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface RegisterCmd {
  /* 用户名 */
  username: string
  /* 密码 */
  password: string
  /* 邮箱 */
  email: string
  /* 验证码 */
  code: string
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

export interface RegisterMailCmd {
  /* 邮箱 */
  email: string
}

export interface ForgetCmd {
  /* 密码 */
  password: string
  /* 邮箱 */
  email: string
  /* 验证码 */
  code: string
}

export interface ForgetMailCmd {
  /* 邮箱 */
  email: string
}

export interface ChangeMyPwdCmd {
  /* 原密码 */
  oldPassword: string
  /* 新密码 */
  password: string
}

export interface UserSelectorQuery {
  /* 用户名或名称 */
  keyword?: string
}

export interface UserSelector {
  id: string
  /* 用户名 */
  username: string
  /* 昵称 */
  nickname?: string
}

export interface ResultListUserSelector {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: UserSelector[]
}

export interface UserRoleVO {
  id?: string
  name?: string
  code?: string
}

export interface MyUserInfoVO {
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
}

export interface ResultMyUserInfoVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: MyUserInfoVO
}

export interface UserAccountVO {
  coin?: number
}

export interface ResultUserAccountVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: UserAccountVO
}

/**
 * 注册用户
 * 注册用户
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postUserRegisterApi = (data: RegisterCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/user/register', data, config)
}

/**
 * 发送注册邮件
 * 发送注册邮件
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postUserRegisterMailApi = (data: RegisterMailCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/user/register/mail', data, config)
}

/**
 * 忘记密码
 * 忘记密码
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postUserForgetApi = (data: ForgetCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/user/forget', data, config)
}

/**
 * 发送忘记密码邮件
 * 发送忘记密码邮件
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postUserForgetMailApi = (data: ForgetMailCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/user/forget/mail', data, config)
}

/**
 * 修改密码
 * 修改密码
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postUserChangePasswordApi = (data: ChangeMyPwdCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/user/change-password', data, config)
}

/**
 * 用户账户选择器
 * 用户账户选择器
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListUserSelector>
 */
export const getUserSelectorApi = (params?: UserSelectorQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListUserSelector>('/user/selector', { params, ...config })
}

/**
 * 我的账户信息
 * 我的账户信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultMyUserInfoVO>
 */
export const getUserInfoApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultMyUserInfoVO>('/user/info', config)
}

/**
 * 用户账户信息
 * 用户账户信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultUserAccountVO>
 */
export const getUserAccountApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultUserAccountVO>('/user/account', config)
}

