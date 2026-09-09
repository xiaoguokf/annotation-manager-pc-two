import { defineStore } from 'pinia'
import { ref } from 'vue'

// @deprecated 请使用 useParseSettingsStore 代替
const OCR_MODEL_KEY = 'ocr_model'

// @deprecated 请使用 useParseSettingsStore 代替
export const useOcrStore = defineStore('ocr', () => {
  const model = ref<number>(1) // 1-豆包(M1)，2-合合(M2)

  // 初始化 OCR 模型
  const initOcrModel = () => {
    const storedModel = localStorage.getItem(OCR_MODEL_KEY)
    if (storedModel) {
      model.value = parseInt(storedModel, 10)
    }
  }

  initOcrModel()

  function setOcrModel(modelValue: number) {
    model.value = modelValue
    localStorage.setItem(OCR_MODEL_KEY, String(modelValue))
  }

  function getOcrModel() {
    return model.value
  }

  return {
    model,
    setOcrModel,
    getOcrModel
  }
})
