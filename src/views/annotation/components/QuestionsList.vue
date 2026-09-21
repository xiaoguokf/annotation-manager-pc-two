<template>
  <div class="questions-list-container h-full flex flex-col">
    <!-- 操作栏 -->
    <div class="toolbar mb-2 flex-shrink-0">
      <el-button type="primary" size="small" :disabled="!canAddQuestion" @click="handleAddQuestion">
        <Icon icon="ep:plus" />
        新增题目
      </el-button>
      <el-button
        type="info"
        size="small"
        :class="{ 'is-active': isSortMode }"
        :disabled="!canAddQuestion"
        @click="toggleSortMode"
      >
        <Icon :icon="isSortMode ? 'ep:check' : 'ep:sort'" />
        {{ isSortMode ? '完成排序' : '调整顺序' }}
      </el-button>
    </div>
    <!-- 题目列表 -->
    <div ref="questionListRef" class="question-list flex-1 overflow-y-auto min-h-0">
      <div
        v-for="(question, index) in questions"
        :key="question.id"
        class="question-item"
        :class="{
          active: selectedQuestionId === question.id,
          'is-dragging': draggedItem?.id === question.id,
          expanded: expandedQuestionId === question.id,
          'drop-target': dropTargetIndex === index
        }"
        @mouseenter="handleDragEnter(index)"
        @mouseleave="handleDragLeave"
      >
        <!-- 插入线 -->
        <div v-if="isSortMode && dropTargetIndex === index" class="drop-indicator"></div>
        <div class="question-content flex items-center justify-between">
          <!-- 拖拽手柄 -->
          <div
            v-if="isSortMode"
            class="drag-handle"
            :class="{ 'is-dragging': isDragging && draggedItem?.id === question.id }"
            @mousedown.stop="handleDragStart($event, question, index)"
            title="拖动以交换顺序"
          >
            <Icon icon="ep:rank" />
          </div>
          <div class="question-info flex-1 min-w-0" @click.stop="handleQuestionClick(question)">
            <Icon
              icon="ep:arrow-right"
              class="expand-icon"
              :class="{ expanded: expandedQuestionId === question.id }"
              @click.stop="handleToggleQuestion(question)"
            />
            <span class="question-prefix">题</span>
            <span class="sort-num">{{ question.sortNum || index + 1 }}</span>
            <span class="annotation-count">({{ question.annotationCount || 0 }})</span>
            <el-cascader
              class="question-type-cascader"
              size="small"
              :model-value="question.labelQuestionType ?? undefined"
              :options="questionTypeCascaderOptions"
              :props="questionTypeCascaderProps"
              filterable
              clearable
              :show-all-levels="false"
              :placeholder="getQuestionTypeLabel(question)"
              @change="(val) => handleQuestionTypeChange(val as number | null, question)"
              @click.stop
            />
            <div v-if="question.page" class="page-badge">
              <Icon icon="ep:circle-check-filled" />
            </div>
            <!-- 注解处理状态图标 -->
            <div
              v-if="question.annotationCount && question.annotationCount > 0"
              class="annotation-status-badge"
              :class="`status-${question.annotationStatus !== undefined ? question.annotationStatus : 0}`"
              :title="getAnnotationStatusText(question.annotationStatus !== undefined ? question.annotationStatus : 0)"
            >
              <Icon :icon="getAnnotationStatusIcon(question.annotationStatus !== undefined ? question.annotationStatus : 0)" />
            </div>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleMenuCommand(cmd, question, index)">
            <el-button type="primary" link>
              <Icon icon="ep:more-filled" />
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="moveToCatalogue">移动到目录</el-dropdown-item>
                <el-dropdown-item command="insertBefore" divided>在此前插入题目</el-dropdown-item>
                <el-dropdown-item command="insertAfter">在此后插入题目</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除题目</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <!-- 标注列表展开区域 -->
        <div v-if="expandedQuestionId === question.id" class="annotations-expand">
          <div class="annotations-list">
            <div
              v-for="annotation in questionAnnotations"
              :key="annotation.id"
              class="annotation-item"
              :class="{ selected: selectedAnnotationId === annotation.id }"
              @click="handleAnnotationClick(annotation)"
            >
              <div class="annotation-type">
                <Icon :icon="getAnnotationTypeIcon(annotation.type, annotation.inputType)" :style="{ color: getAnnotationTypeColor(annotation.type, annotation.inputType) }" />
                <span>{{ getAnnotationTypeName(annotation.type, annotation.inputType) }}</span>
              </div>
              <div class="annotation-info">
                <span>页码: {{ annotation.page }}</span>
              </div>
              <!-- 解析状态显示 -->
              <div v-if="annotation.result !== undefined" class="annotation-status">
                <Icon
                  :icon="annotation.result === 0 ? 'ep:loading' : annotation.result === 1 ? 'ep:check' : 'ep:close'"
                  :style="{ color: annotation.result === 0 ? '#e6a23c' : annotation.result === 1 ? '#67c23a' : '#f56c6c' }"
                  :class="{ 'is-spinning': annotation.result === 0 }"
                />
              </div>
              <el-button
                type="danger"
                link
                size="small"
                @click.stop="handleDeleteAnnotation(annotation, question)"
                :title="annotation.result === 0 ? '解析中，删除后将停止解析' : '删除'"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <div v-if="questionAnnotations.length === 0" class="empty-annotations">
              <Icon icon="ep:document" :width="32" :height="32" class="text-gray-300 mb-1" />
              <p class="text-gray-400 text-xs">暂无标注</p>
            </div>
          </div>
        </div>
      </div>
      <!-- 拖拽到末尾的插入线 -->
      <div
        v-if="isSortMode && questions.length > 0"
        class="drop-zone-end"
        :class="{ 'drop-target': dropTargetIndex === questions.length }"
        @mouseenter="handleDragEnter(questions.length)"
        @mouseleave="handleDragLeave"
      >
        <div v-if="dropTargetIndex === questions.length" class="drop-indicator"></div>
      </div>
      <!-- 空状态 -->
      <div v-if="questions.length === 0" class="empty-state">
        <Icon icon="ep:document" :width="48" :height="48" class="text-gray-300 mb-2" />
        <p class="text-gray-400 text-sm">暂无题目</p>
      </div>
    </div>

    <!-- 移动到目录对话框 -->
    <el-dialog
      v-model="moveToCatalogueDialogVisible"
      title="移动到目录"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="movingQuestion">
        <p class="mb-3">请选择目标目录（仅叶子节点）：</p>
        <el-tree
          ref="catalogTreeRef"
          :data="leafCatalogues"
          :props="catalogTreeProps"
          node-key="id"
          highlight-current
          default-expand-all
          @node-click="handleCatalogTreeNodeClick"
        >
          <template #default="{ node }">
            <span>{{ node.label }}</span>
          </template>
        </el-tree>
      </div>
      <template #footer>
        <el-button @click="moveToCatalogueDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedTargetCatalogueId" @click="handleConfirmMoveToCatalogue">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, onUnmounted, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import http from '@/utils/http'
