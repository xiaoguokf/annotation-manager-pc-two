import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface DicVersionCmd {
  /* 版本名称 */
  name: string
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

export interface DicSubjectCmd {
  /* 学科代码（原系统学科编码） */
  code?: number
  /* 学科名称 */
  subjectName: string
  /* 类型：1-书籍，2-试卷 */
  type?: number
  /* docx 学科枚举（1语文 2数学 3英语 4物理 5化学 6生物 7历史 8地理 9思想政治/道德与法治 10日语 11俄语）
 <p>
 交付输出使用该值，与题型字典的 subject_code 对应 */
  docxCode: number
}

export interface DicPublisherCmd {
  /* 出版社名称 */
  name: string
}

export interface DicGradeCmd {
  /* 年级名称 */
  gradeName: string
}

export interface DicBookLabelCmd {
  /* 名称 */
  name: string
  /* 描述 */
  remark: string
}

export interface DicVersionQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 版本名称（模糊查询） */
  name?: string
}

export interface DicVersionVO {
  /* ID */
  id: string
  /* 版本名称 */
  name: string
}

export interface PageVODicVersionVO {
  /* 记录数据 */
  records?: DicVersionVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVODicVersionVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVODicVersionVO
}

export interface DicSubjectVO {
  /* ID */
  id: string
  /* 学科代码 */
  code: number
  /* 学科名称 */
  subjectName: string
  /* 类型：1-书籍，2-试卷 */
  type?: number
  /* docx 学科枚举（交付输出使用，与题型字典 subject_code 对应） */
  docxCode?: number
}

export interface ResultListDicSubjectVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicSubjectVO[]
}

export interface DicPublisherQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 出版社名称（模糊查询） */
  name?: string
}

export interface DicPublisherVO {
  /* ID */
  id: string
  /* 出版社名称 */
  name: string
}

export interface PageVODicPublisherVO {
  /* 记录数据 */
  records?: DicPublisherVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVODicPublisherVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVODicPublisherVO
}

export interface DicGradeQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 年级名称（模糊查询） */
  gradeName?: string
}

export interface DicGradeVO {
  /* ID */
  id: string
  /* 年级名称 */
  gradeName: string
}

export interface PageVODicGradeVO {
  /* 记录数据 */
  records?: DicGradeVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVODicGradeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVODicGradeVO
}

export interface DicBookLabelQuery {
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
  /* 教辅内容标签名称（模糊查询） */
  name?: string
}

export interface DicBookLabelVO {
  /* ID */
  id: string
  /* 名称 */
  name: string
  /* 描述 */
  remark: string
}

export interface PageVODicBookLabelVO {
  /* 记录数据 */
  records?: DicBookLabelVO[]
  /* 记录条数 */
  total?: number
  /* 页面大小 */
  size?: number
  /* 页号 */
  current?: number
}

export interface ResultPageVODicBookLabelVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: PageVODicBookLabelVO
}

/**
 * 更新版本
 * 更新版本
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminDicVersionUpdateApi = (data: DicVersionCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/admin/dic/version/update/${params.id}`, data, config)
}

/**
 * 更新学科（含 docx 学科枚举）
 * 更新学科（含 docx 学科枚举）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminDicSubjectUpdateApi = (data: DicSubjectCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/admin/dic/subject/update/${params.id}`, data, config)
}

/**
 * 更新出版社
 * 更新出版社
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminDicPublisherUpdateApi = (data: DicPublisherCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/admin/dic/publisher/update/${params.id}`, data, config)
}

/**
 * 更新年级
 * 更新年级
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminDicGradeUpdateApi = (data: DicGradeCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/admin/dic/grade/update/${params.id}`, data, config)
}

/**
 * 更新教辅内容标签
 * 更新教辅内容标签
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putAdminDicBookLabelUpdateApi = (data: DicBookLabelCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/admin/dic/book-label/update/${params.id}`, data, config)
}

/**
 * 创建版本
 * 创建版本
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminDicVersionCreateApi = (data: DicVersionCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/dic/version/create', data, config)
}

/**
 * 创建学科
 * 创建学科
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminDicSubjectCreateApi = (data: DicSubjectCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/dic/subject/create', data, config)
}

/**
 * 创建出版社
 * 创建出版社
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminDicPublisherCreateApi = (data: DicPublisherCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/dic/publisher/create', data, config)
}

/**
 * 创建年级
 * 创建年级
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminDicGradeCreateApi = (data: DicGradeCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/dic/grade/create', data, config)
}

/**
 * 创建教辅内容标签
 * 创建教辅内容标签
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postAdminDicBookLabelCreateApi = (data: DicBookLabelCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/admin/dic/book-label/create', data, config)
}

/**
 * 查询版本列表（分页）
 * 查询版本列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVODicVersionVO>
 */
export const getAdminDicVersionListApi = (params?: DicVersionQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVODicVersionVO>('/admin/dic/version/list', { params, ...config })
}

/**
 * 查询学科列表（管理端，含 docx 学科枚举）
 * 查询学科列表（管理端，含 docx 学科枚举）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicSubjectVO>
 */
export const getAdminDicSubjectListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicSubjectVO>('/admin/dic/subject/list', { params, ...config })
}

/**
 * 查询出版社列表（分页）
 * 查询出版社列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVODicPublisherVO>
 */
export const getAdminDicPublisherListApi = (params?: DicPublisherQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVODicPublisherVO>('/admin/dic/publisher/list', { params, ...config })
}

/**
 * 查询年级列表（分页）
 * 查询年级列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVODicGradeVO>
 */
export const getAdminDicGradeListApi = (params?: DicGradeQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVODicGradeVO>('/admin/dic/grade/list', { params, ...config })
}

/**
 * 查询教辅内容标签列表（分页）
 * 查询教辅内容标签列表（分页）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultPageVODicBookLabelVO>
 */
export const getAdminDicBookLabelListApi = (params?: DicBookLabelQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultPageVODicBookLabelVO>('/admin/dic/book-label/list', { params, ...config })
}

/**
 * 删除学科
 * 删除学科
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteAdminDicSubjectDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/admin/dic/subject/delete/${params.id}`, config)
}

