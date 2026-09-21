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

export interface BookCreateWithPdfCmd {
  /* 上传任务ID */
  uploadId: string
  fileName: string
}

export interface ResultString {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: string
}

export interface BookQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 书籍名称（模糊查询） */
  title?: string
  /* 书籍导入ID（模糊查询） */
  importId?: string
  /* PDF名称（模糊查询） */
  pdfName?: string
  /* 状态数组，支持多选：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功，7-已回传，8-解析中，9-解析失败 */
  status?: number[]
  /* 是否仅查询已完结书籍（已回传和问题提交状态） */
  onlyFinished?: boolean
  /* 创建时间开始（范围查询）yyyy-MM-dd */
  createTimeStart?: string
  /* 创建时间结束（范围查询）yyyy-MM-dd */
  createTimeEnd?: string
  /* 更新时间开始（范围查询） yyyy-MM-dd */
  updateTimeStart?: string
  /* 更新时间结束（范围查询） yyyy-MM-dd */
  updateTimeEnd?: string
}

export interface BookVO {
  /* 书籍ID */
  id: string
  /* 书籍名称 */
  title: string
  /* 书籍导入ID */
  importId?: string
  /* 学科ID（枚举，与amis平台一致） */
  subjectId?: string
  /* 册别ID（枚举） */
  volumeId?: string
  /* 书籍版本ID（枚举） */
  bookVersionId?: string
  /* 状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功，7-已回传，8-解析中，9-解析失败 */
  status?: number
  /* 创建人 */
  createBy?: string
  /* 更新人 */
  updateBy?: string
  /* 创建时间 */
  createTime?: string
  /* 更新时间 */
  updateTime?: string
  /* 页面大小 */
  size?: number
  /* 加载完的数据 */
  loadPage?: number
  /* 采集人 */
  atUserName?: string
  /* 采集昵称 */
  atNickname?: string
  /* 审核人 */
  reviewUserName?: string
  /* 审核昵称 */
  reviewNickname?: string
  /* 是否问题提交 */
  isProblemSubmit?: boolean
  /* 问题类型：no_answer-无答案，missing_page-缺页，no_questions-整本无题，listening-听力相关，other-其他 */
  problemType?: string
  /* 问题备注 */
  problemRemark?: string
  /* 领取时间 */
  claimTime?: string
  /* 做题数量 */
  questionCount: number
  /* 提交时间 */
  summitTime?: string
  /* pdf名称 */
  pdfName: string
  /* 学段：1-小学，2-初中，3-高中 */
  phase?: number
  /* docx 学科枚举（1语文 2数学 3英语 4物理 5化学 6生物 7历史 8地理 9思想政治/道德与法治 10日语 11俄语） */
  subjectCode?: number
  /* 册次中文（上册/下册/全一册） */
  volume?: string
  /* 版本中文（人教版/北师大版） */
  edition?: string
  /* 教辅版本号（supTreeVersion） */
  supTreeVersion?: string
  /* 原始学校名称（originSchoolName） */
  originSchoolName?: string
  /* 教辅树状态（supStatus） */
  supStatus?: number
}

export interface PageVOBookVO {
  /* 记录数据 */
  records?: BookVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVOBookVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVOBookVO
}

export interface ResultListBookVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: BookVO[]
}

export interface ResultBookVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: BookVO
}

/**
 * 重试解析PDF
 * 重试解析PDF
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postBookAdminRetryPdfApi = (params: {
  bookId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/book/admin/retryPdf/${params.bookId}`, null, config)
}

/**
 * 导入书籍
 * 导入书籍
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postBookAdminImportApi = (data: {
  /* Excel文件 */
  file: File
}, config?: SshineAdminRequestConfig<any>) => {
  return http.postForm<ResultVoid>('/book/admin/import', data, config)
}

/**
 * 通过fileId创建书籍并解析PDF
 * 通过fileId创建书籍并解析PDF
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultString>
 */
export const postBookAdminCreateWithPdfApi = (data: BookCreateWithPdfCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultString>('/book/admin/createWithPdf', data, config)
}

/**
 * 查询书籍列表（分页）
 * 查询书籍列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVOBookVO>
 */
export const getBookAdminListApi = (params?: BookQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVOBookVO>('/book/admin/list', { params, ...config })
}

/**
 * 根据ID列表查询书籍
 * 根据ID列表查询书籍
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListBookVO>
 */
export const getBookAdminListByIdsApi = (params?: {
  ids: string[]
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListBookVO>('/book/admin/listByIds', { params, ...config })
}

/**
 * 下载书籍导入模板
 * 下载书籍导入模板
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<any>
 */
export const getBookAdminExportTemplateApi = (config?: SshineAdminRequestConfig<any>) => {
  return http.download('/book/admin/exportTemplate', { method: 'GET', ...config })
}

/**
 * 根据ID查询书籍详情
 * 根据ID查询书籍详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultBookVO>
 */
export const getBookAdminDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultBookVO>(`/book/admin/details/${params.id}`, config)
}

/**
 * 批量删除书籍
 * 批量删除书籍
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteBookAdminBatchDeleteApi = (params?: {
  ids: string[]
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>('/book/admin/batchDelete', { params, ...config })
}

