<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { Icon } from '@iconify/vue'
import { postAuthLoginApi, getAuthGenSecretApi } from '@/api/gen/baseAuthController'
import type { SecretVO } from '@/api/gen/baseAuthController'
import { setToken, setRefreshToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { APP_NAME } from '@/config/app'
import JSEncrypt from 'jsencrypt'

defineOptions({
  name: 'DefaultLogin'
})

const appName = APP_NAME

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const loginForm = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const rememberMe = ref(false)

// RSA 密钥相关状态
const secretData = ref<SecretVO | null>(null)
const refreshTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const isFetchingSecret = ref(false)

/**
 * 计算密钥剩余有效时间（毫秒）
 */
function getRemainingTime(): number {
  if (!secretData.value) return 0
  const { createTime, expireTime } = secretData.value
  if (!createTime || !expireTime) return 0
  // createTime 后端返回为字符串，需显式转为数字，否则 + 会变成字符串拼接
  const createTimeMs = Number(createTime)
  return createTimeMs + expireTime * 1000 - Date.now()
}

/**
 * 从服务端获取 RSA 公钥
 */
async function fetchSecret(): Promise<void> {
  if (isFetchingSecret.value) return
  isFetchingSecret.value = true
  console.log('[RSA密钥] 开始获取公钥...')
  try {
    const res = await getAuthGenSecretApi()
    if (res.data.code === 200 && res.data.data) {
      secretData.value = res.data.data
      const { uuid, createTime, expireTime } = res.data.data
      const remaining = getRemainingTime()
      const createTimeNum = Number(createTime)
      console.log(
        `[RSA密钥] 公钥获取成功 | uuid=${uuid} | 有效期=${expireTime}s | createTime=${createTimeNum}ms | 剩余=${(remaining / 1000).toFixed(1)}s`
      )
      scheduleNextRefresh()
    } else {
      console.error('[RSA密钥] 获取公钥失败:', res.data.msg)
    }
  } catch (error) {
    console.error('[RSA密钥] 获取公钥异常:', error)
  } finally {
    isFetchingSecret.value = false
  }
}

/**
 * 根据有效期安排下一次密钥刷新
 * 当剩余时间不足总有效期的 20% 时主动刷新
 */
function scheduleNextRefresh(): void {
  // 清除已有定时器
  if (refreshTimer.value) {
    clearTimeout(refreshTimer.value)
    refreshTimer.value = null
  }

  const remaining = getRemainingTime()
  if (remaining <= 0) {
    // 已过期，立即刷新
    console.log('[RSA密钥] 密钥已过期，立即刷新')
    fetchSecret()
    return
  }

  const expireTimeMs = (secretData.value?.expireTime ?? 0) * 1000
  const threshold = expireTimeMs * 0.2 // 20% 阈值点
  const delay = remaining - threshold

  if (delay <= 0) {
    // 已进入 20% 区间，立即刷新
    console.log(
      `[RSA密钥] 剩余=${(remaining / 1000).toFixed(1)}s 已低于20%阈值(${(threshold / 1000).toFixed(1)}s)，立即刷新`
    )
    fetchSecret()
    return
  }

  console.log(
    `[RSA密钥] 下次刷新安排在 ${(delay / 1000).toFixed(1)}s 后（剩余${(remaining / 1000).toFixed(1)}s，阈值${(threshold / 1000).toFixed(1)}s）`
  )
  refreshTimer.value = setTimeout(() => {
    console.log('[RSA密钥] 定时器触发，开始刷新')
    fetchSecret()
  }, delay)
}

/**
 * 浏览器标签页可见性变化处理
 * 当标签页从后台切回前台时，检查密钥是否过期或接近过期
 * 浏览器的 setTimeout 在后台标签页中会被严重节流（最低 1s，甚至 1 分钟），
 * 因此切回前台时需要重新检查并调度
 */
function handleVisibilityChange(): void {
  if (document.visibilityState !== 'visible') {
    console.log('[RSA密钥] 标签页进入后台')
    return
  }

  console.log('[RSA密钥] 标签页切回前台，检查密钥状态...')
  const remaining = getRemainingTime()
  console.log(`[RSA密钥] 当前剩余=${(remaining / 1000).toFixed(1)}s`)

  if (!secretData.value || remaining <= 0) {
    // 后台期间密钥已过期，重新获取
    console.log('[RSA密钥] 后台期间密钥已过期，重新获取')
    fetchSecret()
    return
  }

  const totalDuration = (secretData.value.expireTime ?? 0) * 1000
  if (remaining < totalDuration * 0.2) {
    // 已进入 20% 阈值区间，刷新密钥
    console.log(`[RSA密钥] 已进入20%阈值区间(<${(totalDuration * 0.2 / 1000).toFixed(1)}s)，刷新密钥`)
    fetchSecret()
  } else {
    // 后台时 setTimeout 被节流，重新按正确延迟调度
    console.log('[RSA密钥] 密钥仍有效，重新调度定时器')
    scheduleNextRefresh()
  }
}

/**
 * 使用 RSA 公钥加密明文密码
 */
function encryptPassword(password: string): string {
  if (!secretData.value?.pubKey) {
    throw new Error('公钥未获取')
  }
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(secretData.value.pubKey)
  const encrypted = encrypt.encrypt(password)
  if (!encrypted) {
    throw new Error('密码加密失败，请重试')
  }
  return encrypted
}

/**
 * 登录前确保密钥有效
 * 无密钥时获取，在 20% 阈值内时刷新
 */
async function ensureValidSecret(): Promise<boolean> {
  if (!secretData.value?.pubKey) {
    console.log('[RSA密钥] 尚未获取公钥，先获取...')
    await fetchSecret()
    if (!secretData.value?.pubKey) {
      ElMessage.error('获取加密公钥失败，请检查网络后重试')
      return false
    }
  }

  const remaining = getRemainingTime()
  const totalDuration = (secretData.value.expireTime ?? 0) * 1000
  console.log(
    `[RSA密钥] 登录前检查 | 剩余=${(remaining / 1000).toFixed(1)}s | 阈值=${(totalDuration * 0.2 / 1000).toFixed(1)}s`
  )
  if (remaining < totalDuration * 0.2) {
    console.log('[RSA密钥] 剩余时间低于20%阈值，登录前刷新密钥')
    await fetchSecret()
    if (!secretData.value?.pubKey) {
      ElMessage.error('加密公钥已失效，请刷新页面后重试')
      return false
    }
  }

  return true
}

// 初始化时检查是否有记住的用户名
const initLoginForm = () => {
  const savedUsername = localStorage.getItem('remembered_username')
  if (savedUsername) {
    loginForm.value.username = savedUsername
    rememberMe.value = true
  }
}

// 页面加载时初始化
initLoginForm()

const handleLogin = async () => {
  // 表单验证
  if (!loginForm.value.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!loginForm.value.password.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    // 确保密钥有效
    const valid = await ensureValidSecret()
    if (!valid) {
      loading.value = false
      return
    }

    // RSA 加密密码
    let encryptedPassword: string
    try {
      encryptedPassword = encryptPassword(loginForm.value.password)
    } catch {
      ElMessage.error('密码加密失败，请刷新页面后重试')
      loading.value = false
      return
    }

    // 调用登录接口
    const res = await postAuthLoginApi({
      username: loginForm.value.username,
      password: encryptedPassword,
      uuid: secretData.value?.uuid
    })

    const { data } = res

    if (data.code === 200) {
      const { token, refreshToken, user } = data.data || {}

      // 存储token
      if (token) {
        setToken(token)
      }

      // 存储刷新token
      if (refreshToken) {
        setRefreshToken(refreshToken)
      }

      // 存储用户信息
      if (user) {
        const userInfo = {
          username: user.username || '',
          roles: user.roles || [],
          deptIds: [],
          avatar: ''
        }
        userStore.setUserInfo(userInfo)
      } else {
        // 如果接口没有返回用户信息，尝试从API获取
        try {
          await userStore.fetchUserInfo()
        } catch (error) {
          console.error('获取用户信息失败:', error)
          ElMessage.error('获取用户信息失败，请重新登录')
          loading.value = false
          return
        }
      }

      // 处理记住用户名
      if (rememberMe.value) {
        localStorage.setItem('remembered_username', loginForm.value.username)
      } else {
        localStorage.removeItem('remembered_username')
      }

      ElMessage.success('登录成功')

      // 确保localStorage写入完成和用户信息已完全加载后再跳转
      await new Promise(resolve => setTimeout(resolve, 200))

      // 检查是否有redirect参数
      const redirect = route.query.redirect as string
      if (redirect) {
        router.push(redirect)
      } else {
        router.push('/')
      }
    } else {
      ElMessage.error(data.msg || '登录失败')
    }
  } catch {
    ElMessage.error('登录请求失败，请检查网络后重试')
  } finally {
    loading.value = false
  }
}

// 生命周期：组件挂载时获取公钥并监听页面可见性
onMounted(() => {
  fetchSecret()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

// 生命周期：组件卸载时清理定时器和事件监听
onBeforeUnmount(() => {
  if (refreshTimer.value) {
    clearTimeout(refreshTimer.value)
    refreshTimer.value = null
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <div class="min-h-screen flex bg-linear-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <!-- 左侧介绍区域 -->
    <div class="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
      <div class="max-w-lg">
        <!-- Logo和大标题 -->
        <div class="mb-10">
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-16 h-16 bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <img src="/logo.svg" alt="Logo" class="w-10 h-10" />
            </div>
            <h1 class="text-4xl font-bold text-gray-800 dark:text-gray-100">{{ appName }}</h1>
          </div>
          <p class="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            高效的企业后台管理系统，提供用户管理、角色权限、系统配置等核心功能，助力企业数字化管理。
          </p>
        </div>

        <!-- 核心数据展示 -->
        <div class="grid grid-cols-3 gap-6 mb-10">
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xs border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-3xl font-bold text-blue-600 mb-1">100+</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">功能模块</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xs border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-3xl font-bold text-indigo-600 mb-1">99.9%</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">系统可用性</div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xs border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-3xl font-bold text-purple-600 mb-1">7×24h</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">稳定运行</div>
          </div>
        </div>

        <!-- 功能特性 -->
        <div class="space-y-4">
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
              <Icon icon="ep:setting" class="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">系统管理</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">用户管理、角色权限分配、系统配置，全方位后台管理能力</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <Icon icon="ep:lock" class="text-indigo-600 dark:text-indigo-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">安全可靠</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">完善的认证授权体系，Token 自动刷新，保障数据安全</p>
            </div>
          </div>
          <div class="flex items-start space-x-4">
            <div class="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
              <Icon icon="ep:brush" class="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">灵活定制</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">多套主题配色，模块化架构设计，满足不同业务场景需求</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区域 -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <div class="w-full max-w-md">
        <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10">
          <!-- Logo和标题（移动端显示） -->
          <div class="lg:hidden text-center mb-8">
            <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
              <div class="w-full h-full bg-linear-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <img src="/logo.svg" alt="Logo" class="w-10 h-10" />
              </div>
            </div>
            <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ appName }}</h1>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">后台管理系统</p>
          </div>

          <!-- 登录表单标题 -->
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-100">欢迎登录</h2>
            <p class="text-gray-500 dark:text-gray-400 mt-1">请输入您的账号信息</p>
          </div>

          <!-- 登录表单 -->
          <el-form :model="loginForm" @submit.prevent="handleLogin" label-position="top" size="large">
            <el-form-item label="用户名">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                clearable
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <Icon icon="ep:user" class="text-gray-400" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="密码">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                clearable
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <Icon icon="ep:lock" class="text-gray-400" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="rememberMe">
                记住用户名
              </el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="w-full"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 底部信息 -->
          <div class="text-center mt-8 text-sm text-gray-400">
            <p>© 2026 {{ appName }}. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Card 样式 */
::deep(.el-card) {
  border-radius: 16px;
}

/* 移动端适配 */
@media (max-width: 1023px) {
  #login {
    padding: 20px 0;
  }
}
</style>
