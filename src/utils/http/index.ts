import NProgress from '@/utils/nprogress'
import axios, { Axios } from 'axios'
import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import qs from 'qs'
import { getToken, getRefreshToken, setToken, setRefreshToken } from '../auth'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { postAuthRefreshTokenApi } from '@/api/gen/baseAuthController'
import { debounce, throttle } from '@/utils/debounce'
import router from '@/router'

const config: AxiosRequestConfig = {
  baseURL: '/api',
  timeout: 10000,
  paramsSerializer: (params) => {
    // 使用 qs 库序列化参数，数组格式为 id=1&id=2&id=3
    return qs.stringify(params, { arrayFormat: 'repeat' })
  }
}

const whiteList = ['**/login', '**/genSecret']
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

type ShortClipRequestConfigEnhance = {
  loading?: boolean
}

export type ShortClipRequestConfig<D> = AxiosRequestConfig<D> & ShortClipRequestConfigEnhance

type Result<T> = {
  code: number
  msg: string
  data: T
}

class ShortClipHttp {
  private http: Axios
  constructor(config: AxiosRequestConfig) {
    this.http = axios.create(config)
    this.init()
  }
  init() {
    this.http.interceptors.request.use(
      async (config) => {
        const cfg = config as ShortClipRequestConfig<any>
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
        if ((response.config as ShortClipRequestConfig<any>).loading) {
          NProgress.done()
        }
        return response
      },
      async (error) => {
        NProgress.done()

        error.isCancelRequest = axios.isCancel(error)
        // 关闭进度条动画
        NProgress.done()
        if (error.code == 'ECONNABORTED') {
          ElMessage.error('请求超时，请刷新重试')
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
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.get(url, config)
  }
  request<T = any, R = AxiosResponse<Result<T>>, D = any>(
    config: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.request(config)
  }
  delete<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.delete(url, config)
  }
  head<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.head(url, config)
  }
  options<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.options(url, config)
  }
  post<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.post(url, data, config)
  }
  put<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.put(url, data, config)
  }
  patch<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.patch(url, data, config)
  }
  postForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.postForm(url, data, config)
  }
  putForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.putForm(url, data, config)
  }
  patchForm<T = any, R = AxiosResponse<T>, D = any>(
    url: string,
    data?: D,
    config?: ShortClipRequestConfig<D>,
  ): Promise<R> {
    return this.http.patchForm(url, data, config)
  }
  public download(
    url: string,
    params?: AxiosRequestConfig,
    config?: ShortClipRequestConfig<any>
  ) {
    this.http
      .get(url, { responseType: "blob", ...params, ...config })
      .then(response => {
        console.log(response);
        // let type = response.headers["Content-Type"] as string;
        const blob = new Blob([response.data], { type: response.data.type });
        const url = URL.createObjectURL(blob);

        const filenameRegex = /filename\*=(UTF-8'')?([^;\n]*)/i;
        const matches = filenameRegex.exec(
          response.headers["content-disposition"]
        );
        let filename = "downloaded_file";

        if (matches != null && matches[2]) {
          filename = decodeURIComponent(matches[2]);
        }

        const link = document.createElement("a");
        link.href = url;
        link.download = filename; // 指定下载文件的名称
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        // 清理临时URL和<a>标签
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      });
  }

}

export default new ShortClipHttp(config)
