/**
 * 作答方式（docx questionAnswerMode）常量与选项。
 *
 * 0 综合母题 / 1 单选 / 2 多选 / 3 填空 / 4 判断 / 5 解答。
 * 列表页与编辑页共用同一份选项，避免两处各写一份而口径走样。
 */

/** 综合母题：答案写在子题内 */
export const ANSWER_MODE_COMPREHENSIVE = 0
/** 单选 */
export const ANSWER_MODE_SINGLE = 1
/** 多选 / 不定项 */
export const ANSWER_MODE_MULTI = 2
/** 填空 */
export const ANSWER_MODE_BLANK = 3
/** 判断 */
export const ANSWER_MODE_JUDGE = 4
/** 解答 */
export const ANSWER_MODE_ANSWER = 5

/** 作答方式下拉项 */
export interface AnswerModeOption {
  label: string
  value: number
}

/** 作答方式选项（顺序即下拉顺序） */
export const answerModeOptions: AnswerModeOption[] = [
  { label: '综合母题', value: ANSWER_MODE_COMPREHENSIVE },
  { label: '单选', value: ANSWER_MODE_SINGLE },
  { label: '多选', value: ANSWER_MODE_MULTI },
  { label: '填空', value: ANSWER_MODE_BLANK },
  { label: '判断', value: ANSWER_MODE_JUDGE },
  { label: '解答', value: ANSWER_MODE_ANSWER },
]

/** 作答方式中文名；未匹配时回退为原值字符串 */
export const answerModeName = (mode?: number | null): string =>
  answerModeOptions.find((item) => item.value === mode)?.label ?? (mode != null ? String(mode) : '')

/**
 * 选择型题目的最少选项数：
 * 单选至少 2 个（否则不构成选择），多选 / 不定项至少 1 个。
 */
export const minChoiceOptions = (mode?: number | null): number =>
  mode === ANSWER_MODE_SINGLE ? 2 : 1
