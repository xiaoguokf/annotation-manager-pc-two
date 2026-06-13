<template>
  <div class="profile-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>个人资料</span>
          <el-button type="primary" disabled>
            编辑资料
          </el-button>
        </div>
      </template>

      <div class="profile-content">
        <!-- 头像区域 -->
        <div class="avatar-section">
          <el-avatar :size="120" :src="userInfo?.avatar || defaultAvatar" />
        </div>

        <!-- 基本信息 -->
        <el-form :model="formData" label-width="100px" class="profile-form">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名">
                <el-input v-model="formData.username" :disabled="true" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="昵称">
                <el-input v-model="formData.nickname" disabled placeholder="请输入昵称" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="formData.email" disabled placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input v-model="formData.phone" disabled placeholder="请输入手机号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="账户状态">
                <el-tag :type="userInfo?.enable ? 'success' : 'danger'">
                  {{ userInfo?.enable ? '正常' : '已禁用' }}
                </el-tag>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="创建时间">
                <span>{{ formatDate(userInfo?.createTime) }}</span>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="用户角色">
            <div class="roles-container">
              <el-tag 
                v-for="role in userInfo?.roleDetails" 
                :key="role.id"
                class="role-tag"
                type="info"
              >
                {{ role.name }}
              </el-tag>
              <el-tag v-if="!userInfo?.roleDetails?.length" type="info">暂无角色</el-tag>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import {  computed, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import defaultAvatar from '@/assets/user.png'

defineOptions({
  name: 'ShortClipProfile'
})

const userStore = useUserStore()

// 用户信息
const userInfo = computed(() => userStore.getUserInfo())

// 表单数据
const formData = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: ''
})

// 初始化表单数据
const initFormData = () => {
  if (userInfo.value) {
    formData.username = userInfo.value.username || ''
    formData.nickname = userInfo.value.nickname || ''
    formData.email = userInfo.value.email || ''
    formData.phone = userInfo.value.phone || ''
  }
}

// 刷新用户信息
const refreshUserInfo = async () => {
  try {
    await userStore.fetchUserInfo()
    initFormData()
  } catch (error) {
    ElMessage.error('获取用户信息失败')
  }
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  refreshUserInfo()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-content {
  display: flex;
  gap: 40px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.change-avatar-btn {
  color: var(--el-color-primary);
  padding: 0;
}

.profile-form {
  flex: 1;
}

.roles-container {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role-tag {
  margin: 0;
}
</style>