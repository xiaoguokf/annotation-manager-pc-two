<template>
  <div class="annotation-mode-container">
    <!-- 图片显示区域 -->
    <div class="annotation-image-area" @mousedown="handleAreaMouseDown">
      <div v-if="currentPage" class="annotation-image-wrapper" :style="wrapperStyle">
        <!-- 缩放容器（固定宽度600px，使用transform缩放） -->
        <div
          class="annotation-image-item"
          :style="imageItemStyle"
          :class="{ 'cursor-grab': !isDragging, 'cursor-grabbing': isDragging }"
          @wheel.prevent="handleWheel"
          @mousedown.stop="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
        >
          <div class="annotation-page-info">
            第 {{ currentPage.realPage }} 页
          </div>
          <img
            ref="imageRef"
            :src="pageImageUrl"
            alt="标注图片"
            class="annotation-image"
          />
          <!-- 标注框 -->
          <template v-for="annotation in currentPageAnnotations" :key="annotation.id">
            <div
              class="annotation-label"
              :style="{ ...getAnnotationLabelStyle(annotation), color: getAnnotationTypeColor(annotation.type, annotation.inputType) }"
            >
              {{ getAnnotationTypeName(annotation.type, annotation.inputType) }}
            </div>
            <div
              class="annotation-box"
              :class="{ selected: localSelectedAnnotationId === annotation.id }"
              :style="{ ...getAnnotationStyle(annotation), borderColor: getAnnotationTypeColor(annotation.type, annotation.inputType) }"
              @click.stop="handleAnnotationClick(annotation.id)"
            />
          </template>
        </div>
      </div>
      <div v-else class="no-annotation-image">
        <Icon icon="ep:picture" :width="64" :height="64" class="text-gray-400" />
        <p class="text-gray-400 mt-2">请选择标注项查看图片</p>
      </div>
    </div>

    <!-- 底部标注列表 -->
    <div class="annotation-bar">
      <div v-if="annotations.length > 0" class="annotation-bar-list-wrapper">
        <div class="annotation-bar-list">
          <div
            v-for="annotation in annotations"
            :key="annotation.id"
            class="annotation-bar-item"
            :class="{ active: localSelectedAnnotationId === annotation.id }"
            @click="handleSelectAnnotation(annotation)"
          >
            <div class="annotation-bar-icon" :style="{ backgroundColor: getAnnotationTypeColor(annotation.type, annotation.inputType) }">
              <Icon :icon="getAnnotationTypeIcon(annotation.type, annotation.inputType)" />
            </div>
            <div class="annotation-bar-info">
              <div class="annotation-bar-type">{{ getAnnotationTypeName(annotation.type, annotation.inputType) }}</div>
              <div class="annotation-bar-page">第 {{ annotation.page }} 页</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-annotation-data">
        <Icon icon="ep:picture" :width="32" :height="32" class="text-gray-400" />
        <span class="text-gray-400 ml-2">暂无标注</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import type { PdfPageVO } from '@/api/gen/pdfAdminController'
import type { AnnotationSimpleVO, AnnotationVO as AnnotationFullVO } from '@/api/gen/annotationController'
import { useConfigStore } from '@/stores/config'

interface Props {
  annotations: AnnotationSimpleVO[]
  fullAnnotations: AnnotationFullVO[]
  pageList: PdfPageVO[]
}

const props = defineProps<Props>()

const configStore = useConfigStore()

// 本地选中的标注ID（每个组件实例独立）
const localSelectedAnnotationId = ref<string | null>(null)

// 图片元素 ref
const imageRef = ref<HTMLImageElement | null>(null)

// 图片基准宽度（与后端标注坐标对应）
const IMAGE_BASE_WIDTH = 600

// 用户手动缩放比例（默认-1表示未手动缩放）
const userScale = ref(-1)

// 实际缩放比例（用户缩放优先，否则自动适应）
const scale = computed(() => {
  if (userScale.value > 0) {
    return userScale.value
  }
  if (imageRef.value) {
    return imageRef.value.offsetWidth / IMAGE_BASE_WIDTH
  }
  return 1
})

// 图片容器样式（包含缩放）
const imageItemStyle = computed(() => ({
  transform: `scale(${scale.value})`,
  transformOrigin: 'top left',
  userSelect: (isDragging.value ? 'none' : 'auto') as 'none' | 'auto'
}))

// 拖动相关状态
const isDragging = ref(false)
const imagePosition = reactive({ x: 0, y: 0 })
const dragStartPos = reactive({ x: 0, y: 0 })

