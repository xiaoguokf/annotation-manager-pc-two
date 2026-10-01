<template>
  <div class="answer-rows">
    <div v-for="(row, idx) in modelValue" :key="idx" class="answer-row">
      <div class="answer-row-main">
        <!-- 选择题：主答案是一个选项字母 -->
        <el-input
          v-if="variant === 'choice'"
          :model-value="row.primary.optionKey"
          placeholder="请输入正确选项字母，如 A"
          style="width: 200px"
          @update:model-value="(val: string) => updateKey(idx, val)"
          @blur="emit('blur')"
        />
        <!-- 填空/解答：主答案是文本 -->
        <el-input
          v-else
          :model-value="row.primary.optionVal"
          type="textarea"
          :rows="1"
          :placeholder="textPlaceholder"
          style="flex: 1"
          @update:model-value="(val: string) => updateVal(idx, val)"
          @blur="emit('blur')"
          @input="emit('input')"
        />
        <el-button
          type="danger"
          size="small"
          circle
          :disabled="modelValue.length <= 1"
          @click="removeRow(idx)"
        >
          <Icon icon="ep:delete" />
        </el-button>
      </div>

      <!-- 每条答案下的备选答案（docx extendOptionList） -->
      <div class="answer-row-ext">
        <div v-for="(ext, extIdx) in row.extends" :key="extIdx" class="answer-ext-item">
          <span class="answer-ext-tag">备选</span>
          <el-input
            v-if="variant === 'choice'"
            :model-value="ext.optionKey"
            placeholder="备选选项字母"
            style="width: 160px"
            @update:model-value="(val: string) => updateExtKey(idx, extIdx, val)"
            @blur="emit('blur')"
          />
          <el-input
            v-else
            :model-value="ext.optionVal"
            type="textarea"
            :rows="1"
            placeholder="备选答案"
            style="flex: 1"
            @update:model-value="(val: string) => updateExtVal(idx, extIdx, val)"
            @blur="emit('blur')"
            @input="emit('input')"
          />
          <el-button type="danger" size="small" circle @click="removeExt(idx, extIdx)">
            <Icon icon="ep:delete" />
          </el-button>
        </div>
        <el-button size="small" @click="addExt(idx)">
          <Icon icon="ep:plus" class="mr-1" />
          添加答案
        </el-button>
      </div>
    </div>

    <div class="answer-rows-actions">
      <el-button v-if="addRowLabel" type="primary" size="small" @click="addRow">
        <Icon icon="ep:plus" class="mr-1" />
        {{ addRowLabel }}
      </el-button>
      <el-button v-if="variant === 'text' && stemBlankCount > modelValue.length" size="small" @click="syncFromStem">
        按题干补全 {{ stemBlankCount }} 空
      </el-button>
      <span v-if="variant === 'text' && stemBlankCount > 0" class="answer-rows-tip">
        题干识别到 {{ stemBlankCount }} 个空位
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  type AnswerRow,
  countBlanks,
  createAnswerRow,
  normalizeChoiceKeys,
} from '@/utils/questionAnswer'

const props = defineProps<{
  /** 答案行：主答案 + 备选答案 */
  modelValue: AnswerRow[]
  /** choice-选项字母；text-答案文本 */
  variant: 'choice' | 'text'
  /** 「添加一行」按钮文案；为空则不显示该按钮（如解答题只有一行） */
  addRowLabel?: string
  /** 文本输入占位符 */
  textPlaceholder?: string
  /** 题干富文本：文本型用于识别空位数量（仅填空传） */
  stem?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AnswerRow[]]
  blur: []
  input: []
}>()

const textPlaceholder = computed(() => props.textPlaceholder || '请输入答案')
const stemBlankCount = computed(() => countBlanks(props.stem))

const updateKey = (index: number, value: string) => {
  const rows = props.modelValue.map((row, i) =>
    i === index
      ? { ...row, primary: { ...row.primary, optionKey: normalizeChoiceKeys(value)[0] ?? '' } }
      : row,
  )
  emit('update:modelValue', rows)
}

const updateVal = (index: number, value: string) => {
  const rows = props.modelValue.map((row, i) =>
    i === index ? { ...row, primary: { ...row.primary, optionVal: value } } : row,
  )
  emit('update:modelValue', rows)
}

const updateExtKey = (rowIndex: number, extIndex: number, value: string) => {
  const rows = props.modelValue.map((row, i) => {
    if (i !== rowIndex) return row
    const next = row.extends.map((cell, j) =>
      j === extIndex ? { ...cell, optionKey: normalizeChoiceKeys(value)[0] ?? '' } : cell,
    )
    return { ...row, extends: next }
  })
  emit('update:modelValue', rows)
}

const updateExtVal = (rowIndex: number, extIndex: number, value: string) => {
  const rows = props.modelValue.map((row, i) => {
    if (i !== rowIndex) return row
    const next = row.extends.map((cell, j) => (j === extIndex ? { ...cell, optionVal: value } : cell))
    return { ...row, extends: next }
  })
  emit('update:modelValue', rows)
}

const addRow = () => emit('update:modelValue', [...props.modelValue, createAnswerRow()])

const removeRow = (index: number) => {
  if (props.modelValue.length <= 1) return
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

const addExt = (rowIndex: number) => {
  const rows = props.modelValue.map((row, i) =>
    i === rowIndex ? { ...row, extends: [...row.extends, { optionKey: '', optionVal: '' }] } : row,
  )
  emit('update:modelValue', rows)
}

const removeExt = (rowIndex: number, extIndex: number) => {
  const rows = props.modelValue.map((row, i) =>
    i === rowIndex ? { ...row, extends: row.extends.filter((_, j) => j !== extIndex) } : row,
  )
  emit('update:modelValue', rows)
}

/** 按题干空位数补齐主答案行（只增不减，已填内容不丢） */
const syncFromStem = () => {
  const rows = [...props.modelValue]
  while (rows.length < stemBlankCount.value) rows.push(createAnswerRow())
  emit('update:modelValue', rows)
}

// 题干空位增加时自动补行；减少时不静默删答案，交由用户处理
watch(stemBlankCount, (count) => {
  if (props.variant === 'text' && count > props.modelValue.length) syncFromStem()
})
</script>

<style scoped>
.answer-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.answer-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.answer-row-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.answer-row-ext {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 16px;
}

.answer-ext-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.answer-ext-tag {
  flex-shrink: 0;
  line-height: 32px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}

.answer-rows-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.answer-rows-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>
