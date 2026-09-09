<template>
  <div class="book-info-manage-container h-screen flex flex-col">
    <!-- 顶部导航区域 -->
    <div
      class="manage-header h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
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
        <el-tag v-if="isReviewMode" color="#7C4DFF" class="ml-2" style="color: #fff; border-color: #7C4DFF;">
          资料审核
        </el-tag>
        <el-tag v-else color="#1565C0" class="ml-2" style="color: #fff; border-color: #1565C0;">
          填写信息
        </el-tag>
      </div>
      <div class="flex items-center">
        <el-tag v-if="isPreviewMode" type="info" class="mr-2">
          预览模式
        </el-tag>
        <!-- 反馈结果按钮 -->
        <el-badge v-if="hasFeedback && unhandledFeedbackCount > 0" :value="unhandledFeedbackCount" class="mr-2">
          <el-button size="small" type="warning" @click="feedbackDialogVisible = true">
            <Icon icon="ep:chat-line-square" class="mr-1" />
            反馈结果
          </el-button>
        </el-badge>
        <el-button v-else-if="hasFeedback" size="small" type="warning" @click="feedbackDialogVisible = true" class="mr-2">
          <Icon icon="ep:chat-line-square" class="mr-1" />
          反馈结果
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="content-area flex-1 overflow-y-auto bg-gray-50 p-4">
      <div class="max-w-5xl mx-auto space-y-4">
        <!-- 填写模式 -->
        <template v-if="!isReviewMode">
          <!-- 内容页管理 (仅书籍) - 放在前面 -->
          <el-card v-if="projectType === 'book'">
            <template #header>
              <div class="flex items-center justify-between">
                <span class="section-title">内容页管理</span>
                <el-button type="primary" size="small" @click="pageManageVisible = true">
                  <Icon icon="ep:setting" class="mr-1" />
                  管理内容页
                </el-button>
              </div>
            </template>
            <div class="pages-summary">
              <div v-if="pageLoading" class="loading-wrapper">
                <el-icon class="is-loading">
                  <Icon icon="ep:loading" />
                </el-icon>
                <span>加载中...</span>
              </div>
              <template v-else>
                <div class="pages-stats mb-4">
                  <el-tag type="info">总页数: {{ pdfPages.length }}</el-tag>
                  <el-tag type="success" class="ml-2">已分类: {{ typedPagesCount }}</el-tag>
                  <el-tag v-if="unTypedPagesCount > 0" type="warning" class="ml-2">未分类: {{ unTypedPagesCount }}
                  </el-tag>
                </div>
                <div v-if="pdfPages.length > 0" class="pages-grid">
                  <div v-for="(page, index) in pdfPages" :key="page.id" class="page-item">
                    <el-image :src="getPageImageUrl(page)" :preview-src-list="getAllImageUrls()" :initial-index="index"
                      fit="contain" class="page-image" :append-to-body="true" :z-index="9999"
                      :preview-teleported="true">
                      <template v-slot:error>
                        <div class="image-slot">加载失败</div>
                      </template>
                    </el-image>
                    <div class="page-info">
                      <el-tag size="small" :type="getPageTypeColor(page.type)">
                        {{ getPageTypeName(page.type) }}
                      </el-tag>
                      <span class="page-number">{{ page.realPage }}</span>
                    </div>
                  </div>
                </div>
                <el-empty v-else description="暂无页面数据" />
              </template>
            </div>
          </el-card>

          <!-- 书籍信息 - 左右分栏布局 -->
          <el-card>
            <template #header>
              <div class="flex items-center justify-between">
                <span class="section-title">书籍信息</span>
                <div v-if="hasCipPages" class="page-pagination-header">
                  <el-button size="small" circle :disabled="currentCipPageIndex === 0" @click="prevCipPage">
                    <Icon icon="ep:arrow-left" />
                  </el-button>
                  <span class="page-indicator">{{ currentCipPageIndex + 1 }} / {{ cipPages.length }}</span>
                  <el-button size="small" circle :disabled="currentCipPageIndex === cipPages.length - 1"
                    @click="nextCipPage">
                    <Icon icon="ep:arrow-right" />
                  </el-button>
                </div>
              </div>
            </template>
            <div class="book-info-split-layout" :class="{ 'has-images': hasCipPages }">
              <!-- 左侧CIP图片预览 -->
              <div v-if="hasCipPages" class="book-info-image-panel">
                <div class="book-info-image-content">
                  <el-image v-if="currentCipPage" :src="getPageImageUrl(currentCipPage)"
                    :preview-src-list="cipPages.map(p => getPageImageUrl(p))" :initial-index="currentCipPageIndex"
                    fit="contain" class="book-preview-image">
                    <template v-slot:error>
                      <div class="image-slot">加载失败</div>
                    </template>
                  </el-image>
                  <div v-else class="no-data">暂无CIP页面</div>
                </div>
              </div>
              <!-- 右侧表单 -->
              <div class="book-info-form-panel">
                <BookInfoForm v-if="projectType === 'book'" ref="bookInfoFormRef" :book-id="String(projectId)"
                  @refresh="handleBookInfoRefresh" />
                <DocInfoForm v-else ref="docInfoFormRef" :doc-id="String(projectId)"
                  @refresh="handleBookInfoRefresh" />
              </div>
            </div>
          </el-card>
        </template>

        <!-- 审核模式：书籍信息审核 + 内容页审核 -->
        <template v-else>
          <BookInfoAudit ref="bookInfoAuditRef" :project-id="String(projectId)" :type="projectType"
            :audit-records="getSectionAuditRecords(1)" :grade-list="gradeList" :subject-list="subjectList"
            :volume-list="volumeList" :version-list="versionList" :publisher-list="publisherList"
            :province-list="provinceList" :book-label-list="bookLabelList" :readonly="isPreviewMode"
            @add-audit="handleAddAudit" />

          <PagesAudit v-if="projectType === 'book'" ref="pagesAuditRef" :project-id="String(projectId)"
            :audit-records="getSectionAuditRecords(2)" :readonly="isPreviewMode" @add-audit="handleAddAudit" />
        </template>
      </div>
    </div>

    <!-- 底部操作区域 -->
    <div v-if="!isPreviewMode"
      class="footer-actions h-16 border-t border-gray-200 bg-white flex items-center justify-end px-6 flex-shrink-0">
      <template v-if="!isReviewMode">
        <!-- 填写模式操作按钮 -->
        <el-button @click="handleOpenProblemDialog">
          <Icon icon="ep:warning" class="mr-1" />
          问题提交
        </el-button>
        <el-button type="primary" @click="handleOpenMaterialSubmitDialog" :loading="materialSubmitting">
          <Icon icon="ep:check" class="mr-1" />
          提交资料审核
        </el-button>
      </template>
      <template v-else>
        <!-- 审核模式操作按钮 -->
        <el-button type="primary" @click="handleOpenReviewDialog" :loading="reviewSubmitting">
          <Icon icon="ep:check" class="mr-1" />
          审核资料
        </el-button>
      </template>
    </div>

    <!-- 内容页管理对话框 -->
    <PageManageDialog v-if="projectType === 'book'" v-model:visible="pageManageVisible"
      :project-id="String(projectId)" @update:visible="handlePageManageDialogClose" />

    <!-- 问题提交对话框 -->
    <el-dialog v-model="problemDialogVisible" title="问题提交" width="500px" :close-on-click-modal="false">
      <el-form :model="problemForm" :rules="problemRules" ref="problemFormRef" label-width="100px">
        <el-form-item label="问题类型" prop="problemType">
          <el-select v-model="problemForm.problemType" placeholder="请选择问题类型" style="width: 100%">
            <el-option v-for="item in ProblemTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="problemForm.problemType === 'other'" label="问题备注" prop="problemRemark">
          <el-input v-model="problemForm.problemRemark" type="textarea" :rows="3" placeholder="请输入问题备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="problemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleProblemSubmit" :loading="problemSubmitting">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 提交资料审核确认对话框 -->
    <el-dialog v-model="materialSubmitDialogVisible" title="提交资料审核" width="500px" :close-on-click-modal="false">
      <el-alert title="提交确认" type="info" :closable="false" show-icon class="mb-4">
        提交资料审核后，审核员将审核您填写的书籍信息和内容页，请确认信息填写完整。
      </el-alert>
      <!-- 未处理反馈提示 -->
      <el-alert v-if="unhandledFeedbackCount > 0" title="存在未处理的反馈" type="warning" :closable="false" show-icon
        class="mb-4">
        还有 {{ unhandledFeedbackCount }} 条反馈未处理，请先处理所有反馈后再提交。
        <el-button type="primary" link size="small" @click="feedbackDialogVisible = true">去处理</el-button>
      </el-alert>
      <el-form :model="materialSubmitForm" label-width="80px">
        <el-form-item v-if="materialSubmitForm.isbn" label="ISBN">
          <el-input v-model="materialSubmitForm.isbn" readonly />
        </el-form-item>
        <el-form-item v-if="!materialSubmitForm.isbn" label="提示">
          <span class="text-gray-500 text-sm">当前书籍未填写ISBN，提交时将跳过查重</span>
        </el-form-item>
      </el-form>
      <!-- 查重结果展示 -->
      <div v-if="materialSubmitForm.isbn && isbnCheckLoading" class="flex items-center justify-center py-4">
        <el-icon class="is-loading mr-2"><i-ep-loading /></el-icon>
        <span class="text-gray-500">正在查重...</span>
      </div>
      <el-alert v-else-if="materialSubmitForm.isbn && isbnCheckResult"
        :title="isbnCheckResult.title" :type="isbnCheckResult.type" :closable="false" show-icon class="mt-4">
        <template #default>
          <div v-html="isbnCheckResult.content"></div>
        </template>
      </el-alert>
      <template #footer>
        <el-button @click="materialSubmitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleMaterialSubmit" :loading="materialSubmitting"
          :disabled="isbnCheckLoading || unhandledFeedbackCount > 0">确认提交</el-button>
      </template>
    </el-dialog>

    <!-- 审核资料对话框 -->
    <el-dialog v-model="reviewConfirmDialogVisible" title="审核资料" width="500px"
      :close-on-click-modal="false">
      <template v-if="isMaterialProblemStatus">
        <el-alert title="资料问题审核" type="info" :closable="false" show-icon class="mb-4">
          请确认该资料问题是否存在，选择确认问题或否定问题。
        </el-alert>
      </template>
      <template v-else>
        <el-alert title="资料审核" type="info" :closable="false" show-icon class="mb-4">
          请审核该资料的书籍信息和内容页，选择通过或不通过。
        </el-alert>
      </template>
      <!-- 查重结果展示 -->
      <div v-if="isReviewCheckLoading" class="flex items-center justify-center py-4">
        <el-icon class="is-loading mr-2"><i-ep-loading /></el-icon>
        <span class="text-gray-500">正在查重...</span>
      </div>
      <el-alert v-else-if="reviewCheckResult"
        :title="reviewCheckResult.title" :type="reviewCheckResult.type" :closable="false" show-icon class="mt-4">
        <template #default>
          <div v-html="reviewCheckResult.content"></div>
        </template>
      </el-alert>
