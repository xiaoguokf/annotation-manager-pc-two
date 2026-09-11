<template>
  <div class="h-full flex flex-col overflow-hidden">
    <ViewLayout title="审核任务">
      <template #header-actions>
        <div class="header-actions">
          <el-button type="success" @click="handleExport" :disabled="selectedRows.length === 0">
            <el-icon>
              <Icon icon="ep:download" />
            </el-icon>
            导出JSON
          </el-button>
          <el-button type="primary" @click="handleOpenClaimDialog">
            <el-icon>
              <Icon icon="ep:download" />
            </el-icon>
            领取审核任务
          </el-button>
        </div>
      </template>

      <template #search>
        <el-form :model="searchForm" class="search-form" :inline="true">
          <el-form-item label="项目ID">
            <el-input
              v-model="searchForm.searchId"
              placeholder="请输入项目ID"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="标题">
            <el-input
              v-model="searchForm.title"
              placeholder="请输入标题"
              clearable
              @keyup.enter="handleSearch"
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="请选择状态"
              clearable
              style="width: 150px"
            >
              <el-option label="待审核" :value="4" />
              <el-option label="审核失败" :value="5" />
              <el-option label="审核成功" :value="6" />
              <el-option label="问题提交" :value="10" />
              <el-option label="回传失败" :value="11" />
              <el-option label="管理员打回" :value="12" />
              <el-option label="待资料审核" :value="14" />
              <el-option label="资料审核失败" :value="15" />
              <el-option label="资料审核通过" :value="16" />
              <el-option label="管理员资料打回" :value="18" />
              <el-option label="资料问题提交" :value="19" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-switch
              v-model="onlyReturned"
              active-text="仅回传"
              @change="handleOnlyReturnedChange"
            />
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

      <!-- 表格区域 -->
      <div class="flex-1 min-h-0 overflow-hidden">
        <el-table
          :data="tableData"
          v-loading="loading"
          height="100%"
          width="100%"
          row-key="searchId"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :selectable="checkSelectable" />
          <el-table-column prop="searchId" label="搜索ID" width="200" />
          <el-table-column prop="title" label="项目名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 0 ? 'primary' : 'success'">
                {{ row.type === 0 ? '书籍' : '试卷' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="审核状态" width="140">
            <template #default="{ row }">
              <el-tag
                v-if="getStatusColorConfig(row.status).color"
                :color="getStatusColorConfig(row.status).color"
                style="color: #fff; border-color: transparent"
              >
                {{ getStatusText(row.status) }}
              </el-tag>
              <el-tag v-else :type="getStatusColorConfig(row.status).type">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reviewClaimTime" label="审核领取时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.reviewClaimTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="340" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="isMaterialReviewStatus(row.status)"
                type="warning"
                size="small"
                link
                @click="handleStartMaterialReview(row as ProjectReviewListVO)"
              >
                <el-icon>
                  <Icon icon="ep:document-checked" />
                </el-icon>
                资料审核
              </el-button>
              <el-button
                v-else
                type="primary"
                size="small"
                link
                :disabled="!canStartReview(row.status)"
                @click="handleStartReview(row as ProjectReviewListVO)"
              >
                <el-icon>
                  <Icon icon="ep:edit-pen" />
                </el-icon>
                开始审核
              </el-button>
              <el-button
                type="primary"
                size="small"
                link
                :disabled="!canPreviewAudit(row.status)"
                @click="handlePreviewAudit(row as ProjectReviewListVO)"
              >
                <el-icon>
                  <Icon icon="ep:view" />
                </el-icon>
                审核预览
              </el-button>
              <el-button
                type="primary"
                size="small"
                link
                @click="handleView(row as ProjectReviewListVO)"
              >
                <el-icon>
                  <Icon icon="ep:document" />
                </el-icon>
                查看
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :prev-text="'上一页'"
          :next-text="'下一页'"
        />
      </template>
    </ViewLayout>

    <!-- 领取任务对话框 -->
    <el-dialog v-model="showClaimDialog" title="领取审核任务" width="500px">
      <el-form :model="claimForm" label-width="100px">
        <el-form-item label="领取方式">
          <el-radio-group v-model="claimMode">
            <el-radio value="auto">随机领取</el-radio>
            <el-radio value="manual">通过ID领取</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="claimMode === 'manual'" label="项目ID">
          <el-input
            v-model="claimForm.searchId"
            placeholder="请输入项目ID"
            clearable
            @keyup.enter="handleClaimConfirm"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showClaimDialog = false">取消</el-button>
          <el-button type="primary" @click="handleClaimConfirm" :loading="claiming">
            确认领取
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- PDF 预览对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`预览 - ${currentProject?.title}`"
      width="1000px"
      top="5vh"
      class="pdf-preview-dialog"
    >
      <div v-loading="pdfLoading" class="pdf-preview-container">
        <div v-if="pdfPages.length > 0" class="flex flex-col h-full">
          <!-- 控制栏 -->
          <div class="pdf-page-nav">
            <el-button @click="handlePrevPage" :disabled="currentPageIndex === 0">
              <el-icon>
                <Icon icon="ep:arrow-left" />
              </el-icon>
              上一页
            </el-button>
            <span class="page-number">{{ currentPageIndex + 1 }} / {{ pdfPages.length }}</span>
            <el-button @click="handleNextPage" :disabled="currentPageIndex === pdfPages.length - 1">
              下一页
              <el-icon>
                <Icon icon="ep:arrow-right" />
              </el-icon>
            </el-button>
            <el-input
              v-model="targetPage"
              type="number"
              size="small"
              style="width: 80px; margin-left: 12px"
              @blur="handleGoToPage"
              @keyup.enter="handleGoToPage"
            />
          </div>

          <!-- 图片展示区域 -->
          <div class="pdf-preview-content">
            <img
              v-if="pdfPages[currentPageIndex]?.url"
              :src="pdfPages[currentPageIndex]?.url"
              class="pdf-preview-image"
              alt="PDF页面"
            />
            <div v-else class="no-image">
              <el-icon><Icon icon="ep:picture" /></el-icon>
              <p>暂无图片</p>
            </div>
          </div>
        </div>

        <el-empty v-else description="暂无PDF页面数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  postProjectReviewClaimApi,
  postProjectReviewClaimSearchIdApi,
  getProjectReviewListApi,
  type ProjectReviewQuery,
  type ProjectReviewListVO,
} from '@/api/gen/projectController'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { getDeliverDocxExportApi } from '@/api/gen/docxDeliver'
import { saveLastExportFolder, getLastExportFolder, isElectron } from '@/utils/export'
import { getToken } from '@/utils/auth'
import { getCurrentBaseURL } from '@/utils/http'
import { ProjectStatus, getProjectStatusColor, ProjectStatusText } from '@/constants/projectStatus'
import ViewLayout from '@/layout/components/lay-view.vue'

const router = useRouter()

// 对话框相关
const dialogVisible = ref(false)
const currentProject = ref<ProjectReviewListVO | null>(null)
const pdfPages = ref<PdfPageVO[]>([])
const currentPageIndex = ref(0)
const pdfLoading = ref(false)

// 搜索表单
const searchForm = reactive<ProjectReviewQuery>({
  size: 10,
  current: 1,
  status: undefined,
  searchId: '',
  title: '',
})

// 仅回传开关
const onlyReturned = ref(false)

// 表格数据
const tableData = ref<ProjectReviewListVO[]>([])
const loading = ref(false)
const claiming = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 选中的行
const selectedRows = ref<ProjectReviewListVO[]>([])
const exporting = ref(false)

// 领取对话框相关
const showClaimDialog = ref(false)
const claimMode = ref<'auto' | 'manual'>('auto')
const claimForm = reactive({
  searchId: '',
})

// 重置对话框
const resetClaimDialog = () => {
  claimForm.searchId = ''
  claimMode.value = 'auto'
}

// 获取审核列表
const fetchReviewList = async () => {
  loading.value = true
  try {
    const response = await getProjectReviewListApi({
      ...searchForm,
      size: pageSize.value,
      current: currentPage.value,
    })
    if (response.data.code === 200) {
      tableData.value = response.data.data?.records || []
      total.value = response.data.data?.total || 0
    } else {
      ElMessage.error(response.data.msg || '获取审核列表失败')
    }
  } catch (error) {
    ElMessage.error('获取审核列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 领取审核任务
const handleClaim = async () => {
  claiming.value = true
  try {
    const response = await postProjectReviewClaimApi()
    if (response.data.code === 200) {
      ElMessage.success('领取审核任务成功')
      showClaimDialog.value = false
      // 刷新页面
      location.reload()
    } else {
      ElMessage.error(response.data.msg || '领取审核任务失败')
    }
  } catch (error) {
    ElMessage.error('领取审核任务失败')
    console.error(error)
  } finally {
    claiming.value = false
  }
}

// 打开领取对话框
const handleOpenClaimDialog = () => {
  resetClaimDialog()
  showClaimDialog.value = true
}

// 通过ID领取审核任务
const handleClaimBySearchId = async () => {
  if (!claimForm.searchId) {
    ElMessage.warning('请输入项目ID')
    return
  }
  claiming.value = true
  try {
    const response = await postProjectReviewClaimSearchIdApi({ searchId: claimForm.searchId })
    if (response.data.code === 200) {
      ElMessage.success('领取审核任务成功')
      showClaimDialog.value = false
      claimForm.searchId = ''
      // 刷新页面
      location.reload()
    } else {
      ElMessage.error(response.data.msg || '领取审核任务失败')
    }
  } catch (error) {
    ElMessage.error('领取审核任务失败')
    console.error(error)
  } finally {
    claiming.value = false
  }
}

// 确认领取
const handleClaimConfirm = () => {
  if (claimMode.value === 'auto') {
    handleClaim()
  } else {
    handleClaimBySearchId()
  }
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchReviewList()
}

// 重置
const handleReset = () => {
  searchForm.status = undefined
  searchForm.searchId = ''
  searchForm.title = ''
  onlyReturned.value = false
  currentPage.value = 1
  fetchReviewList()
}

// 仅回传开关变化
const handleOnlyReturnedChange = (val: string | number | boolean) => {
  if (val) {
    searchForm.status = ProjectStatus.RETURNED
  } else {
    searchForm.status = undefined
  }
  currentPage.value = 1
  fetchReviewList()
}

// 每页数量变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchReviewList()
}

// 当前页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchReviewList()
}

// 获取 PDF 页面列表
const fetchPdfPages = async (projectId: string | undefined) => {
  console.log('开始获取PDF页面，projectId:', projectId)
  if (!projectId) {
    ElMessage.warning('项目ID不存在')
    return
  }
  pdfLoading.value = true
  try {
    console.log('调用API获取PDF页面...')
    const response = await getPdfPageListApi({ pdfOrProjectId: String(projectId) })
    console.log('API返回结果:', response)
    if (response.data.code === 200) {
      pdfPages.value = response.data.data || []
      currentPageIndex.value = 0
      targetPage.value = '1'
      console.log('获取成功，共', pdfPages.value.length, '页')
    } else {
      ElMessage.error(response.data.msg || '获取PDF页面失败')
    }
  } catch (error) {
    ElMessage.error('获取PDF页面失败')
    console.error('获取PDF页面异常:', error)
  } finally {
    pdfLoading.value = false
  }
}

// 上一页
const handlePrevPage = () => {
  if (currentPageIndex.value > 0) {
    currentPageIndex.value--
    targetPage.value = (currentPageIndex.value + 1).toString()
  }
}

// 下一页
const handleNextPage = () => {
  if (currentPageIndex.value < pdfPages.value.length - 1) {
    currentPageIndex.value++
    targetPage.value = (currentPageIndex.value + 1).toString()
  }
}

// 跳转到指定页
const handleGoToPage = () => {
  const page = parseInt(targetPage.value)
  if (page >= 1 && page <= pdfPages.value.length) {
    currentPageIndex.value = page - 1
  } else {
    // 如果输入无效，重置为当前页
    targetPage.value = (currentPageIndex.value + 1).toString()
  }
}

// 目标页码
const targetPage = ref('')

// 开始审核
const handleStartReview = (row: ProjectReviewListVO) => {
  router.push({
    name: 'TaskReviewDetail',
    params: {
      projectId: row.projectId,
    },
    query: {
      type: row.type === 0 ? 'book' : 'doc',
    },
  })
}

// 判断是否为资料审核状态（待资料审核 + 资料问题提交 + 管理员资料打回）
const isMaterialReviewStatus = (status: number | undefined): boolean => {
  return (
    status === ProjectStatus.MATERIAL_PENDING_REVIEW ||
    status === ProjectStatus.MATERIAL_PROBLEM_SUBMITTED ||
    status === ProjectStatus.ADMIN_MATERIAL_REJECTED
  )
}

// 开始资料审核（跳转到书籍信息管理页面）
const handleStartMaterialReview = (row: ProjectReviewListVO) => {
  router.push({
    name: 'BookInfoManage',
    params: {
      projectId: row.projectId,
    },
    query: {
      mode: 'review',
      type: row.type === 0 ? 'book' : 'doc',
      projectStatus: String(row.status),
    },
  })
}

// 查看详情
const handleView = (row: ProjectReviewListVO) => {
  console.log('查看详情:', row)
  currentProject.value = row
  dialogVisible.value = true
  fetchPdfPages(row.projectId)
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// 判断是否可以开始审核（待审核状态和管理员打回状态可以开始审核）
const canStartReview = (status: number | undefined): boolean => {
  return status === ProjectStatus.PENDING_REVIEW || status === ProjectStatus.ADMIN_REJECTED
}

// 判断是否可以审核预览（审核成功、问题提交、资料问题提交状态可以预览）
const canPreviewAudit = (status: number | undefined): boolean => {
  return (
    status === ProjectStatus.REVIEW_SUCCESS ||
    status === ProjectStatus.PROBLEM_SUBMITTED ||
    status === ProjectStatus.MATERIAL_PROBLEM_SUBMITTED
  )
}

// 审核预览
const handlePreviewAudit = (row: ProjectReviewListVO) => {
  router.push({
    name: 'TaskReviewDetail',
    params: {
      projectId: row.projectId,
    },
    query: {
      type: row.type === 0 ? 'book' : 'doc',
      preview: 'true',
    },
  })
}

// 获取状态颜色配置
const getStatusColorConfig = (status: number | undefined) => {
  return getProjectStatusColor(status ?? 0)
}

// 获取审核状态文本
const getStatusText = (status: number | undefined) => {
  return ProjectStatusText[status ?? 0] || '未知'
}

// 选择变化处理
const handleSelectionChange = (selection: ProjectReviewListVO[]) => {
  selectedRows.value = selection
}

// 检查是否可选择
const checkSelectable = (row: ProjectReviewListVO) => {
  return true
}

// 导出ZIP
const handleExport = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要导出的项目')
    return
  }

  exporting.value = true

  try {
    // 检查是否在 Electron 环境
    if (isElectron()) {
      // Electron 环境：让用户选择文件夹，然后批量下载
      const folderPath = await window.ipcRenderer?.invoke('select-folder')
      if (!folderPath) {
        exporting.value = false
        return
      }

      // 保存文件夹路径
      saveLastExportFolder(folderPath)

      // 为每个项目调用导出接口
      for (let i = 0; i < selectedRows.value.length; i++) {
        const row = selectedRows.value[i]
        if (!row) continue

        ElMessage.info(`正在导出 ${i + 1}/${selectedRows.value.length}: ${row.title}`)

        // 从 http.ts 获取当前 baseURL
        const baseUrl = getCurrentBaseURL()
        const apiUrl = `/deliver/docx/export/${row.projectId}`

        // 下载文件（传入文件夹路径、token 和 baseUrl）
        const result = await window.ipcRenderer?.invoke(
          'download-file',
          apiUrl,
          `${row.projectId}_${row.title}.zip`,
          folderPath,
          getToken(),
          baseUrl,
        )

        if (!result?.success) {
          throw new Error(`${row.searchId} ${result?.error || '下载失败'}`)
        }
      }
    } else {
      // Web 环境：直接调用接口，浏览器会弹出下载对话框
      for (let i = 0; i < selectedRows.value.length; i++) {
        const row = selectedRows.value[i]
        if (!row) continue

        ElMessage.info(`正在导出 ${i + 1}/${selectedRows.value.length}: ${row.title}`)
        await getDeliverDocxExportApi({ projectId: row.projectId })
      }
    }

    ElMessage.success(`成功导出 ${selectedRows.value.length} 个项目`)
  } catch (error) {
    console.error('导出失败:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    ElMessage.error(errorMessage || '导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchReviewList()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
}

/* 确保 el-card 内部正确布局 */
:deep(.el-card) {
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  min-height: 0;
}

.pdf-preview-dialog :deep(.el-dialog__body) {
  padding: 20px;
  max-height: 85vh;
  overflow: hidden;
}

.pdf-preview-container {
  height: 75vh;
  display: flex;
  flex-direction: column;
}

.pdf-page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.pdf-page-nav .page-number {
  margin: 0 16px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.pdf-preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  border-radius: 8px;
  overflow: hidden;
  min-height: 0;
}

.pdf-preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.no-image .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}
</style>
