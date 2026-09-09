<template>
  <div>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报表管理</span>
          <el-button type="primary" @click="handleGenerate">
            <el-icon>
              <Icon icon="ep:document" />
            </el-icon>
            生成报表
          </el-button>
        </div>
      </template>

      <!-- 报表列表 -->
      <el-table :data="reportData" width="100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="报表名称" />
        <el-table-column prop="type" label="报表类型" />
        <el-table-column prop="createTime" label="生成时间" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handlePreview(row as ReportItem)">预览</el-button>
            <el-button type="success" size="small" @click="handleDownload(row as ReportItem)">下载</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row as ReportItem)">删除</el-button>
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
  name: "AnnotationStatisticsReport"
})

interface ReportItem {
  id: number
  name: string
  type: string
  createTime: string
  status: string
}

const reportData = ref<ReportItem[]>([
  {
    id: 1,
    name: '月度销售报表',
    type: '销售报表',
    createTime: '2024-01-15 10:00:00',
    status: 'completed'
  },
  {
    id: 2,
    name: '用户统计报表',
    type: '用户报表',
    createTime: '2024-01-14 15:30:00',
    status: 'processing'
  },
  {
    id: 3,
    name: '财务收支报表',
    type: '财务报表',
    createTime: '2024-01-13 09:20:00',
    status: 'failed'
  }
])

const getStatusType = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processing':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed':
      return '已完成'
    case 'processing':
      return '生成中'
    case 'failed':
      return '失败'
    default:
      return '未知'
  }
}

const handleGenerate = () => {
  ElMessage.success('生成报表功能待实现')
}

const handlePreview = (row: ReportItem) => {
  ElMessage.info(`预览报表: ${row.name}`)
}

const handleDownload = (row: ReportItem) => {
  ElMessage.info(`下载报表: ${row.name}`)
}

const handleDelete = (row: ReportItem) => {
  ElMessageBox.confirm(`确定要删除报表 ${row.name} 吗？`, '提示', {
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
