<template>
  <div class="question-editor">
    <!-- 顶部模式切换 -->
    <div class="mode-switcher mb-4">
      <el-segmented v-model="currentMode" :options="modeOptions" @change="handleModeChange" />
    </div>

    <!-- 编辑模式 -->
    <template v-if="currentMode === 'edit'">
      <!-- 题目信息区域 -->
      <div class="detail-section mb-4">
        <div class="section-title mb-3">
          <span>题目信息</span>
        </div>
        <el-form :model="questionForm" label-width="80px" size="small">
          <div class="form-row">
            <el-form-item label="题类">
              <el-select v-model="questionForm.tilei" placeholder="请选择题类" style="width: 100%" @change="() => triggerAutoSave(true)">
                <el-option label="常考题" value="changkaoti" />
                <el-option label="易错题" value="yicuoti" />
                <el-option label="好题" value="haoti" />
                <el-option label="压轴题" value="yazhouti" />
              </el-select>
            </el-form-item>
            <el-form-item label="无答案">
              <el-checkbox v-model="questionForm.noAnswer" @change="() => triggerAutoSave(true)" />
            </el-form-item>
          </div>
          <div class="form-row">
          <el-form-item label="难度" required :error="formErrors.difficulty">
            <el-select v-model="questionForm.difficulty" placeholder="请选择难度" style="width: 100%" @change="() => { updateFieldError('difficulty'); triggerAutoSave(true) }">
              <el-option label="0（容易）" :value="0" />
              <el-option label="0.1（容易）" :value="0.1" />
              <el-option label="0.2（容易）" :value="0.2" />
              <el-option label="0.3（比较易）" :value="0.3" />
              <el-option label="0.4（比较易）" :value="0.4" />
              <el-option label="0.5（中档）" :value="0.5" />
              <el-option label="0.6（中档）" :value="0.6" />
              <el-option label="0.7（较难）" :value="0.7" />
              <el-option label="0.8（较难）" :value="0.8" />
              <el-option label="0.9（难）" :value="0.9" />
              <el-option label="1（难）" :value="1" />
            </el-select>
          </el-form-item>
          <!-- 分值（docx questionScore）：母题同样需要，示例输出中母题亦有分值 -->
          <el-form-item label="分值">
            <el-input-number
              v-model="questionForm.questionScore"
              :min="0"
              :precision="1"
              :controls="false"
              placeholder="请输入分值"
              style="width: 100%"
              @change="() => triggerAutoSave(true)"
            />
          </el-form-item>
          </div>
          <el-form-item label="知识点">
            <el-select
              v-model="knowledgeTags"
              multiple
              filterable
              allow-create
              default-first-option
              :reserve-keyword="false"
              placeholder="请输入知识点，按回车添加"
              style="width: 100%"
              @change="handleKnowledgeChange"
            />
          </el-form-item>
          <el-form-item label="标签题型" required :error="formErrors.labelQuestionType">
            <el-cascader
              v-model="questionForm.labelQuestionType"
              :options="questionTypeCascaderOptions"
              :props="questionTypeCascaderProps"
              placeholder="请选择标签题型"
              style="width: 100%"
              filterable
              clearable
              :show-all-levels="false"
              @change="() => { updateFieldError('labelQuestionType'); triggerAutoSave(true) }"
            />
          </el-form-item>
          <el-form-item label="作答方式" required :error="formErrors.answerMode">
            <!-- 用 :model-value + @change 而非 v-model：切到「综合母题」需先确认清空答案，
                 用户取消时值不能被改掉（v-model 会先行写入） -->
            <el-select
              :key="answerModeSelectKey"
              :model-value="questionForm.questionAnswerMode"
              placeholder="请选择作答方式"
              style="width: 100%"
              @change="handleAnswerModeChange"
            >
              <el-option
                v-for="item in answerModeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="题目类型">
            <el-select
              v-model="questionForm.questionType"
              placeholder="请选择题目类型"
              style="width: 100%"
              filterable
              clearable
              @change="() => triggerAutoSave(true)"
            >
              <el-option
                v-for="item in baseTypeOptions"
                :key="item.typeCode"
                :label="item.questionTypeZh"
                :value="item.typeCode"
              />
            </el-select>
          </el-form-item>
        <el-form-item label="点评">
          <el-input
            v-model="questionForm.questionComment"
            type="textarea"
            :rows="3"
            placeholder="请输入点评"
            @input="() => triggerAutoSave(true)"
          />
        </el-form-item>
        </el-form>
      </div>

    <!-- 题目内容区域 -->
    <div class="detail-section mb-4">
      <div class="section-title mb-3">
        <span>题目内容</span>
        <el-button
          type="success"
          size="small"
          @click="handleSmartAssemble"
          :loading="assembling"
        >
          <Icon icon="ep:magic-stick" class="mr-1" />
          智能封装
        </el-button>
      </div>
      <el-form :model="questionForm" label-width="80px" size="small">
        <el-form-item label="标题" required :error="formErrors.question">
          <el-input
            v-model="questionForm.question"
            type="textarea"
            :rows="4"
            placeholder="请输入标题，支持 Markdown 和 LaTeX 公式"
            @blur="handleQuestionBlur"
            @input="() => triggerAutoSave()"
          />
        </el-form-item>
        <!-- 判断题选项固定为 对/错，不可编辑 -->
        <el-form-item v-if="questionKind === 'judge'" label="选项">
          <span class="judge-options">对 / 错</span>
        </el-form-item>
        <el-form-item v-else-if="questionKind === 'choice'" label="选项" required :error="formErrors.options">
          <div class="options-container">
            <div v-for="(option, index) in choiceOptions" :key="index" class="option-item">
              <div class="option-input-wrapper">
                <el-input
                  v-model="choiceOptions[index]"
                  type="textarea"
                  :rows="option.includes('<img') ? 3 : 1"
                  placeholder="请输入选项内容"
                  @blur="handleOptionBlur"
                  @input="() => triggerAutoSave()"
                />
                <div v-if="option.includes('<img')" class="option-preview">
                  <div v-html="renderContent(option, false)"></div>
                </div>
              </div>
              <el-button
                type="danger"
                size="small"
                circle
                @click="removeOption(index)"
                :disabled="choiceOptions.length <= 2"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <el-button
              type="primary"
              size="small"
              @click="addOption"
              :disabled="choiceOptions.length >= MAX_OPTIONS"
            >
              <Icon icon="ep:plus" class="mr-1" />
              添加选项
            </el-button>
          </div>
        </el-form-item>
        <!-- 综合母题不应单独填答案：若历史数据残留答案，给出清空入口，
             否则答案区被隐藏、用户没有地方清空，会一直卡在提交审核 -->
        <el-form-item v-else-if="hasStaleAnswer" label="答案">
          <div
            class="w-full rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-900/25"
          >
            <div class="flex items-start gap-2 text-[13px] text-amber-700 dark:text-amber-300">
              <Icon icon="ep:warning" class="mt-0.5 shrink-0" />
              <span>综合母题的答案应写在子题内。本题残留了以下答案，需清空后才能提交审核。</span>
            </div>
            <div
              class="mt-2 rounded bg-white/70 px-2 py-1.5 text-[13px] text-gray-600 break-all dark:bg-black/20 dark:text-gray-300"
            >
              {{ staleAnswerPreview }}
            </div>
            <el-button
              class="mt-2"
              type="warning"
              size="small"
              :loading="clearingAnswer"
              @click="handleClearStaleAnswer"
            >
              清空答案
            </el-button>
          </div>
        </el-form-item>
        <el-form-item v-if="questionForm.questionAnswerMode !== 0" label="答案" :required="!questionForm.noAnswer" :error="formErrors.answer">
          <!-- 判断题：对/错 单选；内部值为字符串 "true"/"false"，与 docx 约定一致 -->
          <el-radio-group
            v-if="questionForm.questionAnswerMode === ANSWER_MODE_JUDGE"
            v-model="answerDraft.judge"
            @change="handleAnswerBlur"
          >
            <el-radio value="true">对</el-radio>
            <el-radio value="false">错</el-radio>
          </el-radio-group>
          <!-- 单选 / 多选：一行一个正确选项（answerOptionList），每行可再加备选答案（extendOptionList） -->
          <AnswerRowsEditor
            v-else-if="questionForm.questionAnswerMode === ANSWER_MODE_SINGLE || questionForm.questionAnswerMode === ANSWER_MODE_MULTI"
            v-model="answerDraft.rows"
            variant="choice"
            add-row-label="添加选项"
            @blur="handleAnswerBlur"
          />
          <!-- 填空：一行一空，每空可再加备选答案 -->
          <AnswerRowsEditor
            v-else-if="questionForm.questionAnswerMode === ANSWER_MODE_BLANK"
            v-model="answerDraft.rows"
            variant="text"
            add-row-label="添加空"
            text-placeholder="请输入本空答案"
            :stem="questionForm.question"
            @blur="handleAnswerBlur"
            @input="() => triggerAutoSave()"
          />
          <!-- 解答：单行答案 + 备选答案 -->
          <AnswerRowsEditor
            v-else
            v-model="answerDraft.rows"
            variant="text"
            text-placeholder="请输入答案，支持 Markdown 和 LaTeX 公式"
            @blur="handleAnswerBlur"
            @input="() => triggerAutoSave()"
          />
        </el-form-item>
        <el-form-item label="解析">
          <el-input
            v-model="questionForm.analysis"
            type="textarea"
            :rows="3"
            placeholder="请输入解析，支持 Markdown 和 LaTeX 公式"
            @blur="handleAnalysisBlur"
            @input="() => triggerAutoSave()"
          />
        </el-form-item>
      </el-form>
    </div>

    <!-- 子题区域 -->
    <div class="detail-section mb-4">
      <div class="section-title mb-3">
        <span>子题</span>
      </div>
      <SubQuestionPanel
        ref="subQuestionPanelRef"
        :question-id="props.selectedQuestion.id"
        :project-id="props.selectedQuestion.projectId"
        :catalogue-id="props.selectedQuestion.catalogueId"
        :subject-code="bookSubjectCode"
        :level="props.selectedQuestion.level ?? 0"
        @changed="(parentId: string) => emit('refreshQuestion', parentId)"
      />
    </div>
    </template>

    <!-- 预览模式 -->
    <template v-else-if="currentMode === 'preview'">
      <div class="detail-section mb-4">
        <div class="section-title mb-3">题目信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">题类:</span>
            <span class="value">{{ getTileiLabel(questionForm.tilei) }}</span>
          </div>
          <div class="info-item">
            <span class="label">难度:</span>
            <span class="value">{{ questionForm.difficulty !== undefined && questionForm.difficulty !== null ? `${getDifficultyLabel(questionForm.difficulty)} (${questionForm.difficulty})` : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="label">知识点:</span>
            <div class="value tags-container">
              <el-tag
                v-if="knowledgeTags.length > 0"
                v-for="(tag, index) in knowledgeTags"
                :key="index"
                type="primary"
                size="small"
                class="mr-1 mb-1"
              >
                {{ tag }}
              </el-tag>
              <span v-else>-</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">无答案:</span>
            <span class="value">{{ questionForm.noAnswer ? '是' : '否' }}</span>
          </div>
          <div class="info-item" v-if="questionForm.labelQuestionType != null">
            <span class="label">标签题型:</span>
            <span class="value">{{ (questionTypeOptions.find(t => t.typeCode === questionForm.labelQuestionType)?.typeName) || questionForm.labelQuestionType }}</span>
          </div>
          <div class="info-item" v-if="questionForm.questionAnswerMode != null">
            <span class="label">作答方式:</span>
            <span class="value">{{ (answerModeOptions.find(t => t.value === questionForm.questionAnswerMode)?.label) || questionForm.questionAnswerMode }}</span>
          </div>
          <div class="info-item">
            <span class="label">分值:</span>
            <span class="value">{{ questionForm.questionScore != null ? `${questionForm.questionScore} 分` : '-' }}</span>
          </div>
        </div>
        <div v-if="questionForm.questionComment" class="info-item-full">
          <span class="label">点评:</span>
          <span class="value">{{ questionForm.questionComment }}</span>
        </div>
      </div>

      <div class="detail-section mb-4">
        <div class="section-title mb-3">题目内容</div>
        <div class="preview-content">
          <!-- 标题和选项合并在一个框中 -->
          <div v-if="questionForm.question" class="content-box preview-box mb-4">
            <div class="preview-content">
              <div v-if="questionForm.question" v-html="renderContent(questionForm.question, true)"></div>
            </div>
            <div v-if="isChoiceType(questionForm.labelQuestionType, questionForm.tishi) && choiceOptions.some(o => o)" class="mt-4 pt-4 border-t border-gray-200">
              <div class="preview-content choice-content">
                <div v-for="(option, index) in choiceOptions.filter(o => o)" :key="index" class="choice-item">
                  <div v-html="renderContent(option, true)"></div>
                </div>
              </div>
            </div>
          </div>
          <!-- 答案 -->
          <div v-if="questionForm.questionAnswerMode !== 0 && answerDisplayText" class="content-box preview-box mb-4">
            <el-tag type="success" size="small" class="mb-2">答案</el-tag>
            <div class="preview-content" v-html="renderContent(answerDisplayText, true)"></div>
          </div>
          <!-- 解析 -->
          <div v-if="questionForm.analysis" class="content-box preview-box mb-4">
            <el-tag type="warning" size="small" class="mb-2">解析</el-tag>
            <div class="preview-content" v-html="renderContent(questionForm.analysis, true)"></div>
          </div>
          <!-- 空状态 -->
          <div v-if="!questionForm.question && !questionForm.choice && !questionForm.answer && !questionForm.analysis" class="content-box preview-box">
            <div class="text-gray-400">暂无内容</div>
          </div>
        </div>
      </div>

      <!-- 子题（只读）：与编辑模式共用详情接口的 subQuestionList -->
      <div v-if="previewSubRows.length > 0" class="detail-section mb-4">
        <div class="section-title mb-3">子题（{{ previewSubRows.length }}）</div>
        <div class="sub-preview-list">
          <div v-for="row in previewSubRows" :key="row.id" class="sub-preview-item"
            :style="{ marginLeft: `${row.depth * 16}px` }">
            <div class="sub-preview-head">
              <span class="sub-preview-no">{{ row.no }}</span>
              <el-tag v-if="row.item.labelQuestionType != null" size="small" type="primary">
                {{ questionTypeName(row.item.labelQuestionType) }}
              </el-tag>
              <el-tag v-if="row.item.questionAnswerMode != null" size="small" type="info">
                {{ answerModeName(row.item.questionAnswerMode) }}
              </el-tag>
              <span v-if="row.item.questionContent?.questionScore != null" class="sub-preview-score">
                {{ row.item.questionContent.questionScore }} 分
              </span>
            </div>
            <div class="content-box preview-box">
              <div v-if="subStem(row.item)" class="preview-content" v-html="renderContent(subStem(row.item), true)"></div>
              <div v-else class="text-gray-400">暂无题干</div>
              <div v-if="subOptions(row.item).length" class="mt-2 pt-2 border-t border-gray-200">
                <div v-for="(option, oi) in subOptions(row.item)" :key="oi" class="preview-content choice-content">
                  <div v-html="renderContent(option, true)"></div>
                </div>
              </div>
              <div v-if="row.item.answer" class="mt-2 pt-2 border-t border-gray-200">
                <el-tag type="success" size="small" class="mb-1">答案</el-tag>
                <div class="preview-content" v-html="renderContent(row.item.answer, true)"></div>
              </div>
              <div v-if="row.item.analysis" class="mt-2 pt-2 border-t border-gray-200">
                <el-tag type="warning" size="small" class="mb-1">解析</el-tag>
                <div class="preview-content" v-html="renderContent(row.item.analysis, true)"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import { type QuestionVO, type QuestionDetailsVO, getQuestionDetailsApi, putQuestionUpdateApi } from '@/api/gen/questionController'
import { getBookInfoDetailsApi } from '@/api/gen/bookController'
import { getDicSubjectListApi } from '@/api/gen/dicController'
import { getQuestionTypeBaseTypeApi } from '@/api/gen/questionType'
import { useQuestionTypeDict } from '@/composables/useQuestionTypeDict'
import { getAnnotationListApi, type AnnotationSimpleVO } from '@/api/gen/annotationController'
import { useConfigStore } from '@/stores/config'
import { useParseSettingsStore } from '@/stores/parseSettings'
import { renderContent as renderContentUtil, sanitizeHtml } from '@/utils/contentRenderer'
import {
  ANSWER_MODE_ANSWER,
  ANSWER_MODE_BLANK,
  ANSWER_MODE_COMPREHENSIVE,
  ANSWER_MODE_JUDGE,
  ANSWER_MODE_MULTI,
  ANSWER_MODE_SINGLE,
  answerModeOptions,
  minChoiceOptions,
} from '@/constants/answerMode'
import {
  type AnswerDraft,
  JUDGE_OPTIONS,
  MAX_OPTIONS,
  buildQuestionAnswer,
  createAnswerDraft,
  createAnswerRow,
  draftToDisplay,
  draftToLegacyAnswer,
  isAnswerDraftFilled,
  isJudgeLeftover,
  optionLetter,
  parseAnswerDraft,
  parseLegacyAnswer,
} from '@/utils/questionAnswer'
import SubQuestionPanel from './SubQuestionPanel.vue'
import AnswerRowsEditor from './AnswerRowsEditor.vue'

const configStore = useConfigStore()
const parseSettingsStore = useParseSettingsStore()

const props = defineProps<{
  selectedQuestion: QuestionVO
}>()

const emit = defineEmits<{
  /** 题目/子题内容变更，需要刷新题目列表；参数为发生变化的父题目ID（可选） */
  refreshQuestion: [parentId?: string]
}>()

// 选项数组
const choiceOptions = ref<string[]>(['', '', '', ''])

// 当前模式：edit 或 preview
const currentMode = ref<'edit' | 'preview'>('edit')

/** 子题面板（仅编辑模式下渲染），供快捷键快捷新增子题 */
const subQuestionPanelRef = ref<InstanceType<typeof SubQuestionPanel> | null>(null)

/** 详情接口返回的子题（递归结构），用于预览模式只读展示 */
const subQuestionDetails = ref<QuestionDetailsVO[]>([])

/** 预览用子题行：扁平化后按 depth 缩进，题号形如 子题1 / 子题1.1 */
interface PreviewSubRow {
  id: string
  no: string
  depth: number
  item: QuestionDetailsVO
}
const previewSubRows = computed<PreviewSubRow[]>(() => {
  const rows: PreviewSubRow[] = []
  const walk = (list: QuestionDetailsVO[] | undefined, prefix: string, depth: number) => {
    ;(list || []).forEach((item, index) => {
      const no = prefix ? `${prefix}.${index + 1}` : String(index + 1)
      rows.push({ id: item.id, no: `子题${no}`, depth, item })
      walk(item.subQuestionList, no, depth + 1)
    })
  }
  walk(subQuestionDetails.value, '', 0)
  return rows
})

/** 子题题干：优先取结构化内容，回退到 question 字段 */
const subStem = (item: QuestionDetailsVO) => item.questionContent?.questionStem || item.question || ''

/** 子题选项：choice 为 JSON 数组字符串（判断题固定 对/错），解析失败按换行降级 */
const subOptions = (item: QuestionDetailsVO): string[] => {
  if (!item.choice) return []
  try {
    const parsed = JSON.parse(item.choice)
    return Array.isArray(parsed) ? parsed.map((c) => String(c)).filter((c) => c.trim()) : []
  } catch {
    return item.choice.split('\n').filter((c) => c.trim())
  }
}

/** 题型/作答方式中文名 */
const questionTypeName = (code?: number) =>
  questionTypeOptions.value.find((t) => t.typeCode === code)?.typeName || (code != null ? String(code) : '-')
const answerModeName = (mode?: number) =>
  answerModeOptions.find((m) => m.value === mode)?.label || (mode != null ? String(mode) : '-')

// 保存状态
const assembling = ref(false)
const autoSaving = ref(false)
// 保存进行中产生的改动标记，避免并发保存时改动被丢弃
const pendingSave = ref(false)
const saveTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 表单错误提示
const formErrors = ref({
  question: '',
  options: '',
  answer: '',
  labelQuestionType: '',
  answerMode: '',
  difficulty: ''
})

// 标注列表
const annotations = ref<AnnotationSimpleVO[]>([])

// 模式选项
const modeOptions = [
  { label: '编辑模式', value: 'edit' },
  { label: '预览模式', value: 'preview' }
]

// 题类标签映射
const tileiLabels: Record<string, string> = {
  changkaoti: '常考题',
  yicuoti: '易错题',
  haoti: '好题',
  yazhouti: '压轴题'
}

// 题目表单
const questionForm = ref({
  tilei: '',
  difficulty: 0,
  knowledge: '',
  questionComment: '',
  noAnswer: false,
  question: '',
  choice: '',
  answer: '',
  analysis: '',
  tishi: '',
  labelQuestionType: undefined as number | undefined,
  questionAnswerMode: undefined as number | undefined,
  questionType: undefined as number | undefined,
  /** 分值（docx questionScore）；母题同样需要，缺失会导致导出为 0 */
  questionScore: undefined as number | undefined,
  /** 题内序号（docx questionOrder）；仅回传保留，避免保存时被清空 */
  questionOrder: undefined as number | undefined,
  questionExtra: ''
})

/** 结构化答案草稿：按作答方式采集，提交时转为 questionAnswer */
const answerDraft = ref<AnswerDraft>(createAnswerDraft())

/** 答案至少渲染一行，避免切到单选/多选/填空/解答时列表为空 */
const ensureAnswerRows = () => {
  const mode = questionForm.value.questionAnswerMode
  const needRow =
    mode === ANSWER_MODE_SINGLE || mode === ANSWER_MODE_MULTI || mode === ANSWER_MODE_BLANK || mode === ANSWER_MODE_ANSWER
  if (needRow && answerDraft.value.rows.length === 0) {
    answerDraft.value.rows = [createAnswerRow()]
  }
}

/** 草稿 → 旧扁平 answer，保证 answer 列与 questionAnswer 口径一致（判断题写 "true"/"false"） */
const syncLegacyAnswer = () => {
  questionForm.value.answer = draftToLegacyAnswer(questionForm.value.questionAnswerMode, answerDraft.value)
}

watch(answerDraft, syncLegacyAnswer, { deep: true })

/**
 * 重置答案草稿。
 * 作答方式切换后各形态的答案不可复用（字母 / 对错 / 多空 / 原文结构不同），
 * 统一清空可避免把上一种形态的残留带进新结构。
 */
const resetAnswerDraftsForMode = () => {
  answerDraft.value = createAnswerDraft()
}

/**
 * 母题结构化内容：题干 + 选项（判断题固定 true/false，选择型取填写内容，其余为空）。
 * 供后端结构化优先解析使用，缺失时后端仍回退旧字段。
 */
const buildQuestionContent = () => {
  const mode = questionForm.value.questionAnswerMode
  let optionList: Array<{ optionKey: string; optionVal: string }> = []
  if (mode === ANSWER_MODE_JUDGE) {
    optionList = [
      { optionKey: 'true', optionVal: '' },
      { optionKey: 'false', optionVal: '' },
    ]
  } else if (mode === ANSWER_MODE_SINGLE || mode === ANSWER_MODE_MULTI) {
    optionList = choiceOptions.value
      .filter((option) => option.trim())
      .map((option, index) => ({ optionKey: optionLetter(index), optionVal: option }))
  }
  return {
    questionStem: questionForm.value.question,
    // 分值 / 题内序号必须回传：后端 applyDocxFields 会无条件覆盖这两列，漏传即被清空
    questionScore: questionForm.value.questionScore,
    questionOrder: questionForm.value.questionOrder,
    questionOptionList: optionList,
    questionOptionMatrix: optionList.length > 0 ? [optionList] : [],
  }
}

// 标签题型字典（按当前书籍学科过滤）与作答方式选项
const { isChoiceQuestion, ensureLoaded, getOptionsBySubject } = useQuestionTypeDict()
// 从 questionExtra（题目扩展 JSON）中读取题目类型 code
const readQuestionTypeFromExtra = (extra?: string): number | undefined => {
  if (!extra) return undefined
  try {
    const obj = JSON.parse(extra)
    return typeof obj.questionType === 'number' ? obj.questionType : undefined
  } catch {
    return undefined
  }
}

// 将题目类型 code 合并写回 questionExtra（题目扩展 JSON），保留其它字段
const mergeQuestionTypeToExtra = (extra: string | undefined, questionType: number | undefined): string => {
  let obj: Record<string, unknown> = {}
  if (extra) {
    try {
      obj = JSON.parse(extra)
    } catch {
      obj = {}
    }
  }
  if (questionType != null) {
    obj.questionType = questionType
  } else {
    delete obj.questionType
  }
  return JSON.stringify(obj)
}

const baseTypeOptions = ref<{ typeCode: number; questionTypeZh: string }[]>([])

// 拉取题目类型（基础题型）下拉数据，来自 /question-type/base-type
const fetchBaseTypes = async () => {
  try {
    const res = await getQuestionTypeBaseTypeApi()
    if (res.data.code === 200 && res.data.data) {
      baseTypeOptions.value = res.data.data
    }
  } catch (error) {
    console.error('获取题目类型失败:', error)
  }
}

const bookSubjectCode = ref<number | undefined>(undefined)

// 获取当前书籍的 docx 学科枚举（subjectCode），优先用 book.subjectCode，缺失时由 subjectId 推导
const loadBookSubjectCode = async (projectId: string) => {
  try {
    const res = await getBookInfoDetailsApi({ id: projectId })
    if (res.data.code === 200 && res.data.data) {
      const book = res.data.data
      let code = book.subjectCode && book.subjectCode > 0 ? book.subjectCode : undefined
      if (!code && book.subjectId) {
        const sres = await getDicSubjectListApi({ type: 1 })
        const subject = (sres.data.data || []).find(s => String(s.id) === String(book.subjectId))
        code = subject?.docxCode
      }
      bookSubjectCode.value = code
    }
  } catch (error) {
    console.error('获取书籍学科枚举失败', error)
  }
}

// 当前书籍学科下的标签题型选项（typeCode 为 docx 标签题型枚举）
const questionTypeOptions = computed(() =>
  getOptionsBySubject(bookSubjectCode.value)
    .filter(t => t.typeCode != null)
    .map(t => ({ typeCode: t.typeCode as number, typeName: t.typeName || '' }))
)

// 题型大类 -> 叶子题型，构建 el-cascader 选项（仅叶子可选）
const questionTypeCascaderOptions = computed<Array<{ value: string; label: string; children: Array<{ value: number; label: string }> }>>(() => {
  const raw = getOptionsBySubject(bookSubjectCode.value).filter(t => t.typeCode != null)
  const map = new Map<string, Array<{ value: number; label: string }>>()
  for (const t of raw) {
    const key = t.categoryName || '其他'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push({ value: t.typeCode as number, label: t.typeName || '' })
  }
  return Array.from(map.entries()).map(([categoryName, children]) => ({ value: categoryName, label: categoryName, children }))
})

// 级联选择：emitPath=false 只返回叶子节点值；父节点不可选，只能选叶子
const questionTypeCascaderProps = { emitPath: false, expandTrigger: 'hover' as const }

// 作答方式常量与选项见 @/constants/answerMode，列表页与编辑页共用同一份

/**
 * 作答方式下拉的重挂载标记。
 * 下拉用 :model-value 受控（取消时值不应变化），但 el-select 内部会把选中项文本
 * 立即改成新值，仅靠 prop 不变不会刷新显示，因此取消时自增本标记强制重挂载。
 */
const answerModeSelectKey = ref(0)

/** 清空残留答案的请求进行中 */
const clearingAnswer = ref(false)

/**
 * 综合母题残留了答案。
 * 后端提交审核会校验「综合母题答案必须置空」，而作答方式为综合母题时答案区是隐藏的，
 * 若历史数据残留答案，用户没有地方清空就会一直卡住，因此单独给出提示与清空入口。
 */
const hasStaleAnswer = computed(
  () => questionForm.value.questionAnswerMode === ANSWER_MODE_COMPREHENSIVE
    && !!questionForm.value.answer && questionForm.value.answer.trim() !== '',
)

/** 答案摘要：压缩空白并按长度截断，供提示文案与残留答案预览使用 */
const answerExcerpt = (limit: number) => {
  const raw = (questionForm.value.answer || '').replace(/\s+/g, ' ').trim()
  return raw.length > limit ? raw.slice(0, limit) + '…' : raw
}

/** 残留答案预览（截断，避免长内容撑破面板） */
const staleAnswerPreview = computed(() => answerExcerpt(60))

/** 预览用答案文案：判断题还原为 对/错，填空各空以 ／ 连接 */
const answerDisplayText = computed(() =>
  draftToDisplay(questionForm.value.questionAnswerMode, answerDraft.value),
)

// 知识点标签（用于多选下拉框）
const knowledgeTags = ref<string[]>([])

// 检测内容顶部是否已有 supplement 顶层标签
const hasSupplementTop = (content: string): boolean => {
  if (!content) return false
  return /^\s*<p\s+supplement\b/i.test(content)
}

// 包装 supplement 顶层标签：检测内容顶部是否已有 supplement，没有则自动包裹
const wrapSupplement = (content: string): string => {
  if (!content) return content
  if (hasSupplementTop(content)) return content
  return `<p supplement class="">${content}</p>`
}

// 自动保存
// force = true：元信息字段（题类/难度/知识点/点评/无答案/标签题型/作答方式）改动，
//   与内容完整性无关，跳过内容校验直接提交，避免出现"改了存不进去"的情况
// force = false：题干/选项/答案/解析改动，校验不通过时不提交（错误由表单 :error 展示）
const autoSaveQuestion = async (force: boolean = false) => {
  if (!props.selectedQuestion) return

  // 如果正在保存，标记待保存，等本次结束后补存一次
  if (autoSaving.value) {
    pendingSave.value = true
    return
  }

  // 校验必填字段并更新错误显示（含文档要求的标签题型/作答方式/难度，仅提示不强拦）
  updateFieldError('question')
  updateFieldError('options')
  updateFieldError('answer')
  updateFieldError('labelQuestionType')
  updateFieldError('answerMode')
  updateFieldError('difficulty')

  const questionError = formErrors.value.question
  const optionsError = formErrors.value.options
  const answerError = formErrors.value.answer

  // 内容类改动且存在校验错误时，不进行保存
  if (!force && (questionError || optionsError || answerError)) {
    return
  }

  autoSaving.value = true
  try {
    // 补题模式：保存答案、解析、选项时，检测字段内容顶部是否已有 supplement 顶层标签，没有则自动包裹
    if (parseSettingsStore.getSupplementMode()) {
      // 答案：检测顶部是否已有 supplement 顶层标签，没有则自动包裹
      if (!hasSupplementTop(questionForm.value.answer)) {
        questionForm.value.answer = wrapSupplement(questionForm.value.answer)
      }
      // 解析：同上
      if (!hasSupplementTop(questionForm.value.analysis)) {
        questionForm.value.analysis = wrapSupplement(questionForm.value.analysis)
      }
    }

    // 同步选项到表单（转换为 JSON 数组）
    const validOptions = choiceOptions.value.filter(o => o.trim())
    const choiceJson = JSON.stringify(validOptions)

    // 获取第一个题干标注的页码（包括题干、题干图和表格）
    // 按原始顺序查找，第一个匹配的标注的页码即为题干部分的起始页码
    const questionAnnotation = annotations.value.find(ann => ann.type === 1 || ann.type === 2 || ann.type === 9)
    const page = questionAnnotation?.page

    const data: any = {
      tilei: questionForm.value.tilei,
      difficulty: questionForm.value.difficulty,
      knowledge: JSON.stringify(knowledgeTags.value),
      questionComment: questionForm.value.questionComment,
      noAnswer: questionForm.value.noAnswer,
      question: questionForm.value.question,
      choice: choiceJson,
      // 扁平 answer 与结构化 questionAnswer 同源，保证两条口径一致
      answer: draftToLegacyAnswer(questionForm.value.questionAnswerMode, answerDraft.value),
      analysis: questionForm.value.analysis,
      labelQuestionType: questionForm.value.labelQuestionType,
      questionAnswerMode: questionForm.value.questionAnswerMode,
      questionType: questionForm.value.questionType,
      // 题目内容/答案结构化（docx questionContent / questionAnswer）
      questionContent: buildQuestionContent(),
      questionAnswer: buildQuestionAnswer(questionForm.value.questionAnswerMode, answerDraft.value),
      // 后端 QuestionUpdateCmd 暂无 questionType 字段，临时持久化到 questionExtra（题目扩展）
      questionExtra: mergeQuestionTypeToExtra(questionForm.value.questionExtra, questionForm.value.questionType)
    }

    // 如果有题干标注，设置页码
    if (page !== undefined) {
      data.page = page
    }

    const response = await putQuestionUpdateApi(data, { id: props.selectedQuestion.id })
    if (response.data.code === 200) {
      // 静默保存，不显示提示
      // 通知父组件刷新题目信息
      emit('refreshQuestion')
    } else {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    console.error('自动保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    autoSaving.value = false
    // 保存期间又有改动，补存一次，避免最后一次改动丢失
    if (pendingSave.value) {
      pendingSave.value = false
      await autoSaveQuestion(force)
    }
  }
}

// 去抖自动保存
const triggerAutoSave = (force: boolean = false) => {
  if (saveTimer.value) {
    clearTimeout(saveTimer.value)
  }
  saveTimer.value = setTimeout(() => {
    autoSaveQuestion(force)
  }, 1000) // 1秒后自动保存
}

/**
 * 作答方式切换。
 *
 * 选「综合母题」时答案应由子题承载（后端提交审核也会校验「综合母题答案必须置空」），
 * 因此本题已有答案时先让用户确认再清空；用户取消则保持原作答方式不动。
 * 用 :model-value + 本方法（而非 v-model）才能做到「取消即回滚」。
 */
const handleAnswerModeChange = async (mode: number | undefined) => {
  const hasAnswer = isAnswerDraftFilled(questionForm.value.questionAnswerMode, answerDraft.value)
  if (mode === ANSWER_MODE_COMPREHENSIVE && hasAnswer) {
    try {
      await ElMessageBox.confirm(
        '「综合母题」的答案应写在子题内，不能单独填写。切换后本题答案（当前：' + answerExcerpt(20) + '）将被清空，是否继续？',
        '提示',
        { type: 'warning', confirmButtonText: '清空并切换', cancelButtonText: '取消' },
      )
    } catch {
      // 用户取消：不改动作答方式；重挂载下拉以还原显示（el-select 内部已把文本改成新值）
      answerModeSelectKey.value++
      return
    }
  }
  questionForm.value.questionAnswerMode = mode
  // 各形态答案结构不同，切换后清空草稿，避免残留被带入新结构
  resetAnswerDraftsForMode()
  ensureAnswerRows()
  formErrors.value.answer = ''
  updateFieldError('answerMode')
  if (mode === ANSWER_MODE_COMPREHENSIVE && hasAnswer) {
    ElMessage.success('已清空本题答案')
  }
  triggerAutoSave(true)
}

/**
 * 清空综合母题残留的答案并立即保存。
 */
const handleClearStaleAnswer = async () => {
  clearingAnswer.value = true
  try {
    const response = await putQuestionUpdateApi(
      { answer: '', questionAnswer: { answerOptionList: [], answerOptionMatrix: [] } },
      { id: props.selectedQuestion.id },
    )
    if (response.data.code === 200) {
      resetAnswerDraftsForMode()
      questionForm.value.answer = ''
      formErrors.value.answer = ''
      ElMessage.success('已清空本题答案')
      emit('refreshQuestion')
    } else {
      ElMessage.error(response.data.msg || '清空失败')
    }
  } catch (error) {
    console.error('清空答案失败:', error)
    ElMessage.error('清空失败')
  } finally {
    clearingAnswer.value = false
  }
}

// 处理知识点变化
const handleKnowledgeChange = (value: string[]) => {
  questionForm.value.knowledge = value.join(',')
  triggerAutoSave(true)
}

// 校验单个字段
type FormField = 'question' | 'options' | 'answer' | 'labelQuestionType' | 'answerMode' | 'difficulty'

const validateField = (fieldName: FormField): string => {
  if (fieldName === 'question') {
    if (!questionForm.value.question || questionForm.value.question.trim() === '') {
      return '题干不能为空'
    }
  } else if (fieldName === 'options') {
    // 判断题选项固定为 对/错，无需校验
    if (questionKind.value === 'judge') {
      return ''
    }
    if (questionKind.value === 'choice') {
      const validOptions = choiceOptions.value.filter(o => o.trim())
      if (validOptions.length < minChoiceOptions(questionForm.value.questionAnswerMode)) {
        return '选择题必须要有选项'
      }
    }
  } else if (fieldName === 'answer') {
    const mode = questionForm.value.questionAnswerMode
    if (mode === ANSWER_MODE_COMPREHENSIVE) {
      return ''
    }
    if (!questionForm.value.noAnswer && !isAnswerDraftFilled(mode, answerDraft.value)) {
      return '答案不能为空'
    }
    // 单选/多选答案必须落在已列出的选项范围内（字母数 = 选项行数）
    if (mode === ANSWER_MODE_SINGLE || mode === ANSWER_MODE_MULTI) {
      const limit = choiceOptions.value.length
      const keys = (mode === ANSWER_MODE_SINGLE ? answerDraft.value.rows.slice(0, 1) : answerDraft.value.rows).map(
        (row) => row.primary.optionKey,
      )
      const overflow = keys.filter(Boolean).some((key) => key.trim() && key.trim().toUpperCase().charCodeAt(0) - 65 >= limit)
      if (overflow) {
        return `答案选项超出范围（本题共 ${limit} 个选项）`
      }
    }
  } else if (fieldName === 'labelQuestionType') {
    if (questionForm.value.labelQuestionType == null) {
      return '标签题型不能为空'
    }
  } else if (fieldName === 'answerMode') {
    // 文档要求非综合母题的作答方式必填；综合母题以 0 显式表示，不算缺失
    if (questionForm.value.questionAnswerMode == null) {
      return '作答方式不能为空'
    }
  } else if (fieldName === 'difficulty') {
    if (questionForm.value.difficulty === undefined || questionForm.value.difficulty === null) {
      return '题目难度不能为空'
    }
  }
  return ''
}

// 更新字段错误
const updateFieldError = (fieldName: FormField) => {
  formErrors.value[fieldName] = validateField(fieldName)
}

// 题干失焦处理
const handleQuestionBlur = () => {
  updateFieldError('question')
  triggerAutoSave()
}

// 选项失焦处理
const handleOptionBlur = () => {
  updateFieldError('options')
  triggerAutoSave()
}

// 答案失焦处理
const handleAnswerBlur = () => {
  updateFieldError('answer')
  triggerAutoSave()
}

// 解析失焦处理
const handleAnalysisBlur = () => {
  triggerAutoSave()
}

// 智能封装
const handleSmartAssemble = async () => {
  assembling.value = true
  try {
    // 获取标注数据
    const questionAnnotations = annotations.value

    // 按类型分组标注（用于检查是否有该类型的标注）
    const typeMap: Record<number, AnnotationSimpleVO[]> = {}
    questionAnnotations.forEach(ann => {
      if (!typeMap[ann.type]) {
        typeMap[ann.type] = []
      }
      typeMap[ann.type]!.push(ann)
    })

    // 1. 拼接题干、题干图和表格（按原始顺序）
    let questionContent = ''
    const questionAnnotationsSorted = questionAnnotations.filter(ann => ann.type === 1 || ann.type === 2 || ann.type === 9)

    for (let i = 0; i < questionAnnotationsSorted.length; i++) {
      const ann = questionAnnotationsSorted[i]
      if (!ann?.analysisContent) continue

      const hasNext = i < questionAnnotationsSorted.length - 1

      if (ann.type === 1) {
        // 题干文本
        // 如果前面是图片或表格，前面加换行
        const prevType = i > 0 ? questionAnnotationsSorted[i - 1]?.type : null
        if (prevType && (prevType === 2 || prevType === 9) && questionContent && !questionContent.endsWith('\n')) {
          questionContent += '\n'
        }
        questionContent += ann.analysisContent
      } else if (ann.type === 2) {
        // 题干图（前后加换行）
        if (questionContent && !questionContent.endsWith('\n')) {
          questionContent += '\n'
        }
        questionContent += `<img src="${ann.analysisContent}" alt="题干图" />`
        // 如果后面有内容，后面加换行
        if (hasNext) {
          questionContent += '\n'
        }
      } else if (ann.type === 9) {
        // 表格（前后加换行）
        if (questionContent && !questionContent.endsWith('\n')) {
          questionContent += '\n'
        }
        questionContent += ann.analysisContent
        // 如果后面有内容，后面加换行
        if (hasNext) {
          questionContent += '\n'
        }
      }
    }

    // 2. 拼接选项和选项图（按原始顺序）
    let choiceContent = ''
    const choiceAnnotationsSorted = questionAnnotations.filter(ann => ann.type === 3 || ann.type === 4)
    const choices: string[] = []

    for (let i = 0; i < choiceAnnotationsSorted.length; i++) {
      const ann = choiceAnnotationsSorted[i]
      if (!ann?.analysisContent) continue

      const hasNext = i < choiceAnnotationsSorted.length - 1

      if (ann.type === 3) {
        // 选项文本
        if (choiceContent) {
          choiceContent += '\n'
        }
        choiceContent += ann.analysisContent
      } else if (ann.type === 4) {
        // 选项图 - 将图片链接添加到对应选项中
        const imageUrl = `<img src="${ann.analysisContent}" alt="选项图" />`

        if (choiceContent && !choiceContent.endsWith('\n')) {
          choiceContent += '\n'
        }
        choiceContent += imageUrl

        // 如果后面有内容，后面加换行
        if (hasNext) {
          choiceContent += '\n'
        }
      }
    }

    // 设置选项 - 根据规则：若只有一个选项，该内容应包含四个选项，按换行解析；若有四个选项则一对一对应
    if (choiceAnnotationsSorted.length === 1 && choiceContent) {
      // 只有一个选项标注，按换行解析
      const parsedChoices = choiceContent.split('\n').filter(c => c.trim())
      if (parsedChoices.length > 0) {
        choiceOptions.value = parsedChoices.slice(0, MAX_OPTIONS)
      }
    } else if (choiceContent) {
      // 多个选项标注，按原始解析内容作为选项
      const parsedChoices = choiceContent.split('\n').filter(c => c.trim())
      if (parsedChoices.length > 0) {
        choiceOptions.value = parsedChoices.slice(0, MAX_OPTIONS)
      }
    }

    // 3. 拼接解析和解析图（按原始顺序）
    let analysisContent = ''
    const analysisAnnotationsSorted = questionAnnotations.filter(ann => ann.type === 5 || ann.type === 6)

    for (let i = 0; i < analysisAnnotationsSorted.length; i++) {
      const ann = analysisAnnotationsSorted[i]
      if (!ann?.analysisContent) continue

      const hasNext = i < analysisAnnotationsSorted.length - 1

      if (ann.type === 5) {
        // 解析文本
        // 如果前面是图片，前面加换行
        if (i > 0 && analysisAnnotationsSorted[i - 1]?.type === 6 && analysisContent && !analysisContent.endsWith('\n')) {
          analysisContent += '\n'
        }
        analysisContent += ann.analysisContent
      } else if (ann.type === 6) {
        // 解析图（前后加换行）
        if (analysisContent && !analysisContent.endsWith('\n')) {
          analysisContent += '\n'
        }
        analysisContent += `<img src="${ann.analysisContent}" alt="解析图" />`
        // 如果后面有内容，后面加换行
        if (hasNext) {
          analysisContent += '\n'
        }
      }
    }

    // 4. 拼接答案和答案图（按原始顺序）
    let answerContent = ''
    const answerAnnotationsSorted = questionAnnotations.filter(ann => ann.type === 7 || ann.type === 8)

    for (let i = 0; i < answerAnnotationsSorted.length; i++) {
      const ann = answerAnnotationsSorted[i]
      if (!ann?.analysisContent) continue

      const hasNext = i < answerAnnotationsSorted.length - 1

      if (ann.type === 7) {
        // 答案文本
        // 如果前面是图片，前面加换行
        if (i > 0 && answerAnnotationsSorted[i - 1]?.type === 8 && answerContent && !answerContent.endsWith('\n')) {
          answerContent += '\n'
        }
        answerContent += ann.analysisContent
      } else if (ann.type === 8) {
        // 答案图（前后加换行）
        if (answerContent && !answerContent.endsWith('\n')) {
          answerContent += '\n'
        }
        answerContent += `<img src="${ann.analysisContent}" alt="答案图" />`
        // 如果后面有内容，后面加换行
        if (hasNext) {
          answerContent += '\n'
        }
      }
    }

    // 5. 自动去除题号
    if (parseSettingsStore.getAutoRemoveQuestionNum()) {
      questionContent = removeQuestionNumber(questionContent)
      analysisContent = removeQuestionNumber(analysisContent)
      answerContent = removeQuestionNumber(answerContent)
      choiceOptions.value = choiceOptions.value.map(opt => removeQuestionNumber(opt))
      choiceContent = choiceContent.split('\n').map(line => removeQuestionNumber(line)).join('\n')
    }

    // 更新表单数据
    // 普通模式：更新题干、选项、解析、答案
    if (questionContent) {
      questionForm.value.question = questionContent
    }
    if (choiceContent) {
      questionForm.value.choice = choiceContent
    }
    if (analysisContent) {
      questionForm.value.analysis = analysisContent
    }
    if (answerContent) {
      questionForm.value.answer = answerContent
      // 答案以结构化草稿（answerDraft）为准：提交与回显都读它，这里必须同步写回，
      // 否则智能封装的答案不会生效（且会被 syncLegacyAnswer 覆盖掉）
      answerDraft.value = parseLegacyAnswer(questionForm.value.questionAnswerMode, answerContent)
      ensureAnswerRows()
    }

    // 检查解析失败的字段并提示
    const failedFields: string[] = []

    // 检查解析
    if ((typeMap[5] && typeMap[5].length > 0 || typeMap[6] && typeMap[6].length > 0) && !analysisContent) {
      failedFields.push('解析')
    }

    // 检查答案
    if ((typeMap[7] && typeMap[7].length > 0 || typeMap[8] && typeMap[8].length > 0) && !answerContent) {
      failedFields.push('答案')
    }

    // 检查选项
    if ((typeMap[3] && typeMap[3].length > 0 || typeMap[4] && typeMap[4].length > 0) && !choiceContent) {
      failedFields.push('选项')
    }

    // 检查题干
    if ((typeMap[1] && typeMap[1].length > 0 || typeMap[2] && typeMap[2].length > 0 || typeMap[9] && typeMap[9].length > 0) && !questionContent) {
      failedFields.push('题干')
    }

    if (failedFields.length > 0) {
      ElMessage.warning(`智能封装完成，但以下字段解析失败：${failedFields.join('、')}`)
    } else {
      ElMessage.success('智能封装成功')
      // 智能封装成功后自动保存
      await autoSaveQuestion()
    }
  } catch (error) {
    console.error('智能封装失败:', error)
    ElMessage.error('智能封装失败')
  } finally {
    assembling.value = false
  }
}

// 去除题号
const removeQuestionNumber = (text: string): string => {
  if (!text) return text
  // 题号 / 编号规则：
  //  - 数字（半角或全角）或中文数字 + 顿号/句点/点号
  //  - 可能被文本样式 span 包裹（如 <span class="rich-text-bold">1.</span>），此时连同 span 一起移除
  // 反复剥离，直到不再变化，覆盖「大题号 + 小题号」这类连续编号
  const patterns: RegExp[] = [
    // 样式 span 包裹的题号：数字/中文数字在 span 内，标点在 span 内
    /^<span[^>]*>\s*(?:[0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*[、．.]\s*<\/span>\s*/,
    // 样式 span 包裹的编号，标点在 span 外：<span>1</span>.
    /^<span[^>]*>\s*(?:[0-9０-９]{1,3}|[一二三四五六七八九十百千]+)\s*<\/span>\s*[、．.]\s*/,
    // 中文大题号：一、 二、
    /^[一二三四五六七八九十百千]+[、．.]\s*/,
    // 半角 / 全角数字题号：4.  12.  ４．
    /^[0-9０-９]+[、．.]\s*/,
  ]
  let result = text
  let changed = true
  while (changed) {
    changed = false
    for (const pattern of patterns) {
      const next = result.replace(pattern, '')
      if (next !== result) {
        result = next
        changed = true
      }
    }
  }
  return result
}

// 添加选项
const addOption = () => {
  if (choiceOptions.value.length < MAX_OPTIONS) {
    choiceOptions.value.push('')
    triggerAutoSave()
  }
}

// 删除选项
const removeOption = (index: number) => {
  if (choiceOptions.value.length > 2) {
    choiceOptions.value.splice(index, 1)
    updateFieldError('options')
    triggerAutoSave()
  }
}

// 获取题类标签
const getTileiLabel = (value: string) => {
  return tileiLabels[value] || '-'
}

// 获取难度标签
const getDifficultyLabel = (value: number) => {
  if (value <= 0.2) return '容易'
  if (value <= 0.4) return '比较易'
  if (value <= 0.6) return '中档'
  if (value <= 0.8) return '较难'
  return '难'
}

// 判断是否为选择题类型（优先用学科题型字典 isChoice，回退旧版 tishi 字符串）
const isChoiceType = (labelQuestionType?: number | null, tishi?: string | null) =>
  isChoiceQuestion({ labelQuestionType, tishi })

/**
 * 题目作答形态：
 * - judge：作答方式=判断，或题型字典名称含"判断" → 选项固定 对/错，答案二选一
 * - choice：作答方式=单选/多选，或标签题型为选择类 → 可编辑选项
 * - none：其余题型无选项
 */
const questionKind = computed<'choice' | 'judge' | 'none'>(() => {
  const mode = questionForm.value.questionAnswerMode
  if (mode === 4) return 'judge'
  const matched = questionTypeOptions.value.find((t) => t.typeCode === questionForm.value.labelQuestionType)
  if ((matched?.typeName || '').includes('判断')) return 'judge'
  if (mode === 1 || mode === 2) return 'choice'
  if (isChoiceType(questionForm.value.labelQuestionType, questionForm.value.tishi)) return 'choice'
  return 'none'
})

// 切到判断题时同步固定选项与答案写法；离开判断题时清掉遗留的对/错选项
watch(questionKind, (kind) => {
  if (kind === 'judge') {
    choiceOptions.value = [...JUDGE_OPTIONS]
    // 仅按标签题型判定为判断（mode 未显式给出）时，从旧答案补一次草稿
    if (!answerDraft.value.judge && questionForm.value.answer) {
      answerDraft.value = parseLegacyAnswer(ANSWER_MODE_JUDGE, questionForm.value.answer)
    }
    return
  }
  if (questionForm.value.choice === JSON.stringify(JUDGE_OPTIONS)) {
    choiceOptions.value = ['', '', '', '']
    questionForm.value.choice = ''
  }
})

// 监听无答案选项变化
watch(() => questionForm.value.noAnswer, () => {
  updateFieldError('answer')
  triggerAutoSave(true)
})

// 监听题目类型变化，非选择题类型时清空选项
watch(() => questionForm.value.tishi, (newTishi, oldTishi) => {
  if (isChoiceType(questionForm.value.labelQuestionType, newTishi)) {
    // 是选择题类型
    if (!isChoiceType(questionForm.value.labelQuestionType, oldTishi)) {
      // 从非选择题切换到选择题，初始化选项
      choiceOptions.value = ['', '', '', '']
    }
    // 如果从服务器加载的 choice 数据不为空，需要重新解析
    if (questionForm.value.choice) {
      let loaded: string[] = []
      try {
        // 尝试解析为 JSON 数组
        const parsed = JSON.parse(questionForm.value.choice)
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed.map((c) => String(c))
        }
      } catch {
        // JSON 解析失败，按换行符分割
        loaded = questionForm.value.choice.split('\n').filter(c => c.trim())
      }
      // 存量判断题固定选项（对/错）不是真实选项，切到单选/多选时剔除
      if (isJudgeLeftover(loaded)) {
        loaded = []
      }
      if (loaded.length > 0) {
        choiceOptions.value = loaded
      }
    }
      } else {
        // 不是选择题类型，清空选项
        choiceOptions.value = ['', '', '', '']
        questionForm.value.choice = ''
      }
    // 更新选项错误提示
    updateFieldError('options')
}, { immediate: true })

// 解析选项（按行分割）
const parseChoices = (choiceText: string) => {
  if (!choiceText) return []
  return choiceText.split('\n').filter(line => line.trim())
}

// 模式切换处理
const handleModeChange = (value: string) => {
  if (value === 'edit') {
    // 切换到编辑模式
  }
}

// 设置模式（供外部调用）
const setMode = (mode: 'edit' | 'preview') => {
  currentMode.value = mode
  // 编辑期间子题可能已增删改，切到预览前重新取一次，保证预览内容与最新一致
  if (mode === 'preview' && props.selectedQuestion?.id) {
    loadSubQuestionDetails(props.selectedQuestion.id)
  }
}

// 处理图片路径
const processImageUrl = (url: string) => {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const sliceEndpoint = configStore.getSliceEndpoint()
  return sliceEndpoint ? `${sliceEndpoint}${url}` : url
}

// 渲染内容（支持 Markdown 和 LaTeX）
const renderContent = (content: string, forPreview: boolean = false) => {
  // 题干/选项来自用户输入或模型输出，先清洗再渲染
  return renderContentUtil(sanitizeHtml(content), forPreview ? processImageUrl : null)
}

/**
 * 单独加载子题列表（详情接口按层级递归返回 subQuestionList）。
 * 编辑模式下子题面板自行维护数据，这里只负责预览所需的只读快照。
 */
const loadSubQuestionDetails = async (questionId: string) => {
  try {
    const response = await getQuestionDetailsApi({ id: questionId })
    if (response.data.code === 200) {
      subQuestionDetails.value = response.data.data?.subQuestionList || []
    }
  } catch (error) {
    console.error('加载子题详情失败:', error)
  }
}

// 加载题目详情
const loadQuestionDetails = async (questionId: string) => {
  // 切换题目时清空上一题遗留的校验错误，避免在已填写的题目上显示陈旧红框
  formErrors.value = { question: '', options: '', answer: '', labelQuestionType: '', answerMode: '', difficulty: '' }
  try {
    const response = await getQuestionDetailsApi({ id: questionId })
    if (response.data.code === 200 && response.data.data) {
      const tishiValue = response.data.data.tishi || ''
      const choiceValue = response.data.data.choice || ''

      // 子题快照（预览模式只读展示用）
      subQuestionDetails.value = response.data.data.subQuestionList || []

      questionForm.value = {
        tilei: response.data.data.tilei || '',
        difficulty: response.data.data.difficulty !== undefined ? response.data.data.difficulty : 0,
        knowledge: response.data.data.knowledge || '',
        questionComment: response.data.data.questionComment || '',
        noAnswer: response.data.data.noAnswer || false,
        question: response.data.data.question || '',
        choice: choiceValue,
        answer: response.data.data.answer || '',
        analysis: response.data.data.analysis || '',
        tishi: tishiValue,
        labelQuestionType: response.data.data.labelQuestionType != null ? response.data.data.labelQuestionType : undefined,
        questionAnswerMode: response.data.data.questionAnswerMode != null ? response.data.data.questionAnswerMode : undefined,
        questionScore: response.data.data.questionContent?.questionScore ?? undefined,
        questionOrder: response.data.data.questionContent?.questionOrder ?? undefined,
        questionExtra: response.data.data.questionExtra || '',
        // 后端当前未回传 questionType 字段，从 questionExtra（题目扩展）中读取本地持久化的题目类型
        questionType: readQuestionTypeFromExtra(response.data.data.questionExtra)
      }

      // 初始化知识点标签
      const knowledgeValue = response.data.data.knowledge || ''
      knowledgeTags.value = []
      if (knowledgeValue) {
        try {
          // 尝试解析为 JSON 数组
          const parsed = JSON.parse(knowledgeValue)
          if (Array.isArray(parsed)) {
            knowledgeTags.value = parsed
          } else {
            // 如果不是数组，按逗号分割（兼容旧数据）
            knowledgeTags.value = knowledgeValue.split(',').filter(k => k.trim())
          }
        } catch {
          // JSON 解析失败，按逗号分割（兼容旧数据）
          knowledgeTags.value = knowledgeValue.split(',').filter(k => k.trim())
        }
      }

      // 答案草稿：优先结构化 questionAnswer，为空时按作答方式从旧 answer 兜底解析
      answerDraft.value = parseAnswerDraft(
        questionForm.value.questionAnswerMode,
        response.data.data.questionAnswer,
        response.data.data.answer,
      )
      ensureAnswerRows()
      syncLegacyAnswer()

      // 使用 nextTick 确保 questionForm 更新后再初始化选项
      await nextTick()

      // 加载标注列表：必须对所有题型执行（判断题原先前置 return 会跳过，
      // 导致智能封装读到的是空/上一题的标注 → 题干、答案解析都封不上）
      await loadAnnotations(questionId)

      // 判断题：选项固定 对/错
      if (questionKind.value === 'judge') {
        choiceOptions.value = [...JUDGE_OPTIONS]
        questionForm.value.choice = JSON.stringify(JUDGE_OPTIONS)
        updateFieldError('answer')
      } else if (isChoiceType(response.data.data.labelQuestionType, tishiValue) && choiceValue) {
        let choices: string[] = []
        try {
          // 尝试解析为 JSON 数组
          const parsed = JSON.parse(choiceValue)
          if (Array.isArray(parsed)) {
            choices = parsed.map((c) => String(c))
          } else {
            // 如果不是数组，按换行符分割
            choices = choiceValue.split('\n').filter(c => c.trim())
          }
        } catch {
          // JSON 解析失败，按换行符分割
          choices = choiceValue.split('\n').filter(c => c.trim())
        }
        // 存量判断题固定选项（对/错）不是真实选项，切到单选/多选时剔除，避免凭空多出两项
        if (isJudgeLeftover(choices)) {
          choices = []
        }
        choiceOptions.value = choices.length > 0 ? choices : ['', '', '', '']
      } else {
        choiceOptions.value = ['', '', '', '']
      }

      // 检查是否需要自动智能封装
      if (parseSettingsStore.getAutoParse() && !response.data.data.page) {
        await handleSmartAssemble()
      }
    }
  } catch (error) {
    console.error('加载题目详情失败:', error)
    ElMessage.error('加载题目详情失败')
  }
}

// 加载标注列表
const loadAnnotations = async (questionId: string) => {
  try {
    const response = await getAnnotationListApi({ questionId })
    if (response.data.code === 200 && response.data.data) {
      annotations.value = response.data.data
    }
  } catch (error) {
    console.error('加载标注列表失败:', error)
  }
}

// 监听选中的题目变化
watch(() => props.selectedQuestion, (newQuestion, oldQuestion) => {
  if (newQuestion) {
    // 标签题型字典与书籍学科枚举（用于过滤标签题型下拉），与题目加载并行
    ensureLoaded()
    fetchBaseTypes()
    loadBookSubjectCode(newQuestion.projectId)
    // 检查是否是同一个题目但题型发生变化
    if (oldQuestion && newQuestion.id === oldQuestion.id && newQuestion.tishi !== oldQuestion.tishi) {
      // 同一题目题型变化，只更新 tishi 并触发相关逻辑
      questionForm.value.tishi = newQuestion.tishi || ''
    } else {
      // 不同的题目，重新加载详情
      loadQuestionDetails(newQuestion.id)
    }
  }
}, { immediate: true, deep: true })

// 暴露方法（外部切换题目/关闭面板时调用，强制提交，避免未保存的元信息丢失）
/**
 * 快捷新增子题：挂到当前编辑的题目下。
 * 预览模式下子题面板未渲染，先切回编辑模式再新增。
 */
const addSubQuestion = async () => {
  if (!props.selectedQuestion) {
    ElMessage.warning('请先选中一道题目')
    return
  }
  if (currentMode.value !== 'edit') {
    setMode('edit')
    await nextTick()
  }
  subQuestionPanelRef.value?.handleAdd()
}

defineExpose({
  autoSaveQuestion: (force: boolean = true) => autoSaveQuestion(force),
  setMode,
  addSubQuestion
})
</script>

<style scoped>
.question-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-switcher {
  display: flex;
  justify-content: center;
  background: white;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.mode-switcher :deep(.el-segmented) {
  --el-segmented-bg-color: #f3f4f6;
  --el-segmented-item-selected-bg-color: #409eff;
  --el-segmented-item-selected-color: #fff;
  padding: 4px;
  width: 100%;
}

.mode-switcher :deep(.el-segmented__item) {
  padding: 10px 32px;
  font-size: 15px;
  font-weight: 500;
}

.detail-section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-editor .el-form {
  margin-bottom: 0;
}

.question-editor .el-form-item {
  margin-bottom: 12px;
}

/* 校验错误默认绝对定位，会压住下方控件（选项「添加选项」按钮、答案输入框）。
   改为文档流内显示，出现错误时把后续内容向下推，避免遮挡与重叠。 */
.question-editor .el-form-item__error {
  position: static;
  margin-top: 4px;
}

.question-editor .el-form-item:last-child {
  margin-bottom: 0;
}

/* 选项容器样式 */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.option-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-preview {
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
}

.option-preview :deep(img) {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item-full {
  display: flex;
  align-items: flex-start;
  font-size: 13px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.info-item-full .label {
  color: #6b7280;
  min-width: 70px;
}

.info-item-full .value {
  color: #374151;
  font-weight: 500;
  line-height: 1.6;
}

/* 预览模式样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}

.info-item .label {
  color: #6b7280;
  min-width: 70px;
}

.info-item .value {
  color: #374151;
  font-weight: 500;
}

.content-box {
  background-color: #f9fafb;
  border-radius: 4px;
  padding: 10px;
}

.preview-box {
  min-height: 120px;
}

.content-box.overflow-auto {
  max-height: 300px;
  overflow: auto;
}

.preview-content {
  font-size: 13px;
  line-height: 1.8;
  color: #374151;
}


.block-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.choice-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.choice-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  background-color: #f9fafb;
  border-radius: 4px;
}

.choice-item :deep(img) {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
  margin-top: 8px;
}

.latex-error {
  color: #dc2626;
  font-family: monospace;
  background-color: #fef2f2;
  padding: 2px 6px;
  border-radius: 3px;
}

.block-content :deep(.katex) {
  font-size: 1em;
}

.block-content :deep(.katex-display) {
  margin: 12px 0;
  overflow-x: auto;
}

/* 判断题固定选项展示 */
.judge-options {
  color: var(--el-text-color-secondary, #909399);
}

/* 预览模式下的只读子题列表 */
.sub-preview-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sub-preview-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.sub-preview-no {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.sub-preview-score {
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 子题目块在预览里的留白比主内容略小 */
.sub-preview-item .preview-box {
  min-height: auto;
}

</style>
