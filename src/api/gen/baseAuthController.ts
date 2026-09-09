import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface LoginByRefreshTokenCmd {
  refreshToken?: string
}

export interface UserVO {
  /* 用户名 */
  username?: string
  /* 角色列表 */
  roles?: string[]
}

export interface TokenVO {
  /* token值-访问token */
  token?: string
  /* 刷新token值 */
  refreshToken?: string
  refreshTokenTimeOut?: number
  /* token有效期 */
  tokenTimeout?: number
  /* 用户信息 */
  user?: UserVO
}

export interface ResultTokenVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: TokenVO
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

export interface LoginCmd {
  /* 用户名 */
  username: string
  /* 密码（明文或RSA加密后的密文） */
  password: string
  /* 密钥UUID，密钥认证时必传 */
  uuid?: string
}

export interface SecretVO {
  /* 公钥 */
  pubKey?: string
  /* 公钥id */
  uuid?: string
  /* 创建时间戳（毫秒） */
  createTime?: number
  /* 有效时间（秒） */
  expireTime?: number
}

export interface ResultSecretVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: SecretVO
}

/**
 * 刷新token登陆
 * 刷新token登陆
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultTokenVO>
 */
export const postAuthRefreshTokenApi = (data: LoginByRefreshTokenCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultTokenVO>('/auth/refreshToken', data, config)
}

/**
 * 登出
 * 登出
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAuthLogoutApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/auth/logout', config)
}

/**
 * 登陆
 * 登陆
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultTokenVO>
 */
export const postAuthLoginApi = (data: LoginCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultTokenVO>('/auth/login', data, config)
}

/**
 * 获取密钥
 * 获取密钥
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultSecretVO>
 */
export const getAuthGenSecretApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultSecretVO>('/auth/genSecret', config)
}

