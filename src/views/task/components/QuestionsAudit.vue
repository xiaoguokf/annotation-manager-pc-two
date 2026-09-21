<template>
  <el-card class="paper-card">
    <template v-slot:header>
      <div class="clearfix" style="display: flex; justify-content: space-between; align-items: center;">
        <span class="section-title">题目审核 (共计: {{ totalQuestions }}题)</span>
        <el-button size="small" @click="scrollToTop">返回顶部</el-button>
      </div>
    </template>

    <div class="questions-container">
      <div>
        <div class="panel-header">
          可视化数据
          <div class="filter-section">
            <span class="filter-label">筛选:</span>
            <el-select v-model="selectedTishiType" placeholder="全部题型" clearable size="small" style="width: 150px;"
              @change="handleTishiFilterChange">
              <el-option v-for="(label, key) in tishiMap" :key="key" :label="label" :value="key">
                <span class="tishi-option">
                  <span>{{ label }}</span>
                  <span class="tishi-count">({{ getTishiCount(key) }})</span>
                </span>
              </el-option>
            </el-select>
            <el-cascader v-if="type === 'book'" v-model="selectedCatalogueId" :options="catalogueWithQuestionsTree"
              placeholder="全部目录" clearable size="small" style="width: 250px;"
              :props="{ label: 'label', children: 'children', value: 'id', emitPath: false }"
              @change="(value: any) => handleCatalogueFilterChange(value)">
              <template #default="{ data }">
                <span class="tree-node">
                  <span>{{ data.label }}</span>
                  <span v-if="data.questionCount !== undefined" class="question-count">({{ data.questionCount }})</span>
                </span>
              </template>
            </el-cascader>
          </div>
        </div>
        <div v-if="questions.length > 0" class="questions-list visual-panel">
          <div v-for="(question, index) in questions" :key="question.id" class="item-card"
            :ref="el => { if (el) questionRefs[index] = el as HTMLElement }">
            <div class="item-meta">
              <div class="meta-left">
                <span class="question-index">第{{ index + 1 }}题</span>
                <el-tag v-if="question.tishi" size="small" type="info">题型: {{ getTishiName(question.tishi) }}</el-tag>
                <el-tag v-if="question.tilei" size="small" type="warning">题类: {{ getTileiName(question.tilei)
                }}</el-tag>
                <el-tag v-if="question.difficulty !== undefined" size="small" type="success">难度: {{
                  getDifficultyName(question.difficulty) }} ({{ question.difficulty }})</el-tag>
              </div>
              <div v-if="projectInfo" class="meta-right">
                <span v-if="projectInfo.subjectId" class="meta-info-item">
                  <span class="info-label">学科:</span>
                  <span class="info-value">{{ getSubjectName(projectInfo.subjectId) }}</span>
                </span>
                <span v-if="type === 'doc' && (projectInfo as DocVO).stepId" class="meta-info-item">
                  <span class="info-label">学段:</span>
                  <span class="info-value">{{ (projectInfo as DocVO).stepId }}</span>
                </span>
                <span v-if="(projectInfo as DocVO).gradeId" class="meta-info-item">
                  <span class="info-label">年级:</span>
                  <span class="info-value">{{ getGradeName((projectInfo as DocVO).gradeId) }}</span>
                </span>
                <span v-if="type === 'book' && (projectInfo as BookVO).title" class="meta-info-item">
                  <span class="info-label">书本:</span>
                  <span class="info-value">{{ (projectInfo as BookVO).title }}</span>
                </span>
              </div>
            </div>

            <el-splitter class="content-split-container">
              <!-- 左侧：审核部分（原始文本） -->
              <el-splitter-panel :min="20" :default-size="50">
                <div class="audit-panel">
                  <div class="audit-header">
                    <div class="audit-title">审核区域</div>
                    <div class="header-buttons">
                      <el-button v-if="!isReadonly" size="small"
                        :type="questionEditModes[question.id] ? 'primary' : 'default'"
                        @click="toggleEditMode(question.id)">
                        <Icon :icon="questionEditModes[question.id] ? 'ep:document-checked' : 'ep:edit'"
                          style="margin-right: 4px;" />
                        {{ questionEditModes[question.id] ? '保存' : '编辑' }}
                      </el-button>
                      <el-button v-if="!isReadonly && questionEditModes[question.id]" size="small"
                        @click="cancelEdit(question.id)">
                        取消
                      </el-button>
                      <el-button size="small" :type="questionAnnotationModes[question.id] ? 'primary' : 'default'"
                        @click="toggleAnnotationMode(question.id)">
                        <Icon :icon="questionAnnotationModes[question.id] ? 'ep:view' : 'ep:picture'"
                          style="margin-right: 4px;" />
                        {{ questionAnnotationModes[question.id] ? '原文模式' : '标注模式' }}
                      </el-button>
                    </div>
                  </div>

                  <!-- 原文模式 -->
                  <div v-if="!questionAnnotationModes[question.id]" class="audit-content">
                    <!-- 编辑模式 -->
                    <div v-if="questionEditModes[question.id]" class="edit-content">
                      <div class="audit-section">
                        <div class="audit-label">题目：</div>
                        <el-input v-model="questionEditData[question.id]!.question" type="textarea" :rows="4"
                          :autosize="{ minRows: 3, maxRows: 8 }" class="audit-input edit-input" placeholder="请输入题目内容" />
                      </div>
                      <div v-if="question.choice && isChoiceType(question.tishi)" class="audit-section">
                        <div class="audit-label">
                          选项：
                          <el-button type="primary" size="small" @click="addChoiceOption(question.id)"
                            style="margin-left: 10px;">
                            <Icon icon="ep:plus" />
                            新增选项
                          </el-button>
                        </div>
                        <div v-for="(choice, index) in questionEditData[question.id]!.choice || []" :key="index"
                          class="choice-edit-item">
                          <div class="choice-wrapper">
                            <el-input v-model="questionEditData[question.id]!.choice![index]" type="textarea" :rows="2"
                              :autosize="{ minRows: 2, maxRows: 6 }" class="audit-choice-input edit-input"
                              placeholder="请输入选项内容" />
                            <el-button type="danger" size="small" circle @click="removeChoiceOption(question.id, index)"
                              :disabled="questionEditData[question.id]!.choice!.length <= 2" class="choice-delete-btn">
                              <Icon icon="ep:close" />
                            </el-button>
                          </div>
                        </div>
                      </div>
                      <div v-if="question.answer" class="audit-section">
                        <div class="audit-label">答案：</div>
                        <el-input v-model="questionEditData[question.id]!.answer" type="textarea" :rows="3"
                          :autosize="{ minRows: 2, maxRows: 6 }" class="audit-input edit-input" placeholder="请输入答案" />
                      </div>
                      <div v-if="question.analysis" class="audit-section">
                        <div class="audit-label">解析：</div>
                        <el-input v-model="questionEditData[question.id]!.analysis" type="textarea" :rows="3"
                          :autosize="{ minRows: 2, maxRows: 6 }" class="audit-input edit-input" placeholder="请输入解析" />
                      </div>
                    </div>
                    <!-- 非编辑模式 -->
                    <div v-else class="readonly-content">
                      <div class="audit-section">
                        <div class="audit-label">题目：</div>
                        <el-input :model-value="processImageUrls(question.question)" type="textarea" :rows="4"
                          :autosize="{ minRows: 3, maxRows: 8 }" readonly class="audit-input" />
                      </div>
                      <div v-if="question.choice && isChoiceType(question.tishi)" class="audit-section">
                        <div class="audit-label">选项：</div>
                        <el-input v-for="(choice, index) in parseChoiceOptions(question.choice)" :key="index"
                          :model-value="processImageUrls(choice)" type="textarea" :rows="2"
                          :autosize="{ minRows: 2, maxRows: 6 }" readonly class="audit-choice-input" />
                      </div>
                      <div v-if="question.answer" class="audit-section">
                        <div class="audit-label">答案：</div>
                        <el-input :model-value="processImageUrls(question.answer)" type="textarea" :rows="3"
                          :autosize="{ minRows: 2, maxRows: 6 }" readonly class="audit-input" />
                      </div>
                      <div v-if="question.analysis" class="audit-section">
                        <div class="audit-label">解析：</div>
                        <el-input :model-value="processImageUrls(question.analysis)" type="textarea" :rows="3"
                          :autosize="{ minRows: 2, maxRows: 6 }" readonly class="audit-input" />
                      </div>
                    </div>
                  </div>

                  <!-- 标注模式 -->
                  <AnnotationViewer v-else :annotations="questionAnnotations[question.id] || []"
                    :full-annotations="questionFullAnnotations[question.id] || []" :page-list="pageList" />
                </div>
              </el-splitter-panel>

              <!-- 右侧：预览部分（渲染后的内容） -->
              <el-splitter-panel :min="20" :default-size="50">
                <div class="preview-panel">
                  <div class="preview-content">
                    <div class="item-body">
                      <div v-html="processInlineContent(getQuestionDisplayData(question).question)"></div>
                    </div>
                    <div v-if="getQuestionDisplayData(question).choice && isChoiceType(question.tishi)"
                      class="item-choices">
                      <div class="choices-list">
                        <div
                          v-for="(choice, choiceIndex) in parseChoiceOptions(getQuestionDisplayData(question).choice)"
                          :key="choiceIndex" class="choice-item">
                          <div v-html="processInlineContent(choice)"></div>
                        </div>
                      </div>
                    </div>
                    <div class="analysis-box">
                      <div class="analysis-row" v-if="getQuestionDisplayData(question).answer">
                        <span class="label-tag tag-ans">参考答案</span>
                        <div>
                          <span v-html="processInlineContent(getQuestionDisplayData(question).answer)"></span>
                        </div>
                      </div>
                      <div class="analysis-row" v-if="getQuestionDisplayData(question).analysis">
                        <span class="label-tag tag-ana">试题解析</span>
                        <div>
                          <span v-html="processInlineContent(getQuestionDisplayData(question).analysis)"></span>
                        </div>
                      </div>
                      <div class="analysis-row" v-if="question.questionComment">
                        <span class="label-tag tag-tip">点评</span>
                        <span>{{ question.questionComment }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-splitter-panel>
            </el-splitter>
            <div class="item-footer">
              <div class="footer-left">
                <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 8px;">
                  <span v-if="question.page"><strong>页码:</strong> {{ question.page }}</span>
                  <span v-if="question.knowledge">
                    <strong>知识点:</strong>
                    <el-tag v-for="(tag, index) in parseKnowledgeTags(question.knowledge)" :key="index" type="primary"
                      size="small" style="margin-left: 5px;">
                      {{ tag }}
                    </el-tag>
                  </span>
                  <span v-if="question.catalogueId && getCataloguePath(question.catalogueId)">
                    <strong>章节:</strong>
                    <span style="margin-left: 5px; color: #409EFF;">{{ getCataloguePath(question.catalogueId) }}</span>
                  </span>
                </div>
              </div>
              <div class="footer-right">
                <div class="item-users">
                  <span class="user-info">
                    <Icon icon="ep:user" :width="14" :height="14" />
                    创建人: {{ getUserName(question.createNickname, question.createUsername) }}
                  </span>
                  <span v-if="question.updateNickname || question.updateUsername" class="user-info">
                    <Icon icon="ep:edit" :width="14" :height="14" />
                    更新人: {{ getUserName(question.updateNickname, question.updateUsername) }}
                  </span>
                </div>

              </div>
            </div>

            <!-- 每个题目独立的审核反馈和记录区域 -->
            <div class="question-audit-section">
              <el-divider v-if="!isReadonly" content-position="left">
                添加审核反馈 ({{ getQuestionAuditCount(question.id) }}条记录)
              </el-divider>
              <el-input v-if="!isReadonly" v-model="questionFeedbacks[question.id]" type="textarea" :rows="3"
                placeholder="请输入针对该题目的审核反馈内容" style="margin-bottom: 10px;" />
              <div v-if="!isReadonly" style="text-align: right;">
                <el-button size="small" type="primary" @click="handleSubmitFeedback(question.id)">
                  提交反馈
                </el-button>
              </div>

              <!-- 该题目的审核记录 -->
              <template v-if="getQuestionAuditRecords(question.id).length > 0">
                <el-divider content-position="left">
                  审核记录 ({{ getQuestionAuditRecords(question.id).length }})
                </el-divider>
                <div class="records-list">
                  <div v-for="record in getQuestionAuditRecords(question.id)" :key="record.id" class="record-item">
                    <div class="record-content">{{ record.content }}</div>
                    <!-- 处理内容 -->
                    <div v-if="record.handContent" class="record-hand-content">
                      <div class="hand-content-label">处理内容：</div>
                      <div class="hand-content-text">{{ record.handContent }}</div>
                    </div>
                    <div class="record-meta">
                      <div class="meta-left">
                        <el-tag :type="record.passed ? 'success' : 'warning'" size="small">
                          <span class="tag-content">
                            <Icon :icon="record.passed ? 'ep:check' : 'ep:clock'" :width="12" :height="12" />
                            {{ record.passed ? '已处理' : '未处理' }}
                          </span>
                        </el-tag>
                        <span class="record-time">{{ formatTime(record.createTime) }}</span>
                      </div>
                      <div v-if="record.nickname || record.username" class="meta-right">
                        <span class="handler-info">
                          <Icon icon="ep:user" :width="12" :height="12" />
                          处理人: {{ getHandlerName(record.nickname, record.username) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
        <div v-else-if="allQuestions.length === 0 && questions.length === 0" class="no-data">
          暂无题目数据
        </div>
        <div v-else-if="sortedQuestions.length === 0 && questions.length === 0" class="no-data">
          该目录下暂无题目
        </div>
      </div>
    </div>

    <!-- 标注页预览 -->
    <el-dialog v-model="pagePreviewVisible" title="题目标注页预览" width="800px" append-to-body>
      <div v-if="previewPages.length > 0" class="preview-pages">
        <el-image v-for="(page, index) in previewPages" :key="page.id" :src="getPageImageUrl(page)"
          :preview-src-list="getPreviewImageUrls(index)" :initial-index="index" fit="contain" class="preview-image" lazy
          :append-to-body="true" :z-index="9999" :preview-teleported="true">
          <template v-slot:error>
            <div class="image-slot">加载失败</div>
          </template>
        </el-image>
      </div>
      <div v-else class="no-data">
        暂无标注页预览
      </div>
    </el-dialog>

    <!-- 加载进度悬浮提示 -->
    <div v-if="showLoadingProgress" :class="['loading-progress', { 'minimized': isProgressMinimized }]">
      <!-- 最小化模式 -->
      <div v-if="isProgressMinimized" class="progress-minimized" @click="toggleProgressMinimize">
        <Icon icon="ep:loading" class="minimized-icon" />
        <span class="minimized-text">{{ Math.round((loadingProgress.loaded / loadingProgress.total) * 100) }}%</span>
      </div>
      <!-- 展开模式 -->
      <div v-else class="progress-expanded">
        <div class="progress-header">
          <span class="progress-label">题目加载中...</span>
          <Icon icon="ep:minus" class="minimize-btn" @click="toggleProgressMinimize" />
        </div>
        <span class="progress-hint">提示：加载过程中图片显示可能较慢</span>
        <div class="progress-info">
          <span class="progress-text">{{ loadingProgress.loaded }}/{{ loadingProgress.total }}</span>
          <span class="progress-percent">{{ Math.round((loadingProgress.loaded / loadingProgress.total) * 100)
            }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill"
            :style="{ width: (loadingProgress.loaded / loadingProgress.total) * 100 + '%' }">
          </div>
        </div>
      </div>
    </div>

  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getQuestionDetailsListApi, putQuestionUpdateApi, type QuestionDetailsListVO, type QuestionUpdateCmd } from '@/api/gen/questionController'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { type BookVO } from '@/api/gen/bookController'
import { type DocVO } from '@/api/gen/docController'
import { useConfigStore } from '@/stores/config'
import type { ProjectAuditVO } from '@/api/gen/projectAuditController'
import type { DicGradeVO, DicSubjectVO } from '@/api/gen/dicController'
import type { CatalogueVO } from '@/api/gen/catalogueController'
import { getAnnotationListApi, type AnnotationSimpleVO } from '@/api/gen/annotationController'
import { getAnnotationListByQuestionApi, type AnnotationVO as AnnotationFullVO } from '@/api/gen/annotationController'
import { renderContent as renderContentUtil, sanitizeHtml } from '@/utils/contentRenderer'
import AnnotationViewer from './AnnotationViewer.vue'
import 'katex/dist/katex.min.css'

// 目录树节点接口
interface CatalogueTreeNode {
  id: string
  label: string
  questionCount: number
  children?: CatalogueTreeNode[]
  [key: string]: any
}

// 题型映射
const tishiMap: Record<string, string> = {
  xuanze: '选择题',
  duoxuan: '多选题',
  panduan: '判断题',
  tiankong: '填空题',
  zuhe: '组合题',
  wenda: '问答题',
  gaicuo: '改错题'
}

// 判断是否为选择题类型
const isChoiceType = (tishi?: string) => {
  return tishi === 'xuanze' || tishi === 'duoxuan'
}

// 题类映射
const tileiMap: Record<string, string> = {
  changkaoti: '常考题',
  yicuoti: '易错题',
  haoti: '好题',
  yazhouti: '压轴题',
  gaicuo: '改错题'
}

// 获取题型显示名称
const getTishiName = (tishi?: string) => {
  if (!tishi) return ''
  return tishiMap[tishi] || tishi
}

// 获取题类显示名称
const getTileiName = (tilei?: string) => {
  if (!tilei) return ''
  return tileiMap[tilei] || tilei
}

// 获取难度显示名称
const getDifficultyName = (difficulty?: number) => {
  if (difficulty === undefined || difficulty === null) return ''
  if (difficulty <= 0.2) return '容易'
  if (difficulty <= 0.4) return '比较易'
  if (difficulty <= 0.6) return '中档'
  if (difficulty <= 0.8) return '较难'
  return '难'
}

// 获取用户名称（优先显示昵称）
const getUserName = (nickname?: string, username?: string) => {
  return nickname || username || '-'
}

// 获取处理人名称（优先显示昵称）
const getHandlerName = (nickname?: string, username?: string) => {
  return nickname || username || '-'
}

const props = defineProps<{
  projectId: string
  type: 'book' | 'doc'
  auditRecords: ProjectAuditVO[]
  projectInfo?: BookVO | DocVO
  gradeList?: DicGradeVO[]
  subjectList?: DicSubjectVO[]
  catalogues?: CatalogueVO[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addAudit: [data: { type: number; objectId?: string; content: string }]
}>()

const configStore = useConfigStore()

// 只读模式
const isReadonly = computed(() => props.readonly === true)

// 使用父组件传递的字典数据
const gradeList = computed(() => props.gradeList || [])
const subjectList = computed(() => props.subjectList || [])
const catalogues = computed(() => {
  const cats = props.catalogues || []
  console.log('📂 catalogues 数据更新:', cats.length, '条目录')
  cats.forEach(c => {
    console.log(`  目录ID: ${c.id}, sortNum: ${c.sortNum}, 名称: ${c.catalogueName}`)
  })
  return cats
})

// 构建目录ID到目录的映射
const catalogueMap = computed(() => {
  const map = new Map<string, CatalogueVO>()
  catalogues.value.forEach(catalogue => {
    map.set(catalogue.id, catalogue)
  })
  return map
})

// 构建目录树形数据（包含题目数量）
const catalogueWithQuestionsTree = computed(() => {
  // 先统计每个目录下的题目数量（包括子目录）
  const questionCountMap = new Map<string, number>()

  // 初始化所有目录的题目数量为0
  catalogues.value.forEach(catalogue => {
    questionCountMap.set(catalogue.id, 0)
  })

  // 使用 filteredQuestions 获取筛选后的题目
  const questionsToCount = filteredQuestions.value

  // 统计每个目录下的题目数量
  questionsToCount.forEach(question => {
    if (question.catalogueId) {
      const count = questionCountMap.get(question.catalogueId) || 0
      questionCountMap.set(question.catalogueId, count + 1)

      // 递归累加到父目录
      let currentId = question.catalogueId
      while (currentId) {
        const catalogue = catalogueMap.value.get(currentId)
        if (!catalogue) break
        currentId = catalogue.parentId || ''
        if (currentId) {
          const parentCount = questionCountMap.get(currentId) || 0
          questionCountMap.set(currentId, parentCount + 1)
        }
      }
    }
  })

  // 构建树形数据
  const buildTree = (parentId: string | undefined): CatalogueTreeNode[] => {
    const children: CatalogueTreeNode[] = []
    const siblings: CatalogueVO[] = []

    // 收集同级目录
    catalogues.value.forEach(catalogue => {
      if (catalogue.parentId === parentId || (catalogue.parentId === '0' && !parentId)) {
        siblings.push(catalogue)
      }
    })

    // 排序同级目录：先按 sortNum，再按 id
    siblings.sort((a, b) => {
      const sortNumA = a.sortNum ?? 0
      const sortNumB = b.sortNum ?? 0
      if (sortNumA !== sortNumB) {
        return sortNumA - sortNumB
      }
      // sortNum 相同，按 id 排序
      return BigInt(a.id) > BigInt(b.id) ? 1 : -1
    })

    // 构建树节点
    siblings.forEach(catalogue => {
      const node: CatalogueTreeNode = {
        id: catalogue.id,
        label: catalogue.catalogueName,
        questionCount: questionCountMap.get(catalogue.id) || 0,
        children: buildTree(catalogue.id)
      }
      // 如果没有子节点，移除 children 属性
      if (node.children && node.children.length === 0) {
        delete node.children
      }
      children.push(node)
    })

    return children
  }

  return buildTree(undefined)
})

// 选中的目录ID
const selectedCatalogueId = ref<string | undefined>()

// 选中的题型
const selectedTishiType = ref<string | undefined>()

// 数据流: allQuestions -> filteredQuestions -> sortedQuestions -> questions

// 数据
const allQuestions = ref<QuestionDetailsListVO[]>([]) // 存储所有题目
const questions = ref<QuestionDetailsListVO[]>([]) // 分页显示的题目（从 sortedQuestions 中分页加载）

// 筛选后的题目列表（从 allQuestions 筛选）
const filteredQuestions = computed(() => {
  let result = allQuestions.value

  // 先按目录筛选
  if (selectedCatalogueId.value) {
    result = result.filter(question =>
      isQuestionInCatalogue(question, selectedCatalogueId.value!)
    )
  }

  // 再按题型筛选
  if (selectedTishiType.value) {
    result = result.filter(question => question.tishi === selectedTishiType.value)
  }

  return result
})

// 排序后的题目列表（从 filteredQuestions 排序）
const sortedQuestions = computed(() => {
  const result = filteredQuestions.value

  // 对筛选后的数据进行排序
  return [...result].sort((a, b) => {
    // 先按目录排序
    const catalogueCompare = compareCatalogues(a.catalogueId, b.catalogueId)
    if (catalogueCompare !== 0) {
      return catalogueCompare
    }

    // 同一目录下按 sortNum 排序
    const sortNum1 = a.sortNum ?? 0
    const sortNum2 = b.sortNum ?? 0
    return sortNum1 - sortNum2
  })
})

// 监听 catalogues 变化，重新加载题目
watch(() => props.catalogues, () => {
  // 目录数据更新后，需要重新加载题目以应用正确的排序
  if (allQuestions.value.length > 0) {
    // 重置分页状态
    currentPage.value = 0
    questions.value = []
    hasMore.value = true
    // 重新加载
    fetchQuestions(false)
  }
}, { deep: true })

// 获取各题型的题目数量（基于筛选后的所有题目）
const getTishiCount = (tishiType: string) => {
  // 使用 filteredQuestions 获取筛选后的题目
  const result = filteredQuestions.value

  // 返回指定题型的数量
  return result.filter(q => q.tishi === tishiType).length
}

// 数据
const pageList = ref<PdfPageVO[]>([])
const pagePreviewVisible = ref(false)
const previewPages = ref<PdfPageVO[]>([])
const questionRefs = ref<HTMLElement[]>([])
const questionFeedbacks = ref<Record<string, string>>({})

// 分页相关
const pageSize = 50
const currentPage = ref(0)
const totalQuestions = ref(0)
const isLoading = ref(false)
const hasMore = ref(true)
const loadingProgress = ref({ loaded: 0, total: 0 })
const showLoadingProgress = ref(false) // 控制进度条显示
const isProgressMinimized = ref(false) // 控制进度条最小化

// 从 localStorage 读取最小化状态
const loadProgressMinimizeState = () => {
  const saved = localStorage.getItem('questionsAuditProgressMinimized')
  if (saved !== null) {
    isProgressMinimized.value = saved === 'true'
  }
}

// 保存最小化状态到 localStorage
const saveProgressMinimizeState = (minimized: boolean) => {
  localStorage.setItem('questionsAuditProgressMinimized', String(minimized))
}

// 标注模式相关
const questionAnnotationModes = ref<Record<string, boolean>>({})
const questionAnnotations = ref<Record<string, AnnotationSimpleVO[]>>({})
const questionFullAnnotations = ref<Record<string, AnnotationFullVO[]>>({})

// 编辑模式相关
const questionEditModes = ref<Record<string, boolean>>({})
const questionEditData = ref<Record<string, { question?: string; choice?: string[]; answer?: string; analysis?: string }>>({})
const editSubmitting = ref(false)

// 获取题目显示数据(编辑时显示编辑数据,否则显示原始数据)
const getQuestionDisplayData = (question: QuestionDetailsListVO) => {
  if (questionEditModes.value[question.id] && questionEditData.value[question.id]) {
    const editData = questionEditData.value[question.id]!
    return {
      question: editData.question || '',
      choice: editData.choice?.filter(c => c?.trim()).join('\n') || '',
      answer: editData.answer || '',
      analysis: editData.analysis || ''
    }
  }
  return {
    question: question.question || '',
    choice: question.choice || '',
    answer: question.answer || '',
    analysis: question.analysis || ''
  }
}

// 获取年级名称
const getGradeName = (id: string | undefined) => {
  if (!id) return '-'
  const item = gradeList.value.find(g => g.id === id)
  return item?.gradeName || id
}

// 获取学科名称
const getSubjectName = (id: string | undefined) => {
  if (!id) return '-'
  const item = subjectList.value.find(s => s.id === id)
  return item?.subjectName || id
}

// 获取目录层级路径
const getCataloguePath = (catalogueId: string | undefined) => {
  if (!catalogueId) return null

  const path: string[] = []
  let currentId = catalogueId
  let maxDepth = 10 // 防止循环引用

  while (currentId && maxDepth > 0) {
    const catalogue = catalogueMap.value.get(currentId)
    if (!catalogue) break

    path.unshift(catalogue.catalogueName)
    currentId = catalogue.parentId || ''
    maxDepth--
  }

  return path.length > 0 ? path.join(' → ') : null
}

// 获取目录的完整路径ID列表（用于排序）
const getCataloguePathIds = (catalogueId: string | undefined): string[] => {
  if (!catalogueId) return []

  const pathIds: string[] = []
  let currentId = catalogueId
  let maxDepth = 10 // 防止循环引用

  while (currentId && maxDepth > 0) {
    pathIds.unshift(currentId)
    const catalogue = catalogueMap.value.get(currentId)
    if (!catalogue) break

    currentId = catalogue.parentId || ''
    maxDepth--
  }

  return pathIds
}

// 比较两个目录的层级关系
const compareCatalogues = (catalogueId1: string | undefined, catalogueId2: string | undefined): number => {
  // 如果两个题目都没有目录，视为相等
  if (!catalogueId1 && !catalogueId2) return 0

  // 只有一个有目录，有目录的排在前面
  if (!catalogueId1) return 1
  if (!catalogueId2) return -1

  // 获取两个目录的完整路径ID
  const path1 = getCataloguePathIds(catalogueId1)
  const path2 = getCataloguePathIds(catalogueId2)

  // 比较路径的每一级
  const minLen = Math.min(path1.length, path2.length)
  for (let i = 0; i < minLen; i++) {
    const id1 = path1[i]
    const id2 = path2[i]

    if (id1 !== id2) {
      // 找到第一个不同的目录，获取它们的 sortNum
      const catalogue1 = catalogueMap.value.get(id1!)
      const catalogue2 = catalogueMap.value.get(id2!)

      // 优先按 sortNum 排序，如果为空则赋值 0
      const sortNum1 = catalogue1?.sortNum ?? 0
      const sortNum2 = catalogue2?.sortNum ?? 0

      if (sortNum1 !== sortNum2) {
        return sortNum1 - sortNum2
      }

      // sortNum 相同，按目录 ID 排序（使用 BigInt 避免精度丢失）
      return BigInt(id1!) > BigInt(id2!) ? 1 : -1
    }
  }

  // 所有上级目录都相同，路径短的排在前面（父目录排在子目录前面）
  return path1.length - path2.length
}

// 数据流: allQuestions -> filteredQuestions -> sortedQuestions -> questions

// 检查题目是否属于选中的目录或其子目录
const isQuestionInCatalogue = (question: QuestionDetailsListVO, catalogueId: string): boolean => {
  if (!question.catalogueId) return false

  // 如果题目直接属于该目录
  if (question.catalogueId === catalogueId) return true

  // 检查题目是否属于该目录的子目录
  const questionCatalogue = catalogueMap.value.get(question.catalogueId)
  if (!questionCatalogue) return false

  let currentId = questionCatalogue.parentId
  while (currentId) {
    if (currentId === catalogueId) return true
    const catalogue = catalogueMap.value.get(currentId)
    if (!catalogue) break
    currentId = catalogue.parentId
  }

  return false
}

// 筛选条件变化时的回调
const handleFilterChange = () => {
  // 重置加载状态
  currentPage.value = 0
  questions.value = []
  hasMore.value = true
  loadingProgress.value.loaded = 0

  // 重新开始加载，传入 false 以显示进度条
  fetchQuestions(false)
}

// 处理目录筛选变化
const handleCatalogueFilterChange = (value: string | string[] | undefined) => {
  // 清空时显示所有题目
  if (!value || (Array.isArray(value) && value.length === 0)) {
    selectedCatalogueId.value = undefined
  } else {
    // el-cascader 返回的是数组，最后一个元素是选中的目录ID
    selectedCatalogueId.value = Array.isArray(value) ? value[value.length - 1] : value
  }
  console.log('目录筛选变化, selectedCatalogueId:', selectedCatalogueId.value)
  // 筛选变化后重新加载
  handleFilterChange()
  // 筛选变化后滚动到顶部
  scrollToTop()
}

// 处理题型筛选变化
const handleTishiFilterChange = (value: string | undefined) => {
  selectedTishiType.value = value
  console.log('题型筛选变化, selectedTishiType:', selectedTishiType.value)
  // 筛选变化后重新加载
  handleFilterChange()
  // 筛选变化后滚动到顶部
  scrollToTop()
}

// 获取题目列表（批量加载）
const fetchQuestions = async (loadMore = false) => {
  if (isLoading.value || !hasMore.value) return

  try {
    isLoading.value = true

    // 如果是首次加载且没有数据，从服务器获取所有题目
    if (!loadMore && allQuestions.value.length === 0) {
      // 首次加载，显示进度条
      showLoadingProgress.value = true

      // 获取所有题目信息
      const response = await getQuestionDetailsListApi({ projectId: props.projectId }, {
        timeout: 60000
      })
      if (response.data.code === 200) {
        allQuestions.value = response.data.data || []
      }
    } else if (!loadMore) {
      // 筛选条件变化，显示进度条但不清空 allQuestions
      showLoadingProgress.value = true
    }

    // 使用 sortedQuestions 获取筛选和排序后的数据
    const sortedData = sortedQuestions.value

    console.log('sortedData 长度:', sortedData.length, 'sortedQuestions.value.length:', sortedQuestions.value.length)

    // 更新总数
    totalQuestions.value = sortedData.length
    loadingProgress.value.total = totalQuestions.value

    // 如果没有筛选结果，隐藏进度条并设置hasMore为false
    if (totalQuestions.value === 0) {
      hasMore.value = false
      showLoadingProgress.value = false
      return
    }

    // 如果筛选条件改变或首次加载，重置questions
    if (!loadMore) {
      questions.value = []
      currentPage.value = 0
    }

    // 加载当前页的题目（从 sortedQuestions 中切片）
    const startIndex = currentPage.value * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalQuestions.value)
    const pageQuestions = sortedData.slice(startIndex, endIndex)

    console.log('分页加载:', {
      currentPage: currentPage.value,
      startIndex,
      endIndex,
      pageQuestionsLength: pageQuestions.length,
      questionsLengthBefore: questions.value.length,
      totalQuestions: totalQuestions.value,
      pageQuestionsIds: pageQuestions.slice(0, 3).map(q => q.id) // 只打印前3个ID
    })

    if (pageQuestions.length > 0) {
      questions.value.push(...pageQuestions)
      console.log('添加后 questions.length:', questions.value.length, 'totalQuestions:', totalQuestions.value)

      loadingProgress.value.loaded = questions.value.length
      currentPage.value++
      hasMore.value = endIndex < totalQuestions.value

      // 等待DOM更新后，对新加载的图片进行懒加载初始化
      nextTick(() => {
        initLazyImageLoadingForNewItems()

        // 如果还有更多题目，继续自动加载下一批
        if (hasMore.value) {
          // 使用setTimeout避免阻塞渲染
          setTimeout(() => {
            fetchQuestions(true)
          }, 100)
        } else {
          // 加载完成，隐藏进度条
          showLoadingProgress.value = false
        }
      })
    } else {
      hasMore.value = false
      showLoadingProgress.value = false
    }
  } catch (error) {
    ElMessage.error('获取题目列表失败')
    console.error(error)
    showLoadingProgress.value = false
  } finally {
    isLoading.value = false
  }
}

// 获取页面列表
const fetchPageList = async () => {
  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code === 200) {
      pageList.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取页面列表失败', error)
  }
}

// 返回顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 获取题目的审核记录数量
const getQuestionAuditCount = (questionId: string) => {
  return getQuestionAuditRecords(questionId).length
}

// 获取题目的审核记录
const getQuestionAuditRecords = (questionId: string) => {
  return props.auditRecords.filter(record => record.objectId === questionId)
}

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 解析选项
const parseChoiceOptions = (choice: string | undefined): string[] => {
  if (!choice) return []

  try {
    // 尝试解析为 JSON 数组
    const parsed = JSON.parse(choice)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return []
  } catch {
    // JSON 解析失败，按换行符分割
    return choice.split('\n').filter(c => c.trim())
  }
}

// 解析知识点标签
const parseKnowledgeTags = (knowledge: string | undefined): string[] => {
  if (!knowledge) return []

  try {
    // 尝试解析为 JSON 数组
    const parsed = JSON.parse(knowledge)
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
    }
    return []
  } catch {
    // JSON 解析失败，按逗号分割（兼容旧数据）
    return knowledge.split(',').filter(k => k.trim())
  }
}

// 处理图片路径
const processImageUrl = (url: string | undefined) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  // 题目中的图片可能使用 sliceEndpoint 或 pdfImageEndpoint
  // 优先尝试 sliceEndpoint，如果为空则尝试 pdfImageEndpoint
  let endpoint = configStore.getSliceEndpoint()
  if (!endpoint) {
    endpoint = configStore.getPdfImageEndpoint()
  }
  const processedUrl = endpoint ? `${endpoint}${url}` : url
  return processedUrl
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

// 获取预览图片URL列表（懒加载优化）
const getPreviewImageUrls = (currentIndex: number = 0) => {
  const urls = previewPages.value.map(page => getPageImageUrl(page))
  // 预加载当前图片前后各5张
  const previewUrls: string[] = []
  const preloadRange = 5
  for (let i = Math.max(0, currentIndex - preloadRange); i <= Math.min(urls.length - 1, currentIndex + preloadRange); i++) {
    const url = urls[i]
    if (url) {
      previewUrls.push(url)
    }
  }
  return previewUrls
}

// 处理文本中的图片URL（用于审核区显示）
const processImageUrls = (content: string | undefined) => {
  if (!content) return ''

  let result = content

  // 处理Markdown格式的图片: ![alt](url)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    const processedUrl = processImageUrl(url)
    return `![${alt}](${processedUrl})`
  })

  // 处理HTML格式的<img>标签
  result = result.replace(/<img\s+([^>]*?)>/gi, (match, imgAttrs) => {
    const srcMatch = imgAttrs.match(/src=["']([^"']+)["']/i)
    if (srcMatch) {
      const originalUrl = srcMatch[1]
      const processedSrc = processImageUrl(originalUrl)
      return match.replace(/src=["'][^"']+["']/i, `src="${processedSrc}"`)
    }
    return match
  })

  return result
}

