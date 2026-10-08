<template>
  <div class="sub-question-panel">
    <div class="panel-actions">
      <el-button size="small" type="primary" :disabled="!canAdd" :loading="creating" @click="handleAdd">
        <Icon v-if="!creating" icon="ep:plus" class="mr-1" />
        {{ creating ? '新增中…' : '新增子题' }}
      </el-button>
      <span v-if="!canAdd" class="tip">该题已是二级子题，不能再挂子题</span>
    </div>

    <div v-for="item in children" :key="item.key" class="sub-question-item">
      <el-form label-width="72px" size="small">
        <div class="form-row">
          <el-form-item label="题型">
            <el-select
              v-model="item.labelQuestionType"
              filterable
              placeholder="请选择题型"
              style="width: 100%"
              @change="handleKindChange(item)"
            >
              <el-option
                v-for="type in questionTypes"
                :key="type.typeCode"
                :label="type.typeName"
                :value="type.typeCode"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="作答方式">
            <!-- :model-value + @change 而非 v-model：切到「综合母题」需先确认清空答案，
                 用户取消时值不能被改掉 -->
            <el-select
              :key="item.answerModeSelectKey"
              :model-value="item.questionAnswerMode"
              placeholder="请选择"
              style="width: 100%"
              @change="(mode: number | undefined) => handleKindChange(item, mode)"
            >
              <el-option
                v-for="mode in answerModeOptions"
                :key="mode.value"
                :label="mode.label"
                :value="mode.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分值">
            <el-input-number v-model="item.questionScore" :min="0" :precision="1" controls-position="right"
              @change="triggerAutoSave(item, true, true)" />
          </el-form-item>
          <el-form-item label="难度">
            <el-input-number v-model="item.difficulty" :min="0" :max="1" :step="0.1" :precision="1"
              controls-position="right" placeholder="难度" @change="triggerAutoSave(item, true, true)" />
          </el-form-item>
        </div>

        <el-form-item label="题干">
          <el-input
            v-model="item.questionStem"
            type="textarea"
            :rows="3"
            placeholder="富文本 HTML，公式请使用 \(..\) 或 \[..\]"
            @input="triggerAutoSave(item)"
          />
        </el-form-item>
        <!-- 选择型（单选/多选）子题：可编辑选项，保存到 choice 字段 -->
        <el-form-item v-if="getRowKind(item) === 'choice'" label="选项">
          <div class="options-container">
            <div v-for="(_, idx) in item.choiceOptions" :key="idx" class="option-item">
              <el-input
                v-model="item.choiceOptions[idx]"
                type="textarea"
                :rows="1"
                placeholder="请输入选项内容"
                @input="triggerAutoSave(item)"
              />
              <el-button
                type="danger"
                size="small"
                circle
                :disabled="item.choiceOptions.length <= minChoiceOptions(item.questionAnswerMode)"
                @click="item.choiceOptions.splice(idx, 1); triggerAutoSave(item, true)"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <el-button
              size="small"
              type="primary"
              :disabled="item.choiceOptions.length >= MAX_OPTIONS"
              @click="item.choiceOptions.push(''); triggerAutoSave(item, true)"
            >
              <Icon icon="ep:plus" class="mr-1" />
              添加选项
            </el-button>
          </div>
        </el-form-item>
        <!-- 判断题子题：固定 对/错 两个选项 -->
        <el-form-item v-else-if="getRowKind(item) === 'judge'" label="选项">
          <span class="judge-options">对 / 错</span>
        </el-form-item>

        <el-form-item label="答案">
          <!-- 判断题：对/错 单选；内部值为字符串 "true"/"false" -->
          <el-radio-group
            v-if="item.questionAnswerMode === ANSWER_MODE_JUDGE"
            v-model="item.answerDraft.judge"
            @change="triggerAutoSave(item, true)"
          >
            <el-radio value="true">对</el-radio>
            <el-radio value="false">错</el-radio>
          </el-radio-group>
          <!-- 单选 / 多选：一行一个正确选项，每行可再加备选答案 -->
          <AnswerRowsEditor
            v-else-if="item.questionAnswerMode === ANSWER_MODE_SINGLE || item.questionAnswerMode === ANSWER_MODE_MULTI"
            v-model="item.answerDraft.rows"
            variant="choice"
            add-row-label="添加选项"
            @blur="triggerAutoSave(item, true)"
          />
          <!-- 填空：一行一空，每空可再加备选答案 -->
          <AnswerRowsEditor
            v-else-if="item.questionAnswerMode === ANSWER_MODE_BLANK"
            v-model="item.answerDraft.rows"
            variant="text"
            add-row-label="添加空"
            text-placeholder="请输入本空答案"
            :stem="item.questionStem"
            @blur="triggerAutoSave(item, true)"
            @input="triggerAutoSave(item)"
          />
          <!-- 解答：单行答案 + 备选答案 -->
          <AnswerRowsEditor
            v-else
            v-model="item.answerDraft.rows"
            variant="text"
            text-placeholder="请输入答案"
            @blur="triggerAutoSave(item, true)"
            @input="triggerAutoSave(item)"
          />
        </el-form-item>
        <el-form-item label="解析">
          <el-input
            v-model="item.analysis"
            type="textarea"
            :rows="2"
            placeholder="请输入解析，支持 Markdown 和 LaTeX 公式"
            @input="triggerAutoSave(item)"
          />
        </el-form-item>

        <div class="item-actions">
          <span class="save-hint">
            <Icon v-if="item.saving" icon="ep:loading" class="is-spinning" />
            {{ item.saving ? '保存中…' : '已自动保存' }}
          </span>
          <el-button size="small" type="primary" :loading="item.saving" @click="handleSave(item)">
            保存
          </el-button>
          <el-button size="small" @click="handleRemove(item)">删除</el-button>
        </div>
      </el-form>
    </div>

    <el-empty v-if="children.length === 0" description="暂无子题" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Icon } from '@iconify/vue'
