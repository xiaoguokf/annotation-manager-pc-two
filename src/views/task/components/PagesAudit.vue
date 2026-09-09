<template>
  <el-card class="paper-card">
    <template v-slot:header>
<div  class="card-header">
      <span class="section-title">内容页审核</span>
      <div v-if="!isReadonly" class="header-right">
        <el-button size="small" type="default" @click="toggleEditMode">
          <Icon icon="ep:edit" style="margin-right: 4px;" />
          编辑
        </el-button>
      </div>
      <el-button v-else size="small" @click="scrollToTop">返回顶部</el-button>
    </div>
</template>

    <div class="pages-container">
      <div class="visual-panel">
        <div class="panel-header sticky-header">
          可视化数据
          <el-select v-model="selectedType" placeholder="筛选类型" size="small" style="width: 120px; margin-left: auto;" clearable>
            <el-option label="封面" :value="1" />
            <el-option label="CIP" :value="2" />
            <el-option label="目录" :value="3" />
            <el-option label="封底" :value="4" />
            <el-option label="题目" :value="5" />
            <el-option label="答案" :value="6" />
            <el-option label="其他" :value="7" />
          </el-select>
        </div>
        <div class="panel-content">
          <div v-if="filteredPages.length > 0" class="pages-grid">
            <div
              v-for="(page, index) in filteredPages"
              :key="page.id"
              class="page-item"
              :class="{ 'selected': selectedPageId === page.id }"
            >
              <el-image
                :src="getPageImageUrl(page)"
                :preview-src-list="getAllImageUrls(index)"
                :initial-index="index"
                fit="contain"
                class="page-image"
                lazy
                :append-to-body="true"
                :z-index="9999"
                :preview-teleported="true"
                @error="handleImageError($event, page.url)"
                @click.stop="selectPage(page)"
              >
                <template v-slot:error>