import { getQuestionListApi, postQuestionCreateApi, deleteQuestionDeleteApi, putQuestionSortApi, putQuestionUpdateApi, type QuestionVO } from '@/api/gen/questionController'
import { getAnnotationListApi, deleteAnnotationDeleteApi, getAnnotationListByProjectAndPageApi, getAnnotationListPendingAndFailedApi, type AnnotationSimpleVO, type AnnotationStatusVO } from '@/api/gen/annotationController'
import { getCatalogueListApi, type CatalogueVO } from '@/api/gen/catalogueController'
import { getBookInfoDetailsApi } from '@/api/gen/bookController'
import { getDocInfoDetailsApi } from '@/api/gen/docController'
import { getDicSubjectListApi, type DicSubjectVO } from '@/api/gen/dicController'
import { useQuestionTypeDict } from '@/composables/useQuestionTypeDict'
import type { DicQuestionTypeVO } from '@/api/gen/dicController'

// 扩展 QuestionVO 类型以包含 annotationStatus 及学科题型字段（列表接口未返回，本地更新后补全）
interface ExtendedQuestionVO extends QuestionVO {
  annotationStatus?: number
  labelQuestionType?: number | null
  labelQuestionTypeZh?: string | null
}

interface Props {
  projectId: string
  catalogueId?: string
  type?: 'book' | 'doc'
  currentEditItemId?: string | null
  currentEditType?: 'annotation' | 'question' | null
}

const props = defineProps<Props>()

const emit = defineEmits(['select', 'refreshAnnotations', 'locateAnnotation', 'refreshAnnotationCount', 'questionsLoaded', 'selectAnnotation', 'editQuestion', 'goToPage', 'retry-parse', 'refresh-catalog-count', 'clearAnnotationSelection'])

// 注入目录树组件的引用
const catalogTreeRefParent = inject<any>('catalogTreeRef')

const questions = ref<(ExtendedQuestionVO & { annotationCount?: number })[]>([])
const selectedQuestionId = ref<string | null>(null)
const expandedQuestionId = ref<string | null>(null)
const selectedAnnotationId = ref<string | null>(null)
const questionAnnotations = ref<AnnotationSimpleVO[]>([])
const loading = ref(false)
const isDragging = ref(false)
const isSortMode = ref(false)
const draggedItem = ref<(ExtendedQuestionVO & { annotationCount?: number }) | null>(null)
const draggedIndex = ref(-1)
const dropTargetIndex = ref<number | null>(null)
const questionListRef = ref<HTMLElement | null>(null)

// 移动到目录相关
const moveToCatalogueDialogVisible = ref(false)
const movingQuestion = ref<QuestionVO | null>(null)
const leafCatalogues = ref<any[]>([])
const selectedTargetCatalogueId = ref<string>('')
const catalogTreeRef = ref()
const catalogTreeProps = {
  children: 'children',
  label: 'catalogueName'
}

// 用于等待题目列表加载完成的 Promise resolve
let questionsLoadedResolve: (() => void) | null = null
// 保存待选择的题目和标注ID
let pendingSelection: { questionId: string; annotationId?: string } | null = null

// 轮询相关
let pollingTimer: NodeJS.Timeout | null = null
const pendingAnnotations = ref<AnnotationStatusVO[]>([])
const lastPendingAnnotationsHash = ref('')
const emptyPollingCount = ref(0) // 空结果计数器

// 判断是否可以添加题目（书籍类型需要选中最低级目录，试卷类型不需要目录）
const canAddQuestion = computed(() => {
  if (props.type === 'doc') {
    return true // 试卷类型不需要目录就可以添加题目
  }
  return props.catalogueId && props.catalogueId !== '' // 书籍类型需要选中目录
})

// 标注类型配置
interface AnnotationTypeConfig {
  value: number
  name: string
  icon: string
  color: string
}

const annotationTypeConfigs: AnnotationTypeConfig[] = [
  { value: 1, name: '题干', icon: 'ep:document', color: '#3b82f6' },
  { value: 2, name: '题干图', icon: 'ep:picture', color: '#8b5cf6' },
  { value: 3, name: '选项', icon: 'ep:list', color: '#10b981' },
  { value: 4, name: '选项图', icon: 'ep:picture-rounded', color: '#f59e0b' },
  { value: 5, name: '解析', icon: 'ep:edit-pen', color: '#ef4444' },
  { value: 6, name: '解析图', icon: 'ep:picture-filled', color: '#ec4899' },
  { value: 7, name: '答案', icon: 'ep:check', color: '#06b6d4' },
  { value: 8, name: '答案图', icon: 'ep:zoom-in', color: '#84cc16' }
]

// 表格类型的独立配置（inputType=3 时使用）
const tableTypeConfigs: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: '题干表格', icon: 'ep:grid', color: '#1e40af' },   // 深蓝色
  3: { name: '选项表格', icon: 'ep:grid', color: '#065f46' },   // 深绿色
  5: { name: '解析表格', icon: 'ep:grid', color: '#991b1b' },   // 深红色
  7: { name: '答案表格', icon: 'ep:grid', color: '#155e75' },   // 深青色
  9: { name: '表格', icon: 'ep:grid', color: '#7c3aed' }        // 深紫色（独立表格）
}

// 题目类型（按学科动态加载，来自学科题型字典）
const {
  ensureLoaded,
  getOptionsBySubject,
  getQuestionTypeName,
  getTypeNameByCode,
} = useQuestionTypeDict()

const subjectCode = ref<number | undefined>(undefined)
const questionTypeOptions = ref<DicQuestionTypeVO[]>([])

// 题型大类 -> 叶子题型，构建 el-cascader 选项（仅叶子可选）
const questionTypeCascaderOptions = computed<Array<{ value: string; label: string; children: Array<{ value: number; label: string }> }>>(() => {
  const map = new Map<string, Array<{ value: number; label: string }>>()
  for (const item of questionTypeOptions.value) {
    const key = item.categoryName || '其他'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ value: item.typeCode as number, label: item.typeName || '' })
  }
  return Array.from(map.entries()).map(([categoryName, children]) => ({ value: categoryName, label: categoryName, children }))
})

// 级联选择：emitPath=false 只返回叶子节点值；父节点不可选，只能选叶子
const questionTypeCascaderProps = { emitPath: false, expandTrigger: 'hover' as const }


// 获取当前书籍/试卷的学科枚举（subjectCode）
const loadSubjectCode = async () => {
  try {
    if (props.type === 'doc') {
      const res = await getDocInfoDetailsApi({ id: props.projectId })
      const data = res.data?.data
      if (data?.subjectId) {
        const sres = await getDicSubjectListApi({ type: 2 })
        const subject = (sres.data?.data || []).find(
          (s: DicSubjectVO) => String(s.id) === String(data.subjectId),
        )
        subjectCode.value = subject?.docxCode
      }
    } else {
      const res = await getBookInfoDetailsApi({ id: props.projectId })
      const data = res.data?.data
      if (data?.subjectCode && data.subjectCode > 0) {
        subjectCode.value = data.subjectCode
      } else if (data?.subjectId) {
        const sres = await getDicSubjectListApi({ type: 1 })
        const subject = (sres.data?.data || []).find(
          (s: DicSubjectVO) => String(s.id) === String(data.subjectId),
        )
        subjectCode.value = subject?.docxCode
      }
    }
  } catch (e) {
    console.error('获取学科枚举失败', e)
  }
}

