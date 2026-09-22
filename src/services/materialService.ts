import { ElMessage } from 'element-plus'
import { getBookInfoDetailsApi, type BookVO } from '@/api/gen/bookController'
import { getDocInfoDetailsApi, type DocVO } from '@/api/gen/docController'

/** 资料信息完整度校验结果 */
export interface InfoCompletenessResult {
  /** 是否完整（必填字段均已填写） */
  complete: boolean
  /** 缺失的必填字段名称 */
  missingFields: string[]
}

/** 书籍信息必填字段（field 对应 BookVO / BookUpdateCmd 字段） */
const BOOK_REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: 'title', label: '书籍名称' },
  { field: 'subjectId', label: '学科' },
  { field: 'phase', label: '学段' },
  { field: 'volumeId', label: '册别' },
  { field: 'bookVersionId', label: '版本' }
]

/** 试卷信息必填字段（field 对应 DocVO / DocUpdateCmd 字段） */
const DOC_REQUIRED_FIELDS: { field: string; label: string }[] = [
  { field: 'title', label: '试卷名称' },
  { field: 'stepId', label: '学段' },
  { field: 'gradeId', label: '年级' },
  { field: 'subjectId', label: '学科' },
  { field: 'provinceId', label: '所属省/市' },
  { field: 'cityId', label: '所属市/区' },
  { field: 'year', label: '年份' },
  { field: 'term', label: '学期' },
  { field: 'paperType', label: '试卷类型' }
]

/** 判断字段值是否已填写 */
const isFilled = (value: unknown): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  return true
}

/** 按必填字段列表收集缺失项 */
const collectMissingFields = (
  data: object | null | undefined,
  fields: { field: string; label: string }[]
): string[] => {
  if (!data) return fields.map(item => item.label)
  const record = data as Record<string, unknown>
  return fields.filter(item => !isFilled(record[item.field])).map(item => item.label)
}

/**
 * 资料相关服务：书籍/试卷信息查询与提交前的信息完整度校验
 */
export class MaterialService {
  /** 查询书籍详情 */
  static async getBookInfo(id: string): Promise<BookVO | null> {
    const { data } = await getBookInfoDetailsApi({ id })
    if (data.code === 200) return data.data || null
    ElMessage.error(data.msg || '获取书籍信息失败')
    return null
  }

  /** 查询试卷详情 */
  static async getDocInfo(id: string): Promise<DocVO | null> {
    const { data } = await getDocInfoDetailsApi({ id })
    if (data.code === 200) return data.data || null
    ElMessage.error(data.msg || '获取试卷信息失败')
    return null
  }

  /** 按项目类型查询已保存的书籍/试卷信息 */
  static async getProjectInfo(id: string, type: 'book' | 'doc'): Promise<BookVO | DocVO | null> {
    return type === 'doc' ? await this.getDocInfo(id) : await this.getBookInfo(id)
  }

  /** 校验书籍信息完整度（可传入表单实时数据或服务端已保存数据） */
  static checkBookInfoComplete(book?: Partial<BookVO> | null): InfoCompletenessResult {
    const missingFields = collectMissingFields(book, BOOK_REQUIRED_FIELDS)
    return { complete: missingFields.length === 0, missingFields }
  }

  /** 校验试卷信息完整度（可传入表单实时数据或服务端已保存数据） */
  static checkDocInfoComplete(doc?: Partial<DocVO> | null): InfoCompletenessResult {
    const missingFields = collectMissingFields(doc, DOC_REQUIRED_FIELDS)
    return { complete: missingFields.length === 0, missingFields }
  }

  /** 按项目类型校验信息完整度 */
  static checkProjectInfoComplete(
    type: 'book' | 'doc',
    data?: Partial<BookVO> | Partial<DocVO> | null
  ): InfoCompletenessResult {
    return type === 'doc'
      ? this.checkDocInfoComplete(data as Partial<DocVO> | null)
      : this.checkBookInfoComplete(data as Partial<BookVO> | null)
  }
}
