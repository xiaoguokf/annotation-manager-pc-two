<template>
  <el-dialog v-model="dialogVisible" title="提交审核检测" width="900px" :close-on-click-modal="false" @close="handleClose">
    <div class="check-dialog-container">
      <!-- 检测项列表 -->
      <div class="check-items">
        <!-- 书籍/试卷信息完整性 -->
        <div class="check-item" :class="{ 'error': !checking && !checkResult.bookInfo.pass }">
          <div class="item-header">
            <Icon v-if="checking" icon="ep:loading" class="loading-icon" />
            <Icon v-else :icon="checkResult.bookInfo.pass ? 'ep:check' : 'ep:close'"
              :class="checkResult.bookInfo.pass ? 'success' : 'error'" />
            <span class="item-title">{{ type === 'book' ? '书籍信息检测' : '试卷信息检测' }}</span>
            <el-tag v-if="checking" type="info" size="small">处理中</el-tag>
            <el-tag v-else :type="checkResult.bookInfo.pass ? 'success' : 'danger'" size="small">
              {{ checkResult.bookInfo.pass ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div v-if="!checking && !checkResult.bookInfo.pass" class="item-content">
            <p class="error-msg">请完善以下必填信息：</p>
            <ul class="error-list">
              <li v-for="(msg, index) in checkResult.bookInfo.messages" :key="index">{{ msg }}</li>
            </ul>
          </div>
        </div>

        <!-- 目录完整性（仅书籍） -->
        <div v-if="type === 'book'" class="check-item" :class="{ 'error': !checking && !checkResult.catalogue.pass }">
          <div class="item-header" @click="toggleCatalogTree" style="cursor: pointer;">
            <Icon v-if="checking" icon="ep:loading" class="loading-icon" />
            <Icon v-else :icon="checkResult.catalogue.pass ? 'ep:check' : 'ep:close'"
              :class="checkResult.catalogue.pass ? 'success' : 'error'" />
            <span class="item-title">目录检测</span>
            <el-tag v-if="checking" type="info" size="small">处理中</el-tag>
            <el-tag v-else :type="checkResult.catalogue.pass ? 'success' : 'danger'" size="small">
              {{ checkResult.catalogue.pass ? '通过' : '不通过' }}
            </el-tag>
            <Icon :icon="showCatalogTree ? 'ep:arrow-up' : 'ep:arrow-down'" class="toggle-icon" />
          </div>
          <div v-if="showCatalogTree" class="item-content">
            <div v-if="checkResult.catalogue.nonLeafWithQuestions.length > 0 && !checkResult.catalogue.pass" class="error-summary">
              <p class="error-msg">1.发现题目存在非子目录下</p>
              <p class="error-msg">2.存在空目录</p>
            </div>
            <p v-else-if="checkResult.catalogue.nonLeafWithQuestions.length > 0" class="error-msg">1.发现题目存在非子目录下</p>
            <p v-else-if="!checkResult.catalogue.pass" class="error-msg">1.存在空目录</p>
            <p v-else class="info-msg">目录结构及题目数量：</p>
            <!-- 非子目录下有题目的错误信息
            <div v-if="checkResult.catalogue.nonLeafWithQuestions.length > 0" class="error-box">
              <p class="error-detail">请将以下非子目录下的题目移动到子目录中：</p>
              <div class="non-leaf-questions">
                <div v-for="(item, index) in checkResult.catalogue.nonLeafWithQuestions" :key="index" class="non-leaf-item">
                  <div class="non-leaf-path">{{ item.path }}</div>
                  <div class="non-leaf-count">题目数: {{ item.questionCount }}</div>
                </div>
              </div>
            </div> -->
            <div class="catalog-tree">
              <template v-for="item in checkResult.catalogue.treeData" :key="item.id">
                <CatalogCheckNode :node="item" />
              </template>
            </div>
          </div>
        </div>

        <!-- 内容页完整性（仅书籍） -->
        <div v-if="type === 'book'" class="check-item" :class="{ 'error': !checking && !checkResult.contentPage.pass }">
          <div class="item-header">
            <Icon v-if="checking" icon="ep:loading" class="loading-icon" />
            <Icon v-else :icon="checkResult.contentPage.pass ? 'ep:check' : 'ep:close'"
              :class="checkResult.contentPage.pass ? 'success' : 'error'" />
            <span class="item-title">内容页检测</span>
            <el-tag v-if="checking" type="info" size="small">处理中</el-tag>
            <el-tag v-else :type="checkResult.contentPage.pass ? 'success' : 'danger'" size="small">
              {{ checkResult.contentPage.pass ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div v-if="!checking && !checkResult.contentPage.pass" class="item-content">
            <p class="error-msg">内容页必须要有列表，请设置内容页类型</p>
          </div>
          <div v-else-if="!checking && checkResult.contentPage.pageList && checkResult.contentPage.pageList.length > 0"
            class="item-content">
            <p class="info-msg">内容页类型分布：</p>
            <div class="page-type-list">
              <el-tag v-for="(page, index) in checkResult.contentPage.pageList" :key="index" size="small"
                class="mr-1 mb-1">
                {{ getPageTypeName(page.type) }}: {{ page.count }}页
              </el-tag>
            </div>
          </div>
        </div>

        <!-- 题目完整性 -->
        <div class="check-item" :class="{ 'error': !checking && !checkResult.question.pass }">
          <div class="item-header">
            <Icon v-if="checking" icon="ep:loading" class="loading-icon" />
            <Icon v-else :icon="checkResult.question.pass ? 'ep:check' : 'ep:close'"
              :class="checkResult.question.pass ? 'success' : 'error'" />
            <span class="item-title">题目检测</span>
            <el-tag v-if="checking" type="info" size="small">处理中</el-tag>
            <el-tag v-else :type="checkResult.question.pass ? 'success' : 'danger'" size="small">
              {{ checkResult.question.pass ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div v-if="!checking && !checkResult.question.pass" class="item-content">
            <p class="error-msg">以下题目的题目内容未保存：</p>
            <div class="question-list">
              <div v-for="item in checkResult.question.questions" :key="item.id" class="question-item">
                <span v-if="type === 'book'" class="catalogue-name">{{ item.catalogueName }}</span>
                <span class="question-num">题号: {{ item.sortNum }}</span>
                <span v-if="item.reason" class="error-reason">原因: {{ item.reason }}</span>
                <el-button type="primary" size="small" link @click="handleGoToQuestion(item)" class="jump-btn">
                  跳转
                </el-button>
              </div>
            </div>
          </div>
          <div v-else-if="!checking" class="item-content">
            <p class="info-msg">所有题目校验通过</p>
          </div>
        </div>

        <!-- 反馈结果检测 -->
        <div class="check-item" :class="{ 'error': !checking && !checkResult.feedback.pass }">
          <div class="item-header">
            <Icon v-if="checking" icon="ep:loading" class="loading-icon" />
            <Icon v-else :icon="checkResult.feedback.pass ? 'ep:check' : 'ep:close'"
              :class="checkResult.feedback.pass ? 'success' : 'error'" />
            <span class="item-title">反馈结果检测</span>
            <el-tag v-if="checking" type="info" size="small">处理中</el-tag>
            <el-tag v-else :type="checkResult.feedback.pass ? 'success' : 'danger'" size="small">
              {{ checkResult.feedback.pass ? '通过' : '不通过' }}
            </el-tag>
          </div>
          <div v-if="!checking && !checkResult.feedback.pass" class="item-content">
            <p class="error-msg">还有 {{ checkResult.feedback.unhandledCount }} 条反馈未处理，请先处理所有反馈后再完成提交。</p>
            <el-button type="warning" size="small" @click="handleOpenFeedback">
              查看反馈
            </el-button>
          </div>
          <div v-else-if="!checking && checkResult.feedback.pass" class="item-content">
            <p class="info-msg">所有反馈已处理</p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-popover
          v-model:visible="problemReviewVisible"
          placement="top"
          width="600"
          trigger="click"
        >
          <template #reference>
            <el-button type="warning">
              问题提交
            </el-button>
          </template>
          <div class="problem-review-content">
            <div class="problem-type-grid">
              <div
                v-for="type in problemTypes"
                :key="type.value"
                class="problem-type-card"
                :class="{ 'active': selectedProblemType === type.value }"
                @click="handleSelectProblemType(type.value)"
              >
                <Icon :icon="type.icon" :width="24" :height="24" />
                <span class="type-name">{{ type.label }}</span>
              </div>
            </div>
            <div v-if="selectedProblemType === 'other'" class="problem-remark">
              <el-input
                v-model="problemRemark"
                type="textarea"
                :rows="3"
                placeholder="请输入详细情况"
                maxlength="500"
                show-word-limit
              />
            </div>
            <div class="problem-actions">
              <el-button size="small" @click="problemReviewVisible = false">取消</el-button>
              <el-button v-if="!confirmedProblemType" type="primary" size="small" @click="handleConfirmProblemType" :disabled="!selectedProblemType || (selectedProblemType === 'other' && !problemRemark.trim())">确认选择</el-button>
              <el-button v-else type="warning" size="small" @click="handleProblemSubmit">提交问题</el-button>
            </div>
            <div v-if="confirmedProblemType" class="problem-selected">
              <Icon icon="ep:check" class="success" />
              <span>已选择：{{ problemTypes.find(t => t.value === confirmedProblemType)?.label }}</span>
              <span v-if="confirmedProblemType === 'other' && problemRemark" class="remark-text">（{{ problemRemark }}）</span>
              <el-button type="danger" size="small" link @click="handleClearProblemType">重新选择</el-button>
            </div>
          </div>
        </el-popover>
        <el-button :disabled="!canPartialSubmit" @click="handlePartialSubmit">
          未完成提交
        </el-button>
        <el-button type="primary" :disabled="!allPassed" @click="handleFullSubmit">
          完成提交
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getBookInfoDetailsApi } from '@/api/gen/bookController'
import { getDocInfoDetailsApi } from '@/api/gen/docController'
import { getCatalogueCheckApi, type CatalogueCheckVO } from '@/api/gen/catalogueController'
import { getQuestionCheckApi, type QuestionCheckVO, getQuestionCatalogueIdApi } from '@/api/gen/questionController'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { putProjectSubmitIncompleteApi, putProjectSubmitCompleteApi, putProjectSubmitProblemApi } from '@/api/gen/projectController'
import { getAuditProjectListApi } from '@/api/gen/projectAuditController'
import CatalogCheckNode from './CatalogCheckNode.vue'

interface Props {
  visible: boolean
  projectId: string
  type: 'book' | 'doc'
}

const props = defineProps<Props>()

const emit = defineEmits(['update:visible', 'submitted', 'open-feedback', 'go-to-question'])

const dialogVisible = ref(false)
const loading = ref(false)
const checking = ref(false) // 检测中状态
const showCatalogTree = ref(false) // 是否显示目录树

// 问题审核相关状态
const problemReviewVisible = ref(false)
const selectedProblemType = ref<string>('')
const confirmedProblemType = ref<string>('')
const problemRemark = ref('')

// 问题类型选项
const problemTypes = [
  { value: 'no_answer', label: '无答案', icon: 'ep:remove-outline' },
  { value: 'missing_page', label: '缺页', icon: 'ep:document-delete' },
  { value: 'no_questions', label: '整本无题', icon: 'ep:folder-delete' },
  { value: 'listening', label: '听力相关', icon: 'ep:headset' },
  { value: 'other', label: '其他（需备注详细情况）', icon: 'ep:warning-outline' }
]

interface CatalogueTreeNode extends CatalogueCheckVO {
  children: CatalogueTreeNode[]
  totalCount: number
  hasZeroChild: boolean
  hasQuestionOnNonLeaf: boolean // 非叶子节点下是否有题目
  questionCountOnNonLeaf: number // 非叶子节点下的题目数量
}

interface CheckResult {
  bookInfo: {
    pass: boolean
    messages: string[]
  }
  catalogue: {
    pass: boolean
    treeData: CatalogueTreeNode[]
    nonLeafWithQuestions: Array<{ id: string; name: string; questionCount: number; path: string }> // 非叶子节点下有题目的列表
  }
  contentPage: {
    pass: boolean
    pageList?: Array<{ type: number; count: number }>
  }
  question: {
    pass: boolean
    questions: (QuestionCheckVO & { catalogueName?: string; catalogueOrder?: number })[]
  }
  feedback: {
    pass: boolean
    unhandledCount: number
  }
}

const checkResult = ref<CheckResult>({
  bookInfo: { pass: true, messages: [] },
  catalogue: { pass: true, treeData: [], nonLeafWithQuestions: [] },
  contentPage: { pass: true, pageList: [] },
  question: { pass: true, questions: [] },
  feedback: { pass: true, unhandledCount: 0 }
})

// 是否所有检测项都通过（用于完成提交）
const allPassed = computed(() => {
  return checkResult.value.bookInfo.pass &&
    checkResult.value.catalogue.pass &&
    checkResult.value.contentPage.pass &&
    checkResult.value.question.pass &&
    checkResult.value.feedback.pass
})

// 是否可以通过未完成提交（目录检测和反馈检测可以不通过）
const canPartialSubmit = computed(() => {
  return checkResult.value.bookInfo.pass &&
    checkResult.value.contentPage.pass &&
    checkResult.value.question.pass
})

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    runCheck()
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
  // 对话框关闭时，重置检测结果状态
  if (!val) {
    resetCheckResult()
  }
})

// 重置检测结果
const resetCheckResult = () => {
  checkResult.value = {
    bookInfo: { pass: true, messages: [] },
    catalogue: { pass: true, treeData: [], nonLeafWithQuestions: [] },
    contentPage: { pass: true, pageList: [] },
    question: { pass: true, questions: [] },
    feedback: { pass: true, unhandledCount: 0 }
  }
  // 重置问题审核状态
  problemReviewVisible.value = false
  selectedProblemType.value = ''
  confirmedProblemType.value = ''
  problemRemark.value = ''
}

// 获取页面类型名称
const getPageTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    0: '默认',
    1: '封面',
    2: 'CIP',
    3: '目录',
    4: '封底',
    5: '题目',
    6: '答案',
    7: '其他'
  }
  return typeMap[type] || `类型${type}`
}

// 检测书籍/试卷信息完整性
const checkBookInfo = async () => {
  const messages: string[] = []

  try {
    if (props.type === 'book') {
      const response = await getBookInfoDetailsApi({ id: props.projectId })
      if (response.data.code === 200 && response.data.data) {
        const data = response.data.data
        if (!data.title) messages.push('书籍名称')
        if (!data.isbn) messages.push('ISBN')
        if (!data.seriesTitle) messages.push('丛书名')
        if (!data.year) messages.push('出版年份')
        if (!data.gradeId) messages.push('年级')
        if (!data.subjectId) messages.push('学科')
        if (!data.volumeId) messages.push('册别')
        if (!data.bookVersionId) messages.push('版本')
        if (!data.publisherId) messages.push('出版社')
      }
    } else {
      const response = await getDocInfoDetailsApi({ id: props.projectId })
      if (response.data.code === 200 && response.data.data) {
        const data = response.data.data
        if (!data.title) messages.push('试卷名称')
        if (!data.stepId) messages.push('学段')
        if (!data.gradeId) messages.push('年级')
        if (!data.subjectId) messages.push('学科')
        if (!data.provinceId) messages.push('省份')
        if (!data.cityId) messages.push('市/区')
        if (!data.year) messages.push('年份')
        if (!data.term) messages.push('学期')
        if (!data.paperType) messages.push('试卷类型')
      }
    }
  } catch (error) {
    console.error('检测书籍/试卷信息失败', error)
    messages.push('获取信息失败')
  }

  checkResult.value.bookInfo = {
    pass: messages.length === 0,
    messages
  }
}

// 检测目录完整性
const checkCatalogue = async () => {
  if (props.type !== 'book') {
    checkResult.value.catalogue = { pass: true, treeData: [], nonLeafWithQuestions: [] }
    return
  }

  try {
    const response = await getCatalogueCheckApi({ bookId: props.projectId })
    if (response.data.code === 200 && response.data.data) {
      const data: CatalogueCheckVO[] = response.data.data

      // 构建树形结构
      const treeData = buildCatalogueTree(data)

      // 检查是否有题目数量为0的目录
      const hasEmptyCatalogue = hasZeroQuestionCount(treeData)

      // 收集非叶子节点下有题目的目录
      const nonLeafWithQuestions = collectNonLeafWithQuestions(treeData, data)

      // 目录检测通过条件：没有空目录 且 没有非子目录下有题目
      checkResult.value.catalogue = {
        pass: !hasEmptyCatalogue && nonLeafWithQuestions.length === 0,
        treeData,
        nonLeafWithQuestions
      }
    }
  } catch (error) {
    console.error('检测目录完整性失败', error)
    checkResult.value.catalogue = { pass: false, treeData: [], nonLeafWithQuestions: [] }
  }
}

// 构建目录树形结构
const buildCatalogueTree = (data: CatalogueCheckVO[]): CatalogueTreeNode[] => {
  const tree: CatalogueTreeNode[] = []
  const map = new Map<string, CatalogueTreeNode>()

  data.forEach(item => {
    map.set(item.id, {
      ...item,
      children: [],
      totalCount: item.questionCount || 0,
      hasZeroChild: false,
      hasQuestionOnNonLeaf: false,
      questionCountOnNonLeaf: 0
    })
  })

  data.forEach(item => {
    const node = map.get(item.id)
    if (!node) return

    if (!item.parentId || item.parentId === '0') {
      tree.push(node)
    } else {
      const parent = map.get(item.parentId)
      if (parent) {
        parent.children.push(node)
      }
    }
  })

  // 计算每个节点的总数和是否有子节点为0
  const calculateTotal = (node: CatalogueTreeNode): number => {
    if (node.children.length === 0) {
      node.totalCount = node.questionCount || 0
      node.hasZeroChild = node.totalCount === 0
      return node.totalCount
    }

    let total = 0
    let hasZero = false

    // 遍历所有子节点，累加题目数量
    for (const child of node.children) {
      const childTotal = calculateTotal(child)
      total += childTotal
      if (child.hasZeroChild || childTotal === 0) {
        hasZero = true
      }
    }

    // 加上节点自身的题目数量
    total += node.questionCount || 0

    node.totalCount = total
    node.hasZeroChild = hasZero

    // 检查非叶子节点下是否有题目
    if (node.children.length > 0 && node.questionCount && node.questionCount > 0) {
      node.hasQuestionOnNonLeaf = true
      node.questionCountOnNonLeaf = node.questionCount
    }

    return total
  }

  tree.forEach(node => calculateTotal(node))

  return tree
}

// 检查是否有题目数量为0的目录
const hasZeroQuestionCount = (tree: CatalogueTreeNode[]): boolean => {
  for (const node of tree) {
    if (node.hasZeroChild) {
      return true
    }
    if (node.children && node.children.length > 0) {
      if (hasZeroQuestionCount(node.children)) {
        return true
      }
    }
  }
  return false
}

// 收集非叶子节点下有题目的目录
const collectNonLeafWithQuestions = (
  tree: CatalogueTreeNode[],
  originalData: CatalogueCheckVO[]
): Array<{ id: string; name: string; questionCount: number; path: string }> => {
  const result: Array<{ id: string; name: string; questionCount: number; path: string }> = []

  // 构建目录映射表和父目录关系
  const catalogueMap = new Map<string, string>()
  const parentMap = new Map<string, string>()
  originalData.forEach(item => {
    if (item.catalogueName && item.id) {
      catalogueMap.set(item.id, item.catalogueName)
      if (item.parentId) {
        parentMap.set(item.id, item.parentId)
      }
    }
  })

  // 获取目录的完整路径
  const getCataloguePath = (catalogueId: string): string => {
    const path: string[] = []
    let currentId = catalogueId

    while (currentId && currentId !== '0') {
      const name = catalogueMap.get(currentId)
      if (name) {
        path.unshift(name)
      }
      currentId = parentMap.get(currentId) || ''
    }

    return path.join(' > ')
  }

  // 递归收集非叶子节点下有题目的目录
  const collect = (nodes: CatalogueTreeNode[]) => {
    for (const node of nodes) {
      // 如果是非叶子节点且有题目
      if (node.hasQuestionOnNonLeaf) {
        result.push({
          id: node.id,
          name: node.catalogueName || node.id,
          questionCount: node.questionCountOnNonLeaf,
          path: getCataloguePath(node.id)
        })
      }

      // 递归处理子节点
      if (node.children && node.children.length > 0) {
        collect(node.children)
      }
    }
  }

  collect(tree)
  return result
}

// 检测内容页完整性
const checkContentPage = async () => {
  if (props.type !== 'book') {
    checkResult.value.contentPage = { pass: true, pageList: [] }
    return
  }

  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code === 200 && response.data.data) {
      const pages: PdfPageVO[] = response.data.data

      if (pages.length === 0) {
        checkResult.value.contentPage = { pass: false, pageList: [] }
        return
      }

      // 统计各类型的页面数量
      const typeCount = new Map<number, number>()
      pages.forEach(page => {
        const type = page.type || 0
        typeCount.set(type, (typeCount.get(type) || 0) + 1)
      })

      const pageList = Array.from(typeCount.entries()).map(([type, count]) => ({ type, count }))

      // 检查是否所有页面都是默认类型
      const allDefault = pages.every(page => page.type === 0 || page.type === undefined)
      const pass = !allDefault

      checkResult.value.contentPage = {
        pass,
        pageList
      }
    }
  } catch (error) {
    console.error('检测内容页完整性失败', error)
    checkResult.value.contentPage = { pass: false, pageList: [] }
  }
}

