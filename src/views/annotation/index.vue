<template>
  <el-container class="annotation-container h-screen">
    <!-- 顶部导航区域 -->
    <el-header
      class="annotation-header h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4 flex-shrink-0">
      <div class="flex items-center">
        <el-button link @click="handleGoBack">
          <Icon icon="ep:arrow-left" :width="20" :height="20" />
          返回
        </el-button>
        <el-divider direction="vertical" />
        <span class="text-lg font-medium">{{ projectTitle }}</span>
        <el-tag :type="type === 'book' ? 'primary' : 'success'" class="ml-2">
          {{ type === 'book' ? '书籍' : '试卷' }}
        </el-tag>
        <div v-if="type === 'book'" class="total-questions-info ml-3">
          <span class="info-label">题目总数</span>
          <span class="info-count">{{ totalQuestionCount }}</span>
        </div>
      </div>
      <div class="flex items-center">
        <!-- 快捷键设置 -->
        <el-button size="small" @click="handleOpenShortcuts" class="mr-3">
          <Icon icon="ep:key" class="mr-1" />
          快捷键
        </el-button>
        <!-- 反馈结果按钮 -->
        <el-badge v-if="hasFeedback && unhandledFeedbackCount > 0" :value="unhandledFeedbackCount" class="mr-3">
          <el-button size="small" type="warning" @click="handleOpenFeedbackDialog">
            <Icon icon="ep:chat-line-square" class="mr-1" />
            反馈结果
          </el-button>
        </el-badge>
        <el-button v-else-if="hasFeedback" size="small" type="warning" @click="handleOpenFeedbackDialog" class="mr-3">
          <Icon icon="ep:chat-line-square" class="mr-1" />
          反馈结果
        </el-button>
        <!-- 节点管理 -->
        <el-button size="small" @click="handleOpenNodeManagement" class="mr-3">
          <Icon icon="ep:connection" class="mr-1" />
          节点管理
        </el-button>
        <!-- 解析设置 -->
        <el-button size="small" @click="handleOpenParseSettings" class="mr-3">
          <Icon icon="ep:setting" class="mr-1" />
          解析设置
        </el-button>
        <el-button type="primary" @click="handleOpenSubmitDialog">
          提交审核
        </el-button>
      </div>
    </el-header>

    <!-- 工作区域 -->
    <div class="work-container flex-1 overflow-hidden">
      <el-splitter class="h-full" layout="horizontal">
        <!-- 左侧菜单区域 -->
        <el-splitter-panel :min="200" size="280px">
          <div
            class="menu-panel w-full h-full border-r border-gray-200 bg-white flex flex-col overflow-hidden relative">
            <!-- 目录和题目区域 - 垂直 splitter -->
            <el-splitter class="flex-1" layout="vertical">
              <!-- 目录区域 - 仅书籍类型显示 -->
              <el-splitter-panel v-if="type === 'book'" :min="200" size="300px">
                <div class="catalog-section w-full h-full flex flex-col overflow-hidden">
                  <div class="catalog-header p-3 border-b border-gray-100 flex-shrink-0">
                    <div class="flex items-center justify-between">
                      <span class="font-medium text-gray-700">目录管理</span>
                    </div>
                    <div class="flex gap-2 mt-2">
                      <el-button type="primary" size="small" @click="handleCatalogManage">
                        目录管理
                      </el-button>
                      <el-button type="primary" size="small" @click="handlePageManage">
                        内容页管理
                      </el-button>
                    </div>
                  </div>
                  <div class="catalog-tree flex-1 overflow-y-auto p-3">
                    <CatalogTree ref="catalogTreeRef" :book-id="String(projectId)" :project-id="String(projectId)"
                      @select="handleCatalogSelect" @go-to-page="handleGoToPage" />
                  </div>
                </div>
              </el-splitter-panel>

              <!-- 题目区域 -->
              <el-splitter-panel :min="150">
                <div class="questions-section w-full h-full p-3 flex flex-col"
                  :class="{ 'border-t border-gray-200': type === 'book' }">
                  <div class="flex items-center justify-between mb-2 flex-shrink-0">
                    <div class="flex items-center">
                      <span class="font-medium text-gray-700">题目列表</span>
                      <span class="questions-count ml-2">{{ questionsCount }}</span>
                      <el-tooltip content="自动排序" placement="top">
                        <el-button type="primary" link size="small" class="ml-2" :disabled="questionsCount === 0"
                          @click="handleAutoSort">
                          <Icon icon="ep:refresh-right" :width="16" :height="16" />
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                  <div class="flex-1 overflow-hidden">
                    <QuestionsList ref="questionsListRef" v-if="projectId" :project-id="String(projectId)"
                      :catalogue-id="selectedCatalogueId" :type="type" :current-edit-item-id="currentEditItemId"
                      :current-edit-type="currentEditType" @select="handleQuestionSelect"
                      @edit-question="handleEditQuestion" @refresh-annotations="handleRefreshAnnotations"
                      @locate-annotation="handleLocateAnnotation"
                      @refresh-annotation-count="handleRefreshAnnotationCount" @questions-loaded="handleQuestionsLoaded"
                      @select-annotation="handleSelectAnnotationInEdit" @go-to-page="handleGoToPage"
                      @refresh-catalog-count="handleRefreshCatalogCount" @auto-sort="handleAutoSort"
                      @clear-annotation-selection="handleClearAnnotationSelection" />
                  </div>
                </div>
              </el-splitter-panel>
            </el-splitter>

            <!-- 书籍/试卷信息栏 -->
            <div class="info-bar p-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <el-button class="w-full" @click="handleOpenInfoDrawer">
                <Icon icon="ep:document" class="mr-1" />
                {{ type === 'book' ? '书籍信息' : '试卷信息' }}
              </el-button>
            </div>
            <!-- 书籍/试卷信息抽屉 -->
            <InfoDrawer v-model:visible="infoDrawerVisible" :type="type" :project-id="String(projectId)"
              :readonly="isMaterialLocked" @refresh="handleInfoRefresh" />
          </div>
        </el-splitter-panel>

        <!-- 中间标注区域 -->
        <el-splitter-panel :min="300">
          <div class="annotation-panel w-full h-full bg-gray-100 overflow-hidden p-0">
            <AnnotationArea v-if="projectId" ref="annotationAreaRef" :project-id="String(projectId)"
              :subject="subjectName"
              @refresh-annotations="handleRefreshAnnotations" @annotation-created="handleAnnotationCreated"
              @select-annotation="handleSelectAnnotation" @annotation-parsed="handleAnnotationParsed"
              @annotation-parse-start="handleAnnotationParseStart" @delete-annotation="handleDeleteAnnotation" />
          </div>
        </el-splitter-panel>

        <!-- 右侧编辑区域 -->
        <el-splitter-panel :min="200" size="280px">
          <div class="edit-panel w-full h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <EditPanel v-if="projectId" ref="editPanelRef" :project-id="String(projectId)" :type="type"
              @retry-parse="handleRetryParse" @update-content="handleUpdateContent"
              @refresh-question="handleRefreshQuestion" @update-annotation="handleUpdateAnnotation"
              @annotation-parse-start="handleAnnotationParseStart" />
          </div>
        </el-splitter-panel>
      </el-splitter>
    </div>

    <!-- 目录管理对话框 -->
    <CatalogManageDialog v-model:visible="catalogDialogVisible" v-if="type == 'book'" :book-id="String(projectId)"
      :project-id="String(projectId)" @refresh="handleCatalogRefresh" />

    <!-- 内容页管理对话框 -->
    <PageManageDialog v-model:visible="pageDialogVisible" :project-id="String(projectId)" :readonly="isMaterialLocked" />

    <!-- 节点管理对话框 -->
    <NodeManagementDialog v-model="nodeManagementDialogVisible" />

    <!-- 解析设置对话框 -->
    <ParseSettingsDialog v-model:visible="parseSettingsDialogVisible" @model-changed="handleModelChanged" />

    <!-- 提交审核检测对话框 -->
    <SubmitCheckDialog v-model:visible="submitDialogVisible" :project-id="String(projectId)" :type="type"
      @submitted="handleSubmitted" @open-feedback="handleOpenFeedbackFromSubmit"
      @go-to-question="handleGoToQuestionFromSubmit" />

    <!-- 反馈结果对话框 -->
    <FeedbackListDialog v-model:visible="feedbackDialogVisible" :project-id="String(projectId)" :type="type"
      :catalogue-tree-ref="catalogTreeRef" @feedback-handled="handleFeedbackHandled"
      @go-to-question="handleGoToQuestion" ref="feedbackDialogRef" />

    <!-- 快捷键设置对话框 -->
    <ShortcutsDialog v-model:visible="shortcutsDialogVisible" />
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useConfigStore } from '@/stores/config'
import CatalogTree from './components/CatalogTree.vue'
import QuestionsList from './components/QuestionsList.vue'
import AnnotationArea from './components/AnnotationArea.vue'
import EditPanel from './components/EditPanel.vue'
import CatalogManageDialog from './components/CatalogManageDialog.vue'
import PageManageDialog from './components/PageManageDialog.vue'
import InfoDrawer from './components/InfoDrawer.vue'
import ParseSettingsDialog from './components/ParseSettingsDialog.vue'
import SubmitCheckDialog from './components/SubmitCheckDialog.vue'
import FeedbackListDialog from './components/FeedbackListDialog.vue'
import NodeManagementDialog from '@/layout/components/NodeManagementDialog.vue'
import ShortcutsDialog from './components/ShortcutsDialog.vue'
import type { QuestionVO } from '@/api/gen/questionController'
import type { AnnotationSimpleVO } from '@/api/gen/annotationController'
import type { ModelVO } from '@/api/gen/modelController'
import { getQuestionListApi } from '@/api/gen/questionController'
import { getBookInfoDetailsApi } from '@/api/gen/bookController'
import { getDocInfoDetailsApi } from '@/api/gen/docController'
import { getDicSubjectListApi, type DicSubjectVO } from '@/api/gen/dicController'