// 容器位置样式
const wrapperStyle = computed(() => ({
  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`
}))

// 鼠标按下开始拖动
const handleMouseDown = (e: MouseEvent) => {
  if (e.button !== 0) return
  e.preventDefault()
  isDragging.value = true
  dragStartPos.x = e.clientX - imagePosition.x
  dragStartPos.y = e.clientY - imagePosition.y
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  imagePosition.x = e.clientX - dragStartPos.x
  imagePosition.y = e.clientY - dragStartPos.y
}

// 鼠标释放
const handleMouseUp = () => {
  isDragging.value = false
}

// 区域鼠标按下（重置位置）
const handleAreaMouseDown = () => {
  // 可以在这里重置位置逻辑
}

// 滚轮缩放
const handleWheel = (e: WheelEvent) => {
  if (isDragging.value) return
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newScale = Math.max(0.3, Math.min(3, (userScale.value > 0 ? userScale.value : (imageRef.value?.offsetWidth || 600) / IMAGE_BASE_WIDTH) + delta))
  userScale.value = newScale
}

// 重置缩放
const resetScale = () => {
  userScale.value = -1
  imagePosition.x = 0
  imagePosition.y = 0
}

// 获取标注框样式（使用原始坐标，标注框会自动跟随父元素缩放）
const getAnnotationStyle = (annotation: AnnotationFullVO) => {
  return {
    left: `${annotation.topLeftX}px`,
    top: `${annotation.topLeftY}px`,
    width: `${(annotation.bottomRightX ?? 0) - (annotation.topLeftX ?? 0)}px`,
    height: `${(annotation.bottomRightY ?? 0) - (annotation.topLeftY ?? 0)}px`
  }
}

// 获取标注标签样式（字体大小需要反向缩放以保持可读性）
const getAnnotationLabelStyle = (annotation: AnnotationFullVO) => {
  return {
    left: `${annotation.topLeftX}px`,
    top: `calc(${annotation.topLeftY}px - 20px)`,
    fontSize: `${Math.max(10, 11 / scale.value)}px`
  }
}

// 标注类型配置
interface AnnotationTypeConfig {
  value: number
  name: string
  icon: string
  color: string
}

const annotationTypeConfigs: AnnotationTypeConfig[] = [
  { value: 1, name: '题干', icon: 'ep:document', color: '#3b82f6' },
  { value: 2, name: '题干图', icon: 'ep:picture', color: '#8b5cf6' },
  { value: 3, name: '选项', icon: 'ep:list', color: '#10b981' },
  { value: 4, name: '选项图', icon: 'ep:picture-rounded', color: '#f59e0b' },
  { value: 5, name: '解析', icon: 'ep:edit-pen', color: '#ef4444' },
  { value: 6, name: '解析图', icon: 'ep:picture-filled', color: '#ec4899' },
  { value: 7, name: '答案', icon: 'ep:check', color: '#06b6d4' },
  { value: 8, name: '答案图', icon: 'ep:zoom-in', color: '#84cc16' },
  { value: 9, name: '表格', icon: 'ep:grid', color: '#7c3aed' }
]

// 表格类型的独立配置（inputType=3 时使用）
const tableTypeConfigs: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: '题干表格', icon: 'ep:grid', color: '#1e40af' },   // 深蓝色
  3: { name: '选项表格', icon: 'ep:grid', color: '#065f46' },   // 深绿色
  5: { name: '解析表格', icon: 'ep:grid', color: '#991b1b' },   // 深红色
  7: { name: '答案表格', icon: 'ep:grid', color: '#155e75' },   // 深青色
  9: { name: '表格', icon: 'ep:grid', color: '#7c3aed' }        // 深紫色（独立表格）
}

// 获取标注类型配置
const getAnnotationTypeConfig = (type: number, inputType?: number) => {
  // 如果 inputType 是 3（表格），使用表格的独立配置
  if (inputType === 3 && tableTypeConfigs[type]) {
    return {
      value: type,
      name: tableTypeConfigs[type].name,
      icon: tableTypeConfigs[type].icon,
      color: tableTypeConfigs[type].color
    }
  }
  return annotationTypeConfigs.find(config => config.value === type) || annotationTypeConfigs[0]
}

// 获取标注类型名称
const getAnnotationTypeName = (type: number, inputType?: number) => {
  return getAnnotationTypeConfig(type, inputType)?.name || '未知'
}

// 获取标注类型颜色
const getAnnotationTypeColor = (type: number, inputType?: number) => {
  return getAnnotationTypeConfig(type, inputType)?.color || '#6b7280'
}

// 获取标注类型图标
const getAnnotationTypeIcon = (type: number, inputType?: number) => {
  return getAnnotationTypeConfig(type, inputType)?.icon || 'ep:document'
}

// 获取当前应该显示的页面
const currentPage = computed(() => {
  if (!localSelectedAnnotationId.value) return null

  const selectedAnnotation = props.fullAnnotations.find(a => a.id === localSelectedAnnotationId.value)
  if (!selectedAnnotation) return null

  return props.pageList.find(p => p.realPage === selectedAnnotation.page) || null
})

// 当前页面的标注
const currentPageAnnotations = computed(() => {
  if (!currentPage.value) return []

  return props.fullAnnotations.filter(a => a.page === currentPage.value!.realPage)
})

// 获取页面图片URL
const pageImageUrl = computed(() => {
  if (!currentPage.value) return ''

  const pdfImageEndpoint = configStore.getPdfImageEndpoint()
  const url = currentPage.value.url

  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return pdfImageEndpoint ? `${pdfImageEndpoint}${url}` : url
})

// 选择标注
const handleSelectAnnotation = (annotation: AnnotationSimpleVO) => {
  localSelectedAnnotationId.value = annotation.id
  resetScale() // 切换标注时重置缩放和位置
}

// 点击标注框
const handleAnnotationClick = (annotationId: string) => {
  localSelectedAnnotationId.value = annotationId
}

// 监听标注列表变化，自动选中第一个
watch(() => props.annotations, (newAnnotations) => {
  if (newAnnotations.length > 0 && !localSelectedAnnotationId.value) {
    const first = newAnnotations[0]
    if (first) {
      localSelectedAnnotationId.value = first.id
    }
  }
}, { immediate: true })
</script>

<style scoped>
/* 标注模式样式 */
.annotation-mode-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.annotation-image-area {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  border-radius: 4px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  position: relative;
  min-height: 0;
  padding: 20px;
}

.annotation-image-wrapper {
  position: relative;
  flex-shrink: 0;
}

/* 缩放容器（与AnnotationArea保持一致） */
.annotation-image-item {
  position: relative;
  width: 600px;
  flex-shrink: 0;
  transition: transform 0.2s ease-in-out;
}

.annotation-image-item.cursor-grab {
  cursor: grab;
}

.annotation-image-item.cursor-grabbing {
  cursor: grabbing;
}

.annotation-page-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  text-align: center;
}

.annotation-image {
  display: block;
  width: 600px;
}

/* 标注框样式 */
.annotation-box {
  position: absolute;
  border: 2px solid;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: auto;
}

.annotation-box:hover {
  background-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.annotation-box.selected {
  background-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

/* 标注标签样式 */
.annotation-label {
  position: absolute;
  font-size: 11px;
  white-space: nowrap;
  font-weight: 500;
  text-shadow: 0 0 2px white, 0 0 2px white;
  pointer-events: none;
  line-height: 1;
}

/* 底部标注栏 */
.annotation-bar {
  min-height: 100px;
  max-height: 200px;
  border-top: 1px solid #e4e7ed;
  padding: 10px;
  background: #fff;
  overflow-y: auto;
  flex-shrink: 0;
  box-sizing: border-box;
}

.annotation-bar-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 4px 0;
}

.annotation-bar-list::-webkit-scrollbar {
  height: 6px;
}

.annotation-bar-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.annotation-bar-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.annotation-bar-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.annotation-bar-item {
  flex-shrink: 0;
  min-width: 90px;
  max-width: 160px;
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafc;
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  box-sizing: border-box;
}

.annotation-bar-item:hover {
  border-color: #c6e2ff;
  background: #f0f9ff;
}

.annotation-bar-item.active {
  border-color: #409EFF;
  background: #ecf5ff;
}

.annotation-bar-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: white;
  flex-shrink: 0;
  overflow: hidden;
}

.annotation-bar-icon .iconify {
  font-size: 16px;
  max-height: 28px;
  max-width: 28px;
}

.annotation-bar-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.annotation-bar-type {
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  word-break: break-word;
  line-height: 1.3;
}

.annotation-bar-page {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.no-annotation-image,
.no-annotation-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.no-annotation-data {
  flex-direction: row;
  height: 100%;
  align-items: center;
}

.mt-2 {
  margin-top: 8px;
}

.ml-2 {
  margin-left: 8px;
}

.text-gray-400 {
  color: #9ca3af;
}
</style>