// 获取目录映射表和父目录关系
const getCatalogueMap = async (): Promise<{ map: Map<string, string>, parentMap: Map<string, string> }> => {
  const map = new Map<string, string>()
  const parentMap = new Map<string, string>()
  try {
    const response = await getCatalogueCheckApi({ bookId: props.projectId })
    if (response.data.code === 200 && response.data.data) {
      const data: CatalogueCheckVO[] = response.data.data
      data.forEach(item => {
        if (item.catalogueName && item.id) {
          map.set(item.id, item.catalogueName)
          if (item.parentId) {
            parentMap.set(item.id, item.parentId)
          }
        }
      })
    }
  } catch (error) {
    console.error('获取目录映射失败', error)
  }
  return { map, parentMap }
}

// 获取目录的完整路径
const getCataloguePath = (catalogueId: string, catalogueMap: Map<string, string>, parentMap: Map<string, string>): string => {
  const path: string[] = []
  let currentId = catalogueId

  while (currentId && currentId !== '0') {
    const name = catalogueMap.get(currentId)
    if (name) {
      path.unshift(name)
    }
    currentId = parentMap.get(currentId) || ''
  }

  return path.join(' > ')
}

// 检测题目完整性
const checkQuestion = async () => {
  try {
    const response = await getQuestionCheckApi({ projectId: props.projectId })
    if (response.data.code === 200 && response.data.data) {
      const questions: QuestionCheckVO[] = response.data.data

      // 如果有未通过校验的题目，需要获取目录名称
      if (questions.length > 0 && props.type === 'book') {
        const { map: catalogueMap, parentMap } = await getCatalogueMap()

        // 构建目录树，获取每个目录的排序信息
        const catalogueTree = buildCatalogueTree(Array.from(catalogueMap.keys()).map(id => ({
          id,
          catalogueName: catalogueMap.get(id) || '',
          parentId: parentMap.get(id) || '0',
          questionCount: 0
        })))

        // 获取目录的排序序号（基于树的遍历顺序）
        const catalogueOrderMap = new Map<string, number>()
        let order = 0
        const traverseCatalogue = (nodes: CatalogueTreeNode[]) => {
          nodes.forEach(node => {
            catalogueOrderMap.set(node.id, order++)
            traverseCatalogue(node.children)
          })
        }
        traverseCatalogue(catalogueTree)

        const questionsWithCatalogue = questions.map(q => ({
          ...q,
          catalogueName: q.catalogueId ? getCataloguePath(q.catalogueId, catalogueMap, parentMap) : '',
          catalogueOrder: q.catalogueId ? (catalogueOrderMap.get(q.catalogueId) || 9999) : 9999
        }))

        // 按目录序号排序，同一目录的题目按 sortNum 排序
        questionsWithCatalogue.sort((a, b) => {
          if (a.catalogueOrder !== b.catalogueOrder) {
            return a.catalogueOrder - b.catalogueOrder
          }
          return (a.sortNum || 0) - (b.sortNum || 0)
        })

        checkResult.value.question = {
          pass: false,
          questions: questionsWithCatalogue
        }
      } else {
        checkResult.value.question = {
          pass: questions.length === 0,
          questions
        }
      }
    }
  } catch (error) {
    console.error('检测题目完整性失败', error)
    checkResult.value.question = { pass: false, questions: [] }
  }
}