defineOptions({
  name: 'AnnotationSystem'
})

const route = useRoute()
const router = useRouter()

// 路由参数
const projectId = computed(() => route.params.projectId)
const type = computed(() => route.query.type as ('book' | 'doc') || 'book')
const summitStep = computed(() => {
  const s = route.query.summitStep
  return s ? Number(s) : 0
})

// 是否禁止修改资料（标注工作台中内容页管理和书籍信息始终不可修改）
const isMaterialLocked = computed(() => true)

// 配置store
const configStore = useConfigStore()

// 项目标题
const projectTitle = ref('标注工作台')

// 学科名称（用于OCR识别时注入学科相关提示词）
const subjectName = ref<string | undefined>(undefined)

// 题目总数
const totalQuestionCount = ref(0)

// 当前题目列表数量
const questionsCount = ref(0)

// 获取书籍总题目数量
const fetchTotalQuestionCount = async () => {
  try {
    const response = await getQuestionListApi({ projectId: String(projectId.value) })
    if (response.data.code === 200) {
      totalQuestionCount.value = (response.data.data || []).length
    }
  } catch (error) {
    console.error('获取题目总数失败:', error)
  }
}

// 获取学科名称（用于OCR识别时注入学科相关提示词）
const fetchSubjectName = async () => {
  try {
    // 先获取学科字典
    const subjectListRes = await getDicSubjectListApi({ type: type.value === 'book' ? 1 : 2 })
    const subjectList: DicSubjectVO[] = subjectListRes.data.data || []

    // 根据类型获取书籍/试卷信息中的subjectId
    let subjectId: string | undefined
    if (type.value === 'book') {
      const res = await getBookInfoDetailsApi({ id: String(projectId.value) })
      if (res.data.code === 200 && res.data.data) {
        subjectId = res.data.data.subjectId
      }
    } else {
      const res = await getDocInfoDetailsApi({ id: String(projectId.value) })
      if (res.data.code === 200 && res.data.data) {
        subjectId = res.data.data.subjectId
      }
    }

    // 根据subjectId查找学科名称
    if (subjectId) {
      const subject = subjectList.find(s => s.id === subjectId)
      subjectName.value = subject?.subjectName || undefined
    }
  } catch (error) {
    console.error('[AnnotationSystem] 获取学科信息失败:', error)
  }
}