// 渲染 LaTeX 公式
// 处理内联内容（使用公共工具函数）
const processInlineContent = (content: string | undefined) => {
  // 题干/选项来自用户输入或模型输出，先清洗再渲染
  return renderContentUtil(sanitizeHtml(content || ''), processImageUrl)
}

// 提交审核反馈
const handleSubmitFeedback = (questionId: string) => {
  const content = questionFeedbacks.value[questionId]?.trim()
  if (!content) {
    ElMessage.warning('请输入审核反馈内容')
    return
  }

  emit('addAudit', {
    type: 4,
    objectId: questionId,
    content
  })
  questionFeedbacks.value[questionId] = ''
}

// 标注模式切换
const toggleAnnotationMode = async (questionId: string) => {
  const currentMode = questionAnnotationModes.value[questionId]
  questionAnnotationModes.value[questionId] = !currentMode

  if (!currentMode) {
    // 切换到标注模式，加载标注数据
    await loadQuestionAnnotations(questionId)
  }
}

// 加载题目标注数据
const loadQuestionAnnotations = async (questionId: string) => {
  try {
    // 加载简单标注信息（用于底部列表）
    const simpleRes = await getAnnotationListApi({ questionId })
    if (simpleRes.data.code === 200 && simpleRes.data.data) {
      questionAnnotations.value[questionId] = simpleRes.data.data // 显示所有类型的标注
    } else {
      questionAnnotations.value[questionId] = []
    }

    // 加载完整标注信息（包含坐标，用于显示标注框）
    const fullRes = await getAnnotationListByQuestionApi({ questionId })
    if (fullRes.data.code === 200 && fullRes.data.data) {
      questionFullAnnotations.value[questionId] = fullRes.data.data
    } else {
      questionFullAnnotations.value[questionId] = []
    }
  } catch (error) {
    console.error('加载标注数据失败:', error)
    questionAnnotations.value[questionId] = []
    questionFullAnnotations.value[questionId] = []
    ElMessage.error('加载标注数据失败')
  }
}

