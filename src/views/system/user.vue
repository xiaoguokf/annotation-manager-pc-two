<template>
  <div class="h-full">
    <ViewLayout title="用户管理">
    <template #header-actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Icon icon="ep:plus" />
        </el-icon>
        新增用户
      </el-button>
    </template>

    <template #search>
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/昵称" clearable @keyup.enter="handleSearch"
            style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.enable" placeholder="请选择状态" clearable style="width: 150px">
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon>
              <Icon icon="ep:search" />
            </el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #default>
      <el-table :data="tableData" v-loading="loading" row-key="id">
        <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="roleNames" label="角色" min-width="200" show-overflow-tooltip />
        <el-table-column prop="enable" label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enable" style="--el-switch-on-color: #67C23A; --el-switch-off-color: #F56C6C"
              @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon>
                <Icon icon="ep:edit" />
              </el-icon>
              编辑
            </el-button>
            <el-button type="info" size="small" @click="handleAssignRole(row)">
              <el-icon>
                <Icon icon="ep:user" />
              </el-icon>
              分配角色
            </el-button>
            <el-button type="warning" size="small" @click="handleResetPassword(row)">
              <el-icon>
                <Icon icon="ep:key" />
              </el-icon>
              重置
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              <el-icon>
                <Icon icon="ep:delete" />
              </el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <template #footer>
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" :prev-text="'上一页'" :next-text="'下一页'" />
    </template>
  </ViewLayout>

  <!-- 用户表单对话框 -->
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="600px">
    <el-form :model="userForm" :rules="rules" label-width="80px">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="userForm.username" :disabled="isEdit" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="密码" prop="password">
        <el-input v-model="userForm.password" type="password" show-password />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="userForm.nickname" />
      </el-form-item>
      <el-form-item v-if="!isEdit" label="状态">
        <el-switch v-model="userForm.enable" active-text="启用" inactive-text="禁用" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="userForm.remark" type="textarea" :rows="3" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleSave">确定</el-button>
    </template>
  </el-dialog>

  <!-- 分配角色对话框 -->
  <el-dialog v-model="roleDialogVisible" title="分配角色" width="450px" :close-on-click-modal="false">
    <el-form label-width="100px" size="large">
      <el-form-item label="当前用户">
        <el-text type="primary" size="large">
          {{ currentUserForRole?.username }}
        </el-text>
      </el-form-item>
      <el-form-item label="选择角色" required>
        <el-select v-model="selectedRoleIds" placeholder="请选择角色" style="width: 100%" size="large" multiple clearable>
          <el-option v-for="role in roleList" :key="role.id" :label="role.name" :value="role.id!" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="roleDialogVisible = false" size="large">取消</el-button>
      <el-button type="primary" @click="handleSaveRoleAssignment" size="large">确定</el-button>
    </template>
  </el-dialog>

  <!-- 重置密码对话框 -->
  <el-dialog v-model="passwordDialogVisible" title="重置密码" width="450px" :close-on-click-modal="false">
    <el-form :model="passwordForm" :rules="passwordRules" label-width="100px" size="large">
      <el-form-item label="当前用户">
        <el-text type="primary" size="large">
          {{ currentUserForPassword?.username }}
        </el-text>
      </el-form-item>
      <el-form-item label="新密码" prop="password">
        <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入新密码"
          style="width: 100%" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码"
          style="width: 100%" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="passwordDialogVisible = false" size="large">取消</el-button>
      <el-button type="primary" @click="handleSavePassword" size="large">确定</el-button>
    </template>
  </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { UserService } from '@/services/userService'
import { RoleService } from '@/services/roleService'
import ViewLayout from '@/layout/components/lay-view.vue'
import type { UserInfoVO, UserInfoUpdateCmd } from '@/api/gen/userAdminController'
import type { RoleInfoVO } from '@/api/gen/roleAdminController'

defineOptions({
  name: "ShortClipSystemUser"
})

// 响应式数据
const loading = ref(false)
const tableData = ref<(UserInfoVO & { roleNames?: string })[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  keyword: '',
  enable: undefined as boolean | undefined
})

// 表单数据
const dialogVisible = ref(false)
const isEdit = ref(false)

// 角色分配相关
const roleDialogVisible = ref(false)
const roleList = ref<RoleInfoVO[]>([])
const selectedRoleIds = ref<string[]>([])
const currentUserForRole = ref<UserInfoVO | undefined>(undefined)

// 重置密码相关
const passwordDialogVisible = ref(false)
const currentUserForPassword = ref<UserInfoVO | undefined>(undefined)
const passwordForm = ref({
  password: '',
  confirmPassword: ''
})



// 用户表单类型（支持编辑时的 id 字段）
interface UserForm {
  id?: string
  username: string
  password?: string
  nickname?: string
  enable: boolean
  remark?: string
}

const userForm = ref<UserForm>({
  username: '',
  password: '',
  nickname: '',
  remark: '',
  enable: true
})

// 表单验证规则
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' as const }
  ],
  password: [
    { required: !isEdit.value, message: '请输入密码', trigger: 'blur' as const },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' as const }
  ]
}))

