<template>
  <div class="review-container h-screen flex flex-col">
    <!-- 顶部导航区域 -->
    <div
      class="review-header h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
      <div class="flex items-center">
        <el-button link @click="handleGoBack">
          <Icon icon="ep:arrow-left" :width="20" :height="20" />
          返回
        </el-button>
        <el-divider direction="vertical" />
        <span class="text-lg font-medium">{{ projectTitle }}</span>
        <el-tag :type="projectType === 'book' ? 'primary' : 'success'" class="ml-2">
          {{ projectType === 'book' ? '书籍' : '试卷' }}
        </el-tag>
      </div>
      <div class="flex items-center">
        <el-tag v-if="isPreviewMode" type="info" class="mr-2">
          预览模式
        </el-tag>
        <el-button type="success" @click="handleExportJson" class="mr-2">
          <Icon icon="ep:download" style="margin-right: 4px;" />
          导出JSON
        </el-button>
        <el-button v-if="!isPreviewMode" type="primary" @click="handleSubmitAudit">
          提交审核
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area flex-1 overflow-y-auto bg-gray-100 p-4">
      <div class="max-w-7xl mx-auto space-y-4">
        <!-- 问题提交提示 -->
        <el-card v-if="projectInfo && isProblemSubmit" class="problem-submit-card">
          <template #header>
            <div class="flex items-center">
              <el-icon class="mr-2" :size="20" color="#E6A23C">
                <Icon icon="ep:warning" />
              </el-icon>
              <span class="text-base font-medium">问题提交</span>
            </div>
          </template>
          <div class="problem-content">
            <div class="problem-item">
              <span class="problem-label">问题类型：</span>
              <span class="problem-value">{{ getProblemTypeName(projectInfo.problemType) || '-' }}</span>
            </div>
            <div v-if="projectInfo.problemRemark" class="problem-item">
              <span class="problem-label">问题说明：</span>
              <span class="problem-value">{{ projectInfo.problemRemark }}</span>
            </div>
          </div>
        </el-card>

        <!-- 书籍/试卷信息审核 -->
        <BookInfoAudit ref="bookInfoAuditRef" :project-id="String(projectId)" :type="projectType"
          :audit-records="getSectionAuditRecords(1)" :grade-list="gradeList" :subject-list="subjectList"
          :volume-list="volumeList" :version-list="versionList" :publisher-list="publisherList"
          :province-list="provinceList" :book-label-list="bookLabelList" :readonly="isPreviewMode"
          @add-audit="handleAddAudit" />

        <!-- 内容页审核 (仅书籍) -->
        <PagesAudit v-if="projectType === 'book'" ref="pagesAuditRef" :project-id="String(projectId)"
          :audit-records="getSectionAuditRecords(2)" :readonly="isPreviewMode" @add-audit="handleAddAudit" />

        <!-- 章节审核 (仅书籍) -->
        <CatalogueAudit v-if="projectType === 'book'" ref="catalogueAuditRef" :project-id="String(projectId)"
          :audit-records="getSectionAuditRecords(3)" :readonly="isPreviewMode" @add-audit="handleAddAudit" />

        <!-- 题目审核 -->
        <QuestionsAudit ref="questionsAuditRef" :project-id="String(projectId)" :type="projectType"
          :audit-records="getSectionAuditRecords(4)" :project-info="projectInfo || undefined" :grade-list="gradeList"
          :subject-list="subjectList" :catalogues="catalogues" :readonly="isPreviewMode" @add-audit="handleAddAudit" />
      </div>
    </div>

    <!-- 审核记录抽屉 -->
    <el-drawer v-model="auditDrawerVisible" title="审核反馈" size="400px" direction="rtl">
      <template #header>
        <div class="flex items-center justify-between">
          <span>审核反馈 ({{ auditRecords.length }})</span>
          <el-button size="small" @click="refreshAuditRecords">
            <Icon icon="ep:refresh" />
            刷新
          </el-button>
        </div>
      </template>
      <div class="audit-list">
        <div v-for="record in auditRecords" :key="record.id"
          class="audit-item p-4 border-b border-gray-200 cursor-pointer" @click="handleAuditItemClick(record)">
          <div class="flex items-start justify-between mb-2">
            <el-tag :type="getAuditTypeTag(record.type)" size="small">
              {{ getAuditTypeName(record.type) }}
            </el-tag>
            <span class="text-xs text-gray-400">{{ formatTime(record.createTime) }}</span>
          </div>
          <div class="text-sm text-gray-700 mb-2">{{ record.content }}</div>
          <!-- 处理内容 -->
          <div v-if="record.handContent" class="audit-hand-content">
            <div class="hand-label">处理内容：</div>
            <div class="hand-text">{{ record.handContent }}</div>
          </div>
          <div v-if="record.passed" class="text-xs text-green-600">
            已处理
          </div>
          <div v-else-if="!isPreviewMode">
            <el-button size="small" type="danger" link @click.stop="handleDeleteAudit(record.id)">
              删除
            </el-button>
          </div>
        </div>
        <el-empty v-if="auditRecords.length === 0" description="暂无审核反馈" />
      </div>
    </el-drawer>

    <!-- 审核记录悬浮按钮 -->
    <el-badge :value="auditRecords.length" class="audit-drawer-badge">
      <el-button class="audit-drawer-btn" type="primary" circle size="large" @click="auditDrawerVisible = true">
        <Icon icon="ep:document" :width="20" :height="20" />
      </el-button>
    </el-badge>

    <!-- 审核确认对话框 -->
    <el-dialog v-model="reviewConfirmDialogVisible" title="审核确认" width="800px" :close-on-click-modal="false">
      <div class="review-confirm-content">
        <el-alert title="审核确认" type="info" :closable="false" show-icon class="mb-4">
          请确认以下审核记录，选择是否通过审核。提交后将无法更改。
        </el-alert>

        <!-- 审核记录列表 -->
        <div class="audit-records-list">
          <div v-if="auditRecords.length === 0" class="no-records">
            暂无审核记录
          </div>
          <div v-else>
            <div v-for="record in auditRecords" :key="record.id" class="audit-record-item">
              <div class="record-header">
                <div class="record-tags">
                  <el-tag :type="getAuditTypeTag(record.type)" size="small">
                    {{ getAuditTypeName(record.type) }}
                  </el-tag>
                  <el-tag :type="record.passed ? 'success' : 'warning'" size="small" class="ml-2">
                    <span class="status-tag-content">
                      <Icon :icon="record.passed ? 'ep:check' : 'ep:clock'" :width="12" :height="12" />
                      {{ record.passed ? '已处理' : '未处理' }}
                    </span>
                  </el-tag>
                </div>
                <span class="record-time">{{ formatTime(record.createTime) }}</span>
              </div>
              <div class="record-content">{{ record.content }}</div>
              <!-- 处理内容 -->
              <div v-if="record.handContent" class="record-hand-content">
                <div class="hand-label">处理内容：</div>
                <div class="hand-text">{{ record.handContent }}</div>
              </div>
              <div v-if="record.passed && (record.nickname || record.username)" class="record-footer">
                <span class="record-handler">
                  <Icon icon="ep:user" :width="12" :height="12" />
                  处理人: {{ getHandlerName(record) }}
                </span>
                <span v-if="record.handTime" class="record-handle-time">
                  处理时间: {{ formatTime(record.handTime) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="reviewConfirmDialogVisible = false">
            <Icon icon="ep:close" style="margin-right: 4px;" />
            取消
          </el-button>
          <el-button type="danger" @click="handleReviewReject" :loading="reviewSubmitting">
            <Icon icon="ep:close-bold" style="margin-right: 4px;" />
            不通过
          </el-button>
          <el-button type="success" @click="handleReviewPass" :loading="reviewSubmitting">
            <Icon icon="ep:check" style="margin-right: 4px;" />
            通过
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getAuditProjectListApi, postAuditProjectCreateApi, putAuditProjectHandleApi, deleteAuditProjectDeleteApi, type ProjectAuditVO } from '@/api/gen/projectAuditController'
import { getBookInfoDetailsApi, type BookVO } from '@/api/gen/bookController'
import { getDocInfoDetailsApi, type DocVO } from '@/api/gen/docController'
import { getCatalogueListApi, type CatalogueVO } from '@/api/gen/catalogueController'
import { putProjectReviewApi, type ProjectReviewCmd } from '@/api/gen/projectController'
import { getDeliverExportApi } from '@/api/gen/deliverController'
import {
  getDicGradeListApi,
  getDicSubjectListApi,
  getDicVolumeListApi,
  getDicVersionListApi,
  getDicPublisherListApi,
  getDicAdministrativeDivisionListApi,
  getDicBookLabelListApi,
  type DicGradeVO,
  type DicSubjectVO,
  type DicBookLabelVO
} from '@/api/gen/dicController'
import BookInfoAudit from './components/BookInfoAudit.vue'
import PagesAudit from './components/PagesAudit.vue'
import CatalogueAudit from './components/CatalogueAudit.vue'
import QuestionsAudit from './components/QuestionsAudit.vue'
import { useConfigStore } from '@/stores/config'

defineOptions({
  name: 'TaskReviewDetail'
})

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

// 路由参数
const projectId = computed(() => route.params.projectId as string)
const projectType = computed(() => (route.query.type as 'book' | 'doc') || 'book')
const isPreviewMode = computed(() => route.query.preview === 'true')

// 项目信息
const projectTitle = ref('审核工作台')
const projectInfo = ref<BookVO | DocVO | null>(null)

// 判断是否为问题提交
const isProblemSubmit = computed(() => {
  return projectInfo.value?.isProblemSubmit === true
})

// 问题类型映射
const getProblemTypeName = (type?: string): string => {
  if (!type) return ''
  const typeMap: Record<string, string> = {
    'no_answer': '无答案',
    'missing_page': '缺页',
    'no_questions': '整本无题',
    'listening': '听力相关',
    'other': '其他'
  }
  return typeMap[type] || type
}

// 字典数据
const gradeList = ref<DicGradeVO[]>([])
const subjectList = ref<DicSubjectVO[]>([])
const volumeList = ref<{ id?: string; name?: string }[]>([])
const versionList = ref<{ id?: string; name?: string }[]>([])
const publisherList = ref<{ id?: string; name?: string }[]>([])
const provinceList = ref<{ id?: string; name?: string; code?: string; level?: number; parentCode?: string }[]>([])
const bookLabelList = ref<DicBookLabelVO[]>([])

// 目录数据
const catalogues = ref<CatalogueVO[]>([])

// 审核记录抽屉显示状态
const auditDrawerVisible = ref(false)

// 审核记录列表
const auditRecords = ref<ProjectAuditVO[]>([])

// 审核确认对话框显示状态
const reviewConfirmDialogVisible = ref(false)

// 审核提交中状态
const reviewSubmitting = ref(false)

// 组件引用
const bookInfoAuditRef = ref()
const pagesAuditRef = ref()
const catalogueAuditRef = ref()
const questionsAuditRef = ref()

// 获取字典数据
const fetchDictData = async () => {
  try {
    const [gradeRes, subjectRes, volumeRes, versionRes, publisherRes, provinceRes, bookLabelRes] = await Promise.all([
      getDicGradeListApi(),
      getDicSubjectListApi({ type: projectType.value === 'book' ? 1 : 2 }),
      getDicVolumeListApi(),
      getDicVersionListApi(),
      getDicPublisherListApi(),
      getDicAdministrativeDivisionListApi(),
      getDicBookLabelListApi()
    ])
    if (gradeRes.data.code === 200) gradeList.value = gradeRes.data.data || []
    if (subjectRes.data.code === 200) subjectList.value = subjectRes.data.data || []
    if (volumeRes.data.code === 200) volumeList.value = volumeRes.data.data || []
    if (versionRes.data.code === 200) versionList.value = versionRes.data.data || []
    if (publisherRes.data.code === 200) publisherList.value = publisherRes.data.data || []
    if (provinceRes.data.code === 200) provinceList.value = provinceRes.data.data || []
    if (bookLabelRes.data.code === 200) bookLabelList.value = bookLabelRes.data.data || []
  } catch (error) {
    console.error('获取字典数据失败', error)
  }
}

// 获取目录数据
const fetchCatalogues = async () => {
  if (projectType.value !== 'book') return
  try {
    const response = await getCatalogueListApi({ bookId: projectId.value })
    if (response.data.code === 200) {
      catalogues.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取目录数据失败', error)
  }
}

// 获取项目信息
const fetchProjectInfo = async () => {
  try {
    if (projectType.value === 'book') {
      const response = await getBookInfoDetailsApi({ id: projectId.value })
      if (response.data.code === 200) {
        const bookInfo = response.data.data
        if (bookInfo) {
          projectTitle.value = bookInfo.title || '书籍审核'
          // 优先使用后端返回的 isProblemSubmit，如果没有则根据 status 判断
          const isProblemSubmit = bookInfo.isProblemSubmit ?? (bookInfo.status === 10)
          projectInfo.value = {
            ...bookInfo,
            isProblemSubmit
          }
          // 调试日志
          console.log('📚 书籍详情数据:', {
            status: bookInfo.status,
            isProblemSubmitFromBackend: bookInfo.isProblemSubmit,
            isProblemSubmitFinal: isProblemSubmit,
            problemType: bookInfo.problemType,
            problemRemark: bookInfo.problemRemark
          })
        }
      }
    } else {
      const response = await getDocInfoDetailsApi({ id: projectId.value })
      if (response.data.code === 200) {
        const docInfo = response.data.data
        if (docInfo) {
          projectTitle.value = docInfo.title || '试卷审核'
          // 优先使用后端返回的 isProblemSubmit，如果没有则根据 status 判断
          const isProblemSubmit = docInfo.isProblemSubmit ?? (docInfo.status === 10)
          projectInfo.value = {
            ...docInfo,
            isProblemSubmit
          }
          // 调试日志
          console.log('📄 试卷详情数据:', {
            status: docInfo.status,
            isProblemSubmitFromBackend: docInfo.isProblemSubmit,
            isProblemSubmitFinal: isProblemSubmit,
            problemType: docInfo.problemType,
            problemRemark: docInfo.problemRemark
          })
        }
      }
    }
  } catch (error) {
    ElMessage.error('获取项目信息失败')
    console.error(error)
  }
}

// 获取审核记录列表
const fetchAuditRecords = async () => {
  try {
    const response = await getAuditProjectListApi({ projectId: projectId.value })
    if (response.data.code === 200) {
      auditRecords.value = response.data.data || []
    }
  } catch (error) {
    ElMessage.error('获取审核记录失败')
    console.error(error)
  }
}

// 刷新审核记录
const refreshAuditRecords = () => {
  fetchAuditRecords()
}

// 返回
const handleGoBack = () => {
  router.push('/task/review')
}

// 检查任务状态并跳转
const checkAndRedirectBasedOnStatus = () => {
  if (!projectInfo.value) return

  const status = projectInfo.value.status
  const isNotPendingReview = status !== 4 && status !== 12 && !isPreviewMode.value

  // 如果不是待审核状态或管理员打回状态且不是预览模式，跳转到预览模式或返回列表
  if (isNotPendingReview) {
    ElMessage.warning('该任务状态不允许进行审核，已切换为预览模式')
    router.replace({
      name: 'TaskReviewDetail',
      params: {
        projectId: projectId.value
      },
      query: {
        type: projectType.value,
        preview: 'true'
      }
    })
  }
}

// 添加审核记录
const handleAddAudit = async (data: { type: number; objectId?: string; content: string }) => {
  try {
    const response = await postAuditProjectCreateApi({
      type: data.type,
      projectId: projectId.value,
      objectId: data.objectId,
      content: data.content
    })
    if (response.data.code === 200) {
      ElMessage.success('添加审核记录成功')
      fetchAuditRecords()
    } else {
      ElMessage.error(response.data.msg || '添加审核记录失败')
    }
  } catch (error) {
    ElMessage.error('添加审核记录失败')
    console.error(error)
  }
}

// 获取特定审核类型的记录
const getSectionAuditRecords = (type: number) => {
  return auditRecords.value.filter(record => record.type === type)
}

// 删除审核记录
const handleDeleteAudit = async (auditId: string) => {
  try {
    await ElMessageBox.confirm('确认删除此审核记录吗？', '提示', {
      type: 'warning'
    })
    const response = await deleteAuditProjectDeleteApi({ auditId })
    if (response.data.code === 200) {
      ElMessage.success('删除成功')
      fetchAuditRecords()
    } else {
      ElMessage.error(response.data.msg || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 处理审核记录点击，滚动到对应位置
const handleAuditItemClick = (record: ProjectAuditVO) => {
  // 关闭抽屉
  auditDrawerVisible.value = false

  // 根据审核类型滚动到对应内容
  setTimeout(() => {
    let targetElement: HTMLElement | null = null

    if (record.type === 1) {
      // 书籍/试卷信息审核
      targetElement = bookInfoAuditRef.value?.$el
    } else if (record.type === 2) {
      // 内容页审核
      targetElement = pagesAuditRef.value?.$el
    } else if (record.type === 3) {
      // 目录审核
      targetElement = catalogueAuditRef.value?.$el
    } else if (record.type === 4 && record.objectId) {
      // 题目审核，需要定位到具体题目
      targetElement = questionsAuditRef.value?.scrollToQuestion(record.objectId)
      return // 题目组件会自己处理滚动
    }

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }, 300) // 等待抽屉关闭动画完成
}

// 提交审核
const handleSubmitAudit = () => {
  reviewConfirmDialogVisible.value = true
}

// 审核通过
const handleReviewPass = async () => {
  await handleReviewSubmit(true)
}

// 审核不通过
const handleReviewReject = async () => {
  try {
    await ElMessageBox.confirm(
      '确认不通过此审核吗？项目将退回修改。',
      '确认不通过',
      {
        type: 'warning',
        confirmButtonText: '确认',
        cancelButtonText: '取消'
      }
    )
    await handleReviewSubmit(false)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
      console.error(error)
    }
  }
}

// 提交审核结果
const handleReviewSubmit = async (pass: boolean) => {
  if (reviewSubmitting.value) {
    return
  }

  reviewSubmitting.value = true
  try {
    const data: ProjectReviewCmd = {
      pass
    }

    const response = await putProjectReviewApi(data, { projectId: projectId.value })
    if (response.data.code === 200) {
      ElMessage.success(pass ? '审核通过' : '审核不通过')
      reviewConfirmDialogVisible.value = false
      router.push('/task/review')
    } else {
      ElMessage.error(response.data.msg || '审核失败')
    }
  } catch (error) {
    ElMessage.error('审核失败')
    console.error(error)
  } finally {
    reviewSubmitting.value = false
  }
}

// 获取审核类型标签
const getAuditTypeTag = (type: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  switch (type) {
    case 1:
      return 'primary'
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'info'
    default:
      return undefined
  }
}

// 获取审核类型名称
const getAuditTypeName = (type: number) => {
  switch (type) {
    case 1:
      return '信息审核'
    case 2:
      return '内容页'
    case 3:
      return '章节'
    case 4:
      return '题目'
    default:
      return '未知'
  }
}

// 获取处理人名称
const getHandlerName = (record: ProjectAuditVO) => {
  return record.nickname || record.username || '-'
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(minutes / 60)

  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (hours < 24 * 7) {
    return `${Math.floor(hours / 24)}天前`
  } else {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }
}

// 导出JSON
const handleExportJson = async () => {
  try {
    await getDeliverExportApi({ projectId: projectId.value, validate: false })
    ElMessage.success('导出JSON成功')
  } catch (error) {
    ElMessage.error('导出JSON失败')
    console.error('导出JSON失败:', error)
  }
}

// 页面加载时获取数据
onMounted(async () => {
  // 初始化配置
  await configStore.initConfig()
  console.log('配置初始化完成:', {
    sliceEndpoint: configStore.getSliceEndpoint(),
    pdfImageEndpoint: configStore.getPdfImageEndpoint()
  })
  await fetchDictData()
  await fetchCatalogues()
  await fetchProjectInfo()
  await fetchAuditRecords()

  // 检查任务状态并决定是否需要跳转
  checkAndRedirectBasedOnStatus()
})
</script>

<style scoped>
.review-container {
  height: 100vh;
}

.review-header {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.problem-submit-card {
  border: 1px solid #E6A23C;
  background: #FEF8F0;
  margin-bottom: 16px;
}

.problem-submit-card :deep(.el-card__header) {
  background: #FFF8E6;
  border-bottom: 1px solid #E6A23C;
  padding: 12px 20px;
}

.problem-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.problem-label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  min-width: 80px;
  flex-shrink: 0;
}

.problem-value {
  flex: 1;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.audit-drawer-badge {
  position: fixed !important;
  right: 24px;
  bottom: 80px;
  z-index: 100;
}

.audit-drawer-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.audit-item {
  transition: background-color 0.2s;
  cursor: pointer;
}

.audit-item:hover {
  background-color: #f0f9ff;
}

.audit-item:active {
  background-color: #e0f2fe;
}

.audit-list {
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.content-area {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.content-area::-webkit-scrollbar {
  width: 8px;
}

.content-area::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.content-area::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 4px;
}

.review-confirm-content {
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.audit-records-list {
  flex: 1;
  overflow-y: auto;
  max-height: 50vh;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
}

.audit-records-list::-webkit-scrollbar {
  width: 6px;
}

.audit-records-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.audit-records-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.no-records {
  text-align: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.audit-record-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 12px;
  background: #fff;
  transition: all 0.2s;
}

.audit-record-item:hover {
  border-color: #c6e2ff;
  background: #f0f9ff;
}

.audit-record-item:last-child {
  margin-bottom: 0;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.record-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.record-content {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.audit-hand-content {
  padding: 8px 12px;
  background: #ecfdf5;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  margin-bottom: 8px;
}

.hand-label {
  font-size: 12px;
  font-weight: bold;
  color: #059669;
  margin-bottom: 4px;
}

.hand-text {
  font-size: 13px;
  color: #047857;
  line-height: 1.5;
}

.record-handler,
.record-handle-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.ml-2 {
  margin-left: 8px;
}

.status-tag-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-tag-content :deep(svg) {
  display: block;
}

.mr-2 {
  margin-right: 8px;
}
</style>
