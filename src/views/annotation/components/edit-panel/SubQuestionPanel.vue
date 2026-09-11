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
            <el-select v-model="item.questionAnswerMode" placeholder="请选择" style="width: 100%">
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
        <el-form-item label="答案">
          <el-input v-model="item.answer" type="textarea" :rows="2" placeholder="请输入答案" />
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
  saving?: boolean
}

const children = ref<SubQuestionRow[]>([])
const questionTypes = ref<Array<{ typeCode: number; typeName?: string }>>([])

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
      item.typeCode === undefined ? [] : [{ typeCode: item.typeCode, typeName: item.typeName }],
    )
  } catch (error) {
    console.error('题型字典加载失败:', error)
  }
}

/** 题目详情 → 编辑行 */
const toRow = (detail: QuestionDetailsVO): SubQuestionRow => ({
  key: detail.id,
  id: detail.id,
  labelQuestionType: detail.labelQuestionType,
  questionAnswerMode: detail.questionAnswerMode,
  questionScore: detail.questionContent?.questionScore,
  questionStem: detail.questionContent?.questionStem || detail.question || '',
  answer: detail.answer || '',
})

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
    questionAnswerMode: 1,
  })
}

/** 保存：新建走 create，已存在走 update */
const handleSave = async (row: SubQuestionRow) => {
  if (!row.questionStem.trim()) {
    ElMessage.warning('请先填写题干')
    return
  }

  row.saving = true
  try {
    const payload = {
      labelQuestionType: row.labelQuestionType,
      questionAnswerMode: row.questionAnswerMode,
      question: row.questionStem,
      answer: row.answer,
      parentId: props.questionId,
      level: childLevel.value,
      questionContent: {
        questionStem: row.questionStem,
        questionScore: row.questionScore,
      },
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

.nested-panel {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid var(--el-color-primary-light-7, #c6e2ff);
}
</style>
