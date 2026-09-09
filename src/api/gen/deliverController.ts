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

export interface ProjectSummitRecordVO {
  /* 记录ID */
  id?: string
  /* 项目ID */
  projectId?: string
  /* 阶段：1-信息导入，2-内容页导入，3-目录导入，4-试题导入，5-数据统计 */
  step?: number
  /* 阶段名称 */
  stepName?: string
  /* 状态码：0表示成功，其他表示失败 */
  errorno?: number
  /* 错误信息 */
  errmsg?: string
  /* 创建时间 */
  createTime?: string
  /* 错误提示数据 */
  data?: string
  /* 是否在进行中 */
  doing?: boolean
}

export interface ResultListProjectSummitRecordVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: ProjectSummitRecordVO[]
}

export interface BookInfoDeliverVO {
  date?: string
  importID?: string
  title?: string
  seriesTitle?: string
  isbn?: string
  year?: number
  grade?: string
  subject?: string
  volume?: string
  bookVersion?: string
  publisher?: string
  price?: string
  bookLabel?: string
  hasSpecialVersion?: number
  specialVersionDesc?: string
  province?: string
  city?: string
  sign?: string
}

export interface BookCoverItemDeliver {
  img?: string
  real_page?: number
  content_type?: string
}

export interface BookImgDeliverItem {
  img?: string
  real_page?: number
}

export interface AnswerImgDeliverItem {
  img?: string
  real_page?: number
}

export interface BookImgDeliverVO {
  importID?: string
  book_cover?: BookCoverItemDeliver[]
  book_img?: BookImgDeliverItem[]
  answer_img?: AnswerImgDeliverItem[]
  sign?: string
}

export interface ChapterDeliverVO {
  text?: string
  type?: string
}

export interface ChapterDeliverListVO {
  importID?: string
  chapters?: ChapterDeliverVO[]
  sign?: string
}

export interface QuestionChapterDeliverVO {
  text?: string
  type?: string
  sub?: any
}

export interface QuestionDeliverVO {
  importShitiID?: string
  realPage?: number
  question?: string
  choice?: string[]
  answer?: string
  analysis?: string
  comment?: string
  tishi?: string
  tilei?: string
  difficulty?: string
  subject?: string
  grade?: string
  bookIsbn?: string
  knowledge?: string[]
  chapters?: QuestionChapterDeliverVO
}

export interface QuestionDeliverListVO {
  importID?: string
  shitiList?: QuestionDeliverVO[]
  sign?: string
}

export interface FinishDeliverVO {
  importID?: string
  shitiCount?: number
  sign?: string
}

export interface DeliverVO {
  /* 项目ID */
  projectId: string
  /* 项目标题 */
  title: string
  /* 项目状态：0-未解析，1-待发布，2-待领取，3-已领取，4-待审核，5-审核失败，6-审核成功 */
  status: number
  /* 项目类型：0-书籍，1-试卷 */
  type: number
  /* 书籍信息 (对应接口1: 上传单本书籍) */
  bookInfo?: BookInfoDeliverVO
  /* 图片信息 (对应接口2: 上传单本教辅的目录和答案图片) */
  bookImg?: BookImgDeliverVO
  /* 章节目录 (对应接口3: 上传单本教辅下的所有章节目录) */
  chapters?: ChapterDeliverListVO
  /* 试题列表 (对应接口4: 批量上传教辅试题) */
  shitiList?: QuestionDeliverListVO
  /* 完成信息 (对应接口5: 单本教辅的所有试题上传完毕) */
  finish?: FinishDeliverVO
}

export interface ResultDeliverVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DeliverVO
}

/**
 * 手动回传项目数据
 * 手动回传项目数据到外部接口,管理员不要点击，系统会自动重传,仅急需时使用
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postDeliverSubmitApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/deliver/submit/${params?.projectId}`, config)
}

/**
 * 单步骤提交项目数据
 * 单步骤提交项目数据,仅支持step为1、2、3的提交
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postDeliverSubmitSignApi = (params: {
  projectId: string,
  step: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/deliver/submit/sign/${params?.projectId}/${params?.step}`, config)
}

/**
 * 资料审核回传书籍信息和内容页
 * 资料审核通过后管理员回传书籍信息和内容页
 回传成功后进入做题阶段，每步回传成功后保存回传记录
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postDeliverMaterialApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>(`/deliver/material/${params?.projectId}`, config)
}

/**
 * 获取项目回传记录列表
 * 获取项目回传记录列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListProjectSummitRecordVO>
 */
export const getDeliverRecordsApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListProjectSummitRecordVO>(`/deliver/records/${params?.projectId}`, config)
}

/**
 * 下载导出项目成果交付数据为ZIP
 * 下载导出项目成果交付数据为ZIP
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<any>
 */
export const getDeliverExportApi = (params?: {
  projectId: string,
  validate?: boolean
}, config?: SshineAdminRequestConfig<any>) => {
  return http.download(`/deliver/export/${params?.projectId}`, { params, ...config })
}

/**
 * 获取项目成果交付数据
 * 获取项目成果交付数据
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultDeliverVO>
 */
export const getDeliverDetailsApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultDeliverVO>(`/deliver/details/${params?.projectId}`, config)
}