// 加载题型字典并按学科过滤下拉选项
const loadQuestionTypeOptions = async () => {
  await ensureLoaded()
  await loadSubjectCode()
  questionTypeOptions.value = getOptionsBySubject(subjectCode.value)
}

// 启用拖拽
const isDraggingEnabled = computed(() => questions.value.length > 1)

// 标注类型映射
const annotationTypeMap: Record<number, string> = {
  1: '题干',
  2: '题干图',
  3: '选项',
  4: '选项图',
  5: '解析',
  6: '解析图',
  7: '答案',
  8: '答案图',
  9: '表格'
}

// 获取标注类型名称
const getAnnotationTypeName = (type: number, inputType?: number) => {
  // 如果 inputType 是 3（表格），使用表格的独立配置
  if (inputType === 3 && tableTypeConfigs[type]) {
    return tableTypeConfigs[type].name
  }
  return annotationTypeMap[type] || '未知类型'
}

// 获取标注类型配置
const getAnnotationTypeConfig = (type: number, inputType?: number) => {
  // 如果 inputType 是 3（表格），使用表格的独立配置
  if (inputType === 3 && tableTypeConfigs[type]) {
    return {
      value: type,
      name: tableTypeConfigs[type].name,
      icon: tableTypeConfigs[type].icon,
      color: tableTypeConfigs[type].color
    }
  }
  return annotationTypeConfigs.find(config => config.value === type) || annotationTypeConfigs[0]
}

// 获取标注类型图标
const getAnnotationTypeIcon = (type: number, inputType?: number) => {
  const config = getAnnotationTypeConfig(type, inputType)
  return config?.icon ?? annotationTypeConfigs[0]?.icon ?? 'ep:document'
}

// 获取标注类型颜色
const getAnnotationTypeColor = (type: number, inputType?: number) => {
  const config = getAnnotationTypeConfig(type, inputType)
  return config?.color ?? annotationTypeConfigs[0]?.color ?? '#6b7280'
}

// 获取题目类型标签
const getQuestionTypeLabel = (question: {
  labelQuestionType?: number | null
  tishi?: string | null
  labelQuestionTypeZh?: string | null
}) => {
  return (
    getQuestionTypeName({
      labelQuestionType: question.labelQuestionType,
      tishi: question.tishi,
      labelQuestionTypeZh: question.labelQuestionTypeZh,
    }) || '设置类型'
  )
}

// 获取注解处理状态图标
const getAnnotationStatusIcon = (status?: number) => {
  if (status === 1) return 'ep:check' // 完成 - 绿色
  if (status === 2) return 'ep:close' // 失败 - 红色
  return 'ep:loading' // 进行中 - 蓝色
}

// 获取注解处理状态文本
const getAnnotationStatusText = (status?: number) => {
  if (status === 1) return '全部注解已完成'
  if (status === 2) return '存在失败的标注'
  return '标注处理中...'
}

// 计算题目的注解处理状态（基于 pendingAnnotations 数据）
const calculateQuestionAnnotationStatus = (question: ExtendedQuestionVO): number | undefined => {
  // 1. 该道题没有标注，不显示
  if (!question.annotationCount || question.annotationCount === 0) {
    question.annotationStatus = undefined
    return undefined
  }

  // 使用 pendingAnnotations（只包含进行中和失败的标注）
  const questionPendingAnnotations = pendingAnnotations.value.filter((a: any) => a.questionId === question.id)

  // 3. 该题目存在失败标注，则整道题为失败状态
  if (questionPendingAnnotations.some((a: any) => a.result === 2)) {
    question.annotationStatus = 2
    return 2
  }

  // 4. 该道题有进行中的标注
  if (questionPendingAnnotations.some((a: any) => a.result === 0)) {
    question.annotationStatus = 0
    return 0
  }

  // 2. 该道题有标注，但是没有进行中和失败，显示成功状态
  // （说明所有标注都已完成）
  question.annotationStatus = 1
  return 1
}

// 更新题目列表的注解状态
const updateQuestionsAnnotationStatus = () => {
  questions.value.forEach(question => {
    question.annotationStatus = calculateQuestionAnnotationStatus(question)
  })
}

// 轮询进行中和失败的标注状态
const pollPendingAndFailedAnnotations = async () => {
  if (!props.projectId) return

  try {
    const response = await getAnnotationListPendingAndFailedApi({ projectId: props.projectId })
    if (response.data.code === 200) {
      const newAnnotations = response.data.data || []
      const newHash = JSON.stringify(newAnnotations)

      // 检查是否为空结果
      if (newAnnotations.length === 0) {
        emptyPollingCount.value++
        // 连续三次为空，停止轮询
        if (emptyPollingCount.value >= 3) {
          console.log('连续三次查询结果为空，停止轮询')
          stopPolling()
          return
        }
      } else {
        // 有数据时重置计数器
        emptyPollingCount.value = 0
      }

      // 记录之前的进行中的标注ID
      const previousPendingIds = new Set(pendingAnnotations.value.map(a => a.id))
      // 更新 pendingAnnotations，始终以 API 返回的数据为准
      pendingAnnotations.value = newAnnotations
      // 当前的进行中的标注ID
      const currentPendingIds = new Set(newAnnotations.map(a => a.id))

      // 检查是否有标注完成了解析（之前在 pending 列表，现在不在了）
      let hasCompletedAnnotation = false
      const completedAnnotationIds: string[] = []
      previousPendingIds.forEach(id => {
        if (!currentPendingIds.has(id)) {
          hasCompletedAnnotation = true
          completedAnnotationIds.push(id)
        }
      })

      console.log('[轮询]', {
        previousPendingCount: previousPendingIds.size,
        currentPendingCount: currentPendingIds.size,
        hasCompletedAnnotation,
        completedAnnotationIds,
        newAnnotationsLength: newAnnotations.length
      })

      // 当数据变化或 pendingAnnotations 为空时，更新题目状态和标注列表
      if (newHash !== lastPendingAnnotationsHash.value || newAnnotations.length === 0 || hasCompletedAnnotation) {
        lastPendingAnnotationsHash.value = newHash

        console.log('[轮询] 开始更新题目状态和标注列表')

        // 更新所有题目的注解状态
        updateQuestionsAnnotationStatus()

        // 如果当前有展开的题目，刷新其标注列表
        if (expandedQuestionId.value) {
          const question = questions.value.find(q => q.id === expandedQuestionId.value)
          if (question) {
            await loadQuestionAnnotations(question)
            console.log('[轮询] 已刷新题目标注列表，标注数量:', questionAnnotations.value.length)

            // 如果当前有选中的标注，触发事件通知父组件更新编辑面板
            if (selectedAnnotationId.value) {
              const annotation = questionAnnotations.value.find(a => a.id === selectedAnnotationId.value)
              console.log('[轮询] 检查编辑面板刷新条件:', {
                selectedAnnotationId: selectedAnnotationId.value,
                hasAnnotation: !!annotation,
                currentEditType: props.currentEditType,
                currentEditItemId: props.currentEditItemId,
                annotationId: annotation?.id,
                shouldRefresh: annotation && props.currentEditType === 'annotation' && props.currentEditItemId === annotation?.id
              })
              // 只有当前编辑面板打开的就是这个标注时，才通知刷新
              if (annotation && props.currentEditType === 'annotation' && props.currentEditItemId === annotation.id) {
                console.log('[轮询] 触发编辑面板更新，标注ID:', annotation.id, 'URL:', annotation.url, 'result:', annotation.result)
                // 使用 nextTick 确保数据更新完成后再触发事件
                await nextTick()
                emit('selectAnnotation', annotation)
              } else {
                console.log('[轮询] 未满足刷新条件，跳过编辑面板更新')
              }
            } else {
              console.log('[轮询] 没有选中的标注，跳过编辑面板更新')
            }
          }
        } else {
          console.log('[轮询] 没有展开的题目，跳过标注列表刷新')
        }
      } else {
        console.log('[轮询] 数据无变化，跳过更新')
      }
    }
  } catch (error) {
    console.error('轮询标注状态失败:', error)
  }
}