import {
  getQuestionDetailsApi,
  postQuestionCreateApi,
  putQuestionUpdateApi,
  deleteQuestionDeleteApi,
  type QuestionDetailsVO,
} from '@/api/gen/questionController'
import { getQuestionTypeListApi } from '@/api/gen/questionType'
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
  MAX_OPTIONS,
  buildQuestionAnswer,
  createAnswerDraft,
  createAnswerRow,
  draftToLegacyAnswer,
  isAnswerDraftFilled,
  isJudgeLeftover,
  optionLetter,
  parseAnswerDraft,
} from '@/utils/questionAnswer'
import AnswerRowsEditor from './AnswerRowsEditor.vue'

const props = defineProps<{
  /** 母题ID */
  questionId: string
  /** 项目ID */
  projectId: string
  /** 目录ID（子题与母题同目录） */
  catalogueId?: string
  /** 学科枚举，用于按学科筛选题型字典；不传返回全部 */
  subjectCode?: number
  /** 0-书籍，1-试卷 */
  type?: number
  /** 当前题目层级：0-母题，1-一级子题，2-二级子题；新增的子题层级为其 +1 */
  level: number
}>()

const emit = defineEmits<{
  /** 子题列表发生变化；参数为发生变化的父题目ID，供题目列表刷新后展开定位 */
  changed: [parentId: string]
}>()

/** 最大层级（0 母题 / 1 一级子题 / 2 二级子题） */
const LEVEL_MAX = 2

