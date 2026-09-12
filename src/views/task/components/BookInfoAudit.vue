<template>
  <el-card class="paper-card">
    <template v-slot:header>
      <div class="clearfix">
        <div class="header-left">
          <span class="section-title">{{ type === 'book' ? '书籍信息审核' : '试卷信息审核' }}</span>
        </div>
        <div v-if="type === 'book' && !isReadonly" class="header-right">
          <el-button size="small" :type="editMode ? 'primary' : 'default'" @click="toggleEditMode">
            <Icon :icon="editMode ? 'ep:document-checked' : 'ep:edit'" style="margin-right: 4px;" />
            {{ editMode ? '保存' : '编辑' }}
          </el-button>
          <el-button v-if="editMode" size="small" @click="cancelEdit">取消</el-button>
        </div>
      </div>
    </template>

    <div class="info-container">
      <div class="visual-panel">
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="is-loading">
            <Icon icon="ep:loading" />
          </el-icon>
          <span>加载中...</span>
        </div>
        <el-descriptions v-else-if="projectInfo || docInfo" :column="2" border>
          <!-- 书籍信息 -->
          <template v-if="type === 'book' && projectInfo">
            <!-- 编辑模式 -->
            <template v-if="editMode">
              <el-descriptions-item label="书籍名称" :span="2">
                <el-input v-model="editForm.title" placeholder="请输入书籍名称" />
              </el-descriptions-item>
              <el-descriptions-item label="学科">
                <el-select v-model="editForm.subjectId" placeholder="请选择学科" style="width: 100%" filterable>
                  <el-option v-for="item in subjectList.filter(i => i.id)" :key="item.id" :label="item.subjectName" :value="item.id!" />
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item label="册别">
                <el-select v-model="editForm.volumeId" placeholder="请选择册别" style="width: 100%" filterable>
                  <el-option v-for="item in volumeList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
                </el-select>
              </el-descriptions-item>
              <el-descriptions-item label="版本">
                <el-select v-model="editForm.bookVersionId" placeholder="请选择版本" style="width: 100%" filterable>
                  <el-option v-for="item in versionList.filter(i => i.id)" :key="item.id" :label="item.name" :value="item.id!" />
                </el-select>
              </el-descriptions-item>
            </template>
            <!-- 只读模式（非编辑状态时才显示） -->
            <template v-else>
              <el-descriptions-item label="书籍名称">{{ rawImportData?.bookname || projectInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="学科">{{ rawImportData?.subject || getSubjectName(projectInfo.subjectId)
              }}</el-descriptions-item>
            <el-descriptions-item label="册别">{{ rawImportData?.volume || getVolumeName(projectInfo.volumeId)
              }}</el-descriptions-item>
            <el-descriptions-item label="版本">{{ rawImportData?.bookVersion || getVersionName(projectInfo.bookVersionId)
              }}</el-descriptions-item>
            </template>
          </template>
          <!-- 试卷信息 -->
          <template v-else-if="type === 'doc' && docInfo">
            <el-descriptions-item label="试卷名称">{{ docInfo.title }}</el-descriptions-item>
            <el-descriptions-item label="学段">{{ getStepName(docInfo.stepId) }}</el-descriptions-item>
            <el-descriptions-item label="年级">{{ getGradeName(docInfo.gradeId) }}</el-descriptions-item>
            <el-descriptions-item label="学科">{{ getSubjectName(docInfo.subjectId) }}</el-descriptions-item>
            <el-descriptions-item label="所属省/市">{{ getProvinceName(docInfo.provinceId) }}</el-descriptions-item>
            <el-descriptions-item label="所属市/区">{{ getCityName(docInfo.cityId) }}</el-descriptions-item>
            <el-descriptions-item label="年份">{{ docInfo.year || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学期">
              {{ docInfo.term === 1 ? '上学期' : '下学期' }}
            </el-descriptions-item>
            <el-descriptions-item label="试卷类型">
              {{ getPaperTypeText(docInfo.paperType) }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(docInfo.status)">
                {{ getStatusText(docInfo.status) }}
              </el-tag>
            </el-descriptions-item>
          </template>
        </el-descriptions>
        <div v-else class="no-data">
          暂无数据
        </div>
      </div>
    </div>

    <!-- 添加审核反馈 -->
    <el-divider v-if="!isReadonly" content-position="left">添加审核反馈</el-divider>
    <el-input v-if="!isReadonly" v-model="feedbackContent" type="textarea" :rows="3" placeholder="请输入审核反馈内容"
      style="margin-bottom: 10px;" />
    <div v-if="!isReadonly" style="text-align: right;">
      <el-button type="primary" @click="handleSubmitFeedback">提交反馈</el-button>
    </div>

    <!-- 该区域的审核记录 -->
    <template v-if="auditRecords.length > 0">
      <el-divider content-position="left">审核记录 ({{ auditRecords.length }})</el-divider>
      <div class="records-list">
        <div v-for="record in auditRecords" :key="record.id" class="record-item">
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
            <div v-if="record.passed && (record.nickname || record.username)" class="meta-right">
              <span class="handler-info">
                <Icon icon="ep:user" :width="12" :height="12" />
                {{ record.nickname || record.username }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getBookInfoDetailsApi, putBookInfoUpdateApi, type BookVO, type BookUpdateCmd } from '@/api/gen/bookController'
import { getDocInfoDetailsApi, type DocVO } from '@/api/gen/docController'
import type { ProjectAuditVO } from '@/api/gen/projectAuditController'

const props = defineProps<{
  projectId: string
  type: 'book' | 'doc'
  auditRecords: ProjectAuditVO[]
  gradeList?: { id?: string; gradeName?: string }[]
  subjectList?: { id?: string; subjectName?: string }[]
  volumeList?: { id?: string; name?: string }[]
  versionList?: { id?: string; name?: string }[]
  provinceList?: { id?: string; name?: string; code?: string; level?: number; parentCode?: string }[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addAudit: [data: { type: number; objectId?: string; content: string }]
  refresh: []
}>()

// 只读模式
const isReadonly = computed(() => props.readonly === true)

// 数据
const projectInfo = ref<BookVO | null>(null)
const docInfo = ref<DocVO | null>(null)
const feedbackContent = ref('')
const loading = ref(false)
// 原始导入数据（JSON格式，包含中文名称）
const rawImportData = ref<Record<string, any> | null>(null)

// 编辑模式状态
const editMode = ref(false)
const editSubmitting = ref(false)

// 编辑表单数据
const editForm = reactive<Omit<BookUpdateCmd, 'provinceId' | 'cityId'>>({
  title: '',
  subjectId: undefined,
  volumeId: undefined,
  bookVersionId: undefined
})

// 使用父组件传递的字典数据
const gradeList = computed(() => props.gradeList || [])
const subjectList = computed(() => props.subjectList || [])
const volumeList = computed(() => props.volumeList || [])
const versionList = computed(() => props.versionList || [])
const provinceList = computed(() => props.provinceList || [])

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

// 获取册别名称
const getVolumeName = (id: string | undefined) => {
  if (!id) return '-'
  const item = volumeList.value.find(v => v.id === id)
  return item?.name || id
}

// 获取版本名称
const getVersionName = (id: string | undefined) => {
  if (!id) return '-'
  const item = versionList.value.find(v => v.id === id)
  return item?.name || id
}

// 获取省份名称
const getProvinceName = (id: string | undefined) => {
  if (!id) return '-'
  const item = provinceList.value.find(p => p.id === id)
  return item?.name || id
}

// 获取城市名称
const getCityName = (id: string | undefined) => {
  if (!id) return '-'
  const item = provinceList.value.find(c => c.id === id)
  return item?.name || id
}

// 获取学段名称
const getStepName = (id: string | undefined) => {
  const stepMap: Record<string, string> = {
    '1': '小学',
    '2': '初中',
    '3': '高中'
  }
  return stepMap[id || ''] || id || '-'
}

// 获取状态类型
const getStatusType = (status: number | undefined) => {
  const statusTypes: Record<number, any> = {
    0: 'info',
    1: 'warning',
    2: 'warning',
    3: 'primary',
    4: 'warning',
    5: 'danger',
    6: 'success'
  }
  return statusTypes[status || 0] || 'info'
}

// 获取状态文本
const getStatusText = (status: number | undefined) => {
  const statusTexts: Record<number, string> = {
    0: '未解析',
    1: '待发布',
    2: '待领取',
    3: '已领取',
    4: '待审核',
    5: '审核失败',
    6: '审核成功'
  }
  return statusTexts[status || 0] || '未知'
}

// 获取试卷类型文本
const getPaperTypeText = (type: number | undefined) => {
  const paperTypes: Record<number, string> = {
    1: '期中',
    2: '期末',
    3: '单元测试',
    4: '月考',
    5: '竞赛',
    6: '开学考',
    7: '高考真题',
    8: '高考模拟'
  }
  return paperTypes[type || 0] || '未知'
}

// 获取项目信息
const fetchProjectInfo = async () => {
  loading.value = true
  try {
    if (props.type === 'book') {
      const response = await getBookInfoDetailsApi({ id: props.projectId })
      if (response.data.code === 200) {
        projectInfo.value = response.data.data || null
        // 解析原始导入数据
        if (response.data.data?.importId) {
          try {
            rawImportData.value = JSON.parse(response.data.data.importId)
          } catch (e) {
            console.warn('解析原始导入数据失败', e)
          }
        }
      }
    } else {
      const response = await getDocInfoDetailsApi({ id: props.projectId })
      if (response.data.code === 200) {
        docInfo.value = response.data.data || null
        // 解析原始导入数据
        const data = response.data.data as any
        if (data?.importId) {
          try {
            rawImportData.value = JSON.parse(data.importId)
          } catch (e) {
            console.warn('解析原始导入数据失败', e)
          }
        }
      }
    }
  } catch (error) {
    ElMessage.error('获取项目信息失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 提交审核反馈
const handleSubmitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入审核反馈内容')
    return
  }
  emit('addAudit', {
    type: 1,
    content: feedbackContent.value.trim()
  })
  feedbackContent.value = ''
}

// 切换编辑模式
const toggleEditMode = async () => {
  if (!editMode.value) {
    // 进入编辑模式，初始化表单数据
    if (projectInfo.value) {
      Object.assign(editForm, {
        title: projectInfo.value.title,
        subjectId: projectInfo.value.subjectId != null ? String(projectInfo.value.subjectId) : undefined,
        volumeId: projectInfo.value.volumeId != null ? String(projectInfo.value.volumeId) : undefined,
        bookVersionId: projectInfo.value.bookVersionId != null ? String(projectInfo.value.bookVersionId) : undefined
      })
    }
    editMode.value = true
  } else {
    // 保存修改
    await saveEdit()
  }
}

// 取消编辑
const cancelEdit = () => {
  editMode.value = false
  // 重置表单数据
  Object.assign(editForm, {
    title: '',
    subjectId: undefined,
    volumeId: undefined,
    bookVersionId: undefined
  })
}

// 保存编辑
const saveEdit = async () => {
  if (editSubmitting.value) return

  // 验证必填字段
  if (!editForm.title?.trim()) {
    ElMessage.warning('书籍名称不能为空')
    return
  }
  if (!editForm.subjectId) {
    ElMessage.warning('请选择学科')
    return
  }
  if (!editForm.volumeId) {
    ElMessage.warning('请选择册别')
    return
  }
  if (!editForm.bookVersionId) {
    ElMessage.warning('请选择版本')
    return
  }

  try {
    editSubmitting.value = true

    const response = await putBookInfoUpdateApi({ ...editForm }, { id: props.projectId })
    if (response.data.code === 200) {
      ElMessage.success('保存成功')
      editMode.value = false
      // 重新获取数据以更新视图
      await fetchProjectInfo()
      // 通知父组件刷新
      emit('refresh')
    } else {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存书籍信息失败:', error)
  } finally {
    editSubmitting.value = false
  }
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

onMounted(() => {
  fetchProjectInfo()
})
</script>

<style scoped>
:deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

.clearfix {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  gap: 8px;
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

.info-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.visual-panel {
  flex: 1;
  background: #f9fafc;
  padding: 15px;
  border-radius: 4px;
  overflow-y: auto;
  min-height: 0;
}

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--el-text-color-secondary);
}

.loading-wrapper .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
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
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  margin-bottom: 8px;
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

.text-green-600 {
  color: #16a34a;
}

.mb-1 {
  margin-bottom: 4px;
}

.ml-2 {
  margin-left: 8px;
}

.option-name {
  flex: 1;
}

.option-remark {
  color: var(--el-text-color-secondary);
  margin-left: 8px;
}
</style>
