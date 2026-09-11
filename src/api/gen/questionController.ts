import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface QuestionOptionVO {
  /* 选项键：A/B/C/D，判断题为 true/false */
  optionKey?: string
  /* 选项内容（富文本 HTML） */
  optionVal?: string
}

export interface QuestionContentVO {
  /* 题内序号 */
  questionOrder?: number
  /* 分值 */
  questionScore?: number
  /* 题目来源名 */
  questionOriginName?: string
  /* 题干（富文本 HTML，含 LaTeX 公式与 img 标签） */
  questionStem?: string
  /* 一维选项，填空/解答题为 null */
  questionOptionList?: QuestionOptionVO[]
  /* 二维选项矩阵 */
  questionOptionMatrix?: QuestionOptionVO[][]
  /* 是否连线题：0-否，1-是 */
  isMatchLine?: number
  /* 音频地址 */
  audioUrl?: string
}

export interface QuestionAnswerOptionVO {
  /* 答案键：单选填正确选项（如 C），判断填 true/false，填空/解答留空 */
  optionKey?: string
  /* 答案内容 */
  optionVal?: string
  /* 备选答案（多答案兼容） */
  extendOptionList?: QuestionOptionVO[]
}

export interface QuestionAnswerVO {
  /* 一维答案：多个答案分多条对象填写，禁止合并 */
  answerOptionList?: QuestionAnswerOptionVO[]
  /* 二维答案矩阵 */
  answerOptionMatrix?: QuestionAnswerOptionVO[][]
}

export interface QuestionAttachVO {
  /* 文件名 */
  fileName?: string
  /* 附件类型：1-图片，2-音频 */
  fileType?: number
  /* base64 内容：本系统不接收 base64 上传，图片统一由前端调现有上传接口 `/upload/*` 存 OSS 后回传 OSS 信息，
 该字段仅为 docx 输出结构占位，输出固定为空串 */
  fileData?: string
  /* OSS bucket */
  ossBucket?: string
  /* OSS 路径 */
  ossPath?: string
  /* 图片可访问地址（前端走现有上传接口存 OSS 后回传），docx 无此字段，输出不携带 */
  fileUrl?: string
}

export interface QuestionUpdateCmd {
  /* 目录id */
  catalogueId?: string
  /* 题型 */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 标题 */
  question?: string
  /* 选项 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 知识点 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 题目开始页码 */
  page?: number
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 解析 */
  analysis?: string
  /* 母题ID，顶级题目为 0 */
  parentId?: string
  /* 层级：0-母题，1-一级子题，2-二级子题，由服务端按层级推导 */
  level?: number
  /* 标签题型枚举（atd_dic_question_type.type_code） */
  labelQuestionType?: number
  /* 作答方式：0-综合母题，1-单选，2-多选，3-填空，4-判断，5-解答 */
  questionAnswerMode?: number
  /* 题目内容结构化（docx questionContent） */
  questionContent?: QuestionContentVO
  /* 题目答案结构化（docx questionAnswer） */
  questionAnswer?: QuestionAnswerVO
  /* 题目扩展 */
  questionExtra?: string
  /* 文件页码 */
  filePageNumber?: number
  /* 教辅页码 */
  bookPageNumber?: number
  /* 题目年份 */
  questionYear?: string
  /* 题目主题 */
  questionTopic?: string
  /* 附件（图片：base64 与 fileUrl 二选一） */
  attachFileList?: QuestionAttachVO[]
  /* 子题（最多 2 级递归，三级及以上拒绝） */
  subQuestionList?: QuestionUpdateCmd[]
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

export interface QuestionSortCmd {
  /* 题目ID */
  id: string
  /* 新的排序号 */
  sortNum: number
}

export interface QuestionCreateCmd {
  /* 项目ID */
  projectId: string
  /* 目录ID */
  catalogueId?: string
  /* 0-书籍，1-试卷 */
  type: number
  /* 排序号 */
  sortNum?: number
  /* 题型 */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 标题 */
  question?: string
  /* 选项 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 知识点 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 题目开始页码 */
  page?: number
  /* 题内序号（docx questionOrder） */
  questionOrder?: number
  /* 母题ID，顶级题目为 0 */
  parentId?: string
  /* 层级：0-母题，1-一级子题，2-二级子题，由服务端按层级推导 */
  level?: number
  /* 标签题型枚举（atd_dic_question_type.type_code） */
  labelQuestionType?: number
  /* 作答方式：0-综合母题，1-单选，2-多选，3-填空，4-判断，5-解答 */
  questionAnswerMode?: number
  /* 题目内容结构化（docx questionContent） */
  questionContent?: QuestionContentVO
  /* 题目答案结构化（docx questionAnswer） */
  questionAnswer?: QuestionAnswerVO
  /* 题目扩展 */
  questionExtra?: string
  /* 文件页码 */
  filePageNumber?: number
  /* 教辅页码 */
  bookPageNumber?: number
  /* 题目年份 */
  questionYear?: string
  /* 题目主题 */
  questionTopic?: string
  /* 附件（图片：base64 与 fileUrl 二选一） */
  attachFileList?: QuestionAttachVO[]
  /* 子题（最多 2 级递归，三级及以上拒绝） */
  subQuestionList?: QuestionCreateCmd[]
}

export interface QuestionAutoSortCmd {
  /* 项目ID */
  projectId: string
  /* 目录ID（可选，如果不指定则对整个项目进行排序） */
  catalogueId?: string
}

export interface QuestionQuery {
  /* 项目id */
  projectId: string
  /* 目录ID */
  catalogueId?: string
  /* 母题ID：0-只查母题，大于0-查指定母题的子题，不传-全部 */
  parentId?: string
  /* 层级：0-母题，1-一级子题，2-二级子题 */
  level?: number
  /* 标签题型枚举（atd_dic_question_type.type_code） */
  labelQuestionType?: number
  /* 作答方式：0-综合母题，1-单选，2-多选，3-填空，4-判断，5-解答 */
  questionAnswerMode?: number
  /* 题干关键字（模糊匹配，子题独立检索） */
  questionKeyword?: string
}

export interface QuestionVO {
  /* 题目ID */
  id: string
  /* 项目ID */
  projectId: string
  /* 目录ID */
  catalogueId?: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题目开始页码 */
  page?: number
  /* 排序数，用户保证同目录下的题目顺序 */
  sortNum?: number
  /* 标注个数 */
  annotationCount?: number
}

export interface ResultListQuestionVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionVO[]
}

