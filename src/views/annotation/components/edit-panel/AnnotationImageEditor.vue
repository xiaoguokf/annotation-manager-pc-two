<template>
  <div class="annotation-image-editor">
    <!-- 标注基本信息 -->
    <div class="detail-section mb-4">
      <div class="section-title mb-2">标注信息</div>
      <div class="detail-item">
        <span class="label">类型:</span>
        <span class="value">{{ getAnnotationTypeName(selectedAnnotation.type, selectedAnnotation.inputType) }}</span>
      </div>
      <div class="detail-item">
        <span class="label">页码:</span>
        <span class="value">{{ selectedAnnotation.page }}</span>
      </div>
    </div>

    <!-- 解析状态 -->
    <div v-if="selectedAnnotation.result !== undefined && selectedAnnotation.result !== 1" class="detail-section mb-4">
      <div class="section-title mb-2 flex items-center justify-between">
        <span>解析状态</span>
        <el-button v-if="selectedAnnotation.result === 2" type="primary" size="small" link @click="handleResetToOriginal" :loading="resetting">
          <Icon icon="ep:refresh-left" class="mr-1" />
          重试
        </el-button>
      </div>
      <div class="status-box" :class="`status-${selectedAnnotation.result}`">
        <Icon :icon="selectedAnnotation.result === 0 ? 'ep:loading' : 'ep:close'" :width="20" :height="20"
          :class="{ 'is-spinning': selectedAnnotation.result === 0 }" />
        <span class="ml-2">
          {{ selectedAnnotation.result === 0 ? '后台正在解析中，数据已上传到系统，您可以先继续往下做' : '解析失败' }}
        </span>
      </div>
    </div>

    <!-- 解析结果 -->
    <div v-if="selectedAnnotation.result === 1 || selectedAnnotation.url || selectedAnnotation.analysisContent"
      class="detail-section mb-4">
      <div class="section-title mb-2 flex items-center justify-between">
        <span>解析内容</span>
        <div class="flex items-center gap-2">
          <el-button type="primary" size="small" link @click="handleResetToOriginal" :loading="resetting">
            <Icon icon="ep:refresh-left" class="mr-1" />
            重置为原图
          </el-button>
          <el-button type="primary" size="small" link @click="toggleImportMode" v-if="!isImportMode && !isEditMode">
            <Icon icon="ep:upload" class="mr-1" />
            导入
          </el-button>
          <el-button type="primary" size="small" link @click="toggleImportMode" v-if="isImportMode">
            取消
          </el-button>
          <el-button type="primary" size="small" link @click="toggleEditMode" v-if="!isEditMode">
            <Icon icon="ep:edit" class="mr-1" />
            编辑
          </el-button>
          <el-button type="primary" size="small" link @click="handleExitEditMode" v-if="isEditMode">
            <Icon icon="ep:close" class="mr-1" />
            退出编辑
          </el-button>
          <el-button type="primary" size="small" link @click="handleExportImage">
            <Icon icon="ep:download" class="mr-1" />
            导出
          </el-button>
          <el-button type="primary" size="small" link @click="handleCopyImageHtml">
            <Icon icon="ep:document-copy" class="mr-1" />
            复制
          </el-button>
        </div>
      </div>

      <!-- 图片预览 -->
      <div class="content-box image-content-box">
        <div class="image-preview-container">
          <!-- 解析中的加载状态 -->
          <div v-if="isSaving" class="loading-overlay">
            <Icon icon="ep:loading" :width="48" :height="48" class="is-spinning text-blue-500 mb-3" />
            <div class="text-sm text-gray-600">正在保存并解析图片...</div>
          </div>
          <!-- 图片编辑器模式 -->
          <ImageEditor
            v-else-if="isEditMode && currentImageUrl"
            :imageUrl="currentImageUrl"
            @save="handleSaveEditedImage"
            @cancel="handleExitEditMode"
          />
          <!-- 预览模式 -->
          <img v-else-if="!isImportMode && currentImageUrl" ref="imageRef" :src="currentImageUrl" alt="解析图片"
            crossorigin="anonymous" @error="handleImageError" @load="handleImageLoad" />
          <!-- 上传框 -->
          <div v-else class="upload-box">
            <input ref="fileInputRef" type="file" accept="image/jpeg,image/jpg,image/png" class="hidden"
              @change="handleFileSelect" />
            <div class="upload-area" @dragover.prevent @drop.prevent="handleFileDrop" @click="handleFileClick">
              <Icon icon="ep:upload" :width="48" :height="48" class="text-gray-400 mb-3" />
              <div class="text-sm text-gray-600 mb-4">
                点击或拖拽图片到此处上传
              </div>
              <el-button type="primary" size="small" @click.stop="handlePasteFromClipboard">
                <Icon icon="ep:document-copy" class="mr-1" />
                从剪切板上传
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { type AnnotationSimpleVO } from '@/api/gen/annotationController'
import { postAnnotationParseApi } from '@/api/gen/annotationController'
import { useConfigStore } from '@/stores/config'
import ImageEditor from './ImageEditor.vue'