/** 子题编辑行 */
interface SubQuestionRow {
  key: string
  id?: string
  labelQuestionType?: number
  questionAnswerMode?: number
  questionScore?: number
  /** 题内序号（docx questionOrder）；仅回传保留，避免保存时被清空 */
  questionOrder?: number
  /** 题目难度（与母题一致，独立填写，不继承母题） */
  difficulty?: number
  questionStem: string
  answer: string
  analysis: string
  /** 选项内容（选择型/判断题使用），保存时序列化为 choice JSON 数组 */
  choiceOptions: string[]
  /** 结构化答案草稿：按作答方式采集 */
  answerDraft: AnswerDraft
  saving?: boolean
  /**
   * 作答方式下拉的重挂载标记。
   * 下拉用 :model-value 受控（取消时值不应变化），但 el-select 内部会把选中项文本
   * 立即改成新值，仅靠 prop 不变不会刷新显示，因此取消时自增本标记强制重挂载。
   */
  answerModeSelectKey?: number
}

const children = ref<SubQuestionRow[]>([])
const questionTypes = ref<Array<{ typeCode: number; typeName?: string; baseType?: number }>>([])

/** 新增子题请求进行中，避免重复点击创建出多条空子题 */
const creating = ref(false)
/** 每题一个去抖定时器：题目ID/行key → timer */
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()
/** 保存期间又被编辑的行，保存结束后补存一次，避免最后一次改动丢失 */
const pendingSaveKeys = new Set<string>()
/** 去抖间隔，与母题编辑面板保持一致 */
const AUTO_SAVE_DELAY = 1000

/**
 * 子题题型类别：
 * - choice：选择型，显示可编辑选项
 * - judge：判断题，固定 对/错 选项，答案为单选
 * - none：其余题型无选项
 *
 * 作答方式优先于字典：显式选了单选/多选/判断就必须按对应形态渲染，
 * 否则「听力选择」这类字典 baseType 未标选择的题型会被判成 none —— 选项区不显示、
 * 答案字母也无处生成。字典判定仅作答方式缺失时兜底。
 */
const getRowKind = (row: SubQuestionRow): 'choice' | 'judge' | 'none' => {
  if (row.questionAnswerMode === 4) return 'judge'
  if (row.questionAnswerMode === 1 || row.questionAnswerMode === 2) return 'choice'
  const t = questionTypes.value.find((x) => x.typeCode === row.labelQuestionType)
  if (t) {
    if ((t.typeName || '').includes('判断')) return 'judge'
    if (t.baseType === 1) return 'choice'
  }
  return 'none'
}

/** 解析 choice JSON 字符串为选项数组，解析失败返回空数组 */
const parseChoice = (choice?: string): string[] => {
  if (!choice) return []
  try {
    const parsed = JSON.parse(choice)
    return Array.isArray(parsed) ? parsed.map((c) => String(c)) : []
  } catch {
    return choice.split('\n').filter((c) => c.trim())
  }
}

/** 按当前题型类别初始化选项（切换题型/作答方式时调用） */
const initChoiceOptions = (row: SubQuestionRow) => {
  const kind = getRowKind(row)
  if (kind === 'judge') {
    row.choiceOptions = ['对', '错']
  } else   if (kind === 'choice') {
    if (row.choiceOptions.filter((o) => o.trim()).length < minChoiceOptions(row.questionAnswerMode)) {
      row.choiceOptions = ['', '', '', '']
    }
  } else {
    row.choiceOptions = []
  }
}

/**
 * 题型/作答方式变化后重新初始化选项，并立即保存该字段。
 *
 * 切到「综合母题」时答案应写在子题内（后端提交审核会校验「综合母题答案必须置空」），
 * 因此本行已有答案时先让用户确认再清空；用户取消则保持原作答方式不动。
 */
