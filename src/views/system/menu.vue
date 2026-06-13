<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon>
              <Icon icon="ep:plus" />
            </el-icon>
            新增菜单
          </el-button>
        </div>
      </template>

      <el-table :data="menuData" border width="100%" row-key="id">
        <el-table-column prop="name" label="菜单名称" />
        <el-table-column prop="icon" label="图标">
          <template #default="{ row }">
            <el-icon v-if="row.icon">
              <Icon :icon="row.icon" />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路径" />
        <el-table-column prop="component" label="组件" />
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'

defineOptions({
  name: "ShortClipSystemMenu"
})

interface MenuItem {
  id: number
  name: string
  icon: string
  path: string
  component: string
  sort: number
  status: string
}

const menuData = ref<MenuItem[]>([
  {
    id: 1,
    name: '系统管理',
    icon: 'ep:setting',
    path: '/system',
    component: '',
    sort: 1,
    status: 'active'
  },
  {
    id: 2,
    name: '用户管理',
    icon: 'ep:user',
    path: '/system/user',
    component: 'system/user',
    sort: 1,
    status: 'active'
  },
  {
    id: 3,
    name: '角色管理',
    icon: 'ep:user-filled',
    path: '/system/role',
    component: 'system/role',
    sort: 2,
    status: 'active'
  }
])

const handleAdd = () => {
  ElMessage.success('新增菜单功能待实现')
}

const handleEdit = (row: MenuItem) => {
  ElMessage.info(`编辑菜单: ${row.name}`)
}

const handleDelete = (row: MenuItem) => {
  ElMessageBox.confirm(`确定要删除菜单 ${row.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
