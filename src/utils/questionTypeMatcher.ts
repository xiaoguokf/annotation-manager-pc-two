/**
 * 标签题型判断：按需求方《题型判断关键词》规则表，从题目内容推断标签题型。
 *
 * 输入题干/选项/答案/解析（富文本）与当前学科，输出匹配到的题型字典项；
 * 只负责「判什么题型」，不写库、不改表单。
 *
 * 匹配口径：
 * 1. 只在「当前学科适用的规则」里选（全学科规则恒适用）；
 * 2. 每条规则按命中的关键词累计分值，关键词越长越具体、分值越高；
 * 3. 规则表说明栏的特征优先级（听力/长文段/选项/空格/判断/写作）给对应题型加权，
 *    避免「填空题」这类通用标签压过听力、写作等专有标签；
 * 4. 同分取规则表顺序靠前者；全部未命中时归「其他」（字典无该项则不填）。
 */
import { type QuestionTypeRule, SUBJECT_CODE_NAME, questionTypeRules } from '@/constants/questionTypeRules'

/** 候选题型（来自题型字典，按学科过滤后） */
export interface LabelTypeCandidate {
  typeCode: number
  typeName: string
}

/** 判断输入 */
export interface LabelTypeResolveInput {
  /** 题干（富文本 HTML） */
  stem?: string | null
  /** 选项文本 */
  options?: string[]
  /** 答案文本 */
  answer?: string | null
  /** 解析（富文本 HTML） */
  analysis?: string | null
  /** docx 学科枚举 */
  subjectCode?: number | null
  /** 当前学科的标签题型候选（typeCode + typeName） */
  candidates: LabelTypeCandidate[]
}

/** 判断结果 */
export interface LabelTypeResolveResult {
  /** 命中题型的 typeCode；未匹配到字典项时为空 */
  typeCode?: number
  /** 命中题型的 typeName */
  typeName?: string
  /** 命中分值（0 表示未命中关键词，走「其他」兜底） */
  score: number
  /** 命中的关键词，便于提示与排查 */
  hitKeywords: string[]
}

/** 去 HTML 标签与常见实体，压缩空白，便于关键词匹配 */
export const plainText = (html?: string | null): string => {
  if (!html) return ''
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const BLANK_MARK = 'question-blank_filling'

/** 学科名归一：政治 / 道德与法治 / 道法 视为同一学科 */
const normalizeSubject = (name: string): string =>
  name === '道德与法治' || name === '道法' ? '政治' : name

/** 该规则是否适用于当前学科 */
const isApplicable = (rule: QuestionTypeRule, subjectName: string): boolean =>
  rule.subjects === null || rule.subjects.some((s) => normalizeSubject(s) === subjectName)

/** 关键词权重：越长越具体，上限 6 */
const weightOf = (keyword: string): number => Math.min(keyword.length, 6)

/** 典型题干标志比普通关键词更能确定题型，给更高的基础分 */
const STEM_WEIGHT_BASE = 10

/** 题目特征（对应规则表的特征优先级） */
interface Features {
  listening: boolean
  longReading: boolean
  hasOptions: boolean
  hasBlank: boolean
  judge: boolean
  writing: boolean
}

const JUDGE_WORDS = ['对', '错', '√', '×', '正确', '错误', 'true', 'false']

const detectFeatures = (stem: string, options: string[], answer: string): Features => {
  const listening = stem.includes('听') || stem.includes('audio') || stem.includes('音频')
  const longReading = /阅读下(面的)?(文字|文章|短文|材料|文言文|诗歌|古诗)|根据(短文|文章|材料)内容/.test(stem)
  const hasOptions = options.filter((o) => o.trim()).length >= 2
  const hasBlank =
    stem.includes(BLANK_MARK) ||
    stem.includes('横线') ||
    stem.includes('填空') ||
    stem.includes('空格') ||
    /_{3,}/.test(stem)
  const judge =
    JUDGE_WORDS.includes(answer.trim().toLowerCase()) ||
    /判断.{0,4}(正误|对错)/.test(stem)
  const writing = /作文|写作|书面表达|写一篇|自拟题目|不少于|材料作文/.test(stem)
  return { listening, longReading, hasOptions, hasBlank, judge, writing }
}

/** 特征加权：命中某特征时给对应题型家族加分（数值远大于关键词分，保证优先级） */
const featureBonus = (label: string, f: Features): number => {
  let bonus = 0
  if (f.listening && /听力|听短文|听长对话|听短对话/.test(label)) bonus += 200
  if (f.writing && ['作文', '书面表达', '写作题'].includes(label)) bonus += 120
  if (
    f.longReading &&
    /阅读$|现代文阅读|文言文阅读|古代诗歌阅读|整本书阅读|任务型阅读|科普阅读题|资料分析题/.test(label)
  )
    bonus += 80
  if (f.judge && label === '判断题') bonus += 60
  return bonus
}

/**
 * 推断标签题型。
 *
 * @param input 题干/选项/答案/解析/学科/候选题型
 * @returns 命中的题型；未命中任何关键词时兜底「其他」（字典无则 typeCode 为空）
 */
export const resolveLabelQuestionType = (input: LabelTypeResolveInput): LabelTypeResolveResult => {
  const stem = plainText(input.stem)
  const options = (input.options ?? []).map((o) => plainText(o))
  const answer = plainText(input.answer)
  const analysis = plainText(input.analysis)
  const text = [stem, options.join(' '), answer, analysis].join(' ').toLowerCase()

  const subjectName = normalizeSubject(
    input.subjectCode != null ? SUBJECT_CODE_NAME[input.subjectCode] ?? '' : ''
  )
  const features = detectFeatures(stem, options, answer)

  let bestRule: QuestionTypeRule | null = null
  let bestScore = 0
  let bestHits: string[] = []
  for (const rule of questionTypeRules) {
    if (!isApplicable(rule, subjectName)) continue
    const hits: string[] = []
    let score = 0
    for (const keyword of rule.keywords) {
      if (keyword && text.includes(keyword.toLowerCase())) {
        score += weightOf(keyword)
        hits.push(keyword)
      }
    }
    for (const cue of rule.stems) {
      if (cue && text.includes(cue.toLowerCase())) {
        score += STEM_WEIGHT_BASE + weightOf(cue)
        hits.push(cue)
      }
    }
    // 特征只用于「加权已命中的候选」：没有关键词命中的题型不靠特征凭空胜出
    if (score > 0) {
      score += featureBonus(rule.label, features)
    }
    if (score <= 0) continue
    if (score > bestScore) {
      bestScore = score
      bestRule = rule
      bestHits = hits
    }
  }

  const candidates = input.candidates.filter((c) => c.typeName)
  const byName = (name?: string) => candidates.find((c) => c.typeName === name)

  if (bestRule !== null) {
    const rule = bestRule as QuestionTypeRule
    const matched = byName(rule.label)
    if (matched) {
      return { typeCode: matched.typeCode, typeName: matched.typeName, score: bestScore, hitKeywords: bestHits }
    }
    // 规则标签不在本学科字典里时，按名称包含关系兜底
    const loose = candidates.find((c) =>
      rule.label.includes(c.typeName) || c.typeName.includes(rule.label)
    )
    if (loose) {
      return { typeCode: loose.typeCode, typeName: loose.typeName, score: bestScore, hitKeywords: bestHits }
    }
  }

  const fallback = byName('其他')
  if (fallback) {
    return { typeCode: fallback.typeCode, typeName: fallback.typeName, score: 0, hitKeywords: [] }
  }
  return { score: 0, hitKeywords: [] }
}
