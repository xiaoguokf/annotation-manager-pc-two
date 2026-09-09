import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConfigApi, type ConfigVO } from '@/api/gen/configController'

const CONFIG_KEY = 'config_data'

export const useConfigStore = defineStore('config', () => {
  const config = ref<ConfigVO | null>(null)
  const loading = ref(false)

  // 初始化配置
  const initConfig = async () => {
    // 先从 localStorage 读取缓存
    const storedConfig = localStorage.getItem(CONFIG_KEY)
    if (storedConfig) {
      try {
        config.value = JSON.parse(storedConfig)
      } catch (error) {
        console.error('解析缓存配置失败:', error)
      }
    }

    // 从服务器获取最新配置
    await fetchConfig()
  }

  // 获取配置
  const fetchConfig = async () => {
    loading.value = true
    try {
      const res = await getConfigApi()
      if (res.data.code === 200 && res.data.data) {
        config.value = res.data.data
        // 保存到 localStorage
        localStorage.setItem(CONFIG_KEY, JSON.stringify(res.data.data))
      }
    } catch (error) {
      console.error('获取配置失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 获取切图端点
  const getSliceEndpoint = () => {
    return config.value?.sliceEndpoint || ''
  }

  // 获取 PDF 图片端点
  const getPdfImageEndpoint = () => {
    return config.value?.pdfImageEndpoint || ''
  }

  return {
    config,
    loading,
    initConfig,
    fetchConfig,
    getSliceEndpoint,
    getPdfImageEndpoint
  }
})