// 对话框控制
const catalogDialogVisible = ref(false)
const pageDialogVisible = ref(false)
const infoDrawerVisible = ref(false)
const nodeManagementDialogVisible = ref(false)
const parseSettingsDialogVisible = ref(false)
const submitDialogVisible = ref(false)
const feedbackDialogVisible = ref(false)
const shortcutsDialogVisible = ref(false)

// 引用
const catalogTreeRef = ref()
const questionsListRef = ref()
const annotationAreaRef = ref()
const editPanelRef = ref()
const feedbackDialogRef = ref()

// 反馈相关状态
const hasFeedback = ref(false)
const unhandledFeedbackCount = ref(0)

// 选中的目录ID
const selectedCatalogueId = ref<string | undefined>(undefined)
// 选中的题目
const selectedQuestion = ref<QuestionVO | null>(null)
// 当前编辑面板中打开的标注ID或题目ID
const currentEditItemId = ref<string | null>(null)
// 当前编辑面板打开的类型：'annotation' 或 'question'
const currentEditType = ref<'annotation' | 'question' | null>(null)

// 试卷类型自动加载题目列表
watch([projectId, type, questionsListRef], () => {
  console.log('watch triggered:', projectId.value, type.value, questionsListRef.value)
  if (projectId.value && type.value === 'doc' && questionsListRef.value) {
    console.log('calling loadQuestions for doc type')
    // 试卷类型自动触发题目列表加载
    questionsListRef.value.loadQuestions()
  }
}, { immediate: false })