<template #footer>
        <el-button @click="reviewConfirmDialogVisible = false">取消</el-button>
        <template v-if="isMaterialProblemStatus">
          <el-button type="danger" @click="handleReviewConfirm(false)" :loading="reviewSubmitting"
            :disabled="isReviewCheckLoading">
            <Icon icon="ep:close-bold" class="mr-1" />
            否定问题（打回资料阶段）
          </el-button>
          <el-button type="success" @click="handleReviewConfirm(true)" :loading="reviewSubmitting"
            :disabled="isReviewCheckLoading">
            <Icon icon="ep:check" class="mr-1" />
            确认问题（审核通过）
          </el-button>
        </template>
        <template v-else>
          <el-button type="danger" @click="handleReviewConfirm(false)" :loading="reviewSubmitting"
            :disabled="isReviewCheckLoading">
            <Icon icon="ep:close-bold" class="mr-1" />
            审核不通过
          </el-button>
          <el-button type="success" @click="handleReviewConfirm(true)" :loading="reviewSubmitting"
            :disabled="isReviewCheckLoading">
            <Icon icon="ep:check" class="mr-1" />
            审核通过
          </el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 反馈结果对话框 -->
    <FeedbackListDialog v-model:visible="feedbackDialogVisible" :project-id="String(projectId)"
      :type="projectType" @feedback-handled="handleFeedbackHandled" ref="feedbackDialogRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import {
  postProjectMaterialSubmitApi,
  putProjectSubmitProblemApi,
  putProjectMaterialReviewApi,
  getProjectMaterialIsbnCheckApi,
  type ProjectProblemSubmitCmd,
  type MaterialReviewCmd,
} from '@/api/gen/projectController'
import {
  getAuditProjectListApi,
  postAuditProjectCreateApi,
  type ProjectAuditVO,
} from '@/api/gen/projectAuditController'
import {
  getDicGradeListApi,
  getDicSubjectListApi,
  getDicVolumeListApi,
  getDicVersionListApi,
  getDicPublisherListApi,
  getDicAdministrativeDivisionListApi,
  getDicBookLabelListApi,
  type DicBookLabelVO,
  type DicGradeVO,
  type DicSubjectVO,
} from '@/api/gen/dicController'
import { useConfigStore } from '@/stores/config'
import { ProblemTypeOptions, ProjectStatus } from '@/constants/projectStatus'
import BookInfoForm from '@/views/annotation/components/BookInfoForm.vue'
import DocInfoForm from '@/views/annotation/components/DocInfoForm.vue'
import PageManageDialog from '@/views/annotation/components/PageManageDialog.vue'
import BookInfoAudit from '@/views/task/components/BookInfoAudit.vue'
import PagesAudit from '@/views/task/components/PagesAudit.vue'
import FeedbackListDialog from '@/views/annotation/components/FeedbackListDialog.vue'