export interface QuestionDetailsVO {
  /* 题目ID */
  id: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 知识点-字符串数组 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 标题 */
  question?: string
  /* 选项，字符串数组 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 解析 */
  analysis?: string
  /* 题目开始页码 */
  page?: number
  /* 母题ID，顶级题目为 0 */
  parentId?: string
  /* 层级：0-母题，1-一级子题，2-二级子题 */
  level?: number
  /* 标签题型枚举 */
  labelQuestionType?: number
  /* 标签题型中文 */
  labelQuestionTypeZh?: string
  /* 作答方式 */
  questionAnswerMode?: number
  /* 作答方式中文 */
  questionAnswerModeZh?: string
  /* 题目内容结构化 */
  questionContent?: QuestionContentVO
  /* 题目答案结构化 */
  questionAnswer?: QuestionAnswerVO
  /* 题目扩展 */
  questionExtra?: string
  /* 文件页码 */
  filePageNumber?: number
  /* 教辅页码 */
  bookPageNumber?: number
  /* 题目年份 */
  questionYear?: string
  /* 题目主题 */
  questionTopic?: string
  /* 附件 */
  attachFileList?: QuestionAttachVO[]
  /* 子题（递归） */
  subQuestionList?: QuestionDetailsVO[]
}

export interface ResultQuestionDetailsVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionDetailsVO
}

