import NProgress from '@/utils/nprogress'
import axios, { Axios } from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import qs from 'qs'
import { getToken, getRefreshToken, setToken, setRefreshToken } from '../auth'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { useNodeStore } from '@/stores/node'
import { postAuthRefreshTokenApi } from '@/api/gen/baseAuthController'
import { debounce, throttle } from '@/utils/debounce'
import router from '@/router'

// 节点切换状态
let currentBaseURL = ''
let isRetryWithBackup = false
const MAX_RETRY_COUNT = 1
let retryCount = 0

const config: AxiosRequestConfig = {
  baseURL: '/api',
  timeout: 10000,
  paramsSerializer: (params) => {
    // 使用 qs 库序列化参数，数组格式为 id=1&id=2&id=3
    return qs.stringify(params, { arrayFormat: 'repeat' })
  }
}

if (import.meta.env.VITE_API_URL) {
  config.baseURL = import.meta.env.VITE_API_URL
}
const whiteList = ['**/login', '**/genSecret']

/** 无 Content-Disposition 时，按响应类型兜底的文件扩展名 */
const CONTENT_TYPE_EXTENSIONS: Array<[string, string]> = [
  ['application/zip', '.zip'],
  ['application/pdf', '.pdf'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  ['application/vnd.ms-excel', '.xls'],
]

/**
 * 解析下载文件名：优先 RFC 5987 的 filename*=UTF-8''，回退普通 filename=。
 * 两者都缺失时按 content-type 兜底，避免拿到无扩展名的 downloaded_file。
 */
function resolveDownloadFilename(disposition: string, contentType: string): string {
  const encoded = /filename\*\s*=\s*[^']*''([^;\n]*)/i.exec(disposition)
  if (encoded?.[1]) {
    const raw = encoded[1].trim()
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  }

  const plain = /filename\s*=\s*"?([^";\n]*)"?/i.exec(disposition)
  if (plain?.[1]) return plain[1].trim()

  const extension = CONTENT_TYPE_EXTENSIONS.find(([type]) => contentType.includes(type))?.[1] || ''
  return `download${extension}`
}

// 获取初始baseURL
const getInitialBaseURL = () => {
  if (config.baseURL && config.baseURL !== '/api') {
    // 如果配置了VITE_API_URL，使用配置的URL
    return config.baseURL
  }
  return '/api'
}

// 设置当前的baseURL
const setCurrentBaseURL = (url: string) => {
  currentBaseURL = url
}

// 获取当前baseURL
const getCurrentBaseURL = () => {
  return currentBaseURL || getInitialBaseURL()
}

// 导出获取 baseURL 的函数
export { getCurrentBaseURL }
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

const showServiceDownMessage = throttle(() => {
  ElMessage.warning('系统更新重启中，请稍等')
}, 3000)

// URL 路径风格匹配函数
function isUrlMatch(url: string | undefined, pattern: string): boolean {
  if (!url) return false

  // 将通配符模式转换为正则表达式
  let regexPattern = pattern
    // 转义正则表达式特殊字符（除了 *）
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    // 将 ** 转换为匹配任意字符（包括路径分隔符）
    .replace(/\*\*/g, '.*')
    // 将 * 转换为匹配除路径分隔符外的任意字符
    .replace(/\*/g, '[^/]*')

  // 确保完全匹配
  regexPattern = '^' + regexPattern + '$'

  const regex = new RegExp(regexPattern)
  return regex.test(url)
}

type SshineAdminRequestConfigEnhance = {
  loading?: boolean
}

export type SshineAdminRequestConfig<D> = AxiosRequestConfig<D> & SshineAdminRequestConfigEnhance

// SSE 流式请求回调选项
export type SseOptions<T, D> = {
  // 每解析到一条 data 事件时触发
  onMessage: (data: T) => void
  // 发生错误时触发
  onError?: (error: any) => void
  // 流正常结束时触发
  onDone?: () => void
  // axios 配置（含 headers、timeout、loading 等）
  config?: SshineAdminRequestConfig<D>
}