// 切换编辑模式
const toggleEditMode = async (questionId: string) => {
  const currentMode = questionEditModes.value[questionId]

  if (!currentMode) {
    // 进入编辑模式，初始化编辑数据
    const question = questions.value.find(q => q.id === questionId)
    if (question) {
      questionEditData.value[questionId] = {
        question: question.question || '',
        choice: question.choice ? parseChoiceOptions(question.choice) : [],
        answer: question.answer || '',
        analysis: question.analysis || ''
      }
    }
    questionEditModes.value[questionId] = true
  } else {
    // 保存修改
    await saveQuestionEdit(questionId)
  }
}

// 取消编辑
const cancelEdit = (questionId: string) => {
  questionEditModes.value[questionId] = false
  delete questionEditData.value[questionId]
}

// 新增选项
const addChoiceOption = (questionId: string) => {
  const editData = questionEditData.value[questionId]
  if (!editData) return

  if (!editData.choice) {
    editData.choice = []
  }

  // 新增一个空选项
  editData.choice.push('')
}

// 删除选项
const removeChoiceOption = (questionId: string, index: number) => {
  const editData = questionEditData.value[questionId]
  if (!editData || !editData.choice) return

  // 至少保留2个选项
  if (editData.choice.length <= 2) {
    ElMessage.warning('至少需要保留2个选项')
    return
  }

  // 删除指定索引的选项
  editData.choice.splice(index, 1)
}