// 密码表单验证规则
const passwordRules = computed(() => ({
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' as const },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' as const }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' as const },
    {
      validator: (rule: unknown, value: string, callback: (e?: Error) => void) => {
        if (value !== passwordForm.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur' as const
    }
  ]
}))

// 获取用户列表
const getUserList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      current: currentPage.value,
      size: pageSize.value
    }

    const result = await UserService.getUserList(params)
    if (result) {
      // 为用户数据添加角色名称
      const users = (result.records || []).map(user => ({
        ...user,
        roleNames: user.roles && user.roles.length > 0 
          ? user.roles.map(role => role.name).join(', ')
          : '-'
      }))

      tableData.value = users
      total.value = Number(result.total) || 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1
  getUserList()
}

// 重置搜索条件
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.enable = undefined
  currentPage.value = 1
  getUserList()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  getUserList()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getUserList()
}

// 打开新增用户对话框
const handleAdd = () => {
  isEdit.value = false
  userForm.value = {
    username: '',
    password: '',
    nickname: '',
    remark: '',
    enable: true
  }
  dialogVisible.value = true
}

// 打开编辑用户对话框
const handleEdit = (user: UserInfoVO) => {
  isEdit.value = true
  userForm.value = {
    id: user.id,
    username: user.username || '',
    nickname: user.nickname,
    remark: user.remark,
    enable: user.enable || false
    // 编辑时不传密码
  }
  dialogVisible.value = true
}

// 保存用户
const handleSave = async () => {
  if (isEdit.value) {
    // 编辑用户
    const updateData: UserInfoUpdateCmd = {
      id: userForm.value.id!,
      nickname: userForm.value.nickname,
      remark: userForm.value.remark
    }
    const success = await UserService.updateUser(updateData)
    if (success) {
      ElMessage.success('更新用户信息成功')
      dialogVisible.value = false
      getUserList()
    }
  } else {
    // 新增用户
    const success = await UserService.addUser(userForm.value)
    if (success) {
      ElMessage.success('添加用户成功')
      dialogVisible.value = false
      getUserList()
    }
  }
}

// 切换用户状态（通过开关）
const handleStatusChange = async (user: UserInfoVO) => {
  const newStatus = user.enable || false
  const action = newStatus ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}用户 ${user.username} 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 调用API更新状态
    const userId = user.id!
    const success = await UserService.toggleUserStatus(userId, newStatus)
    if (!success) {
      // 如果更新失败，恢复原状态
      user.enable = !newStatus
    } else {
      ElMessage.success(`${action}用户成功`)
    }
  } catch {
    // 用户取消操作，恢复原状态
    user.enable = !newStatus
  }
}

// 删除用户
const handleDelete = async (user: UserInfoVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${user.username} 吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await UserService.deleteUsers([user.id!])
    if (success) {
      ElMessage.success('删除用户成功')
      getUserList()
    }
  } catch {
    // 用户取消操作
  }
}

// 打开分配角色对话框
const handleAssignRole = async (user: UserInfoVO) => {
  currentUserForRole.value = user
  console.log(user.roles);

  selectedRoleIds.value = user.roles ? user.roles.map(role => role.id!).filter(id => id !== undefined): []

  // 获取角色列表
  const roles = await RoleService.getAllRoles()
  if (roles) {
    roleList.value = roles
  }

  roleDialogVisible.value = true
}

// 保存角色分配
const handleSaveRoleAssignment = async () => {
  if (!selectedRoleIds.value || selectedRoleIds.value.length === 0) {
    ElMessage.warning('请选择角色')
    return
  }

  if (!currentUserForRole.value?.id) {
    ElMessage.error('用户信息异常')
    return
  }

  const success = await UserService.assignUserRole({
    id: currentUserForRole.value.id,
    roleIds: selectedRoleIds.value as any
  })

  if (success) {
    ElMessage.success('分配角色成功')
    roleDialogVisible.value = false
    getUserList() // 刷新用户列表
  }
}

// 打开重置密码对话框
const handleResetPassword = (user: UserInfoVO) => {
  currentUserForPassword.value = user
  passwordForm.value = {
    password: '',
    confirmPassword: ''
  }
  passwordDialogVisible.value = true
}

// 保存密码重置
const handleSavePassword = async () => {
  if (!currentUserForPassword.value?.id) {
    ElMessage.error('用户信息异常')
    return
  }

  try {
    await ElMessageBox.confirm(`确定要重置用户 ${currentUserForPassword.value.username} 的密码吗？`, '确认重置', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await UserService.changeUserPassword({
      id: currentUserForPassword.value.id,
      password: passwordForm.value.password
    })

    if (success) {
      ElMessage.success('密码重置成功')
      passwordDialogVisible.value = false
      passwordForm.value = {
        password: '',
        confirmPassword: ''
      }
    }
  } catch {
    // 用户取消操作
  }
}

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

// 页面加载时获取数据
onMounted(() => {
  getUserList()
})
</script>

<style scoped>
/* 自定义开关颜色 */
:deep(.el-switch.is-checked .el-switch__core) {
  background-color: #67C23A;
  border-color: #67C23A;
}

:deep(.el-switch:not(.is-checked) .el-switch__core) {
  background-color: #F56C6C;
  border-color: #F56C6C;
}
</style>
