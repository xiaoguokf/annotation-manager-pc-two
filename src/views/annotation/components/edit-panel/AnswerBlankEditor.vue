<template>
  <div class="answer-blank-editor">
    <div v-for="(_, index) in modelValue" :key="index" class="blank-item">
      <span class="blank-label">空{{ index + 1 }}</span>
      <el-input
        :model-value="modelValue[index]"
        type="textarea"
        :rows="1"
        placeholder="请输入本空答案，支持 Markdown 和 LaTeX 公式"
        @input="(val: string) => updateBlank(index, val)"
      />
      <el-button
        type="danger"
        size="small"
        circle
        :disabled="modelValue.length <= 1"
        @click="removeBlank(index)"
      >
        <Icon icon="ep:delete" />
      </el-button>
    </div>
    <div class="blank-actions">
      <el-button type="primary" size="small" @click="addBlank">
        <Icon icon="ep:plus" class="mr-1" />
        添加空
      </el-button>
      <el-button v-if="stemBlankCount > modelValue.length" size="small" @click="syncFromStem">
        按题干补全 {{ stemBlankCount }} 空
      </el-button>
      <span v-if="stemBlankCount > 0" class="blank-tip">题干识别到 {{ stemBlankCount }} 个空位</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { countBlanks } from '@/utils/questionAnswer'

const props = defineProps<{
  /** 各空答案；一空一条 */
  modelValue: string[]
  /** 题干富文本，用于识别空位数量 */
  stem?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

/** 题干空位数量（空数真源） */
const stemBlankCount = computed(() => countBlanks(props.stem))

const updateBlank = (index: number, value: string) => {
  const next = [...props.modelValue]
  next[index] = value
  emit('update:modelValue', next)
}

const addBlank = () => {
  emit('update:modelValue', [...props.modelValue, ''])
}

const removeBlank = (index: number) => {
  if (props.modelValue.length <= 1) return
  emit('update:modelValue', props.modelValue.filter((_, i) => i !== index))
}

/** 按题干空位数补齐（只增不减，已填内容不丢） */
const syncFromStem = () => {
  const next = [...props.modelValue]
  while (next.length < stemBlankCount.value) next.push('')
  emit('update:modelValue', next)
}

// 题干空位增加时自动补空；减少时不静默删答案，交由用户处理
watch(stemBlankCount, (count) => {
  if (count > props.modelValue.length) syncFromStem()
})
</script>

<style scoped>
.answer-blank-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.blank-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.blank-label {
  flex-shrink: 0;
  min-width: 36px;
  line-height: 32px;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.blank-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.blank-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>