const emit = defineEmits(['retryParse', 'updateAnnotation', 'annotationParseStart'])
const configStore = useConfigStore()

const props = defineProps<{
  selectedAnnotation: AnnotationSimpleVO
}>()

const exporting = ref(false)
const isImportMode = ref(false)
const isEditMode = ref(false)
const isSaving = ref(false) // 保存并解析中状态
const imageRef = ref<HTMLImageElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const resetting = ref(false)
const currentImageUrl = ref('') // 当前显示的图片 URL

// 图片类型
const imageTypes = [2, 4, 6, 8]

// 判断是否为图片类型
const isImageType = (type: number) => {
  return imageTypes.includes(type)
}

// 标注类型名称映射
const annotationTypeNames: Record<number, string> = {
  2: '题干图',
  4: '选项图',
  6: '解析图',
  8: '答案图'
}

// 获取标注类型名称
const getAnnotationTypeName = (type: number, inputType?: number) => {
  // 如果 inputType 是 3（表格），返回表格类型名称
  if (inputType === 3) {
    const tableNames: Record<number, string> = {
      1: '题干表格',
      3: '选项表格',
      5: '解析表格',
      7: '答案表格'
    }
    return tableNames[type] || annotationTypeNames[type] || '未知类型'
  }
  return annotationTypeNames[type] || '未知类型'
}

// 获取原始图片URL（不带缓存逻辑）
const getRawImageUrl = (annotation: AnnotationSimpleVO) => {
  const url = annotation.url || annotation.analysisContent || ''
  if (!url) return url

  // 如果是相对路径，添加 API 前缀
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  const sliceEndpoint = configStore.getSliceEndpoint()
  return sliceEndpoint ? `${sliceEndpoint}${url}` : url
}

// 监听标注变化，更新图片 URL
watch(() => props.selectedAnnotation, (newAnnotation, oldAnnotation) => {
  console.log('[AnnotationImageEditor] watch props.selectedAnnotation', {
    oldAnnotationId: oldAnnotation?.id,
    newAnnotationId: newAnnotation?.id,
    newUrl: newAnnotation?.url,
    newResult: newAnnotation?.result,
    currentImageUrl: currentImageUrl.value,
    isSaving: isSaving.value
  })

  // 如果解析成功（result === 1），停止保存中的状态
  if (newAnnotation?.result === 1 && isSaving.value) {
    console.log('[AnnotationImageEditor] 解析成功，停止保存状态')
    isSaving.value = false
  }

  const newUrl = getRawImageUrl(newAnnotation)
  // 只有当新 URL 不为空且与当前 URL 不同时才更新
  if (newUrl && newUrl !== currentImageUrl.value) {
    console.log('[AnnotationImageEditor] 更新 currentImageUrl:', currentImageUrl.value, '->', newUrl)
    currentImageUrl.value = newUrl
  } else {
    console.log('[AnnotationImageEditor] 未更新 currentImageUrl, newUrl:', newUrl, '是否为空:', !newUrl, '是否相同:', newUrl === currentImageUrl.value)
  }
}, { immediate: true, deep: true })

