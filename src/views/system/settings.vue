<template>
  <div class="p-6">
    <div class="bg-white rounded-lg shadow-sm p-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-6">系统设置</h2>
      
      <div class="space-y-6">
        <!-- 基本设置 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-medium text-gray-700 mb-4">基本设置</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">系统名称</label>
              <el-input v-model="settings.systemName" placeholder="请输入系统名称" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">系统描述</label>
              <el-input v-model="settings.systemDescription" placeholder="请输入系统描述" />
            </div>
          </div>
        </div>

        <!-- 通知设置 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-medium text-gray-700 mb-4">通知设置</h3>
          <div class="space-y-4">
            <el-switch
              v-model="settings.emailNotification"
              active-text="邮件通知"
              inactive-text="关闭邮件通知" />
            <el-switch
              v-model="settings.systemNotification"
              active-text="系统通知"
              inactive-text="关闭系统通知" />
          </div>
        </div>

        <!-- 安全设置 -->
        <div class="border-b pb-6">
          <h3 class="text-lg font-medium text-gray-700 mb-4">安全设置</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">会话超时时间（分钟）</label>
              <el-input-number v-model="settings.sessionTimeout" :min="10" :max="1440" />
            </div>
            <el-switch
              v-model="settings.twoFactorAuth"
              active-text="双因子认证"
              inactive-text="关闭双因子认证" />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end space-x-4">
          <el-button @click="resetSettings">重置</el-button>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'

defineOptions({
  name: "SystemSettings"
})

interface Settings {
  systemName: string
  systemDescription: string
  emailNotification: boolean
  systemNotification: boolean
  sessionTimeout: number
  twoFactorAuth: boolean
}

const settings = reactive<Settings>({
  systemName: 'Annotation Admin',
  systemDescription: '基于 Vue 3 + Element Plus 的后台管理系统',
  emailNotification: true,
  systemNotification: true,
  sessionTimeout: 120,
  twoFactorAuth: false
})

const saveSettings = () => {
  // 这里可以调用 API 保存设置
  localStorage.setItem('systemSettings', JSON.stringify(settings))
  ElMessage.success('设置保存成功')
}

const resetSettings = () => {
  // 重置为默认设置
  Object.assign(settings, {
    systemName: 'Annotation Admin',
    systemDescription: '基于 Vue 3 + Element Plus 的后台管理系统',
    emailNotification: true,
    systemNotification: true,
    sessionTimeout: 120,
    twoFactorAuth: false
  })
  ElMessage.info('设置已重置')
}

// 页面加载时从 localStorage 恢复设置
const loadSettings = () => {
  const savedSettings = localStorage.getItem('systemSettings')
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings)
      Object.assign(settings, parsed)
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
  }
}

// 初始化时加载设置
loadSettings()
</script>