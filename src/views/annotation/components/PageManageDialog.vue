<template>
  <el-dialog v-model="dialogVisible" title="内容页管理" width="1000px" @close="handleClose">
    <div class="page-manage-container">
      <div class="main-content">
        <div class="mb-4">
          <el-button v-if="!readonly" type="primary" @click="handleSave">
            <Icon icon="ep:check" class="mr-1" />
            保存更改
          </el-button>
          <el-button v-if="!readonly" @click="handleAddRange" type="success" :disabled="!canAddRange">
            <Icon icon="ep:plus" class="mr-1" />
            添加范围
          </el-button>
          <el-tag v-if="uncoveredPages > 0" type="warning" class="ml-2">
            未覆盖: {{ uncoveredPages }} 页
          </el-tag>
        </div>
        <el-table :data="pageRanges" v-loading="loading" border max-height="500">
          <el-table-column prop="startPage" label="起始页码" width="120">
            <template #default="{ row, $index }">
              <el-input-number v-if="!readonly" v-model="row.startPage" :min="1" :max="maxPage" size="small" style="width: 100%"
                @change="handleRangeChange" />
              <span v-else>{{ row.startPage }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="endPage" label="结束页码" width="120">
            <template #default="{ row, $index }">
              <el-input-number v-if="!readonly" v-model="row.endPage" :min="1" :max="maxPage" size="small" style="width: 100%"
                @change="handleRangeChange" />
              <span v-else>{{ row.endPage }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="150">
            <template #default="{ row }">
              <el-select v-if="!readonly" v-model="row.type" size="small" style="width: 100%">
                <el-option label="封面" :value="1" />
                <el-option label="CIP" :value="2" />
                <el-option label="目录" :value="3" />
                <el-option label="封底" :value="4" />
                <el-option label="题目" :value="5" />
                <el-option label="答案" :value="6" />
                <el-option label="其他" :value="7" />
              </el-select>
              <span v-else>{{ getPageTypeName(row.type) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="覆盖页数" width="100">
            <template #default="{ row }">
              <span>{{ getCoveredPages(row as PageRange) }} 页</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!readonly" label="操作" width="150">
            <template #default="{ row, $index }">
              <el-button v-if="getCoveredPages(row as PageRange) > 1" type="primary" size="small" @click="handleSplitRange($index)">
                拆分
              </el-button>
              <el-button v-if="$index === pageRanges.length - 1" type="danger" size="small" @click="handleRemoveRange($index)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-empty v-if="pageRanges.length === 0 && !loading" description="所有页面均为默认类型，无需设置范围" />

        <div class="mt-4 p-4 bg-blue-50 rounded border border-blue-200">
          <div class="flex items-center text-sm text-blue-700">
            <Icon icon="ep:info-filled" class="mr-2" />
            <span class="font-medium">范围模式说明：</span>
          </div>
          <ul class="text-sm text-gray-600 mt-2 ml-6 list-disc">
            <li>点击"添加范围"按钮可以添加新的页码范围</li>
            <li>范围之间不能重叠，请合理安排页码范围</li>
            <li>保存后将按范围规则批量更新页面类型</li>
          </ul>
        </div>
      </div>

      <!-- 右侧所有页面预览面板 -->
      <div class="preview-panel">
        <div class="panel-header sticky-header">
          页面预览
          <el-tag size="small" type="info" style="margin-left: auto;">
            共 {{ pageData.length }} 页
          </el-tag>
        </div>
        <div class="panel-content">
          <div v-if="pageData.length > 0" class="pages-grid">
            <div v-for="(page, index) in pageData" :key="page.id" class="page-item">
              <el-image :src="getPageImageUrl(page)" :preview-src-list="getAllImageUrls()" :initial-index="index"
                fit="contain" class="page-image" :append-to-body="true" :z-index="9999" :preview-teleported="true"
                @error="handleImageError($event, page.url)">
                <template v-slot:error>
                  <div class="image-slot">加载失败</div>
                </template>
              </el-image>
              <div class="page-info">
                <el-tag size="small" :type="getPageTypeColor(page.type)">
                  {{ getPageTypeName(page.type) }}
                </el-tag>
                <span class="page-number">{{ page.realPage }}</span>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            暂无页面数据
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>

    <!-- 拆分对话框 -->
    <el-dialog v-model="splitDialogVisible" title="拆分范围" width="500px" append-to-body>
      <el-form label-width="100px">
        <el-form-item label="当前范围">
          <span>{{ splitRange?.startPage }} - {{ splitRange?.endPage }}</span>
        </el-form-item>
        <el-form-item label="拆分点页码">
          <el-input-number v-model="splitPoint" :min="minSplitPoint" :max="maxSplitPoint" size="small" style="width: 100%" />
          <div class="text-xs text-gray-500 mt-1">请输入 {{ minSplitPoint }} - {{ maxSplitPoint }} 之间的页码</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="splitDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSplit">确认拆分</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getPdfPageListApi, postPdfPageTypeUpdateApi, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

interface PageRange {
  startPage: number
  endPage: number
  type: number
}

interface Props {
  visible: boolean
  projectId: string
  readonly?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits(['update:visible'])

const dialogVisible = ref(false)
const loading = ref(false)
const pageData = ref<PdfPageVO[]>([])
const pageRanges = ref<PageRange[]>([])

// 拆分对话框相关
const splitDialogVisible = ref(false)
const splitRangeIndex = ref(-1)
const splitRange = ref<PageRange | null>(null)
const splitPoint = ref(0)
const minSplitPoint = computed(() => splitRange.value ? Math.min(splitRange.value.startPage, splitRange.value.endPage) + 1 : 1)
const maxSplitPoint = computed(() => splitRange.value ? Math.max(splitRange.value.startPage, splitRange.value.endPage) - 1 : 0)
const maxPage = computed(() => pageData.value.length || 0)
const uncoveredPages = computed(() => {
  if (pageRanges.value.length === 0 || maxPage.value === 0) return maxPage.value

  // 收集所有已覆盖的页码
  const covered = new Set<number>()
  pageRanges.value.forEach(range => {
    const start = Math.min(range.startPage, range.endPage)
    const end = Math.max(range.startPage, range.endPage)
    for (let i = start; i <= end; i++) {
      covered.add(i)
    }
  })

  return maxPage.value - covered.size
})

const canAddRange = computed(() => {
  if (pageRanges.value.length === 0) return true
  // 检查是否还有未覆盖的页面
  return uncoveredPages.value > 0
})

watch(() => props.visible, (val) => {
  dialogVisible.value = val
  if (val) {
    fetchPageList()
  }
})

watch(dialogVisible, (val) => {
  emit('update:visible', val)
})

// 获取PDF页列表
const fetchPageList = async () => {
  loading.value = true
  try {
    const response = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (response.data.code === 200) {
      pageData.value = response.data.data || []
      // 检查是否所有页面都是默认类型
      const allDefault = pageData.value.every(page => page.type === 0 || page.type === undefined)
      if (allDefault) {
        pageRanges.value = []
      } else {
        // 从现有数据生成范围
        pageRanges.value = generateRangesFromData()
      }
    } else {
      ElMessage.error(response.data.msg || '获取页面列表失败')
    }
  } catch (error) {
    ElMessage.error('获取页面列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 从现有数据生成范围
const generateRangesFromData = (): PageRange[] => {
  const ranges: PageRange[] = []
  if (pageData.value.length === 0) return ranges

  let currentType: number | null = null
  let startPage = 1

  for (let i = 0; i < pageData.value.length; i++) {
    const page = pageData.value[i]
    if (!page) continue
    const pageType = page.type || 0

    if (currentType === null) {
      currentType = pageType
      startPage = i + 1
    } else if (currentType !== pageType) {
      // 类型改变，添加范围
      if (currentType !== 0) {
        ranges.push({
          startPage,
          endPage: i,
          type: currentType
        })
      }
      currentType = pageType
      startPage = i + 1
    }
  }

  // 添加最后一个范围（非默认类型）
  if (currentType !== null && currentType !== 0) {
    ranges.push({
      startPage,
      endPage: pageData.value.length,
      type: currentType
    })
  }

  return ranges
}

// 获取覆盖的页数
const getCoveredPages = (range: PageRange) => {
  const start = Math.min(range.startPage, range.endPage)
  const end = Math.max(range.startPage, range.endPage)
  return Math.max(0, end - start + 1)
}

// 检查范围是否重叠
const checkOverlap = (newRange: PageRange, excludeIndex: number = -1): boolean => {
  const newStart = Math.min(newRange.startPage, newRange.endPage)
  const newEnd = Math.max(newRange.startPage, newRange.endPage)

  for (let i = 0; i < pageRanges.value.length; i++) {
    if (i === excludeIndex) continue
    const range = pageRanges.value[i]
    if (!range) continue
    const start = Math.min(range.startPage, range.endPage)
    const end = Math.max(range.startPage, range.endPage)

    // 检查是否重叠
    if (!(newEnd < start || newStart > end)) {
      return true
    }
  }
  return false
}

// 范围变化时验证
const handleRangeChange = () => {
  // 验证所有范围
  for (let i = 0; i < pageRanges.value.length; i++) {
    const range = pageRanges.value[i]
    if (range && checkOverlap(range, i)) {
      ElMessage.warning(`第 ${i + 1} 行的范围与其他范围重叠`)
    }
  }
}

// 添加范围
const handleAddRange = () => {
  // 找到第一个未覆盖的页码
  const covered = new Set<number>()
  pageRanges.value.forEach(range => {
    const start = Math.min(range.startPage, range.endPage)
    const end = Math.max(range.startPage, range.endPage)
    for (let i = start; i <= end; i++) {
      covered.add(i)
    }
  })

  let startPage = 1
  for (let i = 1; i <= maxPage.value; i++) {
    if (!covered.has(i)) {
      startPage = i
      break
    }
  }

  const endPage = startPage
  pageRanges.value.push({
    startPage,
    endPage,
    type: 1 // 默认选择封面
  })
}

// 删除范围
const handleRemoveRange = (index: number) => {
  pageRanges.value.splice(index, 1)
}

// 拆分范围
const handleSplitRange = (index: number) => {
  const range = pageRanges.value[index]
  if (!range) return

  splitRangeIndex.value = index
  splitRange.value = { ...range }
  splitPoint.value = Math.floor((range.startPage + range.endPage) / 2)
  splitDialogVisible.value = true
}

// 确认拆分
const confirmSplit = () => {
  if (!splitRange.value || splitRangeIndex.value < 0) return

  const range = splitRange.value
  const start = Math.min(range.startPage, range.endPage)
  const end = Math.max(range.startPage, range.endPage)

  // 创建两个新范围
  const range1: PageRange = {
    startPage: start,
    endPage: splitPoint.value,
    type: range.type
  }
  const range2: PageRange = {
    startPage: splitPoint.value + 1,
    endPage: end,
    type: range.type
  }

  // 替换原范围
  pageRanges.value.splice(splitRangeIndex.value, 1, range1, range2)
  splitDialogVisible.value = false
  ElMessage.success('拆分成功')
}

// 保存更改
const handleSave = async () => {
  // 验证范围
  for (let i = 0; i < pageRanges.value.length; i++) {
    const range = pageRanges.value[i]
    if (!range) continue
    if (range.startPage < 1 || range.endPage > maxPage.value) {
      ElMessage.error(`第 ${i + 1} 行的页码范围超出总页数`)
      return
    }
    if (range.startPage > range.endPage) {
      ElMessage.error(`第 ${i + 1} 行的起始页码不能大于结束页码`)
      return
    }
    if (checkOverlap(range as PageRange, i)) {
      ElMessage.error(`第 ${i + 1} 行的范围与其他范围重叠`)
      return
    }
  }

  // 按范围生成更新数据
  const updates: Array<{ type: number; startPage: number; endPage: number }> = []
  pageRanges.value.forEach(range => {
    updates.push({
      type: range.type,
      startPage: Math.min(range.startPage, range.endPage),
      endPage: Math.max(range.startPage, range.endPage)
    })
  })

  try {
    const response = await postPdfPageTypeUpdateApi({
      projectId: props.projectId,
      updates
    })
    if (response.data.code === 200) {
      ElMessage.success('保存成功')
      fetchPageList()
    } else {
      ElMessage.error(response.data.msg || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  }
}

const handleClose = () => {
  dialogVisible.value = false
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

// 获取所有页面图片URL列表
const getAllImageUrls = () => {
  return pageData.value.map(page => getPageImageUrl(page))
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

// 图片错误处理
const handleImageError = (event: Event, url: string) => {
  console.warn('图片加载失败:', url)
}
</script>

<style scoped>
.page-manage-container {
  max-height: 600px;
  overflow: auto;
  display: flex;
  gap: 16px;
}

.main-content {
  width: 620px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.preview-panel {
  width: 300px;
  flex-shrink: 0;
  background: #f9fafc;
  border-radius: 4px;
  padding: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #e5e7eb;
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
}

.pages-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.page-item {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.page-image {
  width: 100%;
  height: 140px;
  background-color: #f5f7fa;
  cursor: pointer;
}

.page-info {
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
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
  padding: 40px 20px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