// 保存题目编辑
const saveQuestionEdit = async (questionId: string) => {
  if (editSubmitting.value) {
    return
  }

  const editData = questionEditData.value[questionId]
  if (!editData) {
    return
  }

  // 验证必填字段
  if (!editData.question?.trim()) {
    ElMessage.warning('题目内容不能为空')
    return
  }

  try {
    editSubmitting.value = true

    // 准备更新数据
    const updateData: QuestionUpdateCmd = {
      question: editData.question
    }

    // 处理选项（如果是选择题）
    const question = questions.value.find(q => q.id === questionId)
    if (question && question.choice && isChoiceType(question.tishi)) {
      // 将选项数组转换为JSON字符串格式
      const choiceArray = editData.choice?.filter(c => c?.trim()) || []
      updateData.choice = JSON.stringify(choiceArray)
    }

    // 更新答案和解析
    if (editData.answer !== undefined) {
      updateData.answer = editData.answer
    }
    if (editData.analysis !== undefined) {
      updateData.analysis = editData.analysis
    }

    // 调用更新题目的API
    const response = await putQuestionUpdateApi(updateData, { id: questionId })
    if (response.data.code === 200) {
      ElMessage.success('保存成功')

      // 更新本地数据，避免重新渲染所有题目
      const questionIndex = allQuestions.value.findIndex(q => q.id === questionId)
      if (questionIndex !== -1) {
        // 更新 allQuestions 中的数据
        const originalQuestion = allQuestions.value[questionIndex]
        const updatedQuestion = { ...originalQuestion }
        if (updateData.question) updatedQuestion.question = updateData.question
        if (updateData.choice) updatedQuestion.choice = updateData.choice
        if (updateData.answer) updatedQuestion.answer = updateData.answer
        if (updateData.analysis) updatedQuestion.analysis = updateData.analysis

        // 确保类型正确
        if (updatedQuestion.id) {
          allQuestions.value[questionIndex] = updatedQuestion as QuestionDetailsListVO

          // 更新当前显示的 questions 中的数据
          const displayQuestionIndex = questions.value.findIndex(q => q.id === questionId)
          if (displayQuestionIndex !== -1) {
            questions.value[displayQuestionIndex] = updatedQuestion as QuestionDetailsListVO
          }
        }
      }

      questionEditModes.value[questionId] = false
      delete questionEditData.value[questionId]
    } else {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存题目编辑失败:', error)
  } finally {
    editSubmitting.value = false
  }
}

// 页面加载时获取数据
// 图片懒加载观察器
let lazyImageObserver: IntersectionObserver | null = null

// 初始化图片懒加载
const initLazyImageLoading = () => {
  // 清理旧的观察器
  if (lazyImageObserver) {
    lazyImageObserver.disconnect()
  }

  // 创建新的观察器
  lazyImageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const dataSrc = img.getAttribute('data-src')
        if (dataSrc) {
          img.src = dataSrc
          img.removeAttribute('data-src')
          lazyImageObserver?.unobserve(img)
        }
      }
    })
  }, {
    rootMargin: '100px', // 提前100px开始加载
    threshold: 0.01
  })

  // 延迟一帧执行，确保DOM已经渲染
  nextTick(() => {
    initLazyImageLoadingForNewItems()
  })
}