defineOptions({
  name: 'BookInfoManage'
})

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()

// 路由参数
const projectId = computed(() => route.params.projectId as string)
const projectType = computed(() => (route.query.type as 'book' | 'doc') || 'book')
const pageMode = computed(() => (route.query.mode as 'annotate' | 'review') || 'annotate')
const isPreviewMode = computed(() => route.query.preview === 'true')
const isReviewMode = computed(() => pageMode.value === 'review')

// 项目状态（审核模式从路由query传入）
const projectStatus = computed(() => {
  const s = route.query.projectStatus
  return s ? Number(s) : undefined
})

// 判断是否为资料问题提交状态（用户提交的是问题，审核人需要确认问题是否存在）
const isMaterialProblemStatus = computed(() => {
  return projectStatus.value === ProjectStatus.MATERIAL_PROBLEM_SUBMITTED
})

// 项目信息
const projectTitle = ref('书籍信息管理')

// 页面数据
const pdfPages = ref<PdfPageVO[]>([])
const pageLoading = ref(false)
const pageManageVisible = ref(false)
const currentCipPageIndex = ref(0)

// CIP页面列表（type === 2）
const cipPages = computed(() => {
  return pdfPages.value.filter(page => page.type === 2)
})

// 是否有CIP页面
const hasCipPages = computed(() => {
  return cipPages.value.length > 0
})