// 检测反馈结果
const checkFeedback = async () => {
  try {
    const response = await getAuditProjectListApi({ projectId: props.projectId })
    const result = response.data
    if (result && result.data && Array.isArray(result.data)) {
      // 计算未处理的反馈数量
      const unhandledCount = result.data.filter(item => !item.passed).length
      checkResult.value.feedback = {
        pass: unhandledCount === 0,
        unhandledCount
      }
    } else {
      // 没有反馈数据，视为通过
      checkResult.value.feedback = {
        pass: true,
        unhandledCount: 0
      }
    }
  } catch (error) {
    console.error('检测反馈结果失败', error)
    // 出错时视为通过，避免阻塞提交
    checkResult.value.feedback = {
      pass: true,
      unhandledCount: 0
    }
  }
}

// 运行所有检测
const runCheck = async () => {
  checking.value = true
  loading.value = true
  try {
    await Promise.all([
      checkBookInfo(),
      checkCatalogue(),
      checkContentPage(),
      checkQuestion(),
      checkFeedback()
    ])
  } finally {
    checking.value = false
    loading.value = false
  }
}

// 切换目录树显示
const toggleCatalogTree = () => {
  if (!checking.value) {
    showCatalogTree.value = !showCatalogTree.value
  }
}

// 打开反馈对话框
const handleOpenFeedback = () => {
  // 通知父组件打开反馈对话框
  emit('open-feedback')
}

