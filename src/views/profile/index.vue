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

    <!-- 修改密码卡片 -->
    <el-card class="mt-4">
      <template #header>
        <div class="card-header">
          <span>安全设置</span>
        </div>
      </template>

      <div class="security-content">
        <div class="security-item">
          <div class="security-info">
            <div class="security-title">
              <Icon icon="ep:lock" class="mr-2" />
              登录密码
            </div>
            <div class="security-desc text-gray-500 dark:text-gray-400">
              定期更换密码有助于保护账户安全
            </div>
          </div>
          <el-button type="primary" link @click="openChangePwdDialog">
            修改密码
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="changePwdDialogVisible"
      title="修改密码"
      width="460px"
      :close-on-click-modal="false"
      @closed="resetChangePwdForm"
    >
      <el-form
        ref="changePwdFormRef"
        :model="changePwdForm"
        :rules="changePwdRules"
        label-width="80px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="changePwdForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="changePwdForm.password"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="changePwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="changePwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="changePwdLoading" @click="handleChangePwd">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { FormInstance, FormRules } from 'element-plus'
import { postUserChangePasswordApi } from '@/api/gen/userController'
import defaultAvatar from '@/assets/user.png'

defineOptions({
  name: 'ShortClipProfile'
})

const router = useRouter()
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

// ==================== 修改密码 ====================
const changePwdDialogVisible = ref(false)
const changePwdLoading = ref(false)
const changePwdFormRef = ref<FormInstance>()

const changePwdForm = reactive({
  oldPassword: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (value !== changePwdForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const changePwdRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const openChangePwdDialog = () => {
  changePwdDialogVisible.value = true
}

const resetChangePwdForm = () => {
  changePwdForm.oldPassword = ''
  changePwdForm.password = ''
  changePwdForm.confirmPassword = ''
  changePwdFormRef.value?.clearValidate()
}

const handleChangePwd = async () => {
  const valid = await changePwdFormRef.value?.validate().catch(() => false)
  if (!valid) return

  changePwdLoading.value = true
  try {
    const res = await postUserChangePasswordApi({
      oldPassword: changePwdForm.oldPassword,
      password: changePwdForm.password
    })
    if (res.data?.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      changePwdDialogVisible.value = false
      // 修改密码成功后退出登录并跳转登录页
      await userStore.logout()
      router.push('/login')
    } else {
      ElMessage.error(res.data?.msg || '修改密码失败')
    }
  } catch {
    // HTTP 层错误已由拦截器处理
  } finally {
    changePwdLoading.value = false
  }
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

.security-content {
  max-width: 600px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.security-item + .security-item {
  border-top: 1px solid var(--theme-border-color);
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.security-title {
  display: flex;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
}

.security-desc {
  font-size: 13px;
}
</style>