// 导出图片
const handleExportImage = async () => {
  if (!imageRef.value) {
    ElMessage.warning('图片未加载完成，请稍后重试')
    return
  }

  const img = imageRef.value
  const imageUrl = img.src
  if (!imageUrl) {
    ElMessage.warning('暂无图片可导出')
    return
  }

  // 检查图片是否加载完成
  if (!img.complete || img.naturalWidth === 0) {
    ElMessage.warning('图片正在加载中，请稍后重试')
    return
  }

  try {
    exporting.value = true

    const typeName = getAnnotationTypeName(props.selectedAnnotation.type)
    const timestamp = new Date().getTime()
    const suggestedName = `${typeName}_${timestamp}.png`

    // 优先使用 showSaveFilePicker API（支持用户选择保存位置）
    if ('showSaveFilePicker' in window) {
      try {
        // 获取图片数据
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error('图片加载失败')
        }
        const blob = await response.blob()

        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: '图片文件',
              accept: {
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg']
              }
            }
          ]
        })

        const writable = await fileHandle.createWritable()
        await writable.write(blob)
        await writable.close()

        ElMessage.success('图片导出成功')
        return
      } catch (pickerError: any) {
        // 用户取消选择文件位置
        if (pickerError.name === 'AbortError') {
          ElMessage.info('已取消导出')
          return
        }
        throw pickerError
      }
    }

    // 降级方案：直接用链接下载
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = suggestedName
    link.style.display = 'none'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()

    // 清理
    document.body.removeChild(link)

    ElMessage.success('已开始下载图片')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

// 复制图片 HTML
const handleCopyImageHtml = async () => {
  const imageUrl = props.selectedAnnotation.analysisContent || props.selectedAnnotation.url || ''
  if (!imageUrl) {
    ElMessage.warning('暂无图片可复制')
    return
  }

  const htmlCode = `<img src="${imageUrl}" alt="${getAnnotationTypeName(props.selectedAnnotation.type)}" />`

  try {
    await navigator.clipboard.writeText(htmlCode)
    ElMessage.success('图片已复制到剪贴板')
  } catch (error) {
    console.error('复制失败:', error)
    ElMessage.error('复制失败')
  }
}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('图片加载失败:', img.src)
}

// 处理图片加载成功
const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
}

// 切换导入模式
const toggleImportMode = () => {
  isImportMode.value = !isImportMode.value
}

// 文件选择
const handleFileClick = () => {
  fileInputRef.value?.click()
}

// 文件选择处理
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await handleUploadFile(file)
  }
  // 清空 input，允许重复选择同一文件
  target.value = ''
}

// 文件拖放处理
const handleFileDrop = async (event: DragEvent) => {
  const file = event.dataTransfer?.files[0]
  if (file && file.type.startsWith('image/')) {
    await handleUploadFile(file)
  } else {
    ElMessage.warning('请上传图片文件')
  }
}

// 从剪切板上传
const handlePasteFromClipboard = async () => {
  try {
    const clipboardItems = await navigator.clipboard.read()

    for (const item of clipboardItems) {
      const imageTypes = item.types.filter(type => type.startsWith('image/'))
      if (imageTypes.length > 0) {
        const firstImageType = imageTypes[0]
        if (firstImageType) {
          const blob = await item.getType(firstImageType)
          const file = new File([blob], 'clipboard-image.png', { type: blob.type })
          await handleUploadFile(file)
          return
        }
      }
    }

    ElMessage.warning('剪切板中没有图片')
  } catch (error) {
    console.error('读取剪切板失败:', error)
    ElMessage.error('读取剪切板失败，请确保已授予权限')
  }
}