// 完成提交
const handleFullSubmit = async () => {
  try {
    const response = await putProjectSubmitCompleteApi({
      projectId: props.projectId
    })

    if (response.data.code === 200) {
      ElMessage.success('完成提交成功')
      emit('submitted')
      handleClose()
    } else {
      ElMessage.error(response.data.msg || '提交失败')
    }
  } catch (error) {
    ElMessage.error('提交失败')
    console.error(error)
  }
}

// 未完成提交
const handlePartialSubmit = async () => {
  try {
    const response = await putProjectSubmitIncompleteApi({
      projectId: props.projectId
    })

    if (response.data.code === 200) {
      ElMessage.success('未完成提交成功')
      emit('submitted')
      handleClose()
    } else {
      ElMessage.error(response.data.msg || '提交失败')
    }
  } catch (error) {
    ElMessage.error('提交失败')
    console.error(error)
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

// 跳转到题目
const handleGoToQuestion = async (item: QuestionCheckVO & { catalogueName?: string }) => {
  try {
    const response = await getQuestionCatalogueIdApi({ questionId: item.id })
    const result = response.data
    if (result && result.code === 200 && result.data) {
      // 关闭对话框
      dialogVisible.value = false
      // 通知父组件跳转到题目，传递 questionId, catalogueId 和 page
      emit('go-to-question', item.id, result.data.catalogueId, result.data.page)
    } else {
      ElMessage.error(result?.msg || '获取题目信息失败')
    }
  } catch (error) {
    console.error('跳转到题目失败', error)
    ElMessage.error('跳转到题目失败')
  }
}

// 选择问题类型
const handleSelectProblemType = (type: string) => {
  selectedProblemType.value = type
}

// 确认问题类型
const handleConfirmProblemType = () => {
  if (selectedProblemType.value === 'other' && !problemRemark.value.trim()) {
    ElMessage.warning('请输入详细情况')
    return
  }
  confirmedProblemType.value = selectedProblemType.value
}

// 清除问题类型选择
const handleClearProblemType = () => {
  selectedProblemType.value = ''
  confirmedProblemType.value = ''
  problemRemark.value = ''
  problemReviewVisible.value = true
}

// 问题提交
const handleProblemSubmit = async () => {
  if (!confirmedProblemType.value) {
    ElMessage.warning('请选择问题类型')
    return
  }

  try {
    const response = await putProjectSubmitProblemApi({
      problemType: confirmedProblemType.value,
      problemRemark: confirmedProblemType.value === 'other' ? problemRemark.value : undefined
    }, {
      projectId: props.projectId
    })

    if (response.data.code === 200) {
      ElMessage.success('问题提交成功')
      emit('submitted')
      handleClose()
    } else {
      ElMessage.error(response.data.msg || '提交失败')
    }
  } catch (error) {
    ElMessage.error('提交失败')
    console.error(error)
  }
}
</script>

<style scoped>
.check-dialog-container {
  max-height: 600px;
  overflow-y: auto;
}

.check-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.check-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.check-item.error {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  user-select: none;
}

.toggle-icon {
  font-size: 14px;
  color: #909399;
  transition: transform 0.3s;
}

.item-header:hover .toggle-icon {
  color: #409eff;
}

.item-title {
  flex: 1;
  font-weight: 500;
  font-size: 16px;
}

.success {
  color: #67c23a;
  font-size: 20px;
}

.error {
  color: #f56c6c;
  font-size: 20px;
}

.loading-icon {
  color: #409eff;
  font-size: 20px;
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.item-content {
  margin-top: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.error-summary {
  margin-bottom: 12px;
}

.error-summary .error-msg {
  margin: 4px 0;
}

.error-msg {
  color: #f56c6c;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.info-msg {
  color: #67c23a;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.error-box {
  margin-bottom: 12px;
  padding: 10px;
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 6px;
}

.error-detail {
  color: #f56c6c;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.non-leaf-questions {
  max-height: 150px;
  overflow-y: auto;
}

.non-leaf-item {
  padding: 8px;
  margin: 4px 0;
  background-color: #fff;
  border-radius: 4px;
  border-left: 3px solid #f56c6c;
}

.non-leaf-path {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.non-leaf-count {
  color: #909399;
  font-size: 13px;
}

.error-list {
  margin: 0;
  padding-left: 20px;
}

.error-list li {
  color: #f56c6c;
  margin: 4px 0;
}

.catalog-tree {
  max-height: 300px;
  overflow-y: auto;
}

.question-list {
  max-height: 200px;
  overflow-y: auto;
}

.question-item {
  padding: 8px 12px;
  margin: 4px 0;
  background-color: #fff;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.catalogue-name {
  color: #606266;
  font-weight: 500;
  flex-shrink: 0;
}

.question-num {
  color: #909399;
  flex-shrink: 0;
}

.error-reason {
  color: #f56c6c;
  font-size: 13px;
  flex: 1;
  min-width: 0;
  word-break: break-word;
}

.jump-btn {
  margin-left: auto;
  flex-shrink: 0;
}

.page-type-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mr-1 {
  margin-right: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.mb-1 {
  margin-bottom: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 问题审核弹出面板 */
.problem-review-content {
  padding: 8px;
}

.problem-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.problem-type-card {
  padding: 12px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
}

.problem-type-card:hover {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.problem-type-card.active {
  border-color: #e6a23c;
  background-color: #fdf6ec;
  color: #e6a23c;
}

.problem-type-card .type-name {
  font-size: 14px;
  font-weight: 500;
}

.problem-remark {
  margin-bottom: 12px;
}

.problem-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}

.problem-selected {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #fdf6ec;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;
}

.problem-selected .success {
  color: #e6a23c;
}

.remark-text {
  color: #606266;
  font-size: 13px;
}
</style>
