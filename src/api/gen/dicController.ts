import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface DicVolumeVO {
  /* ID */
  id: string
  /* 册别名 */
  name: string
}

export interface ResultListDicVolumeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicVolumeVO[]
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

export interface DicVersionVO {
  /* ID */
  id: string
  /* 版本名称 */
  name: string
}

export interface ResultListDicVersionVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicVersionVO[]
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

export interface DicQuestionTypeVO {
  /* 主键 */
  id: string
  /* 学科枚举（1~11） */
  subjectCode: number
  /* 题型枚举值（docx） */
  typeCode: number
  /* 题型名 */
  typeName: string
  /* 排序 */
  sortNo: number
  /* 基础题型：0-填空型，1-选择型 */
  baseType: number
  /* 题型大类ID，关联 atd_dic_question_category */
  categoryId: string
  /* 题型大类名（听力/阅读/写作表达/语法词汇/实验探究/综合/基础概念/其他） */
  categoryName: string
  /* 是否选择类型：1-选择型，0-填空型（由 baseType 派生，等于 baseType，仅作兼容暴露） */
  isChoice: number
}

export interface ResultListDicQuestionTypeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicQuestionTypeVO[]
}

export interface DicPublisherVO {
  /* ID */
  id: string
  /* 出版社名称 */
  name: string
}

export interface ResultListDicPublisherVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicPublisherVO[]
}

export interface DicGradeVO {
  /* ID */
  id: string
  /* 年级名称 */
  gradeName: string
}

export interface ResultListDicGradeVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicGradeVO[]
}

export interface DicBookLabelVO {
  /* ID */
  id: string
  /* 名称 */
  name: string
  /* 描述 */
  remark: string
}

export interface ResultListDicBookLabelVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicBookLabelVO[]
}

export interface DicAdministrativeDivisionVO {
  /* 主键ID */
  id: string
  /* 行政区划代码 */
  code: string
  /* 行政区划名称 */
  name: string
  /* 行政级别：1-省级，2-地级市，3-县级行政区 */
  level: number
  /* 上级行政区划代码 */
  parentCode?: string
  /* 排序 */
  sort?: number
  /* 创建时间 */
  createdAt?: string
  /* 更新时间 */
  updatedAt?: string
}

export interface ResultListDicAdministrativeDivisionVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DicAdministrativeDivisionVO[]
}

/**
 * 查询册别列表
 * 查询册别列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicVolumeVO>
 */
export const getDicVolumeListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicVolumeVO>('/dic/volume/list', { params, ...config })
}

/**
 * 查询版本列表
 * 查询版本列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicVersionVO>
 */
export const getDicVersionListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicVersionVO>('/dic/version/list', { params, ...config })
}

/**
 * 查询学科列表
 * 查询学科列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicSubjectVO>
 */
export const getDicSubjectListApi = (params?: {
  name?: string,
  type?: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicSubjectVO>('/dic/subject/list', { params, ...config })
}

/**
 * 查询标签题型字典（docx 154 条）
 * 查询标签题型字典（docx 154 条）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicQuestionTypeVO>
 */
export const getDicQuestionTypeListApi = (params?: {
  subjectCode?: number
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicQuestionTypeVO>('/dic/question-type/list', { params, ...config })
}

/**
 * 查询出版社列表
 * 查询出版社列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicPublisherVO>
 */
export const getDicPublisherListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicPublisherVO>('/dic/publisher/list', { params, ...config })
}

/**
 * 查询年级列表
 * 查询年级列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicGradeVO>
 */
export const getDicGradeListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicGradeVO>('/dic/grade/list', { params, ...config })
}

/**
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicBookLabelVO>
 */
export const getDicBookLabelListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicBookLabelVO>('/dic/book-label/list', { params, ...config })
}

/**
 * 查询行政区划列表
 * 查询行政区划列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDicAdministrativeDivisionVO>
 */
export const getDicAdministrativeDivisionListApi = (params?: {
  name?: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDicAdministrativeDivisionVO>('/dic/administrative-division/list', { params, ...config })
}