// 返回
const handleGoBack = () => {
  router.push('/task/list')
}

// 目录选择
const handleCatalogSelect = (data: any) => {
  // 所有节点都会传递 catalogueId，不再限制为叶子节点
  const newCatalogueId = data.id

  // 只在目录真正改变时才清除选中状态
  if (newCatalogueId !== selectedCatalogueId.value) {
    selectedCatalogueId.value = newCatalogueId
    // 清除选中状态
    selectedQuestion.value = null
    annotationAreaRef.value?.setSelectedQuestion(null)
    annotationAreaRef.value?.clearSelection()
    // 清除编辑面板的选中状态
    currentEditItemId.value = null
    currentEditType.value = null
    editPanelRef.value?.clearSelection()
  }
}

// 题目选择
const handleQuestionSelect = (question: QuestionVO) => {
  selectedQuestion.value = question
  // 通知 AnnotationArea 当前选中的题目
  annotationAreaRef.value?.setSelectedQuestion(question.id)
}

// 编辑题目
const handleEditQuestion = (question: QuestionVO) => {
  selectedQuestion.value = question
  currentEditItemId.value = question?.id || null
  currentEditType.value = question ? 'question' : null
  // 通知 EditPanel 编辑题目
  editPanelRef.value?.setSelectedQuestion(question)
}

// 刷新标注列表
const handleRefreshAnnotations = async (page?: number) => {
  // 需要访问 AnnotationArea 组件的当前页码来判断
  // 这里直接刷新，让组件自己判断是否需要更新
  annotationAreaRef.value?.refreshAnnotations(page)
}

// 定位标注
const handleLocateAnnotation = (annotation: any) => {
  annotationAreaRef.value?.locateAnnotation(annotation)
}

// 标注创建成功
const handleAnnotationCreated = async (annotation: any) => {
  // 通知 QuestionsList 刷新当前题目的标注列表并选中新建的标注
  // refreshAnnotationsAndSelect 内部会选中标注，触发 selectAnnotation 事件
  // 那个事件会调用 handleSelectAnnotationInEdit，更新 currentEditItemId 和 currentEditType
  await questionsListRef.value?.refreshAnnotationsAndSelect(annotation)
}

// 刷新当前题目标注数量
const handleRefreshAnnotationCount = () => {
  questionsListRef.value?.refreshCurrentAnnotationCount()
}

// 刷新目录树的题目数量
const handleRefreshCatalogCount = () => {
  catalogTreeRef.value?.refreshQuestionCounts()
  // 刷新题目总数
  fetchTotalQuestionCount()
}

// 题目列表加载完成
const handleQuestionsLoaded = (questions: any[]) => {
  // 更新题目数量
  questionsCount.value = questions.length
  // 更新 AnnotationArea 中的题目索引映射
  annotationAreaRef.value?.setQuestionsList(questions)
}