<div  class="image-slot">加载失败</div>
</template>
              </el-image>
              <div class="page-info" @click.stop="selectPage(page)">
                <el-tag size="small" :type="getPageTypeColor(page.type)">
                  {{ getPageTypeName(page.type) }}
                </el-tag>
                <span class="page-number">页码: {{ page.realPage }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            暂无页面数据
          </div>
        </div>
      </div>
    </div>

    <!-- 页面管理对话框 -->
    <PageManageDialog v-model:visible="pageManageVisible" :project-id="projectId" @update:visible="handleDialogVisibleChange" />

    <!-- 添加审核反馈 -->
    <el-divider v-if="!isReadonly" content-position="left">添加审核反馈</el-divider>
    <div v-if="!isReadonly && selectedPage" class="selected-info mb-2">
      <el-tag type="info" size="small">
        已选择: {{ getPageTypeName(selectedPage.type) }} - 页码 {{ selectedPage.realPage }}
      </el-tag>
    </div>
    <el-input
      v-if="!isReadonly"
      v-model="feedbackContent"
      type="textarea"
      :rows="3"
      placeholder="请先选择页面，然后输入审核反馈内容"
      style="margin-bottom: 10px;"
    />
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
              <el-tag v-if="record.objectId" size="small" type="info" style="margin-left: 10px;">
                页码: {{ getPageNumberById(record.objectId) }}
              </el-tag>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import type { ProjectAuditVO } from '@/api/gen/projectAuditController'
import { useConfigStore } from '@/stores/config'
import PageManageDialog from '@/views/annotation/components/PageManageDialog.vue'

const props = defineProps<{
  projectId: string
  auditRecords: ProjectAuditVO[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  addAudit: [data: { type: number; objectId?: string; content: string }]
}>()

const configStore = useConfigStore()

// 只读模式
const isReadonly = computed(() => props.readonly === true)

// 页面管理对话框可见性
const pageManageVisible = ref(false)

// 数据
const pageList = ref<PdfPageVO[]>([])
const selectedType = ref<number | undefined>(undefined)
const selectedPageId = ref('')
const selectedPage = ref<PdfPageVO | null>(null)
const feedbackContent = ref('')

// 获取所有图片URL（懒加载优化：只在需要时获取）
const getAllImageUrls = (currentIndex: number = 0) => {
  const urls = filteredPages.value.map(page => getPageImageUrl(page))
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

// 筛选后的页面列表
const filteredPages = computed(() => {
  if (selectedType.value === undefined) return pageList.value
  return pageList.value.filter(page => page.type === selectedType.value)
})

// 获取页面列表
const fetchPageList = async () => {
  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code === 200) {
      pageList.value = response.data.data || []
    }
  } catch (error) {
    ElMessage.error('获取页面列表失败')
    console.error(error)
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  // 直接打开页面管理对话框
  pageManageVisible.value = true
}

// 选择页面
const selectPage = (page: PdfPageVO) => {
  selectedPageId.value = page.id
  selectedPage.value = page
}

// 获取页面类型名称
const getPageTypeName = (type: number | undefined) => {
  switch (type) {
    case 1:
      return '封面'
    case 2:
      return 'CIP'
    case 3:
      return '目录'
    case 4:
      return '封底'
    case 5:
      return '题目'
    case 6:
      return '答案'
    case 7:
      return '其他'
    default:
      return '-'
  }
}

// 获取页面类型颜色
const getPageTypeColor = (type: number | undefined): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined => {
  switch (type) {
    case 1:
      return 'primary'
    case 2:
      return 'success'
    case 3:
      return 'warning'
    case 4:
      return 'info'
    case 5:
      return 'danger'
    case 6:
      return 'success'
    case 7:
      return 'info'
    default:
      return undefined
  }
}

// 根据ID获取页码
const getPageNumberById = (pageId: string | undefined) => {
  if (!pageId) return '-'
  const page = pageList.value.find(p => p.id === pageId)
  return page?.realPage?.toString() || '-'
}

// 图片错误处理
const handleImageError = (event: Event, url: string) => {
  console.warn('图片加载失败:', url)
}

// 返回顶部
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 提交审核反馈
const handleSubmitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入审核反馈内容')
    return
  }

  emit('addAudit', {
    type: 2,
    objectId: selectedPage.value?.id,
    content: feedbackContent.value.trim()
  })
  feedbackContent.value = ''
  selectedPage.value = null
  selectedPageId.value = ''
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

// 对话框可见性变化处理
const handleDialogVisibleChange = (visible: boolean) => {
  pageManageVisible.value = visible
  // 对话框关闭时刷新页面数据
  if (!visible) {
    fetchPageList()
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchPageList()
})
</script>

<style scoped>
:deep(.el-card__header) {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  gap: 8px;
}

.section-title {
  font-size: 15px;
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

.pages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  max-height: calc(100vh - 200px);
}

.visual-panel {
  flex: 1;
  background: #f9fafc;
  padding: 10px;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: calc(100vh - 200px);
}

.panel-header {
  font-weight: bold;
  font-size: 13px;
  color: #409EFF;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: #f9fafc;
  z-index: 10;
  padding-top: 5px;
}

.panel-content {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  max-height: calc(100vh - 260px);
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.page-item {
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.page-item.selected {
  border-color: #409EFF;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.page-image {
  width: 100%;
  height: 160px;
  background-color: #f5f7fa;
}

.page-info {
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  background: #fafafa;
}

.page-number {
  color: var(--el-text-color-regular);
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

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: var(--el-text-color-secondary);
}

.edit-mode-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  padding: 40px 20px;
  color: var(--el-text-color-regular);
}

.edit-mode-hint p {
  margin: 8px 0;
  text-align: center;
}

.edit-mode-hint p:first-child {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.selected-info {
  padding: 8px 12px;
  background: #f0f9ff;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
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
  flex-wrap: wrap;
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

.items-start {
  align-items: flex-start;
}

.justify-between {
  justify-content: space-between;
}

.flex-1 {
  flex: 1;
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

.text-green-600 {
  color: #16a34a;
}
</style>
