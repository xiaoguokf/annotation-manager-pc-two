<template>
  <ViewLayout title="公告管理">
    <template #header-actions>
      <el-button type="primary" @click="handleAdd">
        <el-icon>
          <Icon icon="ep:plus" />
        </el-icon>
        新增公告
      </el-button>
      <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
        <el-icon>
          <Icon icon="ep:delete" />
        </el-icon>
        批量删除<span v-if="selectedIds.length">({{ selectedIds.length }})</span>
      </el-button>
    </template>

    <template #search>
      <el-form :model="searchForm" :inline="true">
        <el-form-item label="公告标题">
          <el-input v-model="searchForm.title" placeholder="请输入公告标题" clearable @keyup.enter="handleSearch"
            style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 150px">
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
          <el-button @click="handleReset">
            <el-icon>
              <Icon icon="ep:refresh" />
            </el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </template>

    <template #default>
      <el-table :data="tableData" v-loading="loading" row-key="id" height="100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" :reserve-selection="true" />
        <el-table-column prop="title" label="公告标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="公告内容" min-width="240" show-overflow-tooltip>
          <template #default="{ row }">
            {{ stripHtml(row.content) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-switch v-model="row.status" style="--el-switch-on-color: #67C23A; --el-switch-off-color: #F56C6C"
              @change="handleStatusChange(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="isTop" label="置顶" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isTop" type="warning" effect="light" size="small">置顶</el-tag>
            <span v-else class="text-gray-400 dark:text-gray-500">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="生效开始" width="170">
          <template #default="{ row }">
            {{ formatTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="endTime" label="生效结束" width="170">
          <template #default="{ row }">
            {{ formatTime(row.endTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon>
                <Icon icon="ep:edit" />
              </el-icon>
              编辑
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

      <!-- 新增/编辑公告对话框 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '新增公告'" width="640px"
        :close-on-click-modal="false">
        <el-form :model="announcementForm" :rules="rules" label-width="90px">
          <el-form-item label="公告标题" prop="title">
            <el-input v-model="announcementForm.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="公告内容">
            <RichTextEditor v-model="announcementForm.content" :height="'280px'"
              placeholder="请输入公告内容，支持富文本编辑" />
          </el-form-item>
          <el-form-item label="生效时间">
            <div class="flex flex-col gap-2 w-full">
              <el-date-picker v-model="announcementForm.startTime" type="datetime" placeholder="开始时间"
                value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" clearable />
              <el-date-picker v-model="announcementForm.endTime" type="datetime" placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" clearable />
            </div>
          </el-form-item>
          <el-form-item label="状态">
            <el-switch v-model="announcementForm.status" active-text="启用" inactive-text="禁用" />
          </el-form-item>
          <el-form-item label="置顶">
            <el-switch v-model="announcementForm.isTop" active-text="置顶" inactive-text="不置顶" />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="handleSave">确定</el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { AnnouncementService } from '@/services/announcementService'
import ViewLayout from '@/layout/components/lay-view.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import type { AnnouncementVO, AnnouncementQuery, AnnouncementSaveCmd } from '@/api/gen/announcementAdminController'

defineOptions({
  name: "ShortClipSystemAnnouncement"
})

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<AnnouncementVO[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 搜索表单
const searchForm = reactive<AnnouncementQuery>({
  title: undefined,
  status: undefined
})

// 选中行
const selectedIds = ref<string[]>([])

// 表单数据
const dialogVisible = ref(false)
const isEdit = ref(false)

interface AnnouncementForm {
  id?: string
  title: string
  content?: string
  status: boolean
  isTop: boolean
  startTime?: string
  endTime?: string
}

const announcementForm = ref<AnnouncementForm>({
  title: '',
  content: '',
  status: true,
  isTop: false,
  startTime: undefined,
  endTime: undefined
})

// 表单验证规则
const rules = computed(() => ({
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur-sm' as const }
  ]
}))

// 获取公告列表
const getAnnouncementList = async () => {
  loading.value = true
  try {
    const params: AnnouncementQuery = {
      ...searchForm,
      current: currentPage.value,
      size: pageSize.value
    }

    const result = await AnnouncementService.getAnnouncementList(params)
    if (result) {
      tableData.value = result.records || []
      total.value = Number(result.total) || 0
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  getAnnouncementList()
}

// 重置搜索条件
const handleReset = () => {
  searchForm.title = undefined
  searchForm.status = undefined
  currentPage.value = 1
  getAnnouncementList()
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  getAnnouncementList()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  getAnnouncementList()
}

// 表格多选
const handleSelectionChange = (rows: AnnouncementVO[]) => {
  selectedIds.value = rows.map(r => r.id!).filter(Boolean)
}

// 打开新增对话框
const handleAdd = () => {
  isEdit.value = false
  announcementForm.value = {
    title: '',
    content: '',
    status: true,
    isTop: false,
    startTime: undefined,
    endTime: undefined
  }
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = (row: AnnouncementVO) => {
  isEdit.value = true
  announcementForm.value = {
    id: row.id,
    title: row.title || '',
    content: row.content,
    status: row.status ?? true,
    isTop: row.isTop ?? false,
    startTime: row.startTime,
    endTime: row.endTime
  }
  dialogVisible.value = true
}

// MySQL TEXT 字段上限（字节，内容仅含 HTML 文本与图片链接，64KB 足够）
const MAX_CONTENT_BYTES = 65535

// 计算字符串 UTF-8 字节长度
const getByteLength = (str: string) => new Blob([str]).size

// 当前公告内容字节数（实时显示）
const contentBytes = computed(() => getByteLength(announcementForm.value.content || ''))

// 保存公告
const handleSave = async () => {
  if (!announcementForm.value.title) {
    ElMessage.warning('请输入公告标题')
    return
  }

  if (contentBytes.value > MAX_CONTENT_BYTES) {
    ElMessage.warning(
      `公告内容过大（${contentBytes.value} 字节），已超过数据库上限 ${MAX_CONTENT_BYTES} 字节，请减少图片或精简内容`
    )
    return
  }

  const payload: AnnouncementSaveCmd = {
    id: announcementForm.value.id,
    title: announcementForm.value.title,
    content: announcementForm.value.content,
    status: announcementForm.value.status,
    isTop: announcementForm.value.isTop,
    startTime: announcementForm.value.startTime,
    endTime: announcementForm.value.endTime
  }

  submitting.value = true
  try {
    const success = isEdit.value
      ? await AnnouncementService.updateAnnouncement(payload)
      : await AnnouncementService.createAnnouncement(payload)

    if (success) {
      ElMessage.success(isEdit.value ? '更新公告成功' : '新增公告成功')
      dialogVisible.value = false
      getAnnouncementList()
    }
  } finally {
    submitting.value = false
  }
}

// 切换公告状态（通过开关）
const handleStatusChange = async (row: AnnouncementVO) => {
  const newStatus = row.status || false
  const action = newStatus ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确定要${action}公告「${row.title}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await AnnouncementService.toggleAnnouncementStatus(row.id!)
    if (!success) {
      // 如果更新失败，恢复原状态
      row.status = !newStatus
    } else {
      ElMessage.success(`${action}公告成功`)
    }
  } catch {
    // 用户取消操作，恢复原状态
    row.status = !newStatus
  }
}

// 删除公告
const handleDelete = async (row: AnnouncementVO) => {
  try {
    await ElMessageBox.confirm(`确定要删除公告「${row.title}」吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await AnnouncementService.deleteAnnouncement(row.id!)
    if (success) {
      ElMessage.success('删除公告成功')
      // 删除后若当前页无数据则回退一页
      if (tableData.value.length === 1 && currentPage.value > 1) {
        currentPage.value -= 1
      }
      getAnnouncementList()
    }
  } catch {
    // 用户取消操作
  }
}

// 批量删除公告
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条公告吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const success = await AnnouncementService.batchDeleteAnnouncement(selectedIds.value)
    if (success) {
      ElMessage.success('批量删除成功')
      selectedIds.value = []
      getAnnouncementList()
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

// 去除 HTML 标签，用于列表内容预览
const stripHtml = (html?: string) => {
  if (!html) return '-'
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
  return text.length > 60 ? text.slice(0, 60) + '...' : text || '-'
}

// 页面加载时获取数据
onMounted(() => {
  getAnnouncementList()
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