// 选中标注
const handleSelectAnnotation = async (data: { annotationId: string; questionId: string; catalogueId: string }) => {
  // 如果目标目录与当前目录不同，先切换目录
  if (data.catalogueId && data.catalogueId !== selectedCatalogueId.value) {
    selectedCatalogueId.value = data.catalogueId
    await catalogTreeRef.value?.selectCatalog(data.catalogueId)
  }

  // 选中对应的题目并标注
  if (data.questionId) {
    await questionsListRef.value?.selectQuestion(data.questionId, data.annotationId)
  }

  // 将标注信息传递给 EditPanel
  // 需要从 QuestionsList 中获取标注的详细信息
  if (questionsListRef.value) {
    const annotation = questionsListRef.value.getSelectedAnnotation(data.annotationId)
    if (annotation) {
      editPanelRef.value?.setSelectedAnnotation(annotation)
    }
  }
}

// 在编辑面板中选中标注
const handleSelectAnnotationInEdit = (annotation: any) => {
  console.log('[index] handleSelectAnnotationInEdit 被调用', {
    annotationId: annotation?.id,
    url: annotation?.url,
    result: annotation?.result
  })
  currentEditItemId.value = annotation?.id || null
  currentEditType.value = annotation ? 'annotation' : null
  editPanelRef.value?.setSelectedAnnotation(annotation)
}

// 目录管理
const handleCatalogManage = () => {
  catalogDialogVisible.value = true
}

// 目录刷新
const handleCatalogRefresh = () => {
  catalogTreeRef.value?.fetchCatalogList()
}

// 跳转到指定页码
const handleGoToPage = (page: number) => {
  annotationAreaRef.value?.goToPage(page)
}

// 内容页管理
const handlePageManage = () => {
  pageDialogVisible.value = true
}

// 打开信息抽屉
const handleOpenInfoDrawer = () => {
  infoDrawerVisible.value = true
}

// 信息刷新
const handleInfoRefresh = () => {
  // 刷新后处理
}

// 打开节点管理
const handleOpenNodeManagement = () => {
  nodeManagementDialogVisible.value = true
}

// 打开解析设置
const handleOpenParseSettings = () => {
  parseSettingsDialogVisible.value = true
}

// 模型变更处理
const handleModelChanged = async (model: ModelVO | null) => {
  // 刷新 AnnotationArea 中的模型列表
  await annotationAreaRef.value?.refreshModels()
}

// 打开提交审核对话框
const handleOpenSubmitDialog = () => {
  submitDialogVisible.value = true
}

// 提交成功回调
const handleSubmitted = () => {
  router.push('/task/list')
}

// 从提交对话框打开反馈对话框
const handleOpenFeedbackFromSubmit = () => {
  submitDialogVisible.value = false
  feedbackDialogVisible.value = true
}

// 从提交对话框跳转到题目
const handleGoToQuestionFromSubmit = async (questionId: string, catalogueId: string, page?: number) => {
  // 如果是书籍类型，需要先切换到对应的目录
  if (type.value === 'book' && catalogueId) {
    selectedCatalogueId.value = catalogueId
    await catalogTreeRef.value?.selectCatalog(catalogueId)
  }

  // 选中对应的题目
  if (questionId) {
    await questionsListRef.value?.selectQuestion(questionId)
    // 获取题目信息并打开编辑框
    const question = questionsListRef.value?.getQuestionById(questionId)
    if (question) {
      handleEditQuestion(question)
    }
    // 跳转到指定页面
    if (page) {
      await annotationAreaRef.value?.goToPage(page)
    }
  }
}

// 打开反馈对话框
const handleOpenFeedbackDialog = () => {
  feedbackDialogVisible.value = true
}

// 打开快捷键设置
const handleOpenShortcuts = () => {
  shortcutsDialogVisible.value = true
}

// 跳转到题目
const handleGoToQuestion = async (questionId: string, catalogueId: string, page?: number) => {
  // 如果是书籍类型，需要先切换到对应的目录
  if (type.value === 'book' && catalogueId) {
    selectedCatalogueId.value = catalogueId
    await catalogTreeRef.value?.selectCatalog(catalogueId)
  }

  // 选中对应的题目
  if (questionId) {
    await questionsListRef.value?.selectQuestion(questionId)
    // 获取题目信息并打开编辑框
    const question = questionsListRef.value?.getQuestionById(questionId)
    if (question) {
      handleEditQuestion(question)
    }
    // 跳转到指定页面
    if (page) {
      await annotationAreaRef.value?.goToPage(page)
    }
  }
}

