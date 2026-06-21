<template>
  <ViewLayout title="角色管理">
    <template #header-actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Icon icon="ep:plus" />
        </el-icon>
        新增角色
      </el-button>
    </template>

    <template #search>
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="角色名称">
          <el-input v-model="searchForm.name" placeholder="请输入角色名称" clearable @keyup.enter="handleSearch"
            style="width: 200px" />
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
      <el-table :data="tableData" v-loading="loading" row-key="id" height="100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" min-width="120" />

        <el-table-column prop="remark" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

    <!-- 角色编辑对话框 -->
    <el-dialog v-model="dialogVisible" title="编辑角色" width="600px">
      <el-form :model="roleForm" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input v-model="roleForm.remark" type="textarea" :rows="3" />
        </el-form-item>

      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </template>

    <template #footer>
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="total" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" :prev-text="'上一页'" :next-text="'下一页'" />
    </template>
  </ViewLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { RoleService } from '@/services/roleService'
import ViewLayout from '@/layout/components/lay-view.vue'
import type { RoleInfoVO, RoleUpdateCmd } from '@/api/gen/roleAdminController'

defineOptions({
  name: "ShortClipSystemRole"
})

// 响应式数据
const loading = ref(false)
const tableData = ref<RoleInfoVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive({
  name: ''
})

// 表单数据
const dialogVisible = ref(false)
const isEdit = ref(false)

// 角色表单类型（支持编辑时的 id 字段）
interface RoleForm {
  id?: string
  name?: string
  remark?: string
}

const roleForm = ref<RoleForm>({
  name: '',
  remark: ''
})

// 表单验证规则
const rules = computed(() => ({
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' as const }
  ]
}))

// 获取角色列表
const getRoleList = async () => {
  loading.value = true
  try {
    const params = {
      ...searchForm,
      current: currentPage.value,
      size: pageSize.value
    }

    const result = await RoleService.getRoleList(params)
    if (result) {
      tableData.value = result.records || []
      total.value = Number(result.total) || 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索角色
const handleSearch = () => {
  currentPage.value = 1
  getRoleList()
}

// 重置搜索条件
const handleReset = () => {
  searchForm.name = ''
  currentPage.value = 1
  getRoleList()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  getRoleList()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getRoleList()
}

// 打开新增角色对话框
const handleAdd = () => {
  ElMessage.info('新增角色功能暂未实现')
}

// 打开编辑角色对话框
const handleEdit = (role: RoleInfoVO) => {
  isEdit.value = true
  roleForm.value = {
    id: role.id,
    name: role.name,
    remark: role.remark
  }
  dialogVisible.value = true
}

// 保存角色
const handleSave = async () => {
  if (!roleForm.value.id) {
    ElMessage.error('角色信息异常')
    return
  }

  const updateData: RoleUpdateCmd = {
    id: roleForm.value.id,
    name: roleForm.value.name,
    remark: roleForm.value.remark
  }

  const success = await RoleService.updateRole(updateData)
  if (success) {
    ElMessage.success('更新角色信息成功')
    dialogVisible.value = false
    getRoleList()
  }
}

// 格式化时间
const formatTime = (time?: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString()
}

// 页面加载时获取数据
onMounted(() => {
  getRoleList()
})
</script>
