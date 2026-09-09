import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface TodayStatisticsVO {
  /* 今日题量 */
  todayQuestionCount?: number
  /* 今日回传量 */
  todayReturnCount?: number
  /* 今日领书量 */
  todayClaimCount?: number
  /* 本月回传量 */
  thisMonthReturnCount?: number
  /* 上月回传量 */
  lastMonthReturnCount?: number
}

export interface ResultTodayStatisticsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: TodayStatisticsVO
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

export interface TodayTokenStatisticsVO {
  /* 今日输入token总量 */
  todayInputToken?: number
  /* 今日输出token总量 */
  todayOutputToken?: number
  /* 今日超出token总量 */
  todayExtOutputToken?: number
}

export interface ResultTodayTokenStatisticsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: TodayTokenStatisticsVO
}

export interface TokenDailyStatisticsVO {
  /* 日期 */
  date: string
  /* 输入token总量 */
  inputToken: number
  /* 输出token总量 */
  outputToken: number
  /* 超出token总量 */
  extOutputToken: number
}

export interface ResultListTokenDailyStatisticsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: TokenDailyStatisticsVO[]
}

export interface DailyStatisticsVO {
  /* 日期 */
  date: string
  /* 数量 */
  count: number
}

export interface ResultListDailyStatisticsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DailyStatisticsVO[]
}

/**
 * 获取今日统计数据
 * 获取今日的题量、回传、领书统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultTodayStatisticsVO>
 */
export const getStaticTodayApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultTodayStatisticsVO>('/static/today', config)
}

/**
 * 获取今日Token统计数据
 * 获取今日的inputToken、outputToken、extOutputToken统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultTodayTokenStatisticsVO>
 */
export const getStaticTodayTokenApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultTodayTokenStatisticsVO>('/static/today/token', config)
}

/**
 * 获取本月和上月回传量统计
 * 获取本月和上月的回传数量统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultTodayStatisticsVO>
 */
export const getStaticMonthReturnApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultTodayStatisticsVO>('/static/month/return', config)
}

/**
 * 获取近7日Token统计
 * 获取近7日的Token使用量统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListTokenDailyStatisticsVO>
 */
export const getStaticLast7DaysTokenApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListTokenDailyStatisticsVO>('/static/last7Days/token', config)
}

/**
 * 获取近7日回传量统计
 * 获取近7日的回传数量统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDailyStatisticsVO>
 */
export const getStaticLast7DaysReturnApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDailyStatisticsVO>('/static/last7Days/return', config)
}

/**
 * 获取近7日题量统计
 * 获取近7日的题目数量统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDailyStatisticsVO>
 */
export const getStaticLast7DaysQuestionApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDailyStatisticsVO>('/static/last7Days/question', config)
}

/**
 * 获取近7日领书量统计
 * 获取近7日的领书数量统计
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDailyStatisticsVO>
 */
export const getStaticLast7DaysClaimApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDailyStatisticsVO>('/static/last7Days/claim', config)
}

