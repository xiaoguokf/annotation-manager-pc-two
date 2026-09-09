<template>
  <el-card class="paper-card">
    <template v-slot:header>
<div  class="clearfix">
      <span class="section-title">章节目录审核</span>
    </div>
</template>

    <div class="catalogue-container">
      <div class="visual-panel" :class="{ 'split-layout': hasCataloguePages }">
        <div class="panel-header">
          可视化数据
          <div style="margin-left: auto; display: flex; gap: 8px;">
            <el-button size="small" @click="expandAll">全部展开</el-button>
            <el-button size="small" @click="collapseAll">全部折叠</el-button>
            <el-divider v-if="hasCataloguePages" direction="vertical" style="margin: 0;" />
            <span v-if="hasCataloguePages" class="catalogue-pagination-header">
              <el-button
                size="small"
                circle
                :disabled="currentCatalogueIndex === 0"
                @click="prevCataloguePage"
              >
                <Icon icon="ep:arrow-left" />
              </el-button>
              <span class="page-indicator">{{ currentCatalogueIndex + 1 }} / {{ cataloguePages.length }}</span>
              <el-button
                size="small"
                circle
                :disabled="currentCatalogueIndex === cataloguePages.length - 1"
                @click="nextCataloguePage"
              >
                <Icon icon="ep:arrow-right" />
              </el-button>
            </span>
          </div>
        </div>
        <div class="panel-content">
          <!-- 左侧目录图片 -->
          <div v-if="hasCataloguePages" class="catalogue-image-panel">
            <div class="catalogue-image-content">
              <el-image
                v-if="currentCataloguePage"
                :src="getPageImageUrl(currentCataloguePage)"
                :preview-src-list="cataloguePages.map(p => getPageImageUrl(p))"
                :initial-index="currentCatalogueIndex"
                fit="contain"
                class="catalogue-image"
              >
                <template v-slot:error>
                  <div class="image-slot">加载失败</div>
                </template>
              </el-image>
              <div v-else class="no-data">暂无目录页</div>
            </div>
          </div>

          <!-- 右侧目录树 -->
          <div class="catalogue-tree-panel">
            <el-tree
              ref="treeRef"
              :data="treeData"
              :props="{ children: 'children', label: 'catalogueName' }"
              node-key="id"
              :expand-on-click-node="false"
              :highlight-current="true"
              :default-expand-all="isDataLoaded"
              @node-click="handleNodeClick"
              class="tree-scroll"
            >
              <template #default="{ node, data }">
                <span class="custom-tree-node">
                  <span>
                    <Icon :icon="getChapterIcon(data.level)" style="margin-right: 5px; color: #409EFF;" />
                    {{ data.catalogueName || data.title || node.label }}
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加审核反馈 -->
    <el-divider v-if="!isReadonly" content-position="left">添加审核反馈</el-divider>
    <div v-if="!isReadonly && selectedCatalogue" class="selected-info mb-2">
      <el-tag type="info" size="small">
        已选择: {{ selectedCatalogue.catalogueName }}
      </el-tag>
    </div>
    <el-input
      v-if="!isReadonly"
      v-model="feedbackContent"
      type="textarea"
      :rows="3"
      placeholder="请先选择章节，然后输入审核反馈内容"
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
                {{ getCatalogueTextById(record.objectId) }}
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
import { getCatalogueListApi, type CatalogueVO } from '@/api/gen/catalogueController'
import { getPdfPageListApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import type { ProjectAuditVO } from '@/api/gen/projectAuditController'
import { useConfigStore } from '@/stores/config'

const props = defineProps<{
  projectId: string
  auditRecords: ProjectAuditVO[]
  readonly?: boolean
}>()

const configStore = useConfigStore()

const emit = defineEmits<{
  addAudit: [data: { type: number; objectId?: string; content: string }]
}>()

// 只读模式
const isReadonly = computed(() => props.readonly === true)

// 数据
const catalogues = ref<CatalogueVO[]>([])
const pageList = ref<PdfPageVO[]>([])
const treeRef = ref()
const selectedCatalogue = ref<CatalogueVO | null>(null)
const feedbackContent = ref('')
const isDataLoaded = ref(false)
const currentCatalogueIndex = ref(0)

// 计算属性：是否有目录页
const hasCataloguePages = computed(() => {
  return cataloguePages.value.length > 0
})

// 计算属性：目录页列表
const cataloguePages = computed(() => {
  return pageList.value.filter(page => page.type === 3)
})

// 计算属性：当前目录页
const currentCataloguePage = computed(() => {
  return cataloguePages.value[currentCatalogueIndex.value] || null
})

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

// 排序同级目录
const sortChildren = (nodes: any[]) => {
  nodes.sort((a, b) => {
    // 优先按 sortNum 排序，如果为空则赋值 0
    const sortNumA = a.sortNum ?? 0
    const sortNumB = b.sortNum ?? 0
    if (sortNumA !== sortNumB) {
      return sortNumA - sortNumB
    }
    // sortNum 相同，按目录 ID 排序（使用 BigInt 避免精度丢失）
    return BigInt(a.id) > BigInt(b.id) ? 1 : -1
  })

  // 递归排序子节点
  nodes.forEach(node => {
    if (node.children && node.children.length > 0) {
      sortChildren(node.children)
    }
  })
}

// 构建树形数据
const treeData = computed(() => {
  const map = new Map<string, any>()
  const roots: any[] = []

  catalogues.value.forEach(catalogue => {
    map.set(catalogue.id, { ...catalogue, children: [] })
  })

  catalogues.value.forEach(catalogue => {
    const node = map.get(catalogue.id)!
    if (!catalogue.parentId || catalogue.parentId === '0') {
      roots.push(node)
    } else {
      const parent = map.get(catalogue.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
  })

  // 对树形数据进行排序
  sortChildren(roots)

  return roots
})

// 获取章节列表
const fetchCatalogueList = async () => {
  try {
    const response = await getCatalogueListApi({ bookId: props.projectId })
    if (response.data.code === 200) {
      catalogues.value = response.data.data || []
      isDataLoaded.value = true
      // 数据加载完成后自动展开所有节点
      setTimeout(() => {
        expandAll()
      }, 100)
    }
  } catch (error) {
    ElMessage.error('获取章节列表失败')
    console.error(error)
  }
}

// 获取页面列表（用于预览目录页）
const fetchPageList = async () => {
  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code === 200) {
      pageList.value = response.data.data || []
    }
  } catch (error) {
    console.error('获取页面列表失败', error)
  }
}

// 全部展开
const expandAll = () => {
  const expandKeys: string[] = []
  const collectKeys = (nodes: any[]) => {
    nodes.forEach(node => {
      expandKeys.push(node.id)
      if (node.children && node.children.length > 0) {
        collectKeys(node.children)
      }
    })
  }
  collectKeys(treeData.value)
  if (treeRef.value) {
    expandKeys.forEach(key => {
      const node = treeRef.value.getNode(key)
      if (node) {
        node.expand()
      }
    })
  }
}

// 全部折叠
const collapseAll = () => {
  const collapseKeys: string[] = []
  const collectKeys = (nodes: any[]) => {
    nodes.forEach(node => {
      collapseKeys.push(node.id)
      if (node.children && node.children.length > 0) {
        collectKeys(node.children)
      }
    })
  }
  collectKeys(treeData.value)
  if (treeRef.value) {
    collapseKeys.forEach(key => {
      const node = treeRef.value.getNode(key)
      if (node) {
        node.collapse()
      }
    })
  }
}

// 节点点击事件
const handleNodeClick = (data: CatalogueVO) => {
  selectedCatalogue.value = data
}

// 切换到上一个目录页
const prevCataloguePage = () => {
  if (currentCatalogueIndex.value > 0) {
    currentCatalogueIndex.value--
  }
}

// 切换到下一个目录页
const nextCataloguePage = () => {
  if (currentCatalogueIndex.value < cataloguePages.value.length - 1) {
    currentCatalogueIndex.value++
  }
}

// 获取章节图标
const getChapterIcon = (level: number | undefined) => {
  switch (level) {
    case 1:
      return 'ep:folder'
    case 2:
      return 'ep:folder-opened'
    case 3:
      return 'ep:document'
    default:
      return 'ep:document'
  }
}

// 根据ID获取章节名称
const getCatalogueTextById = (catalogueId: string | undefined) => {
  if (!catalogueId) return '-'
  const catalogue = catalogues.value.find(c => c.id === catalogueId)
  return catalogue?.catalogueName || '-'
}

// 提交审核反馈
const handleSubmitFeedback = () => {
  if (!feedbackContent.value.trim()) {
    ElMessage.warning('请输入审核反馈内容')
    return
  }

  emit('addAudit', {
    type: 3,
    objectId: selectedCatalogue.value?.id,
    content: feedbackContent.value.trim()
  })
  feedbackContent.value = ''
  selectedCatalogue.value = null
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

// 页面加载时获取数据
onMounted(() => {
  fetchCatalogueList()
  fetchPageList()
})
</script>

<style scoped>
:deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
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

.catalogue-container {
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.visual-panel.split-layout {
  padding: 0;
}

.panel-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

.catalogue-image-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fff;
  min-height: 0;
}

.catalogue-pagination-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 8px;
}

.catalogue-image-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px;
  overflow: hidden;
  background: #f5f7fa;
}

.catalogue-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.catalogue-tree-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}

.panel-header {
  font-weight: bold;
  font-size: 14px;
  color: #409EFF;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409EFF;
  display: flex;
  align-items: center;
}

.tree-scroll {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
  width: 100%;
}

.custom-tree-node > span:first-child {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
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
  color: #303133;
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
  color: #909399;
}

.handler-info {
  font-size: 12px;
  color: #909399;
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
