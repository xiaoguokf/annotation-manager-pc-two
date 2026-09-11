import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

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

export interface OssDailyStatsVO {
  /* 日期（yyyy-MM-dd） */
  date?: string
  /* 当日成功次数 */
  successCount?: number
  /* 当日失败次数 */
  failureCount?: number
  /* 当日平均上传耗时（毫秒） */
  avgUploadTimeMs?: number
}

export interface OssStatsVO {
  /* 当前使用的域名 */
  currentDomain?: string
  /* 主域名 */
  primaryDomain?: string
  /* 备用域名 */
  backupDomain?: string
  /* 失败切换阈值（窗口内次数） */
  failureThreshold: number
  /* 失败计数滑动窗口时长（毫秒） */
  failureWindowMs: number
  /* 基础冷却时长（毫秒） */
  baseCooldownMs: number
  /* 最大冷却时长（毫秒） */
  maxCooldownMs: number
  /* 当前窗口内失败次数 */
  currentFailureCount: number
  /* 是否正在使用备用域名 */
  usingBackup: boolean
  /* 连续切换到备用域名的次数 */
  consecutiveSwitchCount: number
  /* 冷却期剩余时间（毫秒），仅在备用域名状态下有效 */
  cooldownRemainingMs?: number
  /* 历史总切换次数 */
  totalSwitchCount: number
  /* 是否处于手动切换模式 */
  manualMode: boolean
  /* 手动切换固定冷却时长（毫秒） */
  manualSwitchCooldownMs?: number
  /* 近三日每日统计数据（按日期升序） */
  last3DaysStats?: OssDailyStatsVO[]
  /* 近500次上传的平均延迟（毫秒） */
  recentAvgLatencyMs?: number
  /* 近500次延迟统计的样本数 */
  recentLatencySampleCount?: number
  /* 近500次延迟统计窗口大小 */
  recentLatencyWindowSize?: number
}

export interface ResultOssStatsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: OssStatsVO
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

export interface AllDomainsVO {
  /* 教学域名列表（用于分发） */
  teachingDomains?: string[]
}

export interface ResultAllDomainsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: AllDomainsVO
}

/**
 * 手动切换回主域名
 * 手动将 OSS 域名切换回主域名
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postStaticOssSwitchToPrimaryApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/static/oss/switch-to-primary', null, config)
}

/**
 * 手动切换到备用域名
 * 手动将 OSS 域名切换到备用域名，固定冷却6小时后自动恢复
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postStaticOssSwitchToBackupApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/static/oss/switch-to-backup', null, config)
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
 * 获取 OSS 监控统计
 * 获取 OSS 的成功/失败次数、平均上传耗时、当前域名、切换阈值等监控信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultOssStatsVO>
 */
export const getStaticOssApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultOssStatsVO>('/static/oss', config)
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

/**
 * 获取全部域名展示
 * 获取教学域名列表以及 OSS 当前/主/备用域名等全部域名信息
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultAllDomainsVO>
 */
export const getStaticDomainsApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultAllDomainsVO>('/static/domains', config)
}

