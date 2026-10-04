/**
 * 结构化答案（docx questionAnswer）的构造与解析。
 *
 * 后端 QuestionContentResolver 的结构化优先解析要求前端提交的形态与作答方式一致：
 * - 单选：单个 optionKey（字母）
 * - 多选：N 条独立对象，禁止合并；矩阵外层恒 1 层
 * - 填空：一空一条，optionKey 为空串，矩阵外层 = 空数
 * - 判断：optionKey 为字符串 "true" / "false"（带引号，不是布尔）
 * - 解答：答案写入 optionVal
 * - 综合母题：答案置空
 *
 * 本模块同时提供「旧扁平 answer → 草稿」的兜底解析，供 questionAnswer 为空时回显，
 * 口径与后端 answerFromLegacy 保持一致。
 */
import type { QuestionAnswerOptionVO, QuestionAnswerVO } from '@/api/gen/questionController'
import {
  ANSWER_MODE_ANSWER,
  ANSWER_MODE_BLANK,
  ANSWER_MODE_JUDGE,
  ANSWER_MODE_MULTI,
  ANSWER_MODE_SINGLE,
} from '@/constants/answerMode'

/** 判断题固定选项文案 */
export const JUDGE_OPTIONS = ['对', '错'] as const

/** 判断题答案字符串（docx 约定） */
export const JUDGE_KEY_TRUE = 'true'
export const JUDGE_KEY_FALSE = 'false'

/** 选项下标 → 字母：0 -> A */
export const optionLetter = (index: number): string => String.fromCharCode(65 + index)

/** 选项字母上限：docx optionKey 为单个字母，故最多 26 项 */
export const MAX_OPTIONS = 26

/**
 * 答案文本 → 选项字母序列：统一大写、去除非字母、去重。
 * 供单选/多选的答案输入框使用（用户手打 "ab" → ['A','B']）。
 */
export const normalizeChoiceKeys = (raw?: string | null): string[] => {
  const keys: string[] = []
  for (const ch of raw ?? '') {
    if (ch >= 'A' && ch <= 'Z') {
      if (!keys.includes(ch)) keys.push(ch)
    } else if (ch >= 'a' && ch <= 'z') {
      const upper = ch.toUpperCase()
      if (!keys.includes(upper)) keys.push(upper)
    }
  }
  return keys
}