// 反馈已处理回调
const handleFeedbackHandled = () => {
  // 重新检查反馈状态
  checkAndAutoOpenFeedback()
  // 可以在这里添加其他逻辑，比如刷新相关数据
}

// 重试解析
const handleRetryParse = async (annotation: any) => {
  if (!annotation) return

  try {
    // 更新题目列表中的标注状态为解析中
    await questionsListRef.value?.updateAnnotationStatus(annotation.id, 0)

    // 执行重试解析
    await annotationAreaRef.value?.retryParseAnnotation(annotation)

    // 解析完成后立即刷新标注列表（不等待轮询）
    await handleRefreshAnnotations()

    // 刷新题目列表中的标注状态
    const questionId = annotation.questionId
    if (questionId) {
      const question = questionsListRef.value?.getQuestionById(questionId)
      if (question) {
        await questionsListRef.value?.loadQuestionAnnotations(question)
      }
    }

    // 刷新编辑面板中的标注信息
    if (questionsListRef.value) {
      const selectedAnnotation = questionsListRef.value.getSelectedAnnotation(annotation.id)
      if (selectedAnnotation) {
        editPanelRef.value?.setSelectedAnnotation(selectedAnnotation)
      }
    }
  } catch (error) {
    // 解析失败，更新状态为失败
    await questionsListRef.value?.updateAnnotationStatus(annotation.id, 2)
    console.error(error)
  }
}

// 标注解析完成
const handleAnnotationParsed = async (annotationId: string) => {
  // 刷新标注列表以更新解析状态
  handleRefreshAnnotations()
  // 刷新题目列表中的标注状态
  await questionsListRef.value?.refreshAnnotationStatus(annotationId)

  // 刷新编辑面板中的标注信息
  if (questionsListRef.value) {
    const selectedAnnotation = questionsListRef.value.getSelectedAnnotation(annotationId)
    if (selectedAnnotation) {
      editPanelRef.value?.setSelectedAnnotation(selectedAnnotation)
    }
  }
}

// 标注开始解析
const handleAnnotationParseStart = async (data: { annotationId: string; questionId: string }) => {
  const { annotationId, questionId } = data
  console.log('[index] handleAnnotationParseStart 被调用', { annotationId, questionId })
  // 更新左侧题目列表中的标注状态为解析中
  await questionsListRef.value?.updateAnnotationStatus(annotationId, 0)
  // 更新题目状态为解析中
  await questionsListRef.value?.updateQuestionAnnotationStatus(questionId, 0)
  // 启动轮询以跟踪解析状态
  questionsListRef.value?.startPolling()
}

// 更新标注内容
const handleUpdateContent = async (data: { annotationId: string; content: string }) => {
  // 更新题目列表中的标注内容
  await questionsListRef.value?.updateAnnotationContent(data.annotationId, data.content)
}

// 更新标注状态
const handleUpdateAnnotation = async (annotation: AnnotationSimpleVO) => {
  // 更新题目列表中的标注状态
  await questionsListRef.value?.updateAnnotationStatus(annotation.id, annotation.result)
  // 刷新标注区域的标注列表
  annotationAreaRef.value?.refreshAnnotations()
  // 更新编辑区域中的标注数据
  const selectedAnnotation = questionsListRef.value?.getSelectedAnnotation(annotation.id)
  if (selectedAnnotation) {
    editPanelRef.value?.setSelectedAnnotation(selectedAnnotation)
  }
}

// 刷新题目信息
const handleRefreshQuestion = async () => {
  // 重新加载题目列表以更新页码等信息
  await questionsListRef.value?.loadQuestions()
}

// 清除标注选中状态
const handleClearAnnotationSelection = async () => {
  currentEditItemId.value = null
  currentEditType.value = null
  await editPanelRef.value?.clearSelection()
}

// 快速删除标注（快捷键）
const handleDeleteAnnotation = async (annotationId: string) => {
  await questionsListRef.value?.quickDeleteAnnotation()
}

// 自动排序
const handleAutoSort = async () => {
  // 调用子组件的自动排序方法
  if (questionsListRef.value) {
    await questionsListRef.value.handleAutoSort()
  }
}