const handleKindChange = async (row: SubQuestionRow, mode?: number) => {
  if (mode !== undefined) {
    const hasAnswer = isAnswerFilled(row)
    if (mode === ANSWER_MODE_COMPREHENSIVE && hasAnswer) {
      try {
        await ElMessageBox.confirm(
          '「综合母题」的答案应写在子题内，不能单独填写。切换后本题答案将被清空，是否继续？',
          '提示',
          { type: 'warning', confirmButtonText: '清空并切换', cancelButtonText: '取消' },
        )
      } catch {
        // 用户取消：不改动作答方式；重挂载下拉以还原显示（el-select 内部已把文本改成新值）
        row.answerModeSelectKey = (row.answerModeSelectKey ?? 0) + 1
        return
      }
      ElMessage.success('已清空本题答案')
    }
    row.questionAnswerMode = mode
    // 各形态答案结构不同，切换后清空草稿，避免残留被带入新结构
    row.answerDraft = createAnswerDraft()
    ensureAnswerRows(row)
  }
  row.answer = draftToLegacyAnswer(row.questionAnswerMode, row.answerDraft)
  initChoiceOptions(row)
  // 切换题型/作答方式会重置答案草稿，属结构性变更，force 跳过答案必填拦截
  triggerAutoSave(row, true, true)
}

/** 答案至少渲染一行，避免切到单选/多选/填空/解答时列表为空 */
const ensureAnswerRows = (row: SubQuestionRow) => {
  const mode = row.questionAnswerMode
  const needRow =
    mode === ANSWER_MODE_SINGLE || mode === ANSWER_MODE_MULTI || mode === ANSWER_MODE_BLANK || mode === ANSWER_MODE_ANSWER
  if (needRow && row.answerDraft.rows.length === 0) {
    row.answerDraft.rows = [createAnswerRow()]
  }
}

/** 子题答案是否已填写（按作答方式判定），供切换确认使用 */
const isAnswerFilled = (row: SubQuestionRow): boolean =>
  Object.values(row.answerDraft).some((val) =>
    Array.isArray(val) ? val.some((item) => String(item).trim() !== '') : String(val ?? '').trim() !== '',
  )

/** 本面板渲染的子题层级 */
const childLevel = computed(() => props.level + 1)

const canAdd = computed(() => childLevel.value <= LEVEL_MAX)

/** 题型字典：按学科加载，未传学科时返回全部 */
const loadQuestionTypes = async () => {
  try {
    const res = await getQuestionTypeListApi({ subjectCode: props.subjectCode })
    // 下拉需要确定的枚举值，缺失 typeCode 的脏数据不参与渲染
    questionTypes.value = (res.data?.data || []).flatMap((item) =>
      item.typeCode === undefined
        ? []
        : [{ typeCode: item.typeCode, typeName: item.typeName, baseType: item.baseType }],
    )
  } catch (error) {
    console.error('题型字典加载失败:', error)
  }
}

/** 题目详情 → 编辑行 */
const toRow = (detail: QuestionDetailsVO): SubQuestionRow => {
  const row: SubQuestionRow = {
    key: detail.id,
    id: detail.id,
    labelQuestionType: detail.labelQuestionType,
    questionAnswerMode: detail.questionAnswerMode,
    questionScore: detail.questionContent?.questionScore,
    questionOrder: detail.questionContent?.questionOrder,
    difficulty: detail.difficulty,
    questionStem: detail.questionContent?.questionStem || detail.question || '',
    answer: detail.answer || '',
    analysis: detail.analysis || '',
    choiceOptions: [],
    answerDraft: createAnswerDraft(),
  }
  // 答案草稿：优先结构化 questionAnswer，为空时按作答方式从旧 answer 兜底解析
  row.answerDraft = parseAnswerDraft(row.questionAnswerMode, detail.questionAnswer, detail.answer)
  ensureAnswerRows(row)
  row.answer = draftToLegacyAnswer(row.questionAnswerMode, row.answerDraft)
  row.choiceOptions = parseChoice(detail.choice)
  // 存量判断题固定选项（对/错）不是真实选项，切到选择型时剔除，避免凭空多出两项
  if (getRowKind(row) !== 'judge' && isJudgeLeftover(row.choiceOptions)) {
    row.choiceOptions = []
  }
  // 选择型子题即使尚无选项，也要给出默认选项行，否则答案字母无从生成
  initChoiceOptions(row)
  return row
}

