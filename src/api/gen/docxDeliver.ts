import http from '@/utils/http'
import type { SshineAdminRequestConfig } from '@/utils/http'

export interface DeliverRecordVO {
  /* 记录ID */
  id?: string
  /* 批次号 */
  batchNo?: string
  /* 项目ID */
  projectId?: string
  /* 教辅树ID */
  bookId?: string
  /* 交付通道：FILE / HTTP */
  channel?: string
  /* 交付状态：EXPORTED / FAILED */
  deliverStatus?: string
  /* 题量（含子题） */
  questionCount?: number
  /* 导出文件名 */
  fileName?: string
  /* 失败原因 */
  failReason?: string
  /* 操作人 */
  createBy?: string
  /* 创建时间 */
  createTime?: string
}

export interface ResultListDeliverRecordVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: DeliverRecordVO[]
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

export interface PaperOutputVO {
  /* 学段中文 */
  phaseZh?: string
  /* 学科中文 */
  subjectZh?: string
  /* 试卷标题 */
  paperTitleName?: string
  /* 学年 */
  paperAcademicYearZh?: string
  /* 试卷类型 */
  paperTypeZh?: string
  /* 学期 */
  paperSemesterZh?: string
  /* 试卷来源 */
  paperSourceZh?: string
  /* 省份中文 */
  provinceZh?: string
  /* 城市中文 */
  cityZh?: string
  /* 区县中文 */
  areaZh?: string
  /* 试卷文件名（必填） */
  paperName?: string
  /* OSS 文件名 */
  paperFileName?: string
  /* 文件扩展名 */
  paperFileExtName?: string
  /* 文件 MD5 */
  paperFileMd5?: string
  /* 生成渠道，固定 5 */
  generateChannel?: number
  /* 教辅树名称 */
  supTreeName?: string
  /* 册次 */
  volume?: string
  /* 版次 */
  edition?: string
}

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

export interface AttachOutputVO {
  /* 文件名 */
  fileName?: string
  /* 附件类型：1-图片，2-音频 */
  fileType?: number
  /* base64 内容（上传 OSS 后输出为空串） */
  fileData?: string
  /* OSS bucket */
  ossBucket?: string
  /* OSS 路径 */
  ossPath?: string
}

export interface QuestionOutputVO {
  /* 标签题型中文 */
  labelQuestionTypeZh?: string
  /* 作答方式中文：单选/多选/填空/判断/解答 */
  questionAnswerModeZh?: string
  /* 难度中文：简单/较易/中等/较难/困难 */
  questionDifficultZh?: string
  /* 题目来源中文，固定 校本资源_教辅 */
  questionSourceZh?: string
  /* 学段中文 */
  phaseZh?: string
  /* 学科中文 */
  subjectZh?: string
  /* 题目年份 */
  questionYear?: string
  /* 题目主题 */
  questionTopic?: string
  /* 省份中文 */
  provinceZh?: string
  /* 城市中文 */
  cityZh?: string
  /* 区县中文 */
  areaZh?: string
  /* 基础树节点名 */
  baseTreeNodeNames?: string[]
  /* 题目内容 */
  questionContent?: QuestionContentVO
  /* 题目答案 */
  questionAnswer?: QuestionAnswerVO
  /* 题目解析（富文本 HTML） */
  questionExplanation?: string
  /* 题目扩展 */
  questionExtra?: string
  /* 子题（最多 2 级嵌套，即 level 1、level 2） */
  subQuestionList?: QuestionOutputVO[]
  /* 附件 */
  attachFileList?: AttachOutputVO[]
  /* 教辅树节点名 */
  supTreeNodeNames?: string
  /* 文件页码 */
  filePageNumber?: number
  /* 教辅页码 */
  bookPageNumber?: number
}

export interface QuestionListOutputVO {
  /* 试卷信息 */
  paper?: PaperOutputVO
  /* 题目（含子题递归） */
  questions?: QuestionOutputVO[]
}

export interface SupTreeNodeOutputVO {
  /* 教辅树ID */
  supTreeId?: string
  /* 节点ID */
  supTreeNodeId?: string
  /* 节点名称 */
  supTreeNodeName?: string
  /* 父节点ID */
  supTreeParentNodeId?: string
  /* 节点路径 */
  supTreeNodeSerialPath?: string
  /* 题目列表（无题目时必须为 []，禁止 [{}]） */
  questionList?: QuestionListOutputVO[]
  /* 子节点 */
  supTreeNodeChildren?: SupTreeNodeOutputVO[]
}

export interface SupTreeOutputVO {
  /* 教辅名称 */
  supTreeName?: string
  /* 教辅版本号 */
  supTreeVersion?: string
  /* 学段：1小学 2初中 3高中 */
  phase?: number
  /* 学科枚举 */
  subject?: number
  /* 册次 */
  volume?: string
  /* 版本 */
  edition?: string
  /* 原始学校名称 */
  originSchoolName?: string
  /* 教辅树状态 */
  supStatus?: number
  /* 节点列表（仅一个根节点） */
  supTreeDetail?: SupTreeNodeOutputVO[]
}

export interface ResultSupTreeOutputVO {
  /* 状态码：200-成功，非200-失败 */
  code?: number
  /* 消息 */
  msg?: string
  /* 数据(如果存在) */
  data?: SupTreeOutputVO
}

/**
 * 交付记录列表
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultListDeliverRecordVO>
 */
export const getDeliverDocxRecordsApi = (params: {
  projectId: string
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultListDeliverRecordVO>(`/deliver/docx/records/${params.projectId}`, config)
}

/**
 * 预览 docx 格式交付 JSON（不落库）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<ResultSupTreeOutputVO>
 */
export const getDeliverDocxPreviewApi = (params: {
  projectId: string,
  withSubQuestion?: boolean
}, config?: SshineAdminRequestConfig<any>) => {
  return http.get<ResultSupTreeOutputVO>(`/deliver/docx/preview/${params.projectId}`, { params, ...config })
}

/**
 * 导出 docx 格式交付 JSON（zip 下载）
 * @param config 可选配置，包含 timeout、loading 等选项
 * @returns Promise<any>
 */
export const getDeliverDocxExportApi = (params: {
  projectId: string,
  withSubQuestion?: boolean
}, config?: SshineAdminRequestConfig<any>) => {
  return http.download(`/deliver/docx/export/${params.projectId}`, { method: 'GET', params, ...config })
}

