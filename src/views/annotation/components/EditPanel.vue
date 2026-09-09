<template>
  <div class="edit-panel-container h-full flex flex-col">
    <div class="panel-header p-3 border-b border-gray-200 flex items-center justify-between">
      <span class="font-medium">编辑区域</span>
    </div>
    <div class="panel-content flex-1 p-3 overflow-auto">
      <!-- 未选择任何内容时显示空状态 -->
      <div v-if="!selectedAnnotation && !selectedQuestion" class="flex items-center justify-center h-full text-gray-400">
        <div class="text-center">
          <Icon icon="ep:setting" :width="48" :height="48" class="mb-2" />
          <p>编辑区域</p>
        </div>
      </div>

      <!-- 题目编辑区域 -->
      <QuestionEditor
        v-else-if="selectedQuestion"
        :key="selectedQuestion.id"
        :selectedQuestion="selectedQuestion"
        ref="questionEditorRef"
        @refresh-question="handleRefreshQuestion"
      />

      <!-- 文本标注编辑区域 -->
      <AnnotationTextEditor
        v-else-if="selectedAnnotation && isTextType(selectedAnnotation.type)"
        :selectedAnnotation="selectedAnnotation"
        ref="textEditorRef"
        @retryParse="handleRetryParse"
        @updateContent="handleUpdateContent"
      />

      <!-- 图片标注编辑区域 -->
      <AnnotationImageEditor
        v-else-if="selectedAnnotation && isImageType(selectedAnnotation.type)"
        :selectedAnnotation="selectedAnnotation"
        ref="imageEditorRef"
        @retryParse="handleRetryParse"
        @updateAnnotation="handleUpdateAnnotation"
        @annotation-parse-start="handleAnnotationParseStart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { type AnnotationSimpleVO } from '@/api/gen/annotationController'
import { type QuestionVO } from '@/api/gen/questionController'
import AnnotationTextEditor from './edit-panel/AnnotationTextEditor.vue'
import AnnotationImageEditor from './edit-panel/AnnotationImageEditor.vue'
import QuestionEditor from './edit-panel/QuestionEditor.vue'

interface Props {
  projectId: string
  type?: 'book' | 'doc'
}

const props = defineProps<Props>()

const emit = defineEmits(['retryParse', 'updateContent', 'refreshQuestion', 'updateAnnotation', 'annotationParseStart'])

const selectedAnnotation = ref<AnnotationSimpleVO | null>(null)
const selectedQuestion = ref<QuestionVO | null>(null)

const textEditorRef = ref()
const imageEditorRef = ref()
const questionEditorRef = ref()

// 图片类型
const imageTypes = [2, 4, 6, 8]

// 判断是否为图片类型
const isImageType = (type: number) => {
  return imageTypes.includes(type)
}

// 判断是否为文本类型（非图片类型）
const isTextType = (type: number) => {
  return !imageTypes.includes(type)
}

// 监听选中的标注变化，切换前保存
watch(selectedAnnotation, async (newAnnotation, oldAnnotation) => {
  // 如果从文本标注切换到另一个标注，先保存当前内容
  if (oldAnnotation && newAnnotation && oldAnnotation.id !== newAnnotation.id) {
    if (textEditorRef.value?.autoSave) {
      await textEditorRef.value.autoSave()
    }
  }
})

// 设置选中的标注
const setSelectedAnnotation = (annotation: AnnotationSimpleVO) => {
  console.log('[EditPanel] setSelectedAnnotation 被调用', {
    annotationId: annotation?.id,
    url: annotation?.url,
    result: annotation?.result,
    analysisContent: annotation?.analysisContent
  })
  selectedQuestion.value = null
  selectedAnnotation.value = annotation
}

// 设置选中的题目
const setSelectedQuestion = (question: QuestionVO) => {
  selectedAnnotation.value = null
  selectedQuestion.value = question
}

// 重新生成
const handleRetryParse = (annotation: AnnotationSimpleVO) => {
  emit('retryParse', annotation)
}

// 更新内容
const handleUpdateContent = (data: { annotationId: string; content: string }) => {
  emit('updateContent', data)
}

// 更新标注状态
const handleUpdateAnnotation = (annotation: AnnotationSimpleVO) => {
  emit('updateAnnotation', annotation)
}

// 处理标注开始解析
const handleAnnotationParseStart = (data: { annotationId: string; questionId: string }) => {
  emit('annotationParseStart', data)
}

// 刷新题目
const handleRefreshQuestion = () => {
  emit('refreshQuestion')
}

// 清除选中
const clearSelection = async () => {
  if (textEditorRef.value?.autoSave) {
    await textEditorRef.value.autoSave()
  }
  if (questionEditorRef.value?.autoSaveQuestion) {
    await questionEditorRef.value.autoSaveQuestion()
  }
  selectedAnnotation.value = null
  selectedQuestion.value = null
}

// 组件销毁前自动保存
onBeforeUnmount(async () => {
  await clearSelection()
})

// 刷新
const refresh = () => {
  // 刷新逻辑
}

// 切换到编辑模式
const switchToEditMode = () => {
  if (questionEditorRef.value) {
    questionEditorRef.value.setMode('edit')
  }
}

// 切换到预览模式
const switchToPreviewMode = () => {
  if (questionEditorRef.value) {
    questionEditorRef.value.setMode('preview')
  }
}

// 暴露方法
defineExpose({
  setSelectedAnnotation,
  setSelectedQuestion,
  refresh,
  clearSelection,
  getSelectedAnnotation: () => selectedAnnotation.value?.id || null,
  getSelectedQuestion: () => selectedQuestion.value?.id || null,
  switchToEditMode,
  switchToPreviewMode
})
</script>

<style scoped>
.edit-panel-container {
  height: 100%;
}

.panel-header {
  background-color: #fafafa;
}

.panel-content {
  background-color: #f5f5f5;
}
</style>
