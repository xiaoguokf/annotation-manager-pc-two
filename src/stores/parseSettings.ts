import { defineStore } from 'pinia'
import { ref } from 'vue'

const AUTO_PARSE_KEY = 'auto_parse'
const AUTO_REMOVE_QUESTION_NUM_KEY = 'auto_remove_question_num'
const SUPPLEMENT_MODE_KEY = 'supplement_mode'
const SELECTED_MODEL_ID_KEY = 'selected_model_id'

export const useParseSettingsStore = defineStore('parseSettings', () => {
  // 自动智能封装开关
  const autoParse = ref<boolean>(true)
  // 是否自动去除题号
  const autoRemoveQuestionNum = ref<boolean>(true)
  // 补题模式开关：仅补充答案和解析，题目内容不更新
  const supplementMode = ref<boolean>(false)
  // 用户选择的模型ID（永久保存）
  const selectedModelId = ref<string | null>(null)

  // 初始化设置
  const initSettings = () => {
    const storedAutoParse = localStorage.getItem(AUTO_PARSE_KEY)
    const storedAutoRemoveQuestionNum = localStorage.getItem(AUTO_REMOVE_QUESTION_NUM_KEY)
    const storedSupplementMode = localStorage.getItem(SUPPLEMENT_MODE_KEY)
    const storedSelectedModelId = localStorage.getItem(SELECTED_MODEL_ID_KEY)

    if (storedAutoParse !== null) {
      autoParse.value = storedAutoParse === 'true'
    }
    if (storedAutoRemoveQuestionNum !== null) {
      autoRemoveQuestionNum.value = storedAutoRemoveQuestionNum === 'true'
    }
    if (storedSupplementMode !== null) {
      supplementMode.value = storedSupplementMode === 'true'
    }
    if (storedSelectedModelId && storedSelectedModelId !== 'null') {
      selectedModelId.value = storedSelectedModelId
    }
  }

  initSettings()

  // 设置自动智能封装
  function setAutoParse(value: boolean) {
    autoParse.value = value
    localStorage.setItem(AUTO_PARSE_KEY, String(value))
  }

  // 获取自动智能封装
  function getAutoParse(): boolean {
    return autoParse.value
  }

  // 设置自动去除题号
  function setAutoRemoveQuestionNum(value: boolean) {
    autoRemoveQuestionNum.value = value
    localStorage.setItem(AUTO_REMOVE_QUESTION_NUM_KEY, String(value))
  }

  // 获取自动去除题号
  function getAutoRemoveQuestionNum(): boolean {
    return autoRemoveQuestionNum.value
  }

  // 设置补题模式
  function setSupplementMode(value: boolean) {
    supplementMode.value = value
    localStorage.setItem(SUPPLEMENT_MODE_KEY, String(value))
  }

  // 获取补题模式
  function getSupplementMode(): boolean {
    return supplementMode.value
  }

  // 设置选中的模型ID（永久保存）
  function setSelectedModelId(modelId: string | null) {
    selectedModelId.value = modelId
    localStorage.setItem(SELECTED_MODEL_ID_KEY, String(modelId))
  }

  // 获取选中的模型ID
  function getSelectedModelId(): string | null {
    return selectedModelId.value
  }

  /**
   * 根据模型列表获取当前应该使用的模型
   * @param modelList 模型列表
   * @returns 使用的模型，如果没有默认模型则返回null
   */
  function getEffectiveModel<T extends { id: string; isDefault?: boolean }>(modelList: T[]): T | null {
    if (!modelList || modelList.length === 0) {
      return null
    }

    // 如果用户之前有选中模型，检查是否还在列表中
    if (selectedModelId.value) {
      const selectedModel = modelList.find(m => m.id === selectedModelId.value)
      if (selectedModel) {
        // 选中的模型仍然存在，继续使用
        return selectedModel
      } else {
        // 选中的模型不存在了，清空选择
        setSelectedModelId(null)
      }
    }

    // 使用默认模型
    const defaultModel = modelList.find(m => m.isDefault)
    return defaultModel || modelList[0] || null
  }

  return {
    autoParse,
    autoRemoveQuestionNum,
    supplementMode,
    selectedModelId,
    setAutoParse,
    getAutoParse,
    setAutoRemoveQuestionNum,
    getAutoRemoveQuestionNum,
    setSupplementMode,
    getSupplementMode,
    setSelectedModelId,
    getSelectedModelId,
    getEffectiveModel
  }
})
