<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { Icon } from '@iconify/vue'
import { postAuthLoginApi } from '@/api/gen/baseAuthController'
import { setToken, setRefreshToken, getToken } from '@/utils/auth'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { APP_NAME } from '@/config/app'

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
    // 调用登录接口
    const res = await postAuthLoginApi({
      username: loginForm.value.username,
      password: loginForm.value.password
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
  } finally {
    loading.value = false
  }
}
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
