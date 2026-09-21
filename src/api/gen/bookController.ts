import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface BookUpdateCmd {
  /* 书籍名称 */
  title: string
  /* 学科ID（枚举，与amis平台一致） */
  subjectId?: string
  /* 册别ID（枚举） */
  volumeId?: string
  /* 书籍版本ID（枚举） */
  bookVersionId?: string
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

export interface ResultBookVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: BookVO
}

/**
 * 更新书籍
 * 更新书籍
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putBookInfoUpdateApi = (data: BookUpdateCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/book/info/update/${params.id}`, data, config)
}

/**
 * 查询书籍详情
 * 查询书籍详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultBookVO>
 */
export const getBookInfoDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultBookVO>(`/book/info/details/${params.id}`, config)
}

