<template>
  <div class="sub-question-panel">
    <div class="panel-actions">
      <el-button size="small" type="primary" :disabled="!canAdd" @click="handleAdd">
        <Icon icon="ep:plus" class="mr-1" />
        新增子题（{{ childLevelLabel }}）
      </el-button>
      <span v-if="!canAdd" class="tip">已达最大层级（母题 + 两级子题）</span>
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
            <el-select v-model="item.questionAnswerMode" placeholder="请选择" style="width: 100%" @change="handleKindChange(item)">
              <el-option
                v-for="mode in ANSWER_MODES"
                :key="mode.value"
                :label="mode.label"
                :value="mode.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="分值">
            <el-input-number v-model="item.questionScore" :min="0" :precision="1" controls-position="right" />
          </el-form-item>
        </div>

        <el-form-item label="题干">
          <el-input
            v-model="item.questionStem"
            type="textarea"
            :rows="3"
            placeholder="富文本 HTML，公式请使用 \(..\) 或 \[..\]"
          />
        </el-form-item>
        <!-- 选择型（单选/多选）子题：可编辑选项，保存到 choice 字段 -->
        <el-form-item v-if="getRowKind(item) === 'choice'" label="选项">
          <div class="options-container">
            <div v-for="(_, idx) in item.choiceOptions" :key="idx" class="option-item">
              <span class="option-label">{{ optionLetter(idx) }}</span>
              <el-input
                v-model="item.choiceOptions[idx]"
                type="textarea"
                :rows="1"
                placeholder="请输入选项内容"
              />
              <el-button
                type="danger"
                size="small"
                circle
                :disabled="item.choiceOptions.length <= 2"
                @click="item.choiceOptions.splice(idx, 1)"
              >
                <Icon icon="ep:delete" />
              </el-button>
            </div>
            <el-button
              size="small"
              type="primary"
              :disabled="item.choiceOptions.length >= 8"
              @click="item.choiceOptions.push('')"
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
          <!-- 判断题：对/错 单选 -->
          <el-radio-group v-if="getRowKind(item) === 'judge'" v-model="item.answer">
            <el-radio value="对">对</el-radio>
            <el-radio value="错">错</el-radio>
          </el-radio-group>
          <!-- 单选：从选项中选一个字母 -->
          <el-select
            v-else-if="getRowKind(item) === 'choice' && item.questionAnswerMode !== 2"
            v-model="item.answer"
            placeholder="请选择答案"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="(_, idx) in item.choiceOptions"
              :key="idx"
              :label="optionLetter(idx)"
              :value="optionLetter(idx)"
            />
          </el-select>
          <el-input v-else v-model="item.answer" type="textarea" :rows="2" placeholder="请输入答案" />
        </el-form-item>
        <el-form-item label="解析">
          <el-input
            v-model="item.analysis"
            type="textarea"
            :rows="2"
            placeholder="请输入解析，支持 Markdown 和 LaTeX 公式"
          />
        </el-form-item>

        <div class="item-actions">
          <el-button size="small" type="primary" :loading="item.saving" @click="handleSave(item)">
            保存
          </el-button>
          <el-button size="small" @click="handleRemove(item)">删除</el-button>
        </div>
      </el-form>

      <!-- 下一级子题：只有一级子题（level 1）还能再挂子题 -->
      <SubQuestionPanel
        v-if="item.id && childLevel < 2"
        class="nested-panel"
        :question-id="item.id"
        :project-id="projectId"
        :catalogue-id="catalogueId"
        :subject-code="subjectCode"
        :type="type"
        :level="childLevel"
        @changed="emit('changed')"
      />
    </div>

    <el-empty v-if="children.length === 0" description="暂无子题" :image-size="60" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
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

// 组件内递归引用自身，需要显式声明组件名
defineOptions({ name: 'SubQuestionPanel' })

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
  /** 当前母题层级：0-母题，1-一级子题 */
  level: number
}>()

const emit = defineEmits<{
  changed: []
}>()

/** 作答方式：与后端 questionAnswerMode 一致 */
const ANSWER_MODES = [
  { label: '综合母题', value: 0 },
  { label: '单选', value: 1 },
  { label: '多选', value: 2 },
  { label: '填空', value: 3 },
  { label: '判断', value: 4 },
  { label: '解答', value: 5 },
]

/** 最大层级（0 母题 / 1 一级子题 / 2 二级子题） */
const LEVEL_MAX = 2

/** 子题编辑行 */
interface SubQuestionRow {
  key: string
  id?: string
  labelQuestionType?: number
  questionAnswerMode?: number
  questionScore?: number
  questionStem: string
  answer: string
  analysis: string
  /** 选项内容（选择型/判断题使用），保存时序列化为 choice JSON 数组 */
  choiceOptions: string[]
  saving?: boolean
}

const children = ref<SubQuestionRow[]>([])
const questionTypes = ref<Array<{ typeCode: number; typeName?: string; baseType?: number }>>([])

/** 选项字母：0->A, 1->B ... */
const optionLetter = (idx: number): string => String.fromCharCode(65 + idx)

/**
 * 子题题型类别：
 * - choice：选择型（字典 baseType=1，即单选/多选），显示可编辑选项
 * - judge：判断题，固定 对/错 选项，答案为单选
 * - none：其余题型无选项
 * 题型未选择时，回退用作答方式判断（1/2-单选多选，4-判断）
 */