// 当前预览的CIP页面
const currentCipPage = computed(() => {
  return cipPages.value[currentCipPageIndex.value] || null
})

const prevCipPage = () => {
  if (currentCipPageIndex.value > 0) {
    currentCipPageIndex.value--
  }
}

const nextCipPage = () => {
  if (currentCipPageIndex.value < cipPages.value.length - 1) {
    currentCipPageIndex.value++
  }
}

// 内容页管理对话框关闭时刷新页面数据
const handlePageManageDialogClose = (visible: boolean) => {
  if (!visible) {
    fetchPdfPages()
  }
}

// 提交状态
const materialSubmitting = ref(false)
const problemSubmitting = ref(false)
const reviewSubmitting = ref(false)

// 问题提交对话框
const problemDialogVisible = ref(false)
const problemFormRef = ref()
const problemForm = reactive<ProjectProblemSubmitCmd>({
  problemType: '',
  problemRemark: ''
})
const problemRules = {
  problemType: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
  problemRemark: [
    {
      validator: (_rule: any, value: any, callback: any) => {
        if (problemForm.problemType === 'other' && !value?.trim()) {
          callback(new Error('问题类型为其他时，问题备注必填'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 提交资料审核对话框
const materialSubmitDialogVisible = ref(false)
const isbnCheckLoading = ref(false)
const isbnCheckResult = ref<{
  title: string
  content: string
  type: 'success' | 'warning' | 'error' | 'info'
  duplicate: boolean
} | null>(null)
const materialSubmitForm = reactive({
  isbn: ''
})

// 反馈相关状态
const feedbackDialogVisible = ref(false)
const feedbackDialogRef = ref()
const hasFeedback = ref(false)
const unhandledFeedbackCount = ref(0)

// 审核资料对话框
const reviewConfirmDialogVisible = ref(false)
const isReviewCheckLoading = ref(false)
const reviewCheckResult = ref<{
  title: string
  content: string
  type: 'success' | 'warning' | 'error' | 'info'
  duplicate: boolean
} | null>(null)

// 审核记录（审核模式）
const auditRecords = ref<ProjectAuditVO[]>([])

// 字典数据（审核模式）
const gradeList = ref<DicGradeVO[]>([])
const subjectList = ref<DicSubjectVO[]>([])
const volumeList = ref<{ id?: string; name?: string }[]>([])
const versionList = ref<{ id?: string; name?: string }[]>([])
const publisherList = ref<{ id?: string; name?: string }[]>([])
const provinceList = ref<{ id?: string; name?: string; code?: string; level?: number; parentCode?: string }[]>([])
const bookLabelList = ref<DicBookLabelVO[]>([])

// 组件引用
const bookInfoFormRef = ref()
const bookInfoAuditRef = ref()
const pagesAuditRef = ref()

// 计算属性
const typedPagesCount = computed(() => {
  return pdfPages.value.filter(p => p.type && p.type > 0).length
})
const unTypedPagesCount = computed(() => {
  return pdfPages.value.filter(p => !p.type || p.type === 0).length
})

// 获取PDF页面列表
const fetchPdfPages = async () => {
  if (!projectId.value) return
  pageLoading.value = true
  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: String(projectId.value) })
    if (response.data.code === 200) {
      pdfPages.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取PDF页面失败', error)
  } finally {
    pageLoading.value = false
  }
}

// 获取审核记录
const fetchAuditRecords = async () => {
  if (!isReviewMode.value || !projectId.value) return
  try {
    const response = await getAuditProjectListApi({ projectId: String(projectId.value) })
    if (response.data.code === 200) {
      auditRecords.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取审核记录失败', error)
  }
}

// 获取字典数据（审核模式需要）
const fetchDictData = async () => {
  if (!isReviewMode.value) return
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

// 获取特定审核类型的记录
const getSectionAuditRecords = (type: number) => {
  return auditRecords.value.filter(record => record.type === type)
}

// 添加审核记录
const handleAddAudit = async (data: { type: number; objectId?: string; content: string }) => {
  try {
    const response = await postAuditProjectCreateApi({
      type: data.type,
      projectId: String(projectId.value),
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

// 返回
const handleGoBack = () => {
  if (isReviewMode.value) {
    router.push('/task/review')
  } else {
    router.push('/task/list')
  }
}

// 书籍信息刷新
const handleBookInfoRefresh = () => {
  // 可在此处刷新相关数据
}

// 打开问题提交对话框
const handleOpenProblemDialog = () => {
  problemForm.problemType = ''
  problemForm.problemRemark = ''
  problemDialogVisible.value = true
}

// 提交问题
const handleProblemSubmit = async () => {
  if (!problemFormRef.value) return
  await problemFormRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    problemSubmitting.value = true
    try {
      const response = await putProjectSubmitProblemApi(problemForm, { projectId: String(projectId.value) })
      if (response.data.code === 200) {
        ElMessage.success('问题提交成功')
        problemDialogVisible.value = false
        router.push('/task/list')
      } else {
        ElMessage.error(response.data.msg || '问题提交失败')
      }
    } catch (error) {
      ElMessage.error('问题提交失败')
      console.error(error)
    } finally {
      problemSubmitting.value = false
    }
  })
}

// 检查反馈状态
const checkFeedbackStatus = async () => {
  if (!projectId.value) return
  try {
    await feedbackDialogRef.value?.loadFeedbackList()
    hasFeedback.value = feedbackDialogRef.value?.feedbackList.length > 0
    unhandledFeedbackCount.value = feedbackDialogRef.value?.unhandledCount || 0
  } catch (error) {
    console.error('检查反馈失败：', error)
    hasFeedback.value = false
    unhandledFeedbackCount.value = 0
  }
}

// 检查并自动打开反馈对话框（页面初始化时使用）
const checkAndAutoOpenFeedback = async () => {
  await checkFeedbackStatus()
  if (unhandledFeedbackCount.value > 0) {
    feedbackDialogVisible.value = true
  }
}

// 反馈已处理回调
const handleFeedbackHandled = () => {
  checkAndAutoOpenFeedback()
}

// 打开提交资料审核对话框 - 打开时执行查重
const handleOpenMaterialSubmitDialog = async () => {
  // 先检查是否有未处理的反馈（不自动弹出反馈对话框）
  await checkFeedbackStatus()
  const isbn = bookInfoFormRef.value?.getIsbn?.() || ''
  materialSubmitForm.isbn = isbn
  isbnCheckResult.value = null
  materialSubmitDialogVisible.value = true

  // 如果有ISBN，打开对话框后立即查重
  if (isbn) {
    await performIsbnCheck(isbn)
  }
}

// 提交资料审核
const handleMaterialSubmit = async () => {
  materialSubmitting.value = true
  try {
    const response = await postProjectMaterialSubmitApi({
      projectId: String(projectId.value)
    })
    if (response.data.code === 200) {
      ElMessage.success('提交资料审核成功')
      materialSubmitDialogVisible.value = false
      router.push('/task/list')
    } else {
      ElMessage.error(response.data.msg || '提交资料审核失败')
    }
  } catch (error) {
    ElMessage.error('提交资料审核失败')
    console.error(error)
  } finally {
    materialSubmitting.value = false
  }
}

// 执行ISBN查重，结果展示在对话框中
const performIsbnCheck = async (isbn: string) => {
  isbnCheckLoading.value = true
  isbnCheckResult.value = null

  try {
    const response = await getProjectMaterialIsbnCheckApi({ isbn })
    const data = response.data?.data
    if (response.data?.code === 200 && data) {
      const checkTime = data.checkTime || ''
      if (data.isbnDuplicate) {
        // 查重发现重复
        isbnCheckResult.value = {
          title: 'ISBN查重结果 - 发现重复',
          content: `<p style="margin-bottom: 8px; color: #F56C6C; font-weight: 500;">ISBN <strong>${data.isbn}</strong> 已存在重复书籍！</p>${checkTime ? `<p style="color: #909399; font-size: 13px;">检查时间：${checkTime}</p>` : ''}<p style="margin-top: 12px;">查重结果仅供参考，回传信息后可能已上传</p>`,
          type: 'warning',
          duplicate: true
        }
      } else {
        // 查重通过
        isbnCheckResult.value = {
          title: 'ISBN查重结果',
          content: `<p style="margin-bottom: 8px;">ISBN <strong>${data.isbn}</strong> 查重通过，未发现重复书籍。</p>${checkTime ? `<p style="color: #909399; font-size: 13px;">检查时间：${checkTime}</p>` : ''}`,
          type: 'success',
          duplicate: false
        }
      }
    } else {
      // 查重接口返回异常
      isbnCheckResult.value = {
        title: 'ISBN查重结果',
        content: `<p style="margin-bottom: 8px;">ISBN <strong>${isbn}</strong> 查重服务暂不可用，无法确认是否重复。</p>`,
        type: 'warning',
        duplicate: false
      }
    }
  } catch (error) {
    console.error('ISBN查重失败', error)
    isbnCheckResult.value = {
      title: 'ISBN查重结果',
      content: `<p style="margin-bottom: 8px;">ISBN <strong>${isbn}</strong> 查重服务暂不可用，无法确认是否重复。</p>`,
      type: 'warning',
      duplicate: false
    }
  } finally {
    isbnCheckLoading.value = false
  }
}

// 打开审核资料对话框 - 打开时执行查重
const handleOpenReviewDialog = async () => {
reviewCheckResult.value = null
  reviewConfirmDialogVisible.value = true

  if (projectType.value === 'book') {
    const isbn = bookInfoAuditRef.value?.getIsbn?.() || ''
    if (isbn) {
      await performReviewIsbnCheck(isbn)
    }
  }
}

// 审核弹框内执行ISBN查重
const performReviewIsbnCheck = async (isbn: string) => {
  isReviewCheckLoading.value = true
  reviewCheckResult.value = null

  try {
    const response = await getProjectMaterialIsbnCheckApi({ isbn })
    const data = response.data?.data
    if (response.data?.code === 200 && data) {
      const checkTime = data.checkTime || ''
      if (data.isbnDuplicate) {
        reviewCheckResult.value = {
          title: 'ISBN查重结果 - 发现重复',
          content: `<p style="margin-bottom: 8px; color: #F56C6C; font-weight: 500;">ISBN <strong>${data.isbn}</strong> 已存在重复书籍！</p>${checkTime ? `<p style="color: #909399; font-size: 13px;">检查时间：${checkTime}</p>` : ''}<p style="margin-top: 12px;">查重结果仅供参考，回传信息后可能已上传</p>`,
          type: 'warning',
          duplicate: true
        }
      } else {
        reviewCheckResult.value = {
          title: 'ISBN查重结果',
          content: `<p style="margin-bottom: 8px;">ISBN <strong>${data.isbn}</strong> 查重通过，未发现重复书籍。</p>${checkTime ? `<p style="color: #909399; font-size: 13px;">检查时间：${checkTime}</p>` : ''}`,
          type: 'success',
          duplicate: false
        }
      }
    } else {
      reviewCheckResult.value = {
        title: 'ISBN查重结果',
        content: `<p style="margin-bottom: 8px;">ISBN <strong>${isbn}</strong> 查重服务暂不可用，无法确认是否重复。</p>`,
        type: 'warning',
        duplicate: false
      }
    }
  } catch (error) {
    console.error('ISBN查重失败', error)
    reviewCheckResult.value = {
      title: 'ISBN查重结果',
      content: `<p style="margin-bottom: 8px;">ISBN <strong>${isbn}</strong> 查重服务暂不可用，无法确认是否重复。</p>`,
      type: 'warning',
      duplicate: false
    }
  } finally {
    isReviewCheckLoading.value = false
  }
}

// 确认审核（查重已在弹框内展示，直接提交）
const handleReviewConfirm = async (pass: boolean) => {
  reviewSubmitting.value = true
  try {
    const data: MaterialReviewCmd = {
      pass,
    }
    const response = await putProjectMaterialReviewApi(data, { projectId: String(projectId.value) })
    if (response.data.code === 200) {
      ElMessage.success(pass ? '审核通过' : '审核不通过')
      reviewConfirmDialogVisible.value = false
      router.push('/task/review')
    } else {
      ElMessage.error(response.data.msg || '审核操作失败')
    }
  } catch (error) {
    ElMessage.error('审核操作失败')
    console.error(error)
  } finally {
    reviewSubmitting.value = false
  }
}

// 获取页面图片URL
const getPageImageUrl = (page: PdfPageVO) => {
  const pdfImageEndpoint = configStore.getPdfImageEndpoint()
  const url = page.url
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return pdfImageEndpoint ? `${pdfImageEndpoint}${url}` : url
}

// 获取所有页面图片URL列表
const getAllImageUrls = () => {
  return pdfPages.value.map(page => getPageImageUrl(page))
}

// 获取页面类型名称
const getPageTypeName = (type: number | undefined) => {
  switch (type) {
    case 1: return '封面'
    case 2: return 'CIP'
    case 3: return '目录'
    case 4: return '封底'
    case 5: return '题目'
    case 6: return '答案'
    case 7: return '其他'
    default: return '未分类'
  }
}

// 获取页面类型颜色
const getPageTypeColor = (type: number | undefined): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  switch (type) {
    case 1: return 'primary'
    case 2: return 'success'
    case 3: return 'warning'
    case 4: return 'info'
    case 5: return 'danger'
    case 6: return 'success'
    case 7: return 'info'
    default: return undefined
  }
}

// 页面初始化
onMounted(async () => {
  await configStore.initConfig()

  if (isReviewMode.value) {
    projectTitle.value = '资料审核'
    await fetchDictData()
    await fetchAuditRecords()
  } else {
    projectTitle.value = '填写标注信息'
    // 加载审核反馈并检查未处理的反馈
    await checkAndAutoOpenFeedback()
  }

  // 加载PDF页面（仅书籍类型）
  if (projectType.value === 'book') {
    await fetchPdfPages()
  }
})
</script>

<style scoped>
.manage-header {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  padding-left: 10px;
  border-left: 4px solid #409EFF;
  line-height: 1.2;
}

.pages-summary {
  min-height: 100px;
}

.pages-stats {
  display: flex;
  align-items: center;
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.page-item {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.page-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.page-image {
  width: 100%;
  height: 160px;
  background-color: #f5f7fa;
  cursor: pointer;
}

.page-info {
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}

.page-number {
  color: #606266;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 12px;
  background-color: #f5f7fa;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-wrapper .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.footer-actions {
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

/* 书籍信息左右分栏布局 */
.book-info-split-layout {
  display: flex;
  min-height: 500px;
}

.book-info-split-layout.has-images {
  min-height: 600px;
}

.book-info-image-panel {
  width: 45%;
  flex-shrink: 0;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #f5f7fa;
}

.book-info-image-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  overflow: hidden;
}

.book-preview-image {
  max-width: 100%;
  max-height: 550px;
  object-fit: contain;
}

.book-info-form-panel {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding-left: 16px;
}

.page-pagination-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-indicator {
  font-size: 13px;
  color: #606266;
  min-width: 60px;
  text-align: center;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
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

.ml-2 {
  margin-left: 8px;
}

.mr-1 {
  margin-right: 4px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