// 上传文件并解析
const handleUploadFile = async (file: File) => {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
  if (!validTypes.includes(file.type)) {
    ElMessage.warning('只支持 JPG、JPEG、PNG 格式的图片')
    return
  }

  try {
    uploading.value = true

    // 更新状态为解析中
    props.selectedAnnotation.result = 0
    emit('updateAnnotation', props.selectedAnnotation)

    // 触发开始解析事件，启动轮询
    emit('annotationParseStart', { annotationId: props.selectedAnnotation.id, questionId: props.selectedAnnotation.questionId })

    // 调用解析 API（不等待结果）
    postAnnotationParseApi({
      annotationId: props.selectedAnnotation.id,
      inputType: 1, // 1-图片
      model: 1, // 1-豆包
      file
    })
      .then(() => {
        ElMessage.success('图片上传成功，正在解析...')
      })
      .catch((error) => {
        console.error('上传失败:', error)
        ElMessage.error('上传失败，请重试')
        // 解析失败
        props.selectedAnnotation.result = 2
        emit('updateAnnotation', props.selectedAnnotation)
      })

    // 退出导入模式
    isImportMode.value = false
  } finally {
    uploading.value = false
  }
}

// 重置为原图
const handleResetToOriginal = async () => {
  try {
    resetting.value = true

    // 清除当前显示的图片 URL
    currentImageUrl.value = ''
    // 清除图片 URL 和分析内容，强制重新加载
    props.selectedAnnotation.url = ''
    props.selectedAnnotation.analysisContent = ''
    // 更新状态为解析中
    props.selectedAnnotation.result = 0
    // 发送重试事件，使用标注框划分的原图重新解析
    emit('retryParse', props.selectedAnnotation)
    ElMessage.success('已开始重新解析原图...')
  } catch (error) {
    console.error('重置失败:', error)
    ElMessage.error('重置失败，请重试')
    props.selectedAnnotation.result = 2
    emit('updateAnnotation', props.selectedAnnotation)
  } finally {
    resetting.value = false
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = true
}

// 退出编辑模式
const handleExitEditMode = () => {
  isEditMode.value = false
}

// 保存编辑后的图片
const handleSaveEditedImage = async (editedBlob: Blob) => {
  try {
    // 开始保存状态
    isSaving.value = true

    // 将 Blob 转换为 File 对象
    const file = new File([editedBlob], 'edited-image.png', { type: 'image/png' })

    // 更新状态为解析中
    props.selectedAnnotation.result = 0
    emit('updateAnnotation', props.selectedAnnotation)

    // 触发开始解析事件，启动轮询
    emit('annotationParseStart', { annotationId: props.selectedAnnotation.id, questionId: props.selectedAnnotation.questionId })

    // 调用解析 API 上传编辑后的图片
    await postAnnotationParseApi({
      annotationId: props.selectedAnnotation.id,
      inputType: 1, // 1-图片
      model: 1, // 1-豆包
      file
    })

    ElMessage.success('图片编辑成功，正在解析...')

    // 退出编辑模式，但保持保存状态，等待轮询更新
    isEditMode.value = false

    // 注意：不在这里清除 isSaving，而是等待轮询检测到解析成功（result === 1）时清除
  } catch (error) {
    console.error('保存编辑图片失败:', error)
    ElMessage.error('保存失败，请重试')
    props.selectedAnnotation.result = 2
    emit('updateAnnotation', props.selectedAnnotation)
    // 失败时清除保存状态
    isSaving.value = false
  }
}
</script>

<style scoped>
.annotation-image-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
}

.section-title {
  font-weight: 500;
  color: #374151;
  font-size: 13px;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item .label {
  color: #6b7280;
  min-width: 50px;
}

.detail-item .value {
  color: #374151;
  font-weight: 500;
}

.status-box {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
}

.status-0 {
  background-color: #fef3c7;
  color: #d97706;
}

.status-2 {
  background-color: #fee2e2;
  color: #dc2626;
}

.status-box .is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.content-box {
  background-color: #f9fafb;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow: auto;
}

.image-content-box {
  padding: 0;
  background-color: transparent;
}

.image-preview-container {
  position: relative;
  min-height: 200px;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background-color: #f9fafb;
  border-radius: 4px;
}

.loading-overlay .is-spinning {
  animation: spin 1s linear infinite;
}

.image-preview-container img {
  display: block;
  border-radius: 4px;
  max-width: 100%;
}

.upload-box {
  width: 100%;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  background-color: #f9fafb;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

.hidden {
  display: none;
}
</style>