// 快捷键处理标志位（防止长按时重复触发）
const keysPressed = ref<Set<string>>(new Set())

// 快捷键处理
const handleKeyDown = (event: KeyboardEvent) => {
  // 检查是否在输入框或文本域中，如果是则不处理快捷键
  const target = event.target as HTMLElement
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' ||
    target.isContentEditable || target.closest('.el-textarea__inner')

  // 如果在输入状态中，不触发快捷键
  if (isInput) return

  // 如果按键已经在处理中，跳过（防止长按时重复触发）
  if (keysPressed.value.has(event.key.toLowerCase())) return
  keysPressed.value.add(event.key.toLowerCase())

  // Q 键 - 快速新增题目
  if (event.key === 'q' || event.key === 'Q') {
    event.preventDefault()
    questionsListRef.value?.handleAddQuestion()
  }

  // 数字键 1-6 - 切换当前选中题目的类型
  const typeKeyMap: Record<string, string> = {
    '1': 'xuanze',     // 选择题
    '2': 'duoxuan',    // 多选题
    '3': 'tiankong',   // 填空题
    '4': 'panduan',    // 判断题
    '5': 'wenda',      // 问答题
    '6': 'zuhe'        // 组合题
  }

  if (typeKeyMap[event.key]) {
    event.preventDefault()
    questionsListRef.value?.handleChangeQuestionType(typeKeyMap[event.key])
  }

  // B 键 - 切换到编辑模式（仅在编辑面板打开时生效）
  if (event.key === 'b' || event.key === 'B') {
    event.preventDefault()
    if (currentEditType.value === 'question') {
      editPanelRef.value?.switchToEditMode()
    }
  }

  // Y 键 - 切换到预览模式（仅在编辑面板打开时生效）
  if (event.key === 'y' || event.key === 'Y') {
    event.preventDefault()
    if (currentEditType.value === 'question') {
      editPanelRef.value?.switchToPreviewMode()
    }
  }
}

// 键盘松开处理（重置按键状态）
const handleKeyUp = (event: KeyboardEvent) => {
  keysPressed.value.delete(event.key.toLowerCase())
}

// 组件挂载时初始化配置
onMounted(async () => {
  configStore.initConfig()
  // 获取题目总数
  await fetchTotalQuestionCount()
  // 获取学科信息
  await fetchSubjectName()
  // 加载反馈列表并检查是否自动弹出
  await checkAndAutoOpenFeedback()
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

// 组件销毁前移除事件监听
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// 检查并自动打开反馈对话框
const checkAndAutoOpenFeedback = async () => {
  if (!projectId.value) return

  try {
    await feedbackDialogRef.value?.loadFeedbackList()
    const hasUnhandled = feedbackDialogRef.value?.hasUnhandledFeedback()
    // 如果反馈列表为空，不显示反馈按钮
    hasFeedback.value = feedbackDialogRef.value?.feedbackList.length > 0
    unhandledFeedbackCount.value = feedbackDialogRef.value?.unhandledCount || 0

    // 如果有未处理的反馈，自动弹出反馈对话框
    if (hasUnhandled) {
      feedbackDialogVisible.value = true
    }
  } catch (error) {
    console.error('检查反馈失败：', error)
    hasFeedback.value = false
    unhandledFeedbackCount.value = 0
  }
}
</script>

<style scoped>
.annotation-container {
  height: 100vh;
}

.annotation-header {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.work-container {
  display: flex;
  flex-direction: row;
}

.menu-panel,
.edit-panel {
  display: flex;
  flex-direction: column;
}

.catalog-section,
.questions-section {
  display: flex;
  flex-direction: column;
}

/* 调整 splitter 样式 */


:deep(.el-splitter__resizer) {
  background-color: #e5e7eb;
  transition: background-color 0.2s;
}

:deep(.el-splitter__resizer:hover) {
  background-color: #3b82f6;
}

:deep(.el-drawer__body) {
  padding: 20px;
}

.total-questions-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background-color: #ecf5ff;
  border-radius: 4px;
}

.info-label {
  font-size: 12px;
  color: #606266;
}

.info-count {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
}

.questions-count {
  font-size: 12px;
  color: #909399;
}
</style>