/** 清空所有待执行的去抖保存（刷新/卸载前调用，避免用旧行对象回写） */
const clearSaveTimers = () => {
  saveTimers.forEach(timer => clearTimeout(timer))
  saveTimers.clear()
  pendingSaveKeys.clear()
}

/**
 * 加载子题：详情接口已按层级递归返回 subQuestionList
 */
const loadChildren = async () => {
  clearSaveTimers()
  try {
    const res = await getQuestionDetailsApi({ id: props.questionId })
    children.value = (res.data?.data?.subQuestionList || []).map(toRow)
  } catch (error) {
    console.error('子题加载失败:', error)
  }
}

/**
 * 新增子题：点击即入库，不再需要先加草稿行再点保存。
 * 创建后由服务端返回的数据渲染行，题目列表同步刷新并展开出现该子题。
 */
const handleAdd = async () => {
  if (!canAdd.value) {
    ElMessage.warning('最多支持两级子题')
    return
  }
  if (creating.value) return

  creating.value = true
  try {
    const response = await postQuestionCreateApi({
      projectId: props.projectId,
      catalogueId: props.catalogueId,
      type: props.type ?? 0,
      parentId: props.questionId,
      level: childLevel.value,
      // 新建时用中性的「综合母题」，避免默认单选却无选项导致的保存拦截
      questionAnswerMode: ANSWER_MODE_COMPREHENSIVE,
    })
    if (response.data.code === 200) {
      await loadChildren()
      emit('changed', props.questionId)
    } else {
      ElMessage.error(response.data.msg || '新增子题失败')
    }
  } catch (error) {
    console.error('新增子题失败:', error)
    ElMessage.error('新增子题失败')
  } finally {
    creating.value = false
  }
}

/** 组装保存载荷；选项按题型归一化 */
const buildSavePayload = (row: SubQuestionRow) => {
  const kind = getRowKind(row)
  const validOptions = row.choiceOptions.map((o) => o.trim()).filter((o) => o)
  // 结构化选项：判断题固定 true/false，选择型取填写内容，其余为空
  const optionList =
    kind === 'judge'
      ? [
          { optionKey: 'true', optionVal: '' },
          { optionKey: 'false', optionVal: '' },
        ]
      : kind === 'choice'
        ? validOptions.map((val, index) => ({ optionKey: optionLetter(index), optionVal: val }))
        : []
  return {
    labelQuestionType: row.labelQuestionType,
    questionAnswerMode: row.questionAnswerMode,
    difficulty: row.difficulty,
    question: row.questionStem,
    // 扁平 answer 与结构化 questionAnswer 同源，保证两条口径一致
    answer: draftToLegacyAnswer(row.questionAnswerMode, row.answerDraft),
    analysis: row.analysis,
    parentId: props.questionId,
    level: childLevel.value,
    questionContent: {
      questionStem: row.questionStem,
      // 分值 / 题内序号必须回传：后端 applyDocxFields 会无条件覆盖这两列，漏传即被清空
      questionScore: row.questionScore,
      questionOrder: row.questionOrder,
      questionOptionList: optionList,
      questionOptionMatrix: optionList.length > 0 ? [optionList] : [],
    },
    questionAnswer: buildQuestionAnswer(row.questionAnswerMode, row.answerDraft),
    // 选项：判断题固定 对/错，选择型取填写内容，其余题型清空
    choice:
      kind === 'judge'
        ? JSON.stringify(['对', '错'])
        : kind === 'choice'
          ? JSON.stringify(validOptions)
          : '',
  }
}

/**
 * 保存子题。
 * @param silent 自动保存模式：不弹提示、不整体重载行以免打断输入
 * @param force  结构性变更（题型/作答方式）专用：跳过答案必填拦截，避免改了存不进去
 */