// 为新加载的图片初始化懒加载
const initLazyImageLoadingForNewItems = () => {
  if (!lazyImageObserver) return

  // 只处理未被包装的图片（新加载的）
  const lazyImages = document.querySelectorAll('.lazy-image:not([data-wrapped])')
  lazyImages.forEach((img) => {
    // 为每个图片创建包装元素
    const wrapper = document.createElement('div')
    wrapper.className = 'lazy-image-wrapper'
    const placeholder = document.createElement('span')
    placeholder.className = 'lazy-image-placeholder'
    placeholder.textContent = '加载中...'
    wrapper.appendChild(placeholder)
    wrapper.appendChild(img.cloneNode(true))
    img.parentNode?.replaceChild(wrapper, img)

    // 获取新插入的图片元素
    const newImg = wrapper.querySelector('.lazy-image') as HTMLImageElement
    if (newImg) {
      // 标记为已包装
      newImg.setAttribute('data-wrapped', 'true')
      lazyImageObserver?.observe(newImg)

      // 添加图片加载事件监听
      newImg.addEventListener('load', () => {
        wrapper.setAttribute('loading', 'loaded')
        wrapper.classList.add('loaded')
      })

      newImg.addEventListener('error', () => {
        wrapper.setAttribute('loading', 'error')
        placeholder.textContent = '加载失败'
      })
    }
  })
}

