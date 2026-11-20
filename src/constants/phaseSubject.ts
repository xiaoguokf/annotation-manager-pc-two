/**
 * 学段-学科对照（与后端 PhaseSubjectConstants 保持一致）
 *
 * 学科字典是全局字典，同一 docx 学科枚举可能存在多行（如 9 号既有道德与法治又有政治），
 * 且思想政治类学科在不同学段的名称不同，因此页面上展示与选择一律走本工具。
 */

/** 学段枚举 → 允许的 docx 学科枚举 */
export const PHASE_SUBJECTS: Record<number, number[]> = {
  1: [1, 2, 3, 9],
  2: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}

/** 学段枚举 → 中文 */
export const PHASE_NAMES: Record<number, string> = {
  1: '小学',
  2: '初中',
  3: '高中'
}

/** docx 学科枚举 → 通用名称 */
const SUBJECT_NAMES: Record<number, string> = {
  1: '语文',
  2: '数学',
  3: '英语',
  4: '物理',
  5: '化学',
  6: '生物',
  7: '历史',
  8: '地理',
  9: '道德与法治',
  10: '日语',
  11: '俄语'
}

/** 同一学科枚举在不同学段的名称差异：小学思想品德 / 初中道德与法治 / 高中思想政治 */
const PHASE_SUBJECT_NAME_OVERRIDE: Record<number, Record<number, string>> = {
  1: { 9: '思想品德' },
  2: { 9: '道德与法治' },
  3: { 9: '思想政治' }
}

/** 字典学科项（只需要 id / 名称 / docx 枚举） */
export interface SubjectDictItem {
  id?: string
  subjectName?: string
  docxCode?: number
}

/** 学科下拉选项 */
export interface SubjectOption {
  id: string
  subjectName: string
  docxCode: number
}

/**
 * 学段 + docx 学科枚举 → 学科名称
 *
 * @param docxCode docx 学科枚举
 * @param phase 学段枚举，为空时取通用名称（思想政治类为道德与法治）
 */
export const subjectName = (docxCode?: number | null, phase?: number | null): string => {
  if (docxCode == null || docxCode <= 0) return ''
  const override = phase != null ? PHASE_SUBJECT_NAME_OVERRIDE[phase]?.[docxCode] : undefined
  return override ?? SUBJECT_NAMES[docxCode] ?? ''
}

/** 该学段是否允许该学科；学段为空时不限制 */
export const isSubjectAllowed = (docxCode?: number | null, phase?: number | null): boolean => {
  if (docxCode == null || docxCode <= 0) return false
  if (phase == null) return true
  const allowed = PHASE_SUBJECTS[phase]
  return allowed ? allowed.includes(docxCode) : true
}

/**
 * 构建学科下拉选项：按学段过滤、丢弃非 docx 学科、同枚举去重
 *
 * @param list 学科字典
 * @param phase 当前学段
 * @param currentId 当前已选字典 ID，去重时优先保留该行（避免切换选项导致 subjectId 漂移）
 */
export const buildSubjectOptions = (
  list: SubjectDictItem[],
  phase?: number | null,
  currentId?: string
): SubjectOption[] => {
  const byCode = new Map<number, SubjectOption>()
  for (const item of list) {
    const code = item.docxCode
    if (item.id == null || code == null || code <= 0) continue
    // 存量数据可能学段与学科不匹配，当前选中行保留展示，避免编辑时凭空清空
    if (item.id !== currentId && !isSubjectAllowed(code, phase)) continue
    const option: SubjectOption = { id: item.id, docxCode: code, subjectName: subjectName(code, phase) }
    const exist = byCode.get(code)
    if (!exist || item.id === currentId) byCode.set(code, option)
  }
  return Array.from(byCode.values())
}

/**
 * 按字典 ID 取学科显示名称
 *
 * @param list 学科字典
 * @param id 学科字典 ID
 * @param phase 学段枚举
 */
export const subjectNameById = (
  list: SubjectDictItem[],
  id?: string | null,
  phase?: number | null
): string => {
  if (!id) return ''
  const item = list.find((s) => s.id === id)
  return item ? subjectName(item.docxCode, phase) : ''
}