const handleSave = async (row: SubQuestionRow, silent = false, force = false) => {
  if (!row.id) return

  // 答案必填：综合母题的答案写在子题内，不参与校验；其余作答方式空答案一律不保存（自动保存同样拦截）
  const answerRequired = row.questionAnswerMode !== ANSWER_MODE_COMPREHENSIVE
  if (!force && answerRequired && !isAnswerDraftFilled(row.questionAnswerMode, row.answerDraft)) {
    if (!silent) ElMessage.warning('答案不能为空')
    return
  }

  // 显式保存才做选项完整性校验；自动保存允许半成品，避免打字过程中反复报错
  if (!silent) {
    if (!row.questionStem.trim()) {
      ElMessage.warning('请先填写题干')
      return
    }
    const kind = getRowKind(row)
    const validOptions = row.choiceOptions.map((o) => o.trim()).filter((o) => o)
    if (kind === 'choice' && validOptions.length < 2) {
      ElMessage.warning('请至少填写 2 个选项内容')
      return
    }
  }

  // 保存中再次触发，标记待补存
  if (row.saving) {
    pendingSaveKeys.add(row.key)
    return
  }

  row.saving = true
  try {
    const response = await putQuestionUpdateApi(buildSavePayload(row), { id: row.id })
    if (response.data.code === 200) {
      if (!silent) {
        ElMessage.success('保存成功')
        await loadChildren()
      }
      // 题型等字段会体现在题目列表上，通知父组件刷新（不重载本面板，避免打断输入）
      emit('changed', props.questionId)
    } else if (!silent) {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    console.error('子题保存失败:', error)
    if (!silent) {
      ElMessage.error('保存失败，请重试')
    }
  } finally {
    row.saving = false
    if (pendingSaveKeys.has(row.key)) {
      pendingSaveKeys.delete(row.key)
      triggerAutoSave(row)
    }
  }
}

/**
 * 去抖自动保存；immediate 用于下拉/单选框这类一次性动作。
 * force=true 用于题型/作答方式等结构性变更：跳过答案必填拦截，避免半成品状态下字段改动存不进去。
 */
const triggerAutoSave = (row: SubQuestionRow, immediate = false, force = false) => {
  if (!row.id) return
  const prev = saveTimers.get(row.key)
  if (prev) clearTimeout(prev)
  if (immediate) {
    saveTimers.delete(row.key)
    handleSave(row, true, force)
    return
  }
  saveTimers.set(
    row.key,
    setTimeout(() => {
      saveTimers.delete(row.key)
      handleSave(row, true, force)
    }, AUTO_SAVE_DELAY),
  )
}

const handleRemove = async (row: SubQuestionRow) => {
  if (!row.id) {
    children.value = children.value.filter((item) => item.key !== row.key)
    return
  }

  // 新增即入库，未填内容的行视为误点，直接删除不打扰用户
  const isBlank = !row.questionStem.trim() && !row.answer.trim() && !row.analysis.trim()
  if (!isBlank) {
    try {
      await ElMessageBox.confirm('删除后该子题及其下级子题都会移除，确认删除？', '提示', {
        type: 'warning',
      })
    } catch {
      return
    }
  }

  try {
    await deleteQuestionDeleteApi({ id: row.id })
    ElMessage.success('删除成功')
    await loadChildren()
    emit('changed', props.questionId)
  } catch (error) {
    console.error('子题删除失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

onMounted(async () => {
  await loadQuestionTypes()
  await loadChildren()
})

// 卸载前清掉待执行的自动保存，避免对已销毁组件的行回写
onUnmounted(() => {
  clearSaveTimers()
})

defineExpose({
  /** 供快捷键调用：新增一条子题（内部已做层级校验与防重） */
  handleAdd
})
</script>

<style scoped>
.sub-question-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tip {
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}

.sub-question-item {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 6px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row :deep(.el-form-item) {
  flex: 1;
}

.save-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: auto;
  color: var(--el-text-color-secondary, #909399);
  font-size: 12px;
}

.item-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.option-item .el-button {
  flex-shrink: 0;
}

.judge-options {
  color: var(--el-text-color-secondary, #909399);
}

</style>