// 清理懒加载观察器
const cleanupLazyImageLoading = () => {
  if (lazyImageObserver) {
    lazyImageObserver.disconnect()
    lazyImageObserver = null
  }
}

// 监听题目变化，重新初始化懒加载
const setupLazyLoadWatch = () => {
  nextTick(() => {
    initLazyImageLoading()
  })
}

onMounted(() => {
  console.log('QuestionsAudit 配置状态:', {
    config: configStore.config,
    sliceEndpoint: configStore.getSliceEndpoint(),
    pdfImageEndpoint: configStore.getPdfImageEndpoint()
  })
  // 加载保存的最小化状态
  loadProgressMinimizeState()
  fetchQuestions()
  fetchPageList()
  initLazyImageLoading()
})

onUnmounted(() => {
  cleanupLazyImageLoading()
})

// 滚动到指定题目
const scrollToQuestion = (questionId: string) => {
  const questionIndex = questions.value.findIndex(q => q.id === questionId)
  if (questionIndex === -1) {
    ElMessage.warning('未找到该题目')
    return null
  }

  // 滚动到题目元素
  const targetElement = questionRefs.value[questionIndex]
  if (targetElement) {
    targetElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })

    // 高亮显示该题目
    targetElement.classList.add('question-highlight')
    setTimeout(() => {
      targetElement.classList.remove('question-highlight')
    }, 2000)

    return targetElement
  }
  return null
}

