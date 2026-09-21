// 学科题型字典：复用 dic/question-type/list（支持按 subjectCode 过滤，并带有 isChoice/baseType）。
// 用于题目类型按学科动态显示，同时兼容旧版 tishi 字符串。
import { ref } from 'vue'
import { getDicQuestionTypeListApi, type DicQuestionTypeVO } from '@/api/gen/dicController'

const dict = ref<DicQuestionTypeVO[]>([])
let loaded = false
let loadingPromise: Promise<void> | null = null

const LEGACY_TISHI_LABEL: Record<string, string> = {
  xuanze: '选择题',
  duoxuan: '多选题',
  panduan: '判断题',
  tiankong: '填空题',
  zuhe: '组合题',
  wenda: '问答题',
  gaicuo: '改错题',
}
const LEGACY_CHOICE_TISHI = new Set(['xuanze', 'duoxuan'])

export function useQuestionTypeDict() {
  const ensureLoaded = async (): Promise<void> => {
    if (loaded) return
    if (loadingPromise) return loadingPromise
    loadingPromise = (async () => {
      try {
        const res = await getDicQuestionTypeListApi()
        dict.value = res.data?.data || []
        loaded = true
      } catch (e) {
        console.error('学科题型字典加载失败', e)
      } finally {
        loadingPromise = null
      }
    })()
    return loadingPromise
  }

  const getOptionsBySubject = (subjectCode?: number): DicQuestionTypeVO[] =>
    subjectCode == null ? dict.value : dict.value.filter((t) => t.subjectCode === subjectCode)

  const getTypeNameByCode = (typeCode?: number | string): string => {
    if (typeCode === undefined || typeCode === null || typeCode === '') return ''
    const code = typeof typeCode === 'string' ? Number(typeCode) : typeCode
    if (Number.isNaN(code)) return ''
    return dict.value.find((t) => t.typeCode === code)?.typeName || ''
  }

  const isChoiceByCode = (typeCode?: number | string): boolean => {
    if (typeCode === undefined || typeCode === null || typeCode === '') return false
    const code = typeof typeCode === 'string' ? Number(typeCode) : typeCode
    if (Number.isNaN(code)) return false
    return dict.value.find((t) => t.typeCode === code)?.isChoice === 1
  }

  const getQuestionTypeName = (opts: {
    labelQuestionType?: number | null
    tishi?: string | null
    labelQuestionTypeZh?: string | null
  }): string => {
    if (opts.labelQuestionType != null) {
      return getTypeNameByCode(opts.labelQuestionType) || opts.labelQuestionTypeZh || ''
    }
    if (opts.tishi) {
      return LEGACY_TISHI_LABEL[opts.tishi] || opts.tishi
    }
    return ''
  }

  const isChoiceQuestion = (opts: {
    labelQuestionType?: number | null
    tishi?: string | null
  }): boolean => {
    if (opts.labelQuestionType != null) return isChoiceByCode(opts.labelQuestionType)
    if (opts.tishi) return LEGACY_CHOICE_TISHI.has(opts.tishi)
    return false
  }

  return {
    dict,
    ensureLoaded,
    getOptionsBySubject,
    getTypeNameByCode,
    isChoiceByCode,
    getQuestionTypeName,
    isChoiceQuestion,
    LEGACY_TISHI_LABEL,
  }
}
