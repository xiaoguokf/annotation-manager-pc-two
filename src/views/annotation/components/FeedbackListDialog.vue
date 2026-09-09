<template>
  <el-dialog
    v-model="dialogVisible"
    title="审核反馈"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 反馈列表 -->
    <div v-loading="loading" class="feedback-list">
      <el-empty v-if="!loading && feedbackList.length === 0" description="暂无反馈" />

      <div v-else class="feedback-items">
        <div
          v-for="feedback in feedbackList"
          :key="feedback.id"
          class="feedback-item"
          :class="{ 'feedback-item-handled': feedback.passed }"
        >
          <div class="feedback-header">
            <div class="feedback-type">
              <el-tag :type="getTypeTagType(feedback.type)" size="small">
                {{ getTypeName(feedback.type) }}
              </el-tag>
              <span v-if="feedback.nickname" class="feedback-auditor">
                处理人：{{ feedback.nickname }}
              </span>
              <el-button
                v-if="feedback.type === 4 && feedback.objectId"
                link
                type="primary"
                size="small"
                @click="handleGoToQuestion(feedback.objectId)"
                class="feedback-jump-btn"
              >
                跳转到题目
              </el-button>
            </div>
            <div class="feedback-status">
              <el-tag v-if="feedback.passed" type="success" size="small">已处理</el-tag>
              <el-tag v-else type="warning" size="small">待处理</el-tag>
            </div>
          </div>

          <div class="feedback-content">
            <div class="feedback-label">反馈内容：</div>
            <div class="feedback-text">{{ feedback.content }}</div>
          </div>

          <div v-if="feedback.type === 3 && feedback.cataloguePath" class="feedback-catalogue">
            <div class="feedback-label">目录路径：</div>
            <div class="feedback-text">{{ feedback.cataloguePath }}</div>
          </div>

          <div v-if="feedback.handContent" class="feedback-hand">
            <div class="feedback-label">处理内容：</div>
            <div class="feedback-text">{{ feedback.handContent }}</div>
          </div>

          <!-- 处理反馈表单 -->
          <div v-if="!feedback.passed" class="feedback-action">
            <el-input
              v-model="feedback.handContentInput"
              type="textarea"
              :rows="2"
              placeholder="请输入处理内容（可选）..."
              class="feedback-input"
            />
            <el-button
              type="primary"
              size="small"
              :loading="feedback.handling"
              @click="handleFeedbackClick(feedback)"
            >
              处理
            </el-button>
          </div>

          <div class="feedback-footer">
            <span class="feedback-time">创建时间：{{ formatTime(feedback.createTime) }}</span>
            <span v-if="feedback.handTime" class="feedback-time ml-4">处理时间：{{ formatTime(feedback.handTime) }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { ProjectAuditVO } from '@/api/gen/projectAuditController'
import { getAuditProjectListApi, putAuditProjectHandleApi } from '@/api/gen/projectAuditController'
import { getQuestionCatalogueIdApi } from '@/api/gen/questionController'

interface Props {
  visible: boolean
  projectId: string
  type?: 'book' | 'doc'
  catalogueTreeRef?: any
}

// 扩展反馈类型，添加 UI 相关字段
interface FeedbackItem extends ProjectAuditVO {
  handContentInput?: string
  handling?: boolean
  cataloguePath?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'feedback-handled': []
  'go-to-question': [questionId: string, catalogueId: string, page: number]
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const feedbackList = ref<FeedbackItem[]>([])

// 未处理反馈数量（暴露给父组件）
const unhandledCount = ref(0)

// 类型映射
const typeMap: Record<number, string> = {
  1: '书籍审核',
  2: '内容页审核',
  3: '目录审核',
  4: '题目审核'
}

// 获取类型名称
const getTypeName = (type: number) => {
  return typeMap[type] || '未知类型'
}

// 获取类型标签样式
const getTypeTagType = (type: number): 'primary' | 'success' | 'info' | 'warning' | 'danger' => {
  const tagTypeMap: Record<number, 'primary' | 'success' | 'info' | 'warning' | 'danger'> = {
    1: 'primary',
    2: 'info',
    3: 'success',
    4: 'warning'
  }
  return tagTypeMap[type] || 'info'
}

// 格式化时间
const formatTime = (time: string) => {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 加载反馈列表
const loadFeedbackList = async () => {
  if (!props.projectId) return

  loading.value = true
  try {
    const response = await getAuditProjectListApi({ projectId: props.projectId })
    const result = response.data
    if (result && result.data && Array.isArray(result.data)) {
      // 按创建时间倒序排列
      feedbackList.value = [...result.data].sort((a: ProjectAuditVO, b: ProjectAuditVO) =>
        new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      )
      // 更新未处理反馈数量
      unhandledCount.value = feedbackList.value.filter(item => !item.passed).length

      // 为目录类型的反馈构建目录路径（仅书籍类型）
      if (props.type === 'book' && props.catalogueTreeRef) {
        const buildCataloguePath = props.catalogueTreeRef.buildCataloguePath
        if (typeof buildCataloguePath === 'function') {
          feedbackList.value.forEach(feedback => {
            if (feedback.type === 3 && feedback.objectId) {
              feedback.cataloguePath = buildCataloguePath(feedback.objectId)
            }
          })
        }
      }
    } else {
      feedbackList.value = []
      unhandledCount.value = 0
    }
  } catch (error) {
    console.error('加载反馈列表失败：', error)
    ElMessage.error('加载反馈列表失败')
    feedbackList.value = []
    unhandledCount.value = 0
  } finally {
    loading.value = false
  }
}

// 处理反馈
const handleFeedback = async (feedbackId: string, handContent: string) => {
  try {
    const response = await putAuditProjectHandleApi(
      { handContent },
      { auditId: feedbackId }
    )
    const result = response.data
    if (result && result.code === 200) {
      ElMessage.success('处理成功')
      // 重新加载反馈列表
      await loadFeedbackList()
      // 通知父组件反馈已处理
      emit('feedback-handled')
    } else {
      ElMessage.error(result?.msg || '处理失败')
    }
  } catch (error) {
    console.error('处理反馈失败：', error)
    ElMessage.error('处理反馈失败')
  }
}

// 点击处理按钮
const handleFeedbackClick = async (feedback: FeedbackItem) => {
  feedback.handling = true
  try {
    const response = await putAuditProjectHandleApi(
      { handContent: feedback.handContentInput || '' },
      { auditId: feedback.id }
    )
    const result = response.data
    if (result && result.code === 200) {
      ElMessage.success('处理成功')
      // 重新加载反馈列表
      await loadFeedbackList()
      // 通知父组件反馈已处理
      emit('feedback-handled')
    } else {
      ElMessage.error(result?.msg || '处理失败')
    }
  } catch (error) {
    console.error('处理反馈失败：', error)
    ElMessage.error('处理反馈失败')
  } finally {
    feedback.handling = false
  }
}

// 检查是否有未处理的反馈
const hasUnhandledFeedback = () => {
  return feedbackList.value.some(item => !item.passed)
}

// 跳转到题目
const handleGoToQuestion = async (questionId: string) => {
  try {
    const response = await getQuestionCatalogueIdApi({ questionId })
    const result = response.data
    if (result && result.code === 200 && result.data) {
      // 关闭反馈对话框
      dialogVisible.value = false
      // 通知父组件跳转到题目，同时传递页码
      emit('go-to-question', questionId, result.data.catalogueId, result.data.page)
    } else {
      ElMessage.error(result?.msg || '获取题目信息失败')
    }
  } catch (error) {
    console.error('跳转到题目失败', error)
    ElMessage.error('跳转到题目失败')
  }
}

// 监听 visible 变化
watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    loadFeedbackList()
  }
})

// 监听 dialogVisible 变化
watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 暴露方法给父组件
defineExpose({
  loadFeedbackList,
  hasUnhandledFeedback,
  handleFeedback,
  unhandledCount,
  feedbackList
})
</script>

<style scoped>
.feedback-list {
  max-height: 500px;
  overflow-y: auto;
}

.feedback-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.feedback-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  transition: all 0.3s;
}

.feedback-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feedback-item-handled {
  opacity: 0.6;
  background: #f9fafc;
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.feedback-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-auditor {
  font-size: 14px;
  color: #606266;
}

.feedback-content,
.feedback-hand,
.feedback-catalogue {
  margin-bottom: 8px;
}

.feedback-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.feedback-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.feedback-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.feedback-time {
  font-size: 12px;
  color: #909399;
}

.ml-4 {
  margin-left: 16px;
}

.feedback-action {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.feedback-input {
  flex: 1;
}
</style>