// 暴露方法供父组件调用
defineExpose({
  scrollToQuestion
})

// 切换进度条最小化
const toggleProgressMinimize = () => {
  isProgressMinimized.value = !isProgressMinimized.value
  saveProgressMinimizeState(isProgressMinimized.value)
}
</script>

<style scoped>
:deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--el-text-color-primary);
  padding-left: 10px;
  border-left: 4px solid #409EFF;
  line-height: 1.2;
}

.paper-card {
  height: 100%;
  border-radius: 8px;
  border: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  background: #fff;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.questions-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.project-info-panel {
  background: #f9fafc;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.info-item .label {
  color: #6b7280;
  min-width: 80px;
  font-weight: 500;
}

.info-item .value {
  color: #374151;
  font-weight: 500;
}

.visual-panel {
  flex: 0 1 auto;
  background: #f9fafc;
  padding: 15px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  font-weight: bold;
  font-size: 14px;
  color: #409EFF;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.question-count {
  margin-left: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}

.tishi-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.tishi-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}

.questions-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.questions-list {
  width: 100%;
}

.item-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  position: relative;
}

.item-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: #c6e2ff;
}

.item-card.question-highlight {
  box-shadow: 0 0 0 3px #409EFF, 0 8px 20px rgba(64, 158, 255, 0.3);
  border-color: #409EFF;
  animation: highlight-pulse 2s ease-in-out;
}

@keyframes highlight-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 3px #409EFF, 0 8px 20px rgba(64, 158, 255, 0.3);
  }

  50% {
    box-shadow: 0 0 0 4px #409EFF, 0 8px 25px rgba(64, 158, 255, 0.4);
  }
}

.item-meta {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.meta-left {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.meta-right {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
}

.meta-info-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.meta-info-item .info-label {
  color: var(--el-text-color-secondary);
  margin-right: 4px;
}

.meta-info-item .info-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.item-users {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.item-body {
  font-size: 16px;
  line-height: 1.8;
  color: #333;
  margin-bottom: 20px;
}

.content-split-container {
  margin-bottom: 20px;
}

.content-split-container :deep(.el-splitter) {
  height: auto !important;
  min-height: auto !important;
  max-height: none !important;
  display: flex !important;
  flex-direction: row !important;
}

.content-split-container :deep(.el-splitter-panel) {
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
  flex: 1;
}

.content-split-container :deep(.el-splitter__resizer) {
  background-color: #e4e7ed;
  transition: background-color 0.2s;
}

.content-split-container :deep(.el-splitter__resizer:hover) {
  background-color: #409EFF;
}

.content-split-container :deep(.el-splitter__resizer:active) {
  background-color: #3b82f6;
}

.audit-panel,
.preview-panel {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: auto;
  height: 100%;
  overflow: visible;
}

.audit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.audit-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--el-text-color-regular);
}

.audit-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
  flex: 0 1 auto;
  min-height: auto;
  height: auto;
  overflow: visible;
}

