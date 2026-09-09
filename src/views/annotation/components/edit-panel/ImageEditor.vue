<template>
  <div class="image-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="tool-buttons">
        <el-button
          :type="currentTool === 'select' ? 'primary' : 'default'"
          size="small"
          @click="setTool('select')"
        >
          <Icon icon="ep:aim" />
          选择
        </el-button>
        <el-button
          :type="currentTool === 'brush' ? 'primary' : 'default'"
          size="small"
          @click="setTool('brush')"
        >
          <Icon icon="ep:edit-pen" />
          画笔
        </el-button>
        <el-button
          :type="currentTool === 'eraser' ? 'primary' : 'default'"
          size="small"
          @click="setTool('eraser')"
        >
          <Icon icon="ep:delete" />
          橡皮擦
        </el-button>
      </div>

      <div class="tool-settings" v-if="currentTool === 'brush' || currentTool === 'eraser'">
        <div class="setting-item">
          <span class="setting-label">颜色:</span>
          <input type="color" v-model="brushColor" class="color-picker" />
        </div>
        <div class="setting-item">
          <span class="setting-label">粗细:</span>
          <el-slider
            v-model="brushSize"
            :min="1"
            :max="50"
            :show-tooltip="false"
            style="width: 100px"
          />
          <span class="size-value">{{ brushSize }}px</span>
        </div>
      </div>

      <div class="action-buttons">
        <el-button size="small" @click="handleUndo" :disabled="!canUndo">
          <Icon icon="ep:refresh-left" />
          撤销
        </el-button>
        <el-button size="small" @click="handleRedo" :disabled="!canRedo">
          <Icon icon="ep:refresh-right" />
          恢复
        </el-button>
        <el-button size="small" @click="handleClear">
          <Icon icon="ep:delete" />
          清空
        </el-button>
        <el-button size="small" @click="handleReset">
          <Icon icon="ep:refresh-left" />
          重置
        </el-button>
      </div>
    </div>

    <!-- 画布容器 -->
    <div class="canvas-container" ref="canvasContainer">
      <canvas ref="canvas" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp" />
    </div>

    <!-- 底部操作栏 -->
    <div class="footer-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'

interface Props {
  imageUrl: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [blob: Blob]
  cancel: []
}>()

// 画布相关
const canvas = ref<HTMLCanvasElement | null>(null)
const canvasContainer = ref<HTMLDivElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

// 工具状态
const currentTool = ref<'select' | 'brush' | 'eraser'>('select')
const brushColor = ref('#ff0000')
const brushSize = ref(5)

// 绘图状态
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// 原始图片
const originalImage = ref<HTMLImageElement | null>(null)

// 历史记录
const history = ref<ImageData[]>([])
const historyIndex = ref(-1)
const maxHistory = 50

// 计算属性
const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

// 初始化画布
const initCanvas = async () => {
  if (!canvas.value || !canvasContainer.value) return

  // 加载图片
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    originalImage.value = img

    // 设置画布尺寸
    canvas.value!.width = img.width
    canvas.value!.height = img.height

    // 获取绘图上下文
    ctx.value = canvas.value!.getContext('2d')
    if (!ctx.value) return

    // 绘制原始图片
    ctx.value.drawImage(img, 0, 0)

    // 保存初始状态
    saveToHistory()
  }
  img.onerror = () => {
    ElMessage.error('图片加载失败')
  }
  img.src = props.imageUrl
}

// 保存到历史记录
const saveToHistory = () => {
  if (!canvas.value || !ctx.value) return

  const imageData = ctx.value.getImageData(0, 0, canvas.value.width, canvas.value.height)

  // 如果在中间位置，删除后面的记录
  if (historyIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, historyIndex.value + 1)
  }

  history.value.push(imageData)
  historyIndex.value = history.value.length - 1

  // 限制历史记录数量
  if (history.value.length > maxHistory) {
    history.value.shift()
    historyIndex.value--
  }
}

// 设置工具
const setTool = (tool: 'select' | 'brush' | 'eraser') => {
  currentTool.value = tool
}

// 获取鼠标在画布上的坐标
const getMousePos = (e: MouseEvent) => {
  if (!canvas.value) return { x: 0, y: 0 }

  const rect = canvas.value.getBoundingClientRect()
  const scaleX = canvas.value.width / rect.width
  const scaleY = canvas.value.height / rect.height

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY
  }
}

// 鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (currentTool.value === 'select') return

  isDrawing.value = true
  const pos = getMousePos(e)
  lastX.value = pos.x
  lastY.value = pos.y
}

// 鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDrawing.value || !ctx.value) return

  const pos = getMousePos(e)

  if (currentTool.value === 'brush') {
    ctx.value.beginPath()
    ctx.value.moveTo(lastX.value, lastY.value)
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.strokeStyle = brushColor.value
    ctx.value.lineWidth = brushSize.value
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
    ctx.value.stroke()
  } else if (currentTool.value === 'eraser') {
    ctx.value.beginPath()
    ctx.value.moveTo(lastX.value, lastY.value)
    ctx.value.lineTo(pos.x, pos.y)
    ctx.value.strokeStyle = brushColor.value
    ctx.value.lineWidth = brushSize.value
    ctx.value.lineCap = 'round'
    ctx.value.lineJoin = 'round'
    ctx.value.globalCompositeOperation = 'destination-out'
    ctx.value.stroke()
    ctx.value.globalCompositeOperation = 'source-over'
  }

  lastX.value = pos.x
  lastY.value = pos.y
}

// 鼠标松开
const handleMouseUp = () => {
  if (isDrawing.value) {
    isDrawing.value = false
    saveToHistory()
  }
}

// 撤销
const handleUndo = () => {
  if (!canUndo.value || !canvas.value || !ctx.value) return

  historyIndex.value--
  const imageData = history.value[historyIndex.value]
  if (imageData) {
    ctx.value.putImageData(imageData, 0, 0)
  }
}

// 恢复
const handleRedo = () => {
  if (!canRedo.value || !canvas.value || !ctx.value) return

  historyIndex.value++
  const imageData = history.value[historyIndex.value]
  if (imageData) {
    ctx.value.putImageData(imageData, 0, 0)
  }
}

// 清空
const handleClear = () => {
  if (!canvas.value || !ctx.value || !originalImage.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.value.drawImage(originalImage.value, 0, 0)
  saveToHistory()
}

// 重置
const handleReset = () => {
  if (!canvas.value || !ctx.value || !originalImage.value) return

  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  ctx.value.drawImage(originalImage.value, 0, 0)

  // 清空历史记录
  history.value = []
  historyIndex.value = -1
  saveToHistory()
}

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 保存
const handleSave = () => {
  if (!canvas.value) return

  canvas.value.toBlob((blob) => {
    if (blob) {
      emit('save', blob)
    } else {
      ElMessage.error('保存失败')
    }
  }, 'image/png')
}

// 监听图片 URL 变化
watch(() => props.imageUrl, () => {
  initCanvas()
})

// 组件挂载后初始化
onMounted(() => {
  initCanvas()
})
</script>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 12px;
}

.tool-buttons,
.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-settings {
  display: flex;
  align-items: center;
  gap: 16px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.setting-label {
  color: var(--el-text-color-regular);
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
}

.size-value {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 35px;
}

.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f0f0;
  overflow: auto;
  padding: 20px;
}

canvas {
  max-width: 100%;
  max-height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-top: 1px solid #e5e7eb;
}
</style>