export interface QuestionDetailsListVO {
  /* 题目ID */
  id: string
  /* 题型类型（xuanze，duoxuan，panduan，tiankong，zuhe，wenda） */
  tishi?: string
  /* 题类：changkaoti-常考题，yicuoti-易错题，haoti-好题，yazhouti-压轴题 */
  tilei?: string
  /* 难度（枚举）:0-0.2容易，0.3-0.4比较易，0.5-0.6中档，0.7-0.8较难，0.9-1难 */
  difficulty?: number
  /* 知识点-字符串数组 */
  knowledge?: string
  /* 试题comment */
  questionComment?: string
  /* 是否有答案：0-有答案，1-没答案 */
  noAnswer?: boolean
  /* 标题 */
  question?: string
  /* 选项，字符串数组 */
  choice?: string
  /* 答案 */
  answer?: string
  /* 解析 */
  analysis?: string
  /* 题目开始页码 */
  page?: number
  /* 母题ID，顶级题目为 0 */
  parentId?: string
  /* 层级：0-母题，1-一级子题，2-二级子题 */
  level?: number
  /* 标签题型枚举 */
  labelQuestionType?: number
  /* 标签题型中文 */
  labelQuestionTypeZh?: string
  /* 作答方式 */
  questionAnswerMode?: number
  /* 作答方式中文 */
  questionAnswerModeZh?: string
  /* 题目内容结构化 */
  questionContent?: QuestionContentVO
  /* 题目答案结构化 */
  questionAnswer?: QuestionAnswerVO
  /* 题目扩展 */
  questionExtra?: string
  /* 文件页码 */
  filePageNumber?: number
  /* 教辅页码 */
  bookPageNumber?: number
  /* 题目年份 */
  questionYear?: string
  /* 题目主题 */
  questionTopic?: string
  /* 附件 */
  attachFileList?: QuestionAttachVO[]
  /* 子题（递归） */
  subQuestionList?: QuestionDetailsVO[]
  /* 排序数，用户保证同目录下的题目顺序 */
  sortNum?: number
  /* 目录id */
  catalogueId?: string
  /* 创建人姓名 */
  createNickname?: string
  /* 创建人用户名 */
  createUsername?: string
  /* 更新人姓名 */
  updateNickname?: string
  /* 更新人用户名 */
  updateUsername?: string
}

export interface ResultListQuestionDetailsListVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionDetailsListVO[]
}

export interface QuestionCheckVO {
  /* 题目ID */
  id: string
  /* 目录ID */
  catalogueId?: string
  /* 排序数 */
  sortNum?: number
  /* 错误原因 */
  reason: string
}

export interface ResultListQuestionCheckVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionCheckVO[]
}

export interface QuestionCatalogueVO {
  /* 题目ID */
  questionId: string
  /* 目录ID */
  catalogueId: string
  /* 题目开始页码 */
  page: number
}

export interface ResultQuestionCatalogueVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: QuestionCatalogueVO
}

/**
 * 更新题目
 * 更新题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putQuestionUpdateApi = (data: QuestionUpdateCmd, params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>(`/question/update/${params.id}`, data, config)
}

/**
 * 题目顺序切换
 * 题目顺序切换
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const putQuestionSortApi = (data: QuestionSortCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.put<ResultVoid>('/question/sort', data, config)
}

/**
 * 创建题目
 * 创建题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postQuestionCreateApi = (data: QuestionCreateCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/question/create', data, config)
}

/**
 * 题目自动排序
 * 题目自动排序
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const postQuestionAutoSortApi = (data: QuestionAutoSortCmd, config?: SshineAdminRequestConfig<any>) => {
  return http.post<ResultVoid>('/question/auto-sort', data, config)
}

/**
 * 查询题目列表
 * 查询题目列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionVO>
 */
export const getQuestionListApi = (params?: QuestionQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionVO>('/question/list', { params, ...config })
}

/**
 * 根据ID查询题目详情
 * 根据ID查询题目详情
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultQuestionDetailsVO>
 */
export const getQuestionDetailsApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultQuestionDetailsVO>(`/question/details/${params.id}`, config)
}

/**
 * 根据项目ID查询题目详情列表
 * 根据项目ID查询题目详情列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionDetailsListVO>
 */
export const getQuestionDetailsListApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionDetailsListVO>(`/question/details/list/${params.projectId}`, config)
}

/**
 * 题目检查：查询没有通过校验的题目
 * 题目检查：查询没有通过校验的题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListQuestionCheckVO>
 */
export const getQuestionCheckApi = (params?: QuestionQuery, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListQuestionCheckVO>('/question/check', { params, ...config })
}

/**
 * 根据题目ID获取所在目录ID
 * 根据题目ID获取所在目录ID
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultQuestionCatalogueVO>
 */
export const getQuestionCatalogueIdApi = (params: {
  questionId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultQuestionCatalogueVO>(`/question/catalogueId/${params.questionId}`, config)
}

/**
 * 删除题目
 * 删除题目
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultVoid>
 */
export const deleteQuestionDeleteApi = (params: {
  id: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.delete<ResultVoid>(`/question/delete/${params.id}`, config)
}