.edit-content,
.readonly-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.edit-input {
  background-color: #f0f9ff;
  border-color: #409EFF;
}

.edit-input :deep(.el-textarea__inner) {
  background-color: #f0f9ff;
  border-color: #409EFF;
  color: var(--el-text-color-primary);
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

/* 标注模式容器 */
.audit-panel :deep(.annotation-viewer-wrapper) {
  flex: 0 1 auto;
  min-height: auto;
  height: auto;
}

.audit-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-label {
  font-size: 13px;
  font-weight: bold;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.choice-edit-item {
  margin-bottom: 12px;
}

.choice-edit-item:last-child {
  margin-bottom: 0;
}

.choice-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.choice-wrapper .audit-choice-input {
  flex: 1;
}

.choice-delete-btn {
  flex-shrink: 0;
  margin-top: 2px;
}

.audit-input,
.audit-choice-input {
  width: 100%;
}

.audit-choice-input {
  margin-bottom: 8px;
}

.audit-choice-input:last-child {
  margin-bottom: 0;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 0 1 auto;
  min-height: auto;
  height: auto;
  overflow: visible;
}

.question-index {
  font-weight: bold;
  color: #409EFF;
  font-size: 18px;
  margin-right: 8px;
}

.item-choices {
  background-color: #fff;
  padding: 15px;
  border-radius: 6px;
  border: 1px dashed #e4e7ed;
  margin-bottom: 15px;
}

.choices-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.choice-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  transition: all 0.2s;
}

.choice-item:hover {
  border-color: #c6e2ff;
  background: #f0f9ff;
}

.analysis-box {
  background-color: #fff;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #e4e7ed;
  font-size: 15px;
}

.analysis-row {
  margin-bottom: 15px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
}

.label-tag {
  font-weight: bold;
  margin-bottom: 6px;
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  color: #fff;
  align-self: flex-start;
}

.tag-ans {
  background-color: #67C23A;
}

.tag-ana {
  background-color: #409EFF;
}

.tag-tip {
  background-color: #E6A23C;
}

.no-data {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}

.item-footer {
  border-top: 1px solid #ebeef5;
  margin-top: 15px;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.preview-pages {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.preview-image {
  width: 100%;
  max-height: 600px;
  background-color: #f5f7fa;
}

.image-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  background-color: #f5f7fa;
}

.selected-info {
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
}

.question-audit-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 2px dashed #e4e7ed;
}

.question-audit-section :deep(.el-divider__text) {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.question-audit-section .records-list {
  max-height: 250px;
  overflow-y: auto;
}

.records-list {
  max-height: 200px;
  overflow-y: auto;
}

.record-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  transition: background-color 0.2s;
}

.record-item:hover {
  background: #f0f2f5;
}

.record-content {
  margin-bottom: 8px;
  color: #374151;
  font-size: 14px;
}

.record-hand-content {
  padding: 8px 12px;
  background: #ecfdf5;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  margin-bottom: 8px;
}

.hand-content-label {
  font-size: 12px;
  font-weight: bold;
  color: #059669;
  margin-bottom: 4px;
}

.hand-content-text {
  font-size: 13px;
  color: #047857;
  line-height: 1.5;
}

.record-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-right {
  display: flex;
  align-items: center;
}

.tag-content {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.record-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.handler-info {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.flex-1 {
  flex: 1;
}

.flex-wrap {
  flex-wrap: wrap;
}

.gap-2 {
  gap: 8px;
}

.mb-1 {
  margin-bottom: 4px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mt-1 {
  margin-top: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.ml-10 {
  margin-left: 40px;
}

.text-sm {
  font-size: 14px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-700 {
  color: #374151;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-gray-500 {
  color: #6b7280;
}

.text-green-600 {
  color: #16a34a;
}

.latex-error {
  color: #dc2626;
  font-family: monospace;
  background-color: #fef2f2;
  padding: 2px 6px;
  border-radius: 3px;
}


/* 图片加载样式 */
.preview-content :deep(.lazy-image-wrapper) {
  position: relative;
  display: block;
  margin: 8px 0;
  background-color: #f5f7fa;
  width: 100%;
  max-width: 100%;
  min-height: 100px;
}

.preview-content :deep(.lazy-image) {
  max-width: 100%;
  height: auto;
  display: block;
  opacity: 0;
  transition: opacity 0.3s;
}

/* 图片加载完成后显示图片 */
.preview-content :deep(.lazy-image-wrapper.loaded .lazy-image),
.preview-content :deep(.lazy-image-wrapper[loading="loaded"] .lazy-image) {
  opacity: 1;
}

/* 加载占位符 */
.preview-content :deep(.lazy-image-placeholder) {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片加载完成后隐藏占位符 */
.preview-content :deep(.lazy-image-wrapper.loaded .lazy-image-placeholder),
.preview-content :deep(.lazy-image-wrapper[loading="loaded"] .lazy-image-placeholder) {
  display: none;
}

/* 图片加载失败样式 */
.preview-content :deep(.lazy-image-wrapper[loading="error"]) {
  background-color: #f5f7fa;
}

.preview-content :deep(.lazy-image-wrapper[loading="error"] .lazy-image-placeholder) {
  color: #f56c6c;
  font-weight: 500;
}

/* 加载进度悬浮提示 */
.loading-progress {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 180px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 最小化模式 - 贴到边缘 */
.loading-progress.minimized {
  bottom: 20px;
  right: 0;
  min-width: 0;
  padding: 0;
  border-radius: 8px 0 0 8px;
  border-right: none;
}

/* 最小化容器 */
.progress-minimized {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.progress-minimized:hover {
  padding-left: 20px;
}

.minimized-icon {
  font-size: 20px;
  color: #409EFF;
  animation: rotate 1.5s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.minimized-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* 展开模式容器 */
.progress-expanded {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.minimize-btn {
  cursor: pointer;
  font-size: 20px;
  color: var(--el-text-color-regular);
  transition: all 0.2s;
  padding: 4px;
  border-radius: 4px;
}

.minimize-btn:hover {
  color: #409EFF;
  transform: scale(1.2);
  background-color: #f0f9ff;
}

.progress-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  margin-bottom: 4px;
}

.progress-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
  padding: 4px 8px;
  background: #f5f7fa;
  border-radius: 4px;
  border-left: 3px solid #E6A23C;
  display: block;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.progress-percent {
  font-size: 13px;
  font-weight: 500;
  color: #409EFF;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background-color: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #409EFF 0%, #66b1ff 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 4px rgba(64, 158, 255, 0.3);
}
</style>