type Result<T> = {
  code: number
  msg: string
  data: T
}

class SshineAdminHttp {
  private http: Axios
  private nodeStore: ReturnType<typeof useNodeStore> | null = null

  constructor(config: AxiosRequestConfig) {
    // 初始化当前baseURL
    setCurrentBaseURL(getInitialBaseURL())

    // 创建axios实例，使用当前baseURL
    const initialConfig = {
      ...config,
      baseURL: getCurrentBaseURL()
    }
    this.http = axios.create(initialConfig)
    this.init()
  }

  // 延迟获取nodeStore，确保在Vue上下文中
  private getNodeStore() {
    if (!this.nodeStore) {
      this.nodeStore = useNodeStore()
    }
    return this.nodeStore
  }

  // 切换到备用节点
  private async switchToBackupNode(): Promise<string | null> {
    const nodeStore = this.getNodeStore()
    const nodes = nodeStore.nodes
    const mainNodeUrl = getInitialBaseURL()

    if (!nodes || nodes.length === 0) {
      // 没有备用节点，尝试切换回主节点
      if (!nodeStore.isMainNode) {
        ElMessage.info('切换回主节点')
        nodeStore.setCurrentNodeInfo(mainNodeUrl, true)
        nodeStore.setSelectedNode(null)
        return mainNodeUrl
      }
      return null
    }

    // 如果是手动模式，使用选中的节点
    if (nodeStore.switchMode === 'manual' && nodeStore.selectedNodeCode) {
      const selectedNode = nodeStore.getSelectedNode()
      if (selectedNode?.url) {
        ElMessage.info(`切换到节点: ${selectedNode.code}`)
        nodeStore.setCurrentNodeInfo(selectedNode.url, false)
        return selectedNode.url
      }
    }

    // 自动模式：先尝试其他备用节点
    for (const node of nodes) {
      if (node.url) {
        try {
          // 快速检查节点是否可用
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2000)

          await fetch(`${node.url}/config`, {
            method: 'GET',
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          // 节点可用，切换到该节点
          ElMessage.success(`已自动切换到节点: ${node.code}`)
          nodeStore.setCurrentNodeInfo(node.url, false)
          // 同步更新选中的节点代码，以便节点管理对话框正确显示
          nodeStore.setSelectedNode(node.code || null)
          return node.url
        } catch (error) {
          // 节点不可用，继续检查下一个
          console.warn(`节点 ${node.code} 不可用:`, error)
        }
      }
    }

    // 所有备用节点都不可用，尝试切换回主节点
    if (!nodeStore.isMainNode) {
      ElMessage.info('切换回主节点')
      nodeStore.setCurrentNodeInfo(mainNodeUrl, true)
      nodeStore.setSelectedNode(null)
      return mainNodeUrl
    }

    // 已经是主节点，没有其他可用节点
    ElMessage.error('所有节点均不可用')
    return null
  }

  init() {
    this.http.interceptors.request.use(
      async (config) => {
        const cfg = config as SshineAdminRequestConfig<any>

        // 更新baseURL（如果nodeStore中的节点切换模式改变了）
        const nodeStore = this.getNodeStore()
        const expectedBaseURL = nodeStore.getCurrentNodeUrl(getInitialBaseURL())

        // 如果baseURL发生变化，更新实例的baseURL
        if (expectedBaseURL && config.baseURL !== expectedBaseURL) {
          config.baseURL = expectedBaseURL
        }

        if (cfg.loading) {
          NProgress.start()
        }
        if (whiteList.some((item) => isUrlMatch(cfg.url, item))) {
          return config
        }
        if (cfg.headers) {
          cfg.headers.Authorization = getToken()
        } else {
          cfg.headers = {
            Authorization: getToken(),
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    this.http.interceptors.response.use(
      (response) => {
        if ((response.config as SshineAdminRequestConfig<any>).loading) {
          NProgress.done()
        }

        // 请求成功，重置重试计数
        isRetryWithBackup = false
        retryCount = 0

        return response
      },
      async (error) => {
        NProgress.done()

        error.isCancelRequest = axios.isCancel(error)
        // 关闭进度条动画
        NProgress.done()
        const nodeStore = this.getNodeStore()

        if (error.code == 'ECONNABORTED') {
          ElMessage.error('请求超时，请刷新重试')

          // 如果是超时错误且未重试过，尝试切换节点
          if (!isRetryWithBackup && retryCount < MAX_RETRY_COUNT && nodeStore.switchMode === 'auto') {
            const backupURL = await this.switchToBackupNode()
            if (backupURL) {
              isRetryWithBackup = true
              retryCount++

              // 更新实例的baseURL
              this.http.defaults.baseURL = backupURL

              // 重新执行原始请求
              error.config.baseURL = backupURL
              return this.http.request(error.config)
            }
          }
        }
        switch (error.status) {
          case 403:
            ElMessage.error('无权限访问')
            router.push({ name: '403' })
            break
          case 401:
            // 不在这里处理401，在下面统一处理刷新token逻辑
            break
          case 400:
            ElMessage.error('请求参数异常')
            break
          case 404:
            ElMessage.error('接口地址不存在')
            break
          case 405:
            ElMessage.error('方法请求错误')
            break
          case 500:
            ElMessage.error('服务器异常,请联系管理员')
            break
          case 502:
          case 503:
            showServiceDownMessage()
            return Promise.reject(error)
          default:
            break
        }

        // 处理401错误，尝试刷新token
        if (error.response?.status === 401 && !error.config._retry) {
          const refreshToken = getRefreshToken()

          if (refreshToken && !isRefreshing) {
            isRefreshing = true
            error.config._retry = true

            try {
              const refreshRes = await postAuthRefreshTokenApi({ refreshToken })
              if (refreshRes.data.code === 200) {
                const { token, refreshToken: newRefreshToken, user } = refreshRes.data.data || {}

                // 更新token
                if (token) {
                  setToken(token)
                }
                if (newRefreshToken) {
                  setRefreshToken(newRefreshToken)
                }

                // 更新用户信息和角色权限
                if (user) {
                  const userStore = useUserStore()
                  const userInfo = {
                    username: user.username || userStore.getUserInfo()?.username || '',
                    roles: user.roles || [],
                    deptIds: userStore.getUserInfo()?.deptIds || [],
                    avatar: userStore.getUserInfo()?.avatar || ''
                  }
                  userStore.setUserInfo(userInfo)
                }

                // 重新执行所有被挂起的请求
                refreshSubscribers.forEach(callback => callback(token || ''))
                refreshSubscribers = []

                // 重新执行原始请求
                if (error.config.headers) {
                  error.config.headers.Authorization = getToken()
                }
                return this.http.request(error.config)
              } else {
                // 刷新token失败，清除token并跳转登录页
                await useUserStore().logout()
                window.location.href = '/login'
              }
            } catch (refreshError) {
              // 刷新token出错，清除token并跳转登录页
              await useUserStore().logout()
              window.location.href = '/login'
            } finally {
              isRefreshing = false
            }
          } else if (isRefreshing) {
            // 如果正在刷新token，将请求加入队列
            return new Promise((resolve) => {
              refreshSubscribers.push((token: string) => {
                if (error.config.headers) {
                  error.config.headers.Authorization = token
                }
                resolve(this.http.request(error.config))
              })
            })
          } else {
            // 没有刷新token，直接跳转登录页
            await useUserStore().logout()
            window.location.href = '/login'
          }
        }

        return Promise.reject(error)
      },
    )
  }
  get<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.get(url, config)
  }
  request<T = any, R = AxiosResponse<Result<T>>, D = any>(
    config: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.request(config)
  }
  delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.delete(url, config)
  }
  head<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.head(url, config)
  }
  options<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.options(url, config)
  }
  post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.post(url, data, config)
  }
  put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.put(url, data, config)
  }
  patch<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.patch(url, data, config)
  }
  postForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.postForm(url, data, config)
  }
  putForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.putForm(url, data, config)
  }
  patchForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: SshineAdminRequestConfig<D>,
  ): Promise<R> {
    return this.http.patchForm(url, data, config)
  }
  /**
   * 下载文件。
   *
   * 请求方法可通过 params / config 中的 method 指定，默认 get。
   * 例如 POST + 请求体的导出接口：http.download(url, { method: 'post', data })
   *
   * @returns 返回 Promise，便于调用方感知失败
   */
  public download(
    url: string,
    params?: AxiosRequestConfig,
    config?: SshineAdminRequestConfig<any>
  ) {
    return this.http
      .request({
        url,
        method: 'get',
        responseType: 'blob',
        ...params,
        ...config,
      })
      .then(response => {
        // 后端未声明类型时按 zip 兜底（交付导出固定为 zip）
        const contentType: string =
          response.headers?.["content-type"] || response.data?.type || 'application/zip';
        const blob = new Blob([response.data], { type: contentType });
        const objectUrl = URL.createObjectURL(blob);

        const disposition: string = response.headers?.["content-disposition"] || "";
        const filename = resolveDownloadFilename(disposition, contentType);

        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = filename; // 指定下载文件的名称
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 延迟释放，避免部分浏览器在下载完成前拿到已失效的 URL
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

        return response;
      });
  }

  /**
   * SSE 流式请求（基于 fetch + ReadableStream）。
   *
   * 请求方法可通过 config.method 指定，默认 post。
   * GET / HEAD 无法携带请求体，此时 body 会被忽略，
   * 需要查询参数时请使用 config.params。
   *
   * 返回 abort 函数，调用可中断流。
   */
  sse<T = any, D = any>(
    url: string,
    data?: D,
    options?: SseOptions<T, D>,
  ): () => void {
    const { onMessage, onError, onDone, config } = options || {}
    const method = (config?.method || 'post').toString().toUpperCase()
    // fetch 规范要求 GET / HEAD 不得携带请求体
    const allowsBody = method !== 'GET' && method !== 'HEAD'
    const controller = new AbortController()
    const baseURL = this.http.defaults.baseURL || ''
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url}`

    // 查询参数序列化，与 axios 拦截器保持一致（数组为重复键形式）
    const query = config?.params
      ? qs.stringify(config.params, { arrayFormat: 'repeat' })
      : ''
    const requestUrl = query ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${query}` : fullUrl

    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: getToken(),
        ...(config?.headers as Record<string, string> | undefined),
      },
      body: allowsBody && data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
      credentials: config?.withCredentials ? 'include' : undefined,
    }
    fetch(requestUrl, init)
      .then(async (response) => {
        if (!response.ok) {
          onError?.(new Error(`SSE 请求失败，状态码：${response.status}`))
          return
        }
        const reader = response.body?.getReader()
        if (!reader) {
          onError?.(new Error('SSE 响应不可读'))
          return
        }
        const decoder = new TextDecoder()
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // SSE 事件以空行(\n\n)分隔
          const events = buffer.split('\n\n')
          buffer = events.pop() || ''
          for (const event of events) {
            const lines = event.split('\n')
            let dataLine = ''
            let hasData = false
            for (const line of lines) {
              if (line.startsWith('data:')) {
                dataLine += line.slice(5).replace(/^ /, '')
                hasData = true
              }
            }
            if (!hasData) continue
            try {
              onMessage?.(JSON.parse(dataLine) as T)
            } catch {
              onMessage?.(dataLine as unknown as T)
            }
          }
        }
        onDone?.()
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
        onError?.(error)
      })

    return () => controller.abort()
  }

}

export default new SshineAdminHttp(config)