const getRowKind = (row: SubQuestionRow): 'choice' | 'judge' | 'none' => {
  const t = questionTypes.value.find((x) => x.typeCode === row.labelQuestionType)
  if (t) {
    if ((t.typeName || '').includes('判断')) return 'judge'
    if (t.baseType === 1) return 'choice'
    return 'none'
  }
  if (row.questionAnswerMode === 4) return 'judge'
  if (row.questionAnswerMode === 1 || row.questionAnswerMode === 2) return 'choice'
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
  } else if (kind === 'choice') {
    if (row.choiceOptions.filter((o) => o.trim()).length < 2) {
      row.choiceOptions = ['', '', '', '']
    }
  } else {
    row.choiceOptions = []
  }
}

/** 题型/作答方式变化后重新初始化选项 */
const handleKindChange = (row: SubQuestionRow) => {
  initChoiceOptions(row)
}

/** 本面板渲染的子题层级 */
const childLevel = computed(() => props.level + 1)

const canAdd = computed(() => childLevel.value <= LEVEL_MAX)

const childLevelLabel = computed(() =>
  childLevel.value === 1 ? '一级' : childLevel.value === 2 ? '二级' : `第 ${childLevel.value} 级`,
)

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
    questionStem: detail.questionContent?.questionStem || detail.question || '',
    answer: detail.answer || '',
    analysis: detail.analysis || '',
    choiceOptions: [],
  }
  // 兼容旧数据：判断题答案可能以 true/false 存储
  if (row.answer === 'true') row.answer = '对'
  if (row.answer === 'false') row.answer = '错'
  row.choiceOptions = parseChoice(detail.choice)
  if (getRowKind(row) === 'judge') row.choiceOptions = ['对', '错']
  return row
}

/**
 * 加载子题：详情接口已按层级递归返回 subQuestionList
 */
const loadChildren = async () => {
  try {
    const res = await getQuestionDetailsApi({ id: props.questionId })
    children.value = (res.data?.data?.subQuestionList || []).map(toRow)
  } catch (error) {
    console.error('子题加载失败:', error)
  }
}

const handleAdd = () => {
  if (!canAdd.value) {
    ElMessage.warning('最多支持两级子题')
    return
  }

  children.value.push({
    key: `new-${Date.now()}`,
    questionStem: '',
    answer: '',
    analysis: '',
    questionAnswerMode: 1,
    choiceOptions: ['', '', '', ''],
  })
}

/** 保存：新建走 create，已存在走 update */
const handleSave = async (row: SubQuestionRow) => {
  if (!row.questionStem.trim()) {
    ElMessage.warning('请先填写题干')
    return
  }

  const kind = getRowKind(row)

  // 选择型子题必须至少有 2 个非空选项
  const validOptions = row.choiceOptions.map((o) => o.trim()).filter((o) => o)
  if (kind === 'choice' && validOptions.length < 2) {
    ElMessage.warning('请至少填写 2 个选项内容')
    return
  }

  row.saving = true
  try {
    const payload = {
      labelQuestionType: row.labelQuestionType,
      questionAnswerMode: row.questionAnswerMode,
      question: row.questionStem,
      answer: row.answer,
      analysis: row.analysis,
      parentId: props.questionId,
      level: childLevel.value,
      questionContent: {
        questionStem: row.questionStem,
        questionScore: row.questionScore,
      },
      // 选项：判断题固定 对/错，选择型取填写内容，其余题型清空
      choice:
        kind === 'judge'
          ? JSON.stringify(['对', '错'])
          : kind === 'choice'
            ? JSON.stringify(validOptions)
            : '',
    }

    if (row.id) {
      await putQuestionUpdateApi(payload, { id: row.id })
    } else {
      await postQuestionCreateApi({
        projectId: props.projectId,
        catalogueId: props.catalogueId,
        type: props.type ?? 0,
        ...payload,
      })
    }

    ElMessage.success('保存成功')
    await loadChildren()
    emit('changed')
  } catch (error) {
    console.error('子题保存失败:', error)
    ElMessage.error('保存失败，请重试')
  } finally {
    row.saving = false
  }
}

const handleRemove = async (row: SubQuestionRow) => {
  // 未保存的新增行直接移除
  if (!row.id) {
    children.value = children.value.filter((item) => item.key !== row.key)
    return
  }

  try {
    await ElMessageBox.confirm('删除后该子题及其下级子题都会移除，确认删除？', '提示', {
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteQuestionDeleteApi({ id: row.id })
    ElMessage.success('删除成功')
    await loadChildren()
    emit('changed')
  } catch (error) {
    console.error('子题删除失败:', error)
    ElMessage.error('删除失败，请重试')
  }
}

onMounted(async () => {
  await loadQuestionTypes()
  await loadChildren()
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

.option-label {
  flex-shrink: 0;
  width: 20px;
  line-height: 32px;
  font-weight: 600;
  text-align: center;
}

.option-item .el-button {
  flex-shrink: 0;
}

.judge-options {
  color: var(--el-text-color-secondary, #909399);
}

.nested-panel {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid var(--el-color-primary-light-7, #c6e2ff);
}
</style>
