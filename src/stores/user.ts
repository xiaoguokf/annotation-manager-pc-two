import { removeToken, getToken, removeRefreshToken } from '@/utils/auth'
import { postAuthLogoutApi } from '@/api/gen/baseAuthController'
import { getUserInfoApi } from '@/api/gen/userController'
import { defineStore } from 'pinia'
import { ref } from 'vue'

interface UserInfo {
  id?: string
  username: string
  email?: string
  nickname?: string
  phone?: string
  roles: string[]
  roleDetails?: Array<{ id?: string, name?: string, code?: string }>
  enable?: boolean
  createTime?: string
  deptIds: string[]
  avatar?: string
}

const USER_INFO_KEY = 'user_info'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo>()

  // 初始化用户信息
  const initUserInfo = () => {
    const storedInfo = localStorage.getItem(USER_INFO_KEY)
    if (storedInfo) {
      try {
        const parsed = JSON.parse(storedInfo)
        // 只有当解析结果有有效内容时才设置
        if (parsed && parsed.username) {
          userInfo.value = parsed
        }
      } catch (error) {
        console.error('解析用户信息失败:', error)
        localStorage.removeItem(USER_INFO_KEY)
      }
    }
  }

  initUserInfo()

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
    console.log('用户信息已更新并存储:', info)
  }

  async function logout() {
    try {
      // 调用登出API通知服务器
      await postAuthLogoutApi()
    } catch (error) {
      // 即使API调用失败，也要清理本地数据
      console.warn('登出API调用失败:', error)
    }

    // 清理本地数据
    userInfo.value = undefined
    localStorage.removeItem(USER_INFO_KEY)
    removeToken()
    removeRefreshToken()
  }

  function getUserInfo() {
    return userInfo.value
  }

  async function fetchUserInfo() {
    try {
      const res = await getUserInfoApi()
      if (res.data.code === 200 && res.data.data) {
        const apiUserInfo = res.data.data
        const userInfoData: UserInfo = {
          id: apiUserInfo.id,
          username: apiUserInfo.username || '',
          email: apiUserInfo.email,
          nickname: apiUserInfo.nickname,
          phone: apiUserInfo.phone,
          roles: apiUserInfo.roles?.map(role => role.code || '') || [],
          roleDetails: apiUserInfo.roles || [],
          enable: apiUserInfo.enable,
          createTime: apiUserInfo.createTime,
          deptIds: [], // 根据实际需求设置
          avatar: '' // 根据实际需求设置
        }

        setUserInfo(userInfoData)
        return userInfoData
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      throw error
    }
  }

  async function initAppUserInfo() {
    const token = getToken()
    if (token) {
      try {
        console.log('应用启动时初始化用户信息...')
        await fetchUserInfo()
        console.log('用户信息初始化成功')
      } catch (error: any) {
        console.warn('初始化用户信息失败:', error)
        // 仅 401/403 需要登出，其他错误保留登录状态
        const status = error?.response?.status || error?.status
        if (status === 401 || status === 403) {
          await logout()
        }
      }
    }
  }

  function isLoggedIn() {
    return !!userInfo.value && !!getToken()
  }

  return {
    userInfo,
    setUserInfo,
    getUserInfo,
    fetchUserInfo,
    initAppUserInfo,
    logout,
    isLoggedIn
  }
})