// 启动轮询
const startPolling = () => {
  stopPolling() // 先停止之前的轮询
  emptyPollingCount.value = 0 // 重置空结果计数器
  pollPendingAndFailedAnnotations() // 立即执行一次
  pollingTimer = setInterval(() => {
    pollPendingAndFailedAnnotations()
  }, 5000) // 每5秒查询一次
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 点击题目项 - 打开题目编辑并设置当前题目
const handleQuestionClick = (question: QuestionVO) => {
  selectedQuestionId.value = question.id
  emit('editQuestion', question)
  // 同时也触发 select 事件，让标注区域知道当前选中的题目
  emit('select', question)
  // 如果题目有 page 字段，触发页码跳转
  if (question.page) {
    emit('goToPage', question.page)
  }
}

// 切换题目类型
const handleQuestionTypeChange = async (type: number | null | undefined, question: ExtendedQuestionVO) => {
  // 清空选择时不做处理，保留原类型
  if (type == null) return
  try {
    const response = await putQuestionUpdateApi(
      { labelQuestionType: type },
      { id: question.id }
    )
    if (response.data.code === 200) {
      const typeName = getTypeNameByCode(type)
      ElMessage.success(`已成功切换为${typeName}`)
      question.labelQuestionType = type
    } else {
      ElMessage.error(response.data.msg || '题目类型修改失败')
    }
  } catch (error) {
    ElMessage.error('题目类型修改失败')
    console.error(error)
  }
}

// 加载题目列表
const loadQuestions = async () => {
  console.log('loadQuestions called:', { projectId: props.projectId, type: props.type, catalogueId: props.catalogueId })
  loading.value = true
  try {
    const params: { projectId: string; catalogueId?: string } = {
      projectId: props.projectId
    }
    // 书籍类型需要传catalogueId
    if (props.type === 'book' && props.catalogueId) {
      params.catalogueId = props.catalogueId
    }
    console.log('request params:', params)
    const response = await getQuestionListApi(params)
    console.log('response:', response)
    if (response.data.code === 200) {
      questions.value = response.data.data || []
      console.log('questions loaded:', questions.value.length)
      // 初始化所有题目的注解状态
      updateQuestionsAnnotationStatus()
      // 通知父组件题目列表已加载
      emit('questionsLoaded', questions.value)
      // 解析等待的 Promise
      if (questionsLoadedResolve) {
        questionsLoadedResolve()
        questionsLoadedResolve = null
      }
      // 处理待选中的题目
      if (pendingSelection) {
        const { questionId, annotationId } = pendingSelection
        pendingSelection = null
        // 延迟一帧确保 DOM 已更新
        setTimeout(() => {
          applySelection(questionId, annotationId)
        }, 50)
      }
    }
  } catch (error) {
    ElMessage.error('加载题目列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 重新加载当前题目的标注数量
const refreshCurrentAnnotationCount = async () => {
  if (expandedQuestionId.value) {
    const question = questions.value.find(q => q.id === expandedQuestionId.value)
    if (question) {
      // 直接使用当前标注列表长度更新数量
      question.annotationCount = questionAnnotations.value.length
    }
  }
}

const handleToggleQuestion = async (question: ExtendedQuestionVO) => {
  if (expandedQuestionId.value === question.id) {
    // 收起
    expandedQuestionId.value = null
    questionAnnotations.value = []
  } else {
    // 展开
    expandedQuestionId.value = question.id
    selectedQuestionId.value = question.id
    emit('select', question)
    // 加载标注列表
    await loadQuestionAnnotations(question)
  }
}

// 加载题目标注列表
const loadQuestionAnnotations = async (question: ExtendedQuestionVO) => {
  try {
    const response = await getAnnotationListApi({ questionId: question.id })
    if (response.data.code === 200) {
      // 直接使用 AnnotationSimpleVO,已包含分析字段
      questionAnnotations.value = response.data.data || []
      console.log('加载题目标注列表，questionId:', question.id, '标注数据:', questionAnnotations.value.map((a: any) => ({
        id: a.id,
        type: a.type,
        result: a.result,
        hasUrl: !!a.url,
        hasAnalysisContent: !!a.analysisContent
      })))
    }
  } catch (error) {
    ElMessage.error('加载标注列表失败')
    console.error(error)
  }
}

// 刷新单个标注状态（用于解析完成后）
const refreshAnnotationStatus = async (annotationId: string) => {
  if (!expandedQuestionId.value) return

  const question = questions.value.find(q => q.id === expandedQuestionId.value)
  if (!question) return

  try {
    const response = await getAnnotationListApi({ questionId: question.id })
    if (response.data.code === 200) {
      // 直接使用 AnnotationSimpleVO,已包含分析字段
      questionAnnotations.value = response.data.data || []
    }
  } catch (error) {
    console.error('刷新标注状态失败:', error)
  }
}

// 点击标注
const handleAnnotationClick = (annotation: AnnotationSimpleVO) => {
  selectedAnnotationId.value = annotation.id
  emit('locateAnnotation', annotation)

  // 直接使用 AnnotationSimpleVO，已包含解析字段
  emit('selectAnnotation', annotation)
}

// 获取完整的标注信息
const getFullAnnotation = async (annotationId: string, page: number): Promise<AnnotationSimpleVO | null> => {
  try {
    const response = await getAnnotationListByProjectAndPageApi({
      projectId: props.projectId,
      page: page
    })
    if (response.data.code === 200) {
      const annotations = response.data.data || []
      return annotations.find(a => a.id === annotationId) || null
    }
    return null
  } catch (error) {
    console.error('获取完整标注信息失败:', error)
    return null
  }
}

// 删除标注
const handleDeleteAnnotation = async (annotation: AnnotationSimpleVO, question: ExtendedQuestionVO) => {
  // 如果正在解析中，给出提示但允许删除
  if (annotation.result === 0) {
    try {
      await ElMessageBox.confirm(
        '该标注正在解析中，删除后将停止解析。确认删除吗？',
        '提示',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch (error: any) {
      // 用户取消删除
      if (error !== 'cancel') {
        console.error(error)
      }
      return
    }
  } else {
    // 普通删除确认
    try {
      await ElMessageBox.confirm('确认删除该标注吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch (error: any) {
      if (error !== 'cancel') {
        console.error(error)
      }
      return
    }
  }

  try {
    const response = await deleteAnnotationDeleteApi({ id: annotation.id })
    if (response.data.code === 200) {
      ElMessage.success('删除标注成功')
      // 如果删除的是当前选中的标注，清除选中状态
      if (selectedAnnotationId.value === annotation.id) {
        selectedAnnotationId.value = null
        // 通知父组件清除编辑面板的选中状态
        emit('clearAnnotationSelection')
      }
      // 重新加载标注列表
      await loadQuestionAnnotations(question)
      // 更新题目的注解状态
      question.annotationStatus = calculateQuestionAnnotationStatus(question)
      // 重新加载题目列表以更新标注数量
      await loadQuestions()
      // 只在删除的标注页码与当前显示页码一致时才刷新右侧标注
      emit('refreshAnnotations', annotation.page)
    } else {
      ElMessage.error(response.data.msg || '删除标注失败')
    }
  } catch (error: any) {
    ElMessage.error('删除标注失败')
    console.error(error)
  }
}

// 快速删除标注（快捷键使用，无确认对话框）
const quickDeleteAnnotation = async () => {
  // 检查是否有选中的标注
  if (!selectedAnnotationId.value) {
    return false
  }

  // 检查是否有展开的题目
  if (!expandedQuestionId.value) {
    return false
  }

  // 查找选中的标注和题目
  const annotation = questionAnnotations.value.find(a => a.id === selectedAnnotationId.value)
  const question = questions.value.find(q => q.id === expandedQuestionId.value)

  if (!annotation || !question) {
    return false
  }

  try {
    const response = await deleteAnnotationDeleteApi({ id: annotation.id })
    if (response.data.code === 200) {
      ElMessage.success('删除标注成功')
      // 重新加载标注列表
      await loadQuestionAnnotations(question)
      // 重新加载题目列表以更新标注数量
      await loadQuestions()
      // 刷新右侧标注
      emit('refreshAnnotations', annotation.page)
      // 清除选中状态
      selectedAnnotationId.value = null
      // 通知父组件清除编辑面板的选中状态
      emit('clearAnnotationSelection')
      return true
    } else {
      ElMessage.error(response.data.msg || '删除标注失败')
      return false
    }
  } catch (error: any) {
    ElMessage.error('删除标注失败')
    console.error(error)
    return false
  }
}

// 重新生成标注解析
const handleRetryParseAnnotation = async (annotation: AnnotationSimpleVO) => {
  try {
    // 更新标注状态为解析中
    annotation.result = 0
    emit('retry-parse', annotation)
  } catch (error: any) {
    ElMessage.error('重新生成失败')
    console.error(error)
  }
}

// 选择题目
const handleSelectQuestion = (question: QuestionVO) => {
  selectedQuestionId.value = question.id
  emit('select', question)
}

// 应用选中状态
const applySelection = async (questionId: string, annotationId?: string) => {
  const question = questions.value.find(q => q.id === questionId)
  if (!question) return

  // 展开该题目
  expandedQuestionId.value = question.id
  selectedQuestionId.value = question.id

  // 加载标注列表
  await loadQuestionAnnotations(question)

  // 如果有标注ID，选中该标注
  if (annotationId) {
    selectedAnnotationId.value = annotationId
  }

  // 触发选中事件
  emit('select', question)

  // 滚动到该题目位置
  setTimeout(() => {
    const questionElements = document.querySelectorAll('.question-item')
    const questionIndex = questions.value.findIndex(q => q.id === questionId)
    if (questionIndex !== -1 && questionElements[questionIndex]) {
      questionElements[questionIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })
    }
  }, 100)
}

// 外部调用选中题目（用于点击标注框后选中）
const selectQuestion = async (questionId: string, annotationId?: string) => {
  // 等待题目列表加载完成
  if (loading.value || questions.value.length === 0) {
    // 保存待选中信息，等待加载完成后应用
    pendingSelection = { questionId, annotationId }
    await new Promise<void>(resolve => {
      questionsLoadedResolve = resolve
      // 如果列表已经是空的但不在加载中，可能需要立即加载
      if (!loading.value && questions.value.length === 0 && props.catalogueId) {
        loadQuestions()
      }
    })
    return
  }

  // 直接应用选中
  await applySelection(questionId, annotationId)
}

// 刷新标注列表并选中新建的标注
const refreshAnnotationsAndSelect = async (annotation: any) => {
  console.log('[QuestionsList] refreshAnnotationsAndSelect 被调用', {
    annotationId: annotation.id,
    questionId: annotation.questionId,
    selectedQuestionId: selectedQuestionId.value
  })
  // 只在当前选中的题目与标注所属题目一致时才刷新
  if (selectedQuestionId.value && selectedQuestionId.value === annotation.questionId) {
    const question = questions.value.find(q => q.id === annotation.questionId)
    if (question) {
      // 确保题目已展开
      if (expandedQuestionId.value !== annotation.questionId) {
        expandedQuestionId.value = annotation.questionId
      }
      // 刷新标注列表
      await loadQuestionAnnotations(question)
      // 选中新建的标注
      selectedAnnotationId.value = annotation.id
      // 更新标注数量
      question.annotationCount = questionAnnotations.value.length
      // 新建标注后，重新计算题目状态（标注可能正在解析中）
      question.annotationStatus = calculateQuestionAnnotationStatus(question)
      // 触发 selectAnnotation 事件，让编辑面板显示新建的标注
      const selectedAnnotation = questionAnnotations.value.find(a => a.id === annotation.id)
      if (selectedAnnotation) {
        console.log('[QuestionsList] 触发 selectAnnotation 事件，标注ID:', selectedAnnotation.id)
        emit('selectAnnotation', selectedAnnotation)
      }
    }
  } else {
    console.log('[QuestionsList] 题目未选中或不匹配，跳过刷新编辑面板')
    // 即使题目未选中，也需要更新该题目的状态和数量
    const question = questions.value.find(q => q.id === annotation.questionId)
    if (question) {
      // 增加标注数量
      question.annotationCount = (question.annotationCount || 0) + 1
      // 新建标注后，重新计算题目状态（标注可能正在解析中）
      question.annotationStatus = calculateQuestionAnnotationStatus(question)
    }
  }
}

// 获取指定标注的详细信息
const getSelectedAnnotation = (annotationId: string): AnnotationSimpleVO | null => {
  return questionAnnotations.value.find(a => a.id === annotationId) || null
}

// 更新标注的解析状态
const updateAnnotationStatus = (annotationId: string, result: number) => {
  const annotation = questionAnnotations.value.find(a => a.id === annotationId)
  if (annotation) {
    annotation.result = result
  }
  // 更新题目列表中该标注所属题目的注解状态
  if (annotation && annotation.questionId) {
    const question = questions.value.find(q => q.id === annotation.questionId)
    if (question) {
      // 重新计算题目状态，而不是直接设置为单个标注的状态
      question.annotationStatus = calculateQuestionAnnotationStatus(question)
    }
  }
}

// 更新题目的解析状态（直接设置为指定状态）
const updateQuestionAnnotationStatus = (questionId: string, status: number) => {
  const question = questions.value.find(q => q.id === questionId)
  if (question) {
    question.annotationStatus = status
  }
}

// 更新标注的内容
const updateAnnotationContent = (annotationId: string, content: string) => {
  const annotation = questionAnnotations.value.find(a => a.id === annotationId)
  if (annotation) {
    annotation.analysisContent = content
  }
}

// 根据题目ID获取题目对象
const getQuestionById = (questionId: string) => {
  return questions.value.find(q => q.id === questionId)
}

// 新增题目
const handleAddQuestion = async () => {
  // 书籍类型需要选中目录
  if (props.type === 'book' && !props.catalogueId) {
    ElMessage.warning('请先选择一个目录')
    return
  }
  try {
    const maxSortNum = Math.max(...questions.value.map(q => q.sortNum || 0), 0)
    const data: any = {
      projectId: props.projectId,
      sortNum: maxSortNum + 1,
      type: props.type === 'book' ? 0 : 1 // 0-书籍，1-试卷
    }
    // 书籍类型需要传catalogueId
    if (props.type === 'book' && props.catalogueId) {
      data.catalogueId = props.catalogueId
    }
    // 如果有题目，使用最后一个题目的类型
    if (questions.value.length > 0) {
      const lastQuestion = questions.value[questions.value.length - 1]
      if (lastQuestion && lastQuestion.tishi) {
        data.tishi = lastQuestion.tishi
      }
      if (lastQuestion && lastQuestion.labelQuestionType != null) {
        data.labelQuestionType = lastQuestion.labelQuestionType
      }
    }
    const response = await postQuestionCreateApi(data)
    if (response.data.code === 200) {
      ElMessage.success('新增题目成功')
      // 加载题目列表
      await loadQuestions()
      // 刷新标注列表以更新题号
      emit('refreshAnnotations')
      // 刷新目录树的题目数量
      emit('refresh-catalog-count')
      // 选中新增的题目（排序号最大的那个）
      const newQuestion = questions.value.find(q => q.sortNum === maxSortNum + 1)
      if (newQuestion) {
        handleSelectQuestion(newQuestion)
        // 收起之前展开的题目（如果有的话）
        if (expandedQuestionId.value && expandedQuestionId.value !== newQuestion.id) {
          expandedQuestionId.value = null
          questionAnnotations.value = []
        }
        // 立刻展开新添加的题目
        expandedQuestionId.value = newQuestion.id
        selectedQuestionId.value = newQuestion.id
        emit('select', newQuestion)
        // 加载标注列表（新题目暂时没有标注，但需要确保展开状态正确）
        await loadQuestionAnnotations(newQuestion)
      }
    } else {
      ElMessage.error(response.data.msg || '新增题目失败')
    }
  } catch (error) {
    ElMessage.error('新增题目失败')
    console.error(error)
  }
}

// 菜单命令处理
const handleMenuCommand = async (command: string, question: QuestionVO, index: number) => {
  switch (command) {
    case 'moveToCatalogue':
      await handleMoveToCatalogue(question)
      break
    case 'insertBefore':
      await handleInsertQuestion(index, true)
      break
    case 'insertAfter':
      await handleInsertQuestion(index, false)
      break
    case 'delete':
      await handleDeleteQuestion(question)
      break
  }
}

// 加载叶子目录列表
const loadLeafCatalogues = async () => {
  try {
    const response = await getCatalogueListApi({ bookId: props.projectId })
    if (response.data.code === 200) {
      const catalogues = response.data.data || []
      // 构建树形结构并过滤出叶子节点
      leafCatalogues.value = buildLeafCatalogueTree(catalogues)
    } else {
      ElMessage.error(response.data.msg || '获取目录列表失败')
    }
  } catch (error) {
    ElMessage.error('获取目录列表失败')
    console.error(error)
  }
}

// 构建叶子目录树（只保留叶子节点）
const buildLeafCatalogueTree = (catalogues: CatalogueVO[]): any[] => {
  // 创建节点映射
  const nodeMap = new Map<string, any>()
  catalogues.forEach(item => {
    nodeMap.set(item.id, { ...item, children: [] })
  })

  // 统计每个节点的子节点数量
  const childCountMap = new Map<string, number>()
  catalogues.forEach(item => {
    if (item.parentId && item.parentId !== '0') {
      childCountMap.set(item.parentId, (childCountMap.get(item.parentId) || 0) + 1)
    }
  })

  // 构建完整的树形结构（所有节点）
  const fullTree: any[] = []
  catalogues.forEach(item => {
    const node = nodeMap.get(item.id)
    if (!item.parentId || item.parentId === '0') {
      fullTree.push(node)
    } else {
      const parent = nodeMap.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 过滤树，只保留包含叶子节点的路径
  return filterTreeWithLeafNodes(fullTree, childCountMap)
}

// 递归过滤树，只保留包含叶子节点的路径
const filterTreeWithLeafNodes = (nodes: any[], childCountMap: Map<string, number>): any[] => {
  const result: any[] = []

  nodes.forEach(node => {
    // 检查是否有子节点
    const childCount = childCountMap.get(node.id) || 0

    if (childCount === 0) {
      // 叶子节点，直接保留
      result.push(node)
    } else if (node.children && node.children.length > 0) {
      // 中间节点，递归过滤子节点
      const filteredChildren = filterTreeWithLeafNodes(node.children, childCountMap)
      if (filteredChildren.length > 0) {
        // 有叶子子节点，保留该节点及其过滤后的子节点
        result.push({ ...node, children: filteredChildren })
      }
    }
  })

  return result
}

// 打开移动到目录对话框
const handleMoveToCatalogue = async (question: QuestionVO) => {
  movingQuestion.value = question
  selectedTargetCatalogueId.value = ''
  await loadLeafCatalogues()
  moveToCatalogueDialogVisible.value = true
}

// 目录树节点点击
const handleCatalogTreeNodeClick = (data: any) => {
  selectedTargetCatalogueId.value = data.id
  catalogTreeRef.value?.setCurrentKey(data.id)
}

// 确认移动到目录
const handleConfirmMoveToCatalogue = async () => {
  if (!movingQuestion.value || !selectedTargetCatalogueId.value) {
    return
  }

  try {
    const response = await putQuestionUpdateApi(
      { catalogueId: selectedTargetCatalogueId.value },
      { id: movingQuestion.value.id }
    )

    if (response.data.code === 200) {
      ElMessage.success('移动题目成功')
      moveToCatalogueDialogVisible.value = false
      // 重新加载题目列表
      await loadQuestions()
      // 刷新标注列表以更新题号
      emit('refreshAnnotations')
      // 刷新目录树的题目数量
      emit('refresh-catalog-count')
    } else {
      ElMessage.error(response.data.msg || '移动题目失败')
    }
  } catch (error) {
    ElMessage.error('移动题目失败')
    console.error(error)
  }
}

// 插入题目
const handleInsertQuestion = async (index: number, before: boolean) => {
  try {
    const targetQuestion = questions.value[index]
    if (!targetQuestion) return

    // 计算新题目的排序号
    let newSortNum: number
    if (before) {
      // 在前面插入：使用当前题目的排序号，后面的题目排序号+1
      newSortNum = targetQuestion.sortNum || index + 1
    } else {
      // 在后面插入：使用当前题目排序号+1
      newSortNum = (targetQuestion.sortNum || index + 1) + 1
    }

    const data: any = {
      projectId: props.projectId,
      sortNum: newSortNum,
      type: props.type === 'book' ? 0 : 1 // 0-书籍，1-试卷
    }
    // 书籍类型需要传catalogueId
    if (props.type === 'book' && props.catalogueId) {
      data.catalogueId = props.catalogueId
    }

    const response = await postQuestionCreateApi(data)
    if (response.data.code === 200) {
      ElMessage.success('插入题目成功')
      // 重新排序题目
      await reorderQuestions()
      // 加载题目列表
      await loadQuestions()
      // 刷新标注列表以更新题号
      emit('refreshAnnotations')
      // 刷新目录树的题目数量
      emit('refresh-catalog-count')
      // 选中插入的题目
      const insertedQuestion = questions.value.find(q => q.sortNum === newSortNum)
      if (insertedQuestion) {
        handleSelectQuestion(insertedQuestion)
        // 收起之前展开的题目（如果有的话）
        if (expandedQuestionId.value && expandedQuestionId.value !== insertedQuestion.id) {
          expandedQuestionId.value = null
          questionAnnotations.value = []
        }
        // 立刻展开新插入的题目
        expandedQuestionId.value = insertedQuestion.id
        selectedQuestionId.value = insertedQuestion.id
        emit('select', insertedQuestion)
        // 加载标注列表（新题目暂时没有标注，但需要确保展开状态正确）
        await loadQuestionAnnotations(insertedQuestion)
      }
    } else {
      ElMessage.error(response.data.msg || '插入题目失败')
    }
  } catch (error) {
    ElMessage.error('插入题目失败')
    console.error(error)
  }
}

// 删除题目
const handleDeleteQuestion = async (question: QuestionVO) => {
  try {
    await ElMessageBox.confirm('确认删除该题目吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const response = await deleteQuestionDeleteApi({ id: question.id })
    if (response.data.code === 200) {
      ElMessage.success('删除题目成功')
      if (selectedQuestionId.value === question.id) {
        selectedQuestionId.value = null
      }
      await loadQuestions()
      // 刷新标注列表以更新题号
      emit('refreshAnnotations')
      // 刷新目录树的题目数量
      emit('refresh-catalog-count')
    } else {
      ElMessage.error(response.data.msg || '删除题目失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除题目失败')
      console.error(error)
    }
  }
}

// 拖拽进入目标
const handleDragEnter = (index: number) => {
  if (isSortMode.value && isDragging.value && draggedItem.value) {
    dropTargetIndex.value = index
  }
}

// 拖拽离开目标
const handleDragLeave = () => {
  if (isSortMode.value) {
    dropTargetIndex.value = null
  }
}

// 切换排序模式
const toggleSortMode = () => {
  isSortMode.value = !isSortMode.value
  // 退出排序模式时清除拖拽状态
  if (!isSortMode.value) {
    dropTargetIndex.value = null
    draggedItem.value = null
    draggedIndex.value = -1
    isDragging.value = false
  }
}

// 拖拽开始
const handleDragStart = (e: MouseEvent, question: QuestionVO, index: number) => {
  if (e.button !== 0) return // 只响应左键
  if (!isSortMode.value) return // 只在排序模式下允许拖拽

  draggedItem.value = question
  draggedIndex.value = index
  isDragging.value = true
  dropTargetIndex.value = null

  // 设置拖拽时的鼠标样式
  document.body.style.cursor = 'grabbing'

  const handleMouseUp = async (upEvent: MouseEvent) => {
    isDragging.value = false
    document.removeEventListener('mousemove', () => {})
    document.removeEventListener('mouseup', handleMouseUp)

    // 恢复鼠标样式
    document.body.style.cursor = ''

    // 清除插入线
    const targetIndex = dropTargetIndex.value
    dropTargetIndex.value = null

    // 如果有有效的目标位置且不是原来的位置，执行交换
    if (targetIndex !== null && targetIndex !== draggedIndex.value && draggedItem.value) {
      await swapQuestions(draggedIndex.value, targetIndex)
    }

    draggedItem.value = null
    draggedIndex.value = -1
  }

  document.addEventListener('mouseup', handleMouseUp, { once: true })
}

// 移动题目顺序（插入模式）
const swapQuestions = async (fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex) return

  try {
    const fromQuestion = questions.value[fromIndex]

    if (!fromQuestion) {
      ElMessage.error('题目信息获取失败')
      return
    }

  // 计算目标排序号
  let targetSortNum: number
  if (toIndex >= questions.value.length) {
    // 移动到末尾：插入到最后一个题目后面，sortNum = 当前总数 + 1
    targetSortNum = questions.value.length + 1
  } else {
    const toQuestion = questions.value[toIndex]
    targetSortNum = toQuestion?.sortNum || toIndex + 1
    }

    // 调用一次 API 将题目移动到目标位置
    await putQuestionSortApi({
      id: fromQuestion.id,
      sortNum: targetSortNum
    })

    ElMessage.success('移动顺序成功')
    await loadQuestions()
    // 刷新标注列表以更新题号
    emit('refreshAnnotations')
  } catch (error) {
    ElMessage.error('移动顺序失败')
    console.error(error)
    // 失败时重新加载数据以恢复
    await loadQuestions()
  }
}

// 重新排序题目
const reorderQuestions = async () => {
  try {
    for (let i = 0; i < questions.value.length; i++) {
      const question = questions.value[i]
      if (question && question.sortNum !== i + 1) {
        await putQuestionSortApi({
          id: question.id,
          sortNum: i + 1
        })
      }
    }
    loadQuestions()
  } catch (error) {
    console.error('重新排序失败', error)
  }
}

// 自动排序题目
const handleAutoSort = async () => {
  try {
    await ElMessageBox.confirm(
      '自动排序将重新整理当前目录下所有题目的题号，是否继续？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
    return
  }

  try {
    const params: any = {
      projectId: props.projectId
    }
    // 书籍类型需要传catalogueId
    if (props.type === 'book' && props.catalogueId) {
      params.catalogueId = props.catalogueId
    }

    const response = await http.post('/question/auto-sort', params)

    if (response.data.code === 200) {
      ElMessage.success('自动排序成功')
      // 重新加载题目列表
      await loadQuestions()
      // 刷新标注列表以更新题号
      emit('refreshAnnotations')
    } else {
      ElMessage.error(response.data.msg || '自动排序失败')
    }
  } catch (error) {
    ElMessage.error('自动排序失败')
    console.error(error)
  }
}

// 切换题目类型（通过数字键）
const handleChangeQuestionType = async (type: number) => {
  // 需要有选中的题目
  if (!selectedQuestionId.value) {
    ElMessage.warning('请先选择一个题目')
    return
  }
  // 查找选中的题目
  const question = questions.value.find(q => q.id === selectedQuestionId.value)
  if (!question) {
    ElMessage.warning('未找到选中的题目')
    return
  }
  // 如果类型相同，不需要切换
  if (question.labelQuestionType === type) {
    return
  }
  // 调用切换类型
  await handleQuestionTypeChange(type, question)
}

// 暴露方法供父组件调用
defineExpose({
  refreshCurrentAnnotationCount,
  selectQuestion,
  loadQuestions,
  loadQuestionAnnotations,
  refreshAnnotationsAndSelect,
  getSelectedAnnotation,
  refreshAnnotationStatus,
  updateAnnotationStatus,
  updateAnnotationContent,
  getQuestionById,
  quickDeleteAnnotation,
  handleAddQuestion,
  handleChangeQuestionType,
  handleAutoSort,
  updateQuestionAnnotationStatus,
  startPolling
})

watch(() => props.catalogueId, () => {
  selectedQuestionId.value = null
  expandedQuestionId.value = null
  selectedAnnotationId.value = null
  loadQuestions()
})

// 项目/类型变化时，按学科加载题目类型下拉选项
watch(
  () => [props.projectId, props.type],
  () => {
    loadQuestionTypeOptions()
  },
  { immediate: true },
)

// 组件挂载时不再自动启动轮询，而是在开始解析时启动
// onMounted(() => {
//   startPolling()
// })

// 组件卸载时停止轮询
onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.questions-list-container {
  height: 100%;
}

.toolbar {
  display: flex;
  gap: 8px;
}

.question-list {
  padding: 4px;
  overflow-y: auto;
  min-height: 0;
}

.question-list > * + * {
  margin-top: 4px;
}

.question-item {
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
  background: white;
  user-select: none;
  overflow: hidden;
}

.question-item:hover {
  background-color: #f3f4f6;
}

.question-item.active {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.question-item.expanded {
  background-color: #f0f9ff;
}

.question-item.is-dragging {
  opacity: 0.5;
}

.toolbar :deep(.el-button.is-active) {
  background-color: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.question-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  gap: 8px;
}

.question-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  cursor: grab;
  color: #9ca3af;
  transition: all 0.2s;
  user-select: none;
}

.drag-handle:hover {
  color: #6b7280;
  background-color: #f3f4f6;
  border-radius: 4px;
}

.drag-handle.is-dragging {
  cursor: grabbing;
  color: #3b82f6;
}

.question-item.is-dragging {
  opacity: 0.5;
}

.expand-icon {
  transition: transform 0.2s;
  color: #9ca3af;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.question-prefix {
  font-weight: 500;
  color: #374151;
}

.sort-num {
  font-weight: 500;
  color: #374151;
}

.annotation-count {
  font-size: 12px;
  color: #6b7280;
}

.question-type-badge {
  display: inline-block;
  padding: 2px 8px;
  margin-left: 8px;
  font-size: 11px;
  border-radius: 4px;
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.question-type-badge:hover {
  background-color: #e5e7eb;
}

.question-type-badge.has-type {
  background-color: #dbeafe;
  color: #1e40af;
}

/* 题型级联选择器：做成紧凑小控件，避免撑破题目行 */
.question-type-cascader {
  width: 160px;
}

.question-type-cascader :deep(.el-cascader__tags) {
  max-width: 100%;
}

.question-type-cascader :deep(.el-input__wrapper) {
  background-color: #f3f4f6;
  box-shadow: none;
}

.question-type-cascader :deep(input::placeholder) {
  color: #6b7280;
}

.dark .question-type-cascader :deep(.el-input__wrapper) {
  background-color: #1f2937;
}

.dark .question-type-cascader :deep(input::placeholder) {
  color: #9ca3af;
}

.page-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 4px;
  font-size: 16px;
  border-radius: 50%;
  background-color: #22c55e;
  color: white;
}

/* 注解处理状态图标 */
.annotation-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  margin-left: 4px;
  border-radius: 50%;
  font-size: 12px;
}

.annotation-status-badge.status-0 {
  background-color: #3b82f6;
  color: white;
}

.annotation-status-badge.status-1 {
  background-color: #67c23a;
  color: white;
}

.annotation-status-badge.status-2 {
  background-color: #f56c6c;
  color: white;
}

.annotation-status-badge .iconify {
  font-size: 10px;
}

.annotation-status-badge.status-0 .iconify {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 标注展开区域 */
.annotations-expand {
  border-top: 1px solid #e5e7eb;
  background-color: #fafafa;
  margin-top: 4px;
}

.annotations-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px 12px 12px;
}

/* 拖拽插入线 */
.drop-indicator {
  height: 3px;
  background-color: #3b82f6;
  border-radius: 2px;
  margin: -2px 0 2px 0;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
  animation: pulse-drop 0.3s ease-in-out;
}

.question-item.drop-target {
  background-color: #eff6ff;
  border-color: #3b82f6;
}

@keyframes pulse-drop {
  0% {
    transform: scaleX(0.8);
    opacity: 0.5;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

.annotation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-radius: 4px;
  background: white;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.annotation-item:hover {
  background-color: #f3f4f6;
}

.annotation-item.selected {
  background-color: #dbeafe;
  border-color: #3b82f6;
}

.annotation-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #374151;
}

.annotation-type .iconify {
  font-size: 16px;
}

.annotation-info {
  flex: 1;
  margin-left: 8px;
  color: #6b7280;
}

.empty-annotations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
}

/* 拖拽到末尾的区域 */
.drop-zone-end {
  min-height: 40px;
  display: flex;
  align-items: center;
  margin-top: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}

.drop-zone-end.drop-target {
  background-color: #eff6ff;
  border: 2px dashed #3b82f6;
}

/* 解析状态样式 */
.annotation-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.annotation-status .is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