/** 题干空位标记：编辑器写入的 span 与文档里的 <blank/> 两种写法都识别 */
const BLANK_PATTERN = /<span[^>]*data-tiptype=["']question-blank_filling["'][^>]*>\s*<\/span>|<blank\s*\/?>/g

/** 统计题干中的空位数量（空数真源） */
export const countBlanks = (stem?: string | null): number => {
  if (!stem) return 0
  return (stem.match(BLANK_PATTERN) ?? []).length
}

/**
 * 存量判断题的固定选项：长度 2 且恰为 对/错。
 * 该选项只属于判断题，切到单选 / 多选时应视为残留并剔除，避免凭空多出两个选项。
 */
export const isJudgeLeftover = (options: string[]): boolean =>
  options.length === 2 &&
  options[0]?.trim() === JUDGE_OPTIONS[0] &&
  options[1]?.trim() === JUDGE_OPTIONS[1]

/** 一条答案：选择题填 optionKey（字母），填空/解答填 optionVal（内容） */
export interface AnswerCell {
  optionKey: string
  optionVal: string
}

/**
 * 一行答案 = 主答案 + 备选答案。
 *
 * 对应 docx：主答案与备选答案同处一条 {@code answerOptionList} 元素，
 * 主答案在 optionKey/optionVal，备选答案（多答案兼容）在 extendOptionList。
 */
export interface AnswerRow {
  primary: AnswerCell
  /** 备选答案（extendOptionList 中除主答案外的部分） */
  extends: AnswerCell[]
}

/**
 * 作答方式对应的答案草稿（表单内部状态）。
 *
 * 答案区与题目选项区同构：都是「可增删的列表」——
 * 选择题每行一个正确选项字母（单选 1 行 / 多选 N 行），填空每行一空，解答一行；
 * 每行还可再挂若干备选答案（多答案兼容）。
 */
export interface AnswerDraft {
  /** 单选/多选/填空/解答：多行答案；单选仅取第一行 */
  rows: AnswerRow[]
  /** 判断：'true' | 'false' */
  judge: string
}

/** 空答案行 */
export const createAnswerRow = (): AnswerRow => ({
  primary: { optionKey: '', optionVal: '' },
  extends: [],
})

/** 空草稿 */
export const createAnswerDraft = (): AnswerDraft => ({
  rows: [],
  judge: '',
})

/**
 * 答案行 → 结构化答案项。
 *
 * extendOptionList 用于「多答案兼容」：**有备选答案时，首项为主答案**（与 optionKey/optionVal 相同），
 * 其余为备选答案；**无备选时为 null**（此时主答案只在 optionKey/optionVal）。
 * 例：{"optionKey":"","optionVal":"app","extendOptionList":[{"optionKey":"","optionVal":"app"},{"optionKey":"","optionVal":"bpp"}]}
 */
const answerRowToItem = (row: AnswerRow): QuestionAnswerOptionVO => {
  const { optionKey, optionVal } = row.primary
  // 有备选答案时，extendOptionList 首项为主答案，其余为备选；无备选即 null
  const extendOptionList = row.extends.length
    ? [
        { optionKey, optionVal },
        ...row.extends.map((cell) => ({ optionKey: cell.optionKey, optionVal: cell.optionVal })),
      ]
    : null
  return { optionKey, optionVal, extendOptionList }
}

/** 判断题答案项（无备选） */
const judgeItem = (key: string): QuestionAnswerOptionVO => ({
  optionKey: key,
  optionVal: '',
  extendOptionList: null,
})

/** 选择型 / 解答型统一形态：矩阵外层恒 1 层 */
const wrapSingleRow = (list: QuestionAnswerOptionVO[]): QuestionAnswerVO =>
  list.length > 0 ? { answerOptionList: list, answerOptionMatrix: [list] } : { answerOptionList: [], answerOptionMatrix: [] }

/**
 * 草稿 → 结构化答案。
 * @param mode 作答方式
 */
export const buildQuestionAnswer = (mode: number | undefined, draft: AnswerDraft): QuestionAnswerVO => {
  // 选择题各行：字母统一大写、去空、行内去重
  const choiceRows = draft.rows.filter((row) => row.primary.optionKey.trim())
  const seen = new Set<string>()
  const dedupedChoiceRows = choiceRows.filter((row) => {
    const key = row.primary.optionKey.trim().toUpperCase()
    if (seen.has(key)) return false
    seen.add(key)
    row.primary.optionKey = key
    return true
  })
  switch (mode) {
    case ANSWER_MODE_SINGLE:
      // 单选：只取第一行
      return dedupedChoiceRows.length
        ? wrapSingleRow([answerRowToItem(dedupedChoiceRows[0]!)])
        : { answerOptionList: [], answerOptionMatrix: [] }
    case ANSWER_MODE_MULTI:
      return dedupedChoiceRows.length
        ? wrapSingleRow(dedupedChoiceRows.map(answerRowToItem))
        : { answerOptionList: [], answerOptionMatrix: [] }
    case ANSWER_MODE_JUDGE:
      return draft.judge ? wrapSingleRow([judgeItem(draft.judge)]) : { answerOptionList: [], answerOptionMatrix: [] }
    case ANSWER_MODE_BLANK: {
      const list = draft.rows.map(answerRowToItem)
      return { answerOptionList: list, answerOptionMatrix: list.map((item) => [item]) }
    }
    case ANSWER_MODE_ANSWER: {
      const first = draft.rows[0]
      return first && (first.primary.optionVal.trim() || first.extends.length)
        ? wrapSingleRow([answerRowToItem(first)])
        : { answerOptionList: [], answerOptionMatrix: [] }
    }
    default:
      return { answerOptionList: [], answerOptionMatrix: [] }
  }
}

/** 【答案】等前缀，兜底解析前剥除（与后端 ANSWER_PREFIX 对齐） */
const ANSWER_PREFIX = /^\s*[【\[（(]?\s*答案\s*[】\]）)]?\s*[：:]?\s*/

const stripAnswerPrefix = (raw: string): string => raw.trim().replace(ANSWER_PREFIX, '')

const JUDGE_TRUE_SET = new Set(['true', 't', '对', '√', '正确'])
const JUDGE_FALSE_SET = new Set(['false', 'f', '错', '×', '错误'])

/** 答案文本 → 判断题键；无法识别返回 '' */
export const toJudgeKey = (raw: string): string => {
  const value = stripAnswerPrefix(raw).toLowerCase()
  if (JUDGE_TRUE_SET.has(value)) return JUDGE_KEY_TRUE
  if (JUDGE_FALSE_SET.has(value)) return JUDGE_KEY_FALSE
  return ''
}

/** 多选答案文本 → 选项字母集合（含圈序号） */
export const splitChoiceKeys = (raw: string): string[] => {
  const value = stripAnswerPrefix(raw)
  const keys: string[] = []
  for (const ch of value) {
    if (ch >= 'A' && ch <= 'Z') keys.push(ch)
    else if (ch >= 'a' && ch <= 'z') keys.push(ch.toUpperCase())
    else if (ch >= '①' && ch <= '⑳') keys.push(optionLetter(ch.charCodeAt(0) - '①'.charCodeAt(0)))
  }
  return Array.from(new Set(keys))
}

/** 填空答案文本 → 各空答案：按 ①②③ / (1)(2) / 换行 切分 */
export const splitBlankAnswers = (raw: string): string[] => {
  const value = stripAnswerPrefix(raw)
  if (!value) return []
  const list = value
    .split(/\s*[①-⑳]\s*|\s*[（(]\s*\d+\s*[）)]\s*|\r?\n+/)
    .map((part) => part.trim())
    .filter((part) => part)
  return list.length > 0 ? list : [value]
}

/** 旧扁平 answer → 草稿（无法判定形态时整体作为解答原文） */
export const parseLegacyAnswer = (mode: number | undefined, legacyAnswer?: string | null): AnswerDraft => {
  const draft = createAnswerDraft()
  const raw = legacyAnswer ?? ''
  const value = stripAnswerPrefix(raw)
  if (!value) return draft
  switch (mode) {
    case ANSWER_MODE_SINGLE:
      draft.rows = splitChoiceKeys(value).slice(0, 1).map((key) => rowOfKey(key))
      break
    case ANSWER_MODE_MULTI:
      draft.rows = splitChoiceKeys(value).map((key) => rowOfKey(key))
      break
    case ANSWER_MODE_JUDGE:
      draft.judge = toJudgeKey(value)
      break
    case ANSWER_MODE_BLANK:
      draft.rows = splitBlankAnswers(value).map((val) => rowOfVal(val))
      break
    case ANSWER_MODE_ANSWER:
      draft.rows = [rowOfVal(value)]
      break
    default:
      draft.rows = [rowOfVal(value)]
  }
  return draft
}

/** 选择题答案行 */
const rowOfKey = (optionKey: string): AnswerRow => ({
  primary: { optionKey, optionVal: '' },
  extends: [],
})

/** 填空/解答答案行 */
const rowOfVal = (optionVal: string): AnswerRow => ({
  primary: { optionKey: '', optionVal },
  extends: [],
})

/** 结构化答案项 → 答案行（extendOptionList 首项为主答案，其余为备选） */
const itemToRow = (item: QuestionAnswerOptionVO): AnswerRow => {
  const primary = { optionKey: (item.optionKey ?? '').trim(), optionVal: item.optionVal ?? '' }
  const cells = (item.extendOptionList ?? []).map((cell) => ({
    optionKey: (cell.optionKey ?? '').trim(),
    optionVal: cell.optionVal ?? '',
  }))
  // 兼容样例口径（extendOptionList[0] 为副本式的主答案）：首项与主答案完全相同则跳过
  const first = cells[0]
  const isPrimaryCopy =
    first != null && first.optionKey === primary.optionKey && first.optionVal === primary.optionVal
  return { primary, extends: isPrimaryCopy ? cells.slice(1) : cells }
}

/** 判断题答案项的键：优先取 optionKey，缺失时从 optionVal 反推 */
const judgeKeyOfItem = (item: QuestionAnswerOptionVO): string => {
  const key = (item.optionKey ?? '').trim().toLowerCase()
  if (key === JUDGE_KEY_TRUE || key === JUDGE_KEY_FALSE) return key
  return toJudgeKey(item.optionVal ?? '')
}

/**
 * 结构化答案（或旧字段）→ 草稿。
 * 结构化非空时优先，为空时按作答方式从旧 answer 兜底解析。
 */
export const parseAnswerDraft = (
  mode: number | undefined,
  structured?: QuestionAnswerVO | null,
  legacyAnswer?: string | null,
): AnswerDraft => {
  const list = (structured?.answerOptionList ?? []).filter((item) => item != null)
  if (list.length === 0) {
    return parseLegacyAnswer(mode, legacyAnswer)
  }
  const draft = createAnswerDraft()
  const first = list[0]
  switch (mode) {
    case ANSWER_MODE_SINGLE:
      draft.rows = first ? [itemToRow(first)] : []
      break
    case ANSWER_MODE_MULTI:
      draft.rows = list.map(itemToRow)
      break
    case ANSWER_MODE_JUDGE:
      draft.judge = first ? judgeKeyOfItem(first) : ''
      break
    case ANSWER_MODE_BLANK:
      draft.rows = list.map(itemToRow)
      break
    default:
      draft.rows = [itemToRow({ optionKey: '', optionVal: list.map((item) => item.optionVal ?? '').join('\n') })]
  }
  return draft
}

/** 草稿 → 旧扁平 answer（提交时同步写入 answer 列，保证两条口径一致） */
export const draftToLegacyAnswer = (mode: number | undefined, draft: AnswerDraft): string => {
  switch (mode) {
    case ANSWER_MODE_SINGLE:
      return draft.rows[0]?.primary.optionKey ?? ''
    case ANSWER_MODE_MULTI:
      return draft.rows.map((row) => row.primary.optionKey).join('')
    case ANSWER_MODE_JUDGE:
      return draft.judge
    case ANSWER_MODE_BLANK:
      return draft.rows.map((row) => row.primary.optionVal).join('\n')
    case ANSWER_MODE_ANSWER:
      return draft.rows[0]?.primary.optionVal ?? ''
    default:
      return draft.rows[0]?.primary.optionVal ?? ''
  }
}

/** 草稿 → 展示文案（判断题还原为 对/错，供预览与只读展示） */
export const draftToDisplay = (mode: number | undefined, draft: AnswerDraft): string => {
  if (mode === ANSWER_MODE_JUDGE) {
    if (draft.judge === JUDGE_KEY_TRUE) return JUDGE_OPTIONS[0]
    if (draft.judge === JUDGE_KEY_FALSE) return JUDGE_OPTIONS[1]
    return ''
  }
  if (mode === ANSWER_MODE_BLANK) {
    return draft.rows.map((row) => row.primary.optionVal).filter(Boolean).join(' ／ ')
  }
  return draftToLegacyAnswer(mode, draft)
}

/** 草稿是否已填写（用于答案必填校验） */
export const isAnswerDraftFilled = (mode: number | undefined, draft: AnswerDraft): boolean => {
  switch (mode) {
    case ANSWER_MODE_SINGLE:
    case ANSWER_MODE_MULTI:
      return draft.rows.some((row) => row.primary.optionKey.trim() !== '')
    case ANSWER_MODE_JUDGE:
      return draft.judge === JUDGE_KEY_TRUE || draft.judge === JUDGE_KEY_FALSE
    case ANSWER_MODE_BLANK:
      return draft.rows.some((row) => row.primary.optionVal.trim() !== '')
    case ANSWER_MODE_ANSWER:
      return (draft.rows[0]?.primary.optionVal ?? '').trim() !== ''
    default:
      return draftToLegacyAnswer(mode, draft).trim() !== ''
  }
}
