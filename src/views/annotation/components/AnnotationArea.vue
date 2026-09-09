<template>
  <div class="annotation-area-container h-full flex flex-col overflow-hidden">
    <!-- 顶部导航栏 -->
    <div class="nav-bar h-12 border-b border-gray-200 bg-white flex items-center px-4 flex-shrink-0">
      <!-- 左图控制区域 -->
      <div class="nav-section left-nav flex items-center gap-3 flex-1">
        <span class="text-sm text-gray-600 font-medium">左图</span>
        <!-- 页码导航 -->
        <div class="flex items-center gap-1">
          <el-button size="small" circle @click="handlePreviousLeftPage" :disabled="leftPageIndex <= 1">
            <Icon icon="ep:arrow-left" />
          </el-button>
          <el-input v-model.number="leftPageIndex" :min="1" :max="leftPdf?.size || 1" size="small" class="w-14"
            @change="handleLeftPageJump" />
          <span class="text-sm text-gray-500">/ {{ leftPdf?.size || 0 }}</span>
          <el-button size="small" circle @click="handleNextLeftPage"
            :disabled="!leftPdf || leftPageIndex >= leftPdf.size">
            <Icon icon="ep:arrow-right" />
          </el-button>
        </div>
        <el-divider direction="vertical" />
        <!-- 缩放控制 -->
        <div class="flex items-center gap-1">
          <el-button size="small" circle @click="handleZoomIn('left')" :disabled="leftZoom >= 3">
            <Icon icon="ep:zoom-in" />
          </el-button>
          <span class="text-sm text-gray-500 w-12 text-center">{{ Math.round(leftZoom * 100) }}%</span>
          <el-button size="small" circle @click="handleZoomOut('left')" :disabled="leftZoom <= 0.5">
            <Icon icon="ep:zoom-out" />
          </el-button>
          <el-button size="small" @click="handleResetZoom('left')">重置</el-button>
        </div>
      </div>

      <!-- 布局切换按钮 -->
      <div class="layout-switcher flex items-center gap-2 px-4">
        <el-button size="small" @click="toggleLayout" title="切换布局">
          <Icon :icon="imageLayout === 'horizontal' ? 'ep:rank' : 'ep:bottom'" />
          <span class="ml-1">{{ imageLayout === 'horizontal' ? '左右布局' : '上下布局' }}</span>
        </el-button>
      </div>

      <!-- 右图控制区域 -->
      <div class="nav-section right-nav flex items-center gap-3 flex-1 justify-end">
        <!-- 缩放控制 -->
        <div class="flex items-center gap-1">
          <el-button size="small" circle @click="handleZoomIn('right')" :disabled="rightZoom >= 3">
            <Icon icon="ep:zoom-in" />
          </el-button>
          <span class="text-sm text-gray-500 w-12 text-center">{{ Math.round(rightZoom * 100) }}%</span>
          <el-button size="small" circle @click="handleZoomOut('right')" :disabled="rightZoom <= 0.5">
            <Icon icon="ep:zoom-out" />
          </el-button>
          <el-button size="small" @click="handleResetZoom('right')">重置</el-button>
        </div>
        <el-divider direction="vertical" />
        <!-- 页码导航 -->
        <div class="flex items-center gap-1">
          <el-button size="small" circle @click="handlePreviousRightPage" :disabled="rightPageIndex <= 1">
            <Icon icon="ep:arrow-left" />
          </el-button>
          <el-input v-model.number="rightPageIndex" :min="1" :max="rightPdf?.size || 1" size="small" class="w-14"
            @change="handleRightPageJump" />
          <span class="text-sm text-gray-500">/ {{ rightPdf?.size || 0 }}</span>
          <el-button size="small" circle @click="handleNextRightPage"
            :disabled="!rightPdf || rightPageIndex >= rightPdf.size">
            <Icon icon="ep:arrow-right" />
          </el-button>
        </div>
        <span class="text-sm text-gray-600 font-medium ml-2">右图</span>
      </div>
    </div>

    <!-- 图片显示区域 -->
    <div class="image-area flex-1 p-4 overflow-hidden bg-gray-100 relative" @contextmenu.prevent="handleRightClick"
      @click="handleClickOutside">
      <el-splitter class="h-full" :layout="imageLayout" :key="imageLayout">
        <!-- 左侧图片区域 -->
        <el-splitter-panel :min="200">
          <div class="image-section left-section w-full h-full overflow-hidden relative"
            @mousedown="handleMouseDown('left')">
            <!-- 左侧可拖动的图片容器 -->
            <div ref="leftImageWrapperRef" class="image-wrapper absolute"
              :class="{ 'cursor-grab': isLongPress.left, 'cursor-grabbing': isDragging.left }" :style="leftWrapperStyle"
              @mousedown="handleImageMouseDown($event, 'left')" @mouseup="handleImageMouseUp($event, 'left')">
              <div class="image-item" :class="{ 'is-annotating': currentAnnotationImage === 'left' }"
                :style="leftImageStyle" @contextmenu.prevent="handleImageRightClick($event, 'left')"
                @wheel.prevent="(e) => handleWheel(e, 'left')">
                <div class="page-info">{{ leftPdf?.pdfName }} - 第 {{ leftPage?.realPage || leftPageIndex }} 页</div>
                <img v-if="leftPageUrl" ref="leftImageRef" :src="leftPageUrl" alt="左侧图片" class="pdf-page"
                  draggable="false" crossorigin="anonymous" />
                <!-- 标注框和标签 -->
                <template v-for="annotation in leftAnnotations" :key="annotation.id">
                  <!-- 标注标签 -->
                  <div class="annotation-label" :class="{ 'label-hidden': shouldHideLabel(annotation, 'left') }"
                    :style="{ ...getAnnotationLabelStyle(annotation, 'left'), color: getAnnotationTypeColor(annotation.type, annotation.inputType) }"
                    @mouseenter="handleLabelMouseEnter(annotation.id)"
                    @mouseleave="handleLabelMouseLeave(annotation.id)">
                    题{{ annotation.sortNum || '?' }}
                  </div>
                  <!-- 标注框 -->
                  <div class="annotation-box"
                    :class="{ selected: selectedAnnotationId === annotation.id, highlighted: highlightedAnnotationId === annotation.id, resizing: resizingAnnotation?.id === annotation.id, dragging: draggingAnnotation?.id === annotation.id, 'show-drag-handle': annotationShowingDragHandle === annotation.id, 'show-label': hoveredLabelId === annotation.id }"
                    :style="{ ...getAnnotationStyle(annotation, 'left'), borderColor: getAnnotationTypeColor(annotation.type, annotation.inputType), cursor: resizingAnnotation?.id === annotation.id ? getResizeCursor(resizingDirection) : '', '--zoom-scale': leftZoom }"
                    @click.stop="handleAnnotationClick(annotation)"
                    @mouseenter="handleAnnotationBoxMouseEnter(annotation.id)"
                    @mouseleave="handleAnnotationBoxMouseLeave(annotation.id)"
                    @mousedown.stop="handleAnnotationMouseDown($event, annotation, 'left')"
                    @contextmenu="handleAnnotationBoxRightClick($event, annotation, 'left')">
                    <!-- 确认和取消按钮（调整或移动后显示） -->
                    <template v-if="pendingConfirmAnnotation?.id === annotation.id && !isParsingAnnotation">
                      <!-- 确认按钮 -->
                      <div class="confirm-button" @click.stop="
                        updatingAnnotationType !== annotation.type
                          ? handleConfirmUpdateType(annotation)
                          : handleConfirmAnnotation(annotation)
                        ">
                        <Icon icon="ep:check" :width="16" :height="16" />
                      </div>
                      <!-- 取消按钮 -->
                      <div class="cancel-button" @click.stop="
                        updatingAnnotationType !== annotation.type
                          ? handleCancelUpdateType(annotation)
                          : handleCancelAnnotationChange(annotation)
                        ">
                        <Icon icon="ep:close" :width="16" :height="16" />
                      </div>
                    </template>
                    <!-- 拖动标志（左上角） -->
                    <div v-if="annotationShowingDragHandle === annotation.id && isParsingAnnotation !== annotation.id"
                      class="drag-handle" @mousedown.stop="handleDragHandleMouseDown($event, annotation, 'left')">
                      <Icon icon="ep:rank" :width="16" :height="16" />
                    </div>
                    <!-- 调整大小的手柄 -->
                    <template v-if="selectedAnnotationId === annotation.id && isParsingAnnotation !== annotation.id">
                      <div class="resize-handle nw" data-dir="nw"></div>
                      <div class="resize-handle ne" data-dir="ne"></div>
                      <div class="resize-handle sw" data-dir="sw"></div>
                      <div class="resize-handle se" data-dir="se"></div>
                    </template>
                  </div>
                </template>
                <!-- 标注选框 -->
                <div v-if="currentAnnotationRect && currentAnnotationImage === 'left'" class="selection-rect"
                  :style="getSelectionRectStyle('left')" />
              </div>
            </div>
            <!-- 左侧空状态提示 -->
            <div v-if="!leftPageUrl" class="empty-state">
              <Icon icon="ep:picture" :width="64" :height="64" class="text-gray-400" />
              <p class="text-gray-400 mt-2">暂无图片</p>
            </div>
          </div>
        </el-splitter-panel>

        <!-- 右侧图片区域 -->
        <el-splitter-panel :min="200">
          <div class="image-section right-section w-full h-full overflow-hidden relative"
            @mousedown="handleMouseDown('right')">
            <!-- 右侧可拖动的图片容器 -->
            <div ref="rightImageWrapperRef" class="image-wrapper absolute"
              :class="{ 'cursor-grab': isLongPress.right, 'cursor-grabbing': isDragging.right }"
              :style="rightWrapperStyle" @mousedown="handleImageMouseDown($event, 'right')"
              @mouseup="handleImageMouseUp($event, 'right')">
              <div class="image-item" :class="{ 'is-annotating': currentAnnotationImage === 'right' }"
                :style="rightImageStyle" @contextmenu.prevent="handleImageRightClick($event, 'right')"
                @wheel.prevent="(e) => handleWheel(e, 'right')">
                <div class="page-info">{{ rightPdf?.pdfName }} - 第 {{ rightPage?.realPage || rightPageIndex }} 页</div>
                <img v-if="rightPageUrl" ref="rightImageRef" :src="rightPageUrl" alt="右侧图片" class="pdf-page"
                  draggable="false" crossorigin="anonymous" />
                <!-- 标注框和标签 -->
                <template v-for="annotation in rightAnnotations" :key="annotation.id">
                  <!-- 标注标签 -->
                  <div class="annotation-label" :class="{ 'label-hidden': shouldHideLabel(annotation, 'right') }"
                    :style="{ ...getAnnotationLabelStyle(annotation, 'right'), color: getAnnotationTypeColor(annotation.type, annotation.inputType) }"
                    @mouseenter="handleLabelMouseEnter(annotation.id)"
                    @mouseleave="handleLabelMouseLeave(annotation.id)">
                    题{{ annotation.sortNum || '?' }}
                  </div>
                  <!-- 标注框 -->
                  <div class="annotation-box"
                    :class="{ selected: selectedAnnotationId === annotation.id, highlighted: highlightedAnnotationId === annotation.id, resizing: resizingAnnotation?.id === annotation.id, dragging: draggingAnnotation?.id === annotation.id, 'show-drag-handle': annotationShowingDragHandle === annotation.id, 'show-label': hoveredLabelId === annotation.id }"
                    :style="{ ...getAnnotationStyle(annotation, 'right'), borderColor: getAnnotationTypeColor(annotation.type, annotation.inputType), cursor: resizingAnnotation?.id === annotation.id ? getResizeCursor(resizingDirection) : '', '--zoom-scale': rightZoom }"
                    @click.stop="handleAnnotationClick(annotation)"
                    @mouseenter="handleAnnotationBoxMouseEnter(annotation.id)"
                    @mouseleave="handleAnnotationBoxMouseLeave(annotation.id)"
                    @mousedown.stop="handleAnnotationMouseDown($event, annotation, 'right')"
                    @contextmenu="handleAnnotationBoxRightClick($event, annotation, 'right')">
                    <!-- 确认和取消按钮（调整或移动后显示） -->
                    <template v-if="pendingConfirmAnnotation?.id === annotation.id && !isParsingAnnotation">
                      <!-- 确认按钮 -->
                      <div class="confirm-button" @click.stop="
                        updatingAnnotationType !== annotation.type
                          ? handleConfirmUpdateType(annotation)
                          : handleConfirmAnnotation(annotation)
                        ">
                        <Icon icon="ep:check" :width="16" :height="16" />
                      </div>
                      <!-- 取消按钮 -->
                      <div class="cancel-button" @click.stop="
                        updatingAnnotationType !== annotation.type
                          ? handleCancelUpdateType(annotation)
                          : handleCancelAnnotationChange(annotation)
                        ">
                        <Icon icon="ep:close" :width="16" :height="16" />
                      </div>
                    </template>
                    <!-- 拖动标志（左上角） -->
                    <div v-if="annotationShowingDragHandle === annotation.id && isParsingAnnotation !== annotation.id"
                      class="drag-handle" @mousedown.stop="handleDragHandleMouseDown($event, annotation, 'right')">
                      <Icon icon="ep:rank" :width="16" :height="16" />
                    </div>
                    <!-- 调整大小的手柄 -->
                    <template v-if="selectedAnnotationId === annotation.id && isParsingAnnotation !== annotation.id">
                      <div class="resize-handle nw" data-dir="nw"></div>
                      <div class="resize-handle ne" data-dir="ne"></div>
                      <div class="resize-handle sw" data-dir="sw"></div>
                      <div class="resize-handle se" data-dir="se"></div>
                    </template>
                  </div>
                </template>
                <!-- 标注选框 -->
                <div v-if="currentAnnotationRect && currentAnnotationImage === 'right'" class="selection-rect"
                  :style="getSelectionRectStyle('right')" />
              </div>
            </div>
            <!-- 右侧空状态提示 -->
            <div v-if="!rightPageUrl" class="empty-state">
              <Icon icon="ep:picture" :width="64" :height="64" class="text-gray-400" />
              <p class="text-gray-400 mt-2">暂无图片</p>
            </div>
          </div>
        </el-splitter-panel>
      </el-splitter>
    </div>

    <!-- 标注类型选择对话框 -->
    <el-dialog v-model="annotationTypeDialogVisible" title="选择标注类型" width="300px">
      <el-form>
        <el-form-item label="标注类型">
          <el-select v-model="selectedAnnotationType" placeholder="请选择标注类型" style="width: 100%">
            <el-option label="题干" :value="1" />
            <el-option label="题干图" :value="2" />
            <el-option label="选项" :value="3" />
            <el-option label="选项图" :value="4" />
            <el-option label="解析" :value="5" />
            <el-option label="解析图" :value="6" />
            <el-option label="答案" :value="7" />
            <el-option label="答案图" :value="8" />
            <el-option label="表格" :value="9" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleCancelAnnotationType">取消</el-button>
        <el-button type="primary" @click="handleCreateAnnotation" :loading="creating">确定</el-button>
      </template>
    </el-dialog>

    <!-- 右键标注类型选择面板（框选后显示） -->
    <teleport to="body">
      <div v-if="contextMenuVisible" ref="contextMenuRef" class="context-menu-panel" :style="contextMenuStyle"
        @click.stop @mouseleave="handleContextMenuMouseLeave">
        <div class="context-menu-title">{{ currentShortcutKey ? `${shortcutKeyNames[currentShortcutKey]}标注` : '选择标注类型' }}</div>
        <div class="context-menu-items">
          <div v-for="config in filteredAnnotationTypeConfigs" :key="config.value"
            class="context-menu-item-wrapper"
            :class="{ 'has-submenu': textTypeWithOcrOption.includes(config.value) }"
            @mouseleave="handleMenuItemMouseLeave(config.value)">
            <div class="context-menu-item"
              :class="{ active: selectedAnnotationType === config.value && selectedOcrType === 'text' }"
              @click="handleSelectAnnotationType(config.value, 'text')"
              @mouseenter="handleMenuItemMouseEnter(config.value, $event)">
              <Icon :icon="config.icon" :style="{ color: config.color }" />
              <span>{{ config.name }}</span>
              <!-- 文本类型(1,3,5,7)显示向右箭头 indicator -->
              <Icon v-if="textTypeWithOcrOption.includes(config.value)"
                icon="ep:arrow-right" class="ml-auto text-gray-400" />
            </div>
            <!-- 子菜单：选择文本或表格OCR -->
            <div v-if="expandedOcrTypeMenu === config.value && textTypeWithOcrOption.includes(config.value)"
              class="ocr-type-submenu"
              @mouseenter="handleSubMenuMouseEnter"
              @mouseleave="handleSubMenuMouseLeave">
              <div class="ocr-type-submenu-item" :class="{ active: selectedOcrType === 'text' }"
                @click.stop="handleSelectAnnotationType(config.value, 'text')">
                <Icon icon="ep:document" class="mr-1" />
                <span>文本</span>
              </div>
              <div class="ocr-type-submenu-item" :class="{ active: selectedOcrType === 'table' }"
                @click.stop="handleSelectAnnotationType(config.value, 'table')">
                <Icon icon="ep:grid" class="mr-1" />
                <span>表格</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- 修改标注类型面板（右键标注框后显示） -->
    <teleport to="body">
      <div v-if="updateTypeMenuVisible" ref="updateTypeMenuRef" class="context-menu-panel" :style="updateTypeMenuStyle"
        @click.stop @mouseleave="handleUpdateTypeMenuMouseLeave">
        <div class="context-menu-title">修改标注类型</div>
        <div class="context-menu-items">
          <div v-for="config in annotationTypeConfigs" :key="config.value"
            class="context-menu-item-wrapper"
            :class="{ 'has-submenu': textTypeWithOcrOption.includes(config.value) }"
            @mouseleave="handleUpdateMenuItemMouseLeave(config.value)">
            <div class="context-menu-item"
              :class="{ active: updatingAnnotationType === config.value && updatingOcrType === 'text', disabled: isParsingAnnotation === selectedAnnotationId }"
              @click="isParsingAnnotation === selectedAnnotationId ? null : handleUpdateAnnotationType(config.value, 'text')"
              @mouseenter="handleUpdateMenuItemMouseEnter(config.value, $event)">
              <Icon :icon="config.icon"
                :style="{ color: isParsingAnnotation === selectedAnnotationId ? '#9ca3af' : config.color }" />
              <span>{{ config.name }}</span>
              <!-- 文本类型(1,3,5,7)显示向右箭头 indicator -->
              <Icon v-if="textTypeWithOcrOption.includes(config.value) && !(isParsingAnnotation === selectedAnnotationId)"
                icon="ep:arrow-right" class="ml-auto text-gray-400" />
            </div>
            <!-- 子菜单：选择文本或表格OCR -->
            <div v-if="expandedUpdateOcrTypeMenu === config.value && textTypeWithOcrOption.includes(config.value)"
              class="ocr-type-submenu"
              @mouseenter="handleUpdateSubMenuMouseEnter"
              @mouseleave="handleUpdateSubMenuMouseLeave">
              <div class="ocr-type-submenu-item" :class="{ active: updatingOcrType === 'text' }"
                @click.stop="handleUpdateAnnotationType(config.value, 'text')">
                <Icon icon="ep:document" class="mr-1" />
                <span>文本</span>
              </div>
              <div class="ocr-type-submenu-item" :class="{ active: updatingOcrType === 'table' }"
                @click.stop="handleUpdateAnnotationType(config.value, 'table')">
                <Icon icon="ep:grid" class="mr-1" />
                <span>表格</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { getPdfListApi, getPdfPageListApi, type PdfVO, type PdfPageVO } from '@/api/gen/pdfAdminController'
import { getAnnotationListByProjectAndPageApi, postAnnotationCreateApi, postAnnotationParseApi, putAnnotationUpdateRectApi, putAnnotationUpdateTypeApi, putAnnotationUpdateTypeToTextApi, postAnnotationProcessAnnotationApi, type AnnotationVO, type AnnotationSimpleVO, type AnnotationUpdateCmd, type ProcessAnnotationCmd } from '@/api/gen/annotationController'
import { getModelListApi, type ModelVO } from '@/api/gen/modelController'
import { useOcrStore } from '@/stores/ocr'
import { useParseSettingsStore } from '@/stores/parseSettings'
import { callDouBaoText, callDouBaoTable, type DouBaoResponse } from '@/api/doubao'

// 图片布局类型：horizontal（左右布局） 或 vertical（上下布局）
const imageLayout = ref<'horizontal' | 'vertical'>('horizontal')

// 切换图片布局
const toggleLayout = () => {
  imageLayout.value = imageLayout.value === 'horizontal' ? 'vertical' : 'horizontal'
  console.log('布局切换:', imageLayout.value)
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
  { value: 8, name: '答案图', icon: 'ep:zoom-in', color: '#84cc16' }
]

// 表格类型的独立配置（inputType=3 时使用）
const tableTypeConfigs: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: '题干表格', icon: 'ep:grid', color: '#1e40af' },   // 深蓝色
  3: { name: '选项表格', icon: 'ep:grid', color: '#065f46' },   // 深绿色
  5: { name: '解析表格', icon: 'ep:grid', color: '#991b1b' },   // 深红色
  7: { name: '答案表格', icon: 'ep:grid', color: '#155e75' },   // 深青色
  9: { name: '表格', icon: 'ep:grid', color: '#7c3aed' }        // 深紫色（独立表格）
}

// 文本类型列表（这些类型可以选择文本OCR或表格OCR）
const textTypeWithOcrOption = [1, 3, 5, 7]

// 快捷键标注类型映射
const shortcutKeyMap: Record<string, number> = {
  't': 1,   // T -> 题干
  'a': 7,   // A -> 答案
  'z': 5,   // Z -> 解析
  'c': 3,   // C -> 选项
}

// 快捷键名称映射
const shortcutKeyNames: Record<string, string> = {
  't': '题干',
  'a': '答案',
  'z': '解析',
  'c': '选项',
}

// 当前按下的快捷键类型（null表示普通右键，没有快捷键）
const currentShortcutKey = ref<string | null>(null)

// 全局按键状态
const pressedKeys = reactive(new Set<string>())

// 监听全局按键按下
const handleGlobalKeyDown = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  pressedKeys.add(key)
}

// 监听全局按键释放
const handleGlobalKeyUp = (e: KeyboardEvent) => {
  const key = e.key.toLowerCase()
  pressedKeys.delete(key)
}

// 获取当前按下的快捷键
const getPressedShortcutKey = (): string | null => {
  for (const key of shortcutKeyMapKeys) {
    if (pressedKeys.has(key)) {
      return key
    }
  }
  return null
}

// 快捷键列表（用于检测）
const shortcutKeyMapKeys = Object.keys(shortcutKeyMap)

// 根据快捷键过滤的标注类型配置
const filteredAnnotationTypeConfigs = computed(() => {
  if (!currentShortcutKey.value) {
    return annotationTypeConfigs
  }
  const targetType = shortcutKeyMap[currentShortcutKey.value]
  if (!targetType) return annotationTypeConfigs
  return annotationTypeConfigs.filter(config => config.value === targetType || config.value === targetType + 1)
})

// 当前展开的OCR类型子菜单（null表示没有展开，number表示展开的类型值）
const expandedOcrTypeMenu = ref<number | null>(null)

// 当前选择的OCR类型（'text' 或 'table'）
const selectedOcrType = ref<'text' | 'table'>('text')

// 修改标注类型时展开的OCR类型子菜单
const expandedUpdateOcrTypeMenu = ref<number | null>(null)

// 修改标注类型时选择的OCR类型（'text' 或 'table'）
const updatingOcrType = ref<'text' | 'table'>('text')

// 标注创建时的OCR类型映射（标注ID -> inputType），用于新创建的标注
const pendingAnnotationOcrType = ref<Record<string, number>>({})

// 子菜单关闭定时器（用于鼠标悬停交互的延迟关闭）
let subMenuCloseTimer: ReturnType<typeof setTimeout> | null = null
let updateSubMenuCloseTimer: ReturnType<typeof setTimeout> | null = null

interface Props {
  projectId: string
  subject?: string
}

const props = defineProps<Props>()

const emit = defineEmits(['refreshAnnotations', 'annotationCreated', 'selectAnnotation', 'annotationParsed', 'annotationParseStart', 'deleteAnnotation'])
const ocrStore = useOcrStore()
const parseSettingsStore = useParseSettingsStore()

// 模型相关
const modelList = ref<ModelVO[]>([])
const currentModel = ref<ModelVO | null>(null)

// 加载模型列表
const loadModelList = async () => {
    try {
        const res = await getModelListApi()
        if (res.data.code === 200 && res.data.data) {
            modelList.value = res.data.data
            console.log('[AnnotationArea] 模型列表加载成功:', modelList.value)

            // 获取当前有效的模型
            currentModel.value = parseSettingsStore.getEffectiveModel(modelList.value)
            console.log('[AnnotationArea] 当前使用模型:', currentModel.value)
        }
    } catch (error) {
        console.error('[AnnotationArea] 加载模型列表失败:', error)
    }
}

// 当前选中的题目ID
const selectedQuestionId = ref<string | null>(null)

// 题目索引映射（用于显示题号）
const questionsIndexMap = ref<Record<string, number>>({})

// 设置题目列表（用于生成题号映射）
const setQuestionsList = (questions: Array<{ id: string; sortNum?: number }>) => {
  const indexMap: Record<string, number> = {}
  questions.forEach((q, index) => {
    indexMap[q.id] = q.sortNum || index + 1
  })
  questionsIndexMap.value = indexMap
}

// 电子书列表
const pdfList = ref<PdfVO[]>([])
// 所有电子书的页面数据
const allPages = ref<PdfPageVO[]>([])
// 当前电子书索引
const currentPdfIndex = ref(0)
// 左侧图片页码
const leftPageIndex = ref(1)
// 右侧图片页码
const rightPageIndex = ref(2) // 右图默认第二页

// 图片拖动位置 - 左右图分别拖动
const leftImagePosition = reactive({ x: 0, y: 0 })
const rightImagePosition = reactive({ x: 0, y: 0 })
const isDragging = reactive({ left: false, right: false })
const dragStart = reactive({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } })
const leftImageWrapperRef = ref<HTMLElement | null>(null)
const rightImageWrapperRef = ref<HTMLElement | null>(null)
const leftImageRef = ref<HTMLImageElement | null>(null)
const rightImageRef = ref<HTMLImageElement | null>(null)

// 缩放相关 - 左右图分别缩放
const leftZoom = ref(1)
const rightZoom = ref(1)

// 标注相关
const annotations = ref<AnnotationVO[]>([])
const selectedAnnotationId = ref<string | null>(null)
const highlightedAnnotationId = ref<string | null>(null)
const annotationTypeDialogVisible = ref(false)
const selectedAnnotationType = ref<number>(1)
const creating = ref(false)
// 显示拖动标志的标注ID
const annotationShowingDragHandle = ref<string | null>(null)
// 待确认的标注框（调整或移动后等待用户确认）
const pendingConfirmAnnotation = ref<{ id: string; side: 'left' | 'right'; topLeftX: number; topLeftY: number; bottomRightX: number; bottomRightY: number; type: number; page: number; questionId?: string } | null>(null)
// 是否正在解析中
const isParsingAnnotation = ref<string | null>(null)
// 标记刚刚完成了拖动或调整大小，防止触发点击事件
const justFinishedDragOrResize = ref(false)
// 当前悬停的标签ID（用于显示被隐藏的标签）
const hoveredLabelId = ref<string | null>(null)

// 右键弹出面板相关
const contextMenuVisible = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })
const contextMenuRef = ref<HTMLElement | null>(null)

// 修改标注类型相关
const updateTypeDialogVisible = ref(false)
const updateTypeMenuVisible = ref(false)
const updateTypeMenuPosition = ref({ x: 0, y: 0 })
const updateTypeMenuRef = ref<HTMLElement | null>(null)
const updatingAnnotationType = ref<number>(1)

// 计算修改标注类型菜单的智能定位样式
const updateTypeMenuStyle = computed(() => {
  if (!updateTypeMenuRef.value || !updateTypeMenuVisible.value) {
    return {
      left: `${updateTypeMenuPosition.value.x}px`,
      top: `${updateTypeMenuPosition.value.y}px`
    }
  }

  const menuRect = updateTypeMenuRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 10 // 边距

  let { x, y } = updateTypeMenuPosition.value

  // 如果菜单超出右边界，向左显示
  if (x + menuRect.width + margin > viewportWidth) {
    x = viewportWidth - menuRect.width - margin
  }

  // 如果菜单超出下边界，向上显示
  if (y + menuRect.height + margin > viewportHeight) {
    y = viewportHeight - menuRect.height - margin
  }

  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

// 鼠标长按检测相关
const isLongPress = reactive({ left: false, right: false })
const mouseDownTimers = reactive<{ left: NodeJS.Timeout | null, right: NodeJS.Timeout | null }>({ left: null, right: null })

// 计算右键菜单的智能定位样式
const contextMenuStyle = computed(() => {
  if (!contextMenuRef.value || !contextMenuVisible.value) {
    return {
      left: `${contextMenuPosition.value.x}px`,
      top: `${contextMenuPosition.value.y}px`
    }
  }

  const menuRect = contextMenuRef.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const margin = 10 // 边距

  let { x, y } = contextMenuPosition.value

  // 如果菜单超出右边界，向左显示
  if (x + menuRect.width + margin > viewportWidth) {
    x = viewportWidth - menuRect.width - margin
  }

  // 如果菜单超出下边界，向上显示
  if (y + menuRect.height + margin > viewportHeight) {
    y = viewportHeight - menuRect.height - margin
  }

  return {
    left: `${x}px`,
    top: `${y}px`
  }
})

// 标注绘制状态
const isAnnotating = ref(false)
const annotationStart = ref<{ x: number; y: number } | null>(null)
const annotationEnd = ref<{ x: number; y: number } | null>(null)
const currentAnnotationImage = ref<'left' | 'right' | null>(null)
const currentMousePos = ref<{ x: number; y: number } | null>(null)

// 标注框调整大小状态
const isResizing = ref(false)
const resizingAnnotation = ref<AnnotationVO | null>(null)
const resizingDirection = ref<'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null>(null)
const resizingSide = ref<'left' | 'right' | null>(null)
const resizeStart = ref<{ x: number; y: number; rect: { topLeftX: number; topLeftY: number; bottomRightX: number; bottomRightY: number } } | null>(null)

// 拖拽标注框相关
const isDraggingAnnotation = ref(false)
const draggingAnnotation = ref<AnnotationVO | null>(null)
const dragAnnotationSide = ref<'left' | 'right' | null>(null)
const dragAnnotationStart = ref<{ x: number; y: number; rect: { topLeftX: number; topLeftY: number; bottomRightX: number; bottomRightY: number } } | null>(null)
// 使用 requestAnimationFrame 节流标注框拖拽
const dragAnnotationAnimationFrameId = ref<number | null>(null)
// 拖拽时的临时坐标（非响应式，避免频繁触发 Vue 更新）
const dragAnnotationTempPosition = ref<{ topLeftX: number; topLeftY: number; bottomRightX: number; bottomRightY: number } | null>(null)

// 当前电子书
const currentPdf = computed(() => pdfList.value[currentPdfIndex.value] || null)

// 左侧电子书（当前电子书）
const leftPdf = computed(() => currentPdf.value)

// 右侧电子书索引
const rightPdfIndex = computed(() => {
  if (pdfList.value.length > 1 && currentPdfIndex.value < pdfList.value.length - 1) {
    return currentPdfIndex.value + 1
  }
  return currentPdfIndex.value
})

// 右侧电子书（下一本，如果没有则用当前电子书）
const rightPdf = computed(() => pdfList.value[rightPdfIndex.value] || null)

// 获取电子书的页面列表（按 realPage 排序）
const getPdfPages = (pdfId: string): PdfPageVO[] => {
  return allPages.value
    .filter(page => page.pdfId === pdfId)
    .sort((a, b) => a.realPage - b.realPage)
}

// 左侧页面数据
const leftPages = computed(() => leftPdf.value ? getPdfPages(leftPdf.value.id) : [])

// 右侧页面数据
const rightPages = computed(() => rightPdf.value ? getPdfPages(rightPdf.value.id) : [])

// 左侧当前页面（使用索引）
const leftPage = computed(() => leftPages.value[leftPageIndex.value - 1])

// 右侧当前页面（使用索引）
const rightPage = computed(() => rightPages.value[rightPageIndex.value - 1])

// 左侧图片 URL
const leftPageUrl = computed(() => leftPage.value?.url || '')

// 右侧图片 URL
const rightPageUrl = computed(() => rightPage.value?.url || '')


// 总页数
const totalPageCount = computed(() => {
  return allPages.value.length
})

// 当前标注框（用于显示选框）
const currentAnnotationRect = computed(() => {
  if (!annotationStart.value) return null
  // 使用 currentMousePos 实时显示选框，如果没有则使用 annotationEnd
  const endPos = currentMousePos.value || annotationEnd.value
  if (!endPos) return null
  const x = Math.min(annotationStart.value.x, endPos.x)
  const y = Math.min(annotationStart.value.y, endPos.y)
  const width = Math.abs(endPos.x - annotationStart.value.x)
  const height = Math.abs(endPos.y - annotationStart.value.y)
  return { x, y, width, height }
})

// 左侧标注（当前页）
const leftAnnotations = computed(() => {
  if (!leftPage.value) return []
  const pageNum = leftPage.value!.realPage || leftPageIndex.value
  console.log('左侧过滤标注，页码:', pageNum, '标注总数:', annotations.value.length)
  const filtered = annotations.value.filter(a => a.page === pageNum)
  console.log('左侧标注结果:', filtered)
  return filtered
})

// 右侧标注（当前页）
const rightAnnotations = computed(() => {
  if (!rightPage.value) return []
  const pageNum = rightPage.value!.realPage || rightPageIndex.value
  console.log('右侧过滤标注，页码:', pageNum, '标注总数:', annotations.value.length)
  const filtered = annotations.value.filter(a => a.page === pageNum)
  console.log('右侧标注结果:', filtered)
  return filtered
})

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
  return getAnnotationTypeConfig(type, inputType)?.name || ''
}

// 获取标注类型图标
const getAnnotationTypeIcon = (type: number, inputType?: number) => {
  return getAnnotationTypeConfig(type, inputType)?.icon || 'ep:document'
}

// 获取标注类型颜色
const getAnnotationTypeColor = (type: number, inputType?: number) => {
  return getAnnotationTypeConfig(type, inputType)?.color || '#000'
}

// 获取调整大小的光标样式
const getResizeCursor = (direction: 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'w' | 'e' | null) => {
  if (!direction) return ''
  return `${direction}-resize`
}

// 处理取消标注框移动/调整
const handleCancelAnnotationChange = (annotation: AnnotationVO) => {
  if (!pendingConfirmAnnotation.value) {
    return
  }

  // 清除待确认状态
  pendingConfirmAnnotation.value = null

  // 重新加载标注数据，恢复原始坐标
  loadAnnotations(true) // 立即加载
}

// 处理确认标注框移动/调整
const handleConfirmAnnotation = async (annotation: AnnotationVO) => {
  if (!pendingConfirmAnnotation.value || isParsingAnnotation.value === annotation.id) {
    return
  }

  const pending = pendingConfirmAnnotation.value

  try {
    // 调用后端更新坐标
    const response = await putAnnotationUpdateRectApi({
      annotationId: pending.id,
      topLeftX: pending.topLeftX,
      topLeftY: pending.topLeftY,
      bottomRightX: pending.bottomRightX,
      bottomRightY: pending.bottomRightY
    })

    if (response.data.code === 200) {
      // 设置解析状态
      isParsingAnnotation.value = annotation.id

      // 通知父组件开始解析，更新左侧题目列表状态
      emit('annotationParseStart', { annotationId: pending.id, questionId: pending.questionId })

      // 异步执行解析（不等待）
      console.log('确认调整成功，开始异步解析，标注ID:', pending.id, '标注类型:', pending.type)
        ; (async () => {
          try {
            console.log('开始解析标注，标注ID:', pending.id)
            await parseAnnotation(
              String(pending.id),
              {
                id: String(pending.id),
                page: pending.page,
                type: pending.type,
                topLeftX: pending.topLeftX,
                topLeftY: pending.topLeftY,
                bottomRightX: pending.bottomRightX,
                bottomRightY: pending.bottomRightY
              },
              pending.side
            )
            console.log('解析标注完成')
          } catch (parseError) {
            console.error('解析标注失败:', parseError)
          } finally {
            // 解析完成后，移除解析状态和待确认状态
            isParsingAnnotation.value = null
            pendingConfirmAnnotation.value = null
          }
        })()
      ElMessage.success('标注框调整成功，开始解析...')
    } else {
      ElMessage.error(response.data.msg || '标注框调整失败')
      // 失败时重新加载恢复原始数据
      await loadAnnotations(true) // 立即加载
      pendingConfirmAnnotation.value = null
    }
  } catch (error) {
    ElMessage.error('标注框调整失败')
    console.error(error)
    // 失败时重新加载恢复原始数据
    await loadAnnotations(true) // 立即加载
    pendingConfirmAnnotation.value = null
  }
}

// 获取标注框样式
const getAnnotationStyle = (annotation: AnnotationVO, side: 'left' | 'right') => {
  // 标注坐标是相对于未缩放的坐标系，标注框会自动跟随父元素 image-item 的缩放
  // 所以直接使用原始坐标即可
  return {
    left: `${annotation.topLeftX}px`,
    top: `${annotation.topLeftY}px`,
    width: `${annotation.bottomRightX - annotation.topLeftX}px`,
    height: `${annotation.bottomRightY - annotation.topLeftY}px`
  }
}

// 获取标注标签样式（左上角外显示）
const getAnnotationLabelStyle = (annotation: AnnotationVO, side: 'left' | 'right') => {
  // 标签会自动跟随父元素 image-item 的缩放
  // 但字体大小需要反向调整以保持可读性
  const scale = side === 'left' ? leftZoom.value : rightZoom.value
  return {
    left: `${annotation.topLeftX}px`,
    top: `calc(${annotation.topLeftY}px - 10px)`,
    fontSize: `${Math.max(10, 11 / scale)}px`
  }
}

// 检查标签是否应该隐藏（会遮挡其他标注框）
const shouldHideLabel = (annotation: AnnotationVO, side: 'left' | 'right') => {
  // 如果当前正在悬停这个标注框，不隐藏
  if (hoveredLabelId.value === annotation.id) {
    return false
  }

  const annotationsList = side === 'left' ? leftAnnotations.value : rightAnnotations.value
  const labelTop = annotation.topLeftY - 20
  const labelBottom = annotation.topLeftY
  const labelLeft = annotation.topLeftX
  const labelRight = annotation.topLeftX + 40 // 假设标签宽度约40px

  // 检查是否与其他标注框重叠
  for (const other of annotationsList) {
    if (other.id === annotation.id) continue

    // 检查标签区域是否与其他标注框重叠
    const isOverlapping = !(
      labelBottom <= other.topLeftY ||
      labelTop >= other.bottomRightY ||
      labelRight <= other.topLeftX ||
      labelLeft >= other.bottomRightX
    )

    if (isOverlapping) {
      return true // 遮挡了其他标注框，应该隐藏
    }
  }

  return false // 没有遮挡，显示标签
}

// 处理标签鼠标进入
const handleLabelMouseEnter = (annotationId: string) => {
  hoveredLabelId.value = annotationId
}

// 处理标签鼠标离开
const handleLabelMouseLeave = (annotationId: string) => {
  if (hoveredLabelId.value === annotationId) {
    hoveredLabelId.value = null
  }
}

// 处理标注框鼠标进入
const handleAnnotationBoxMouseEnter = (annotationId: string) => {
  hoveredLabelId.value = annotationId
}

// 处理标注框鼠标离开
const handleAnnotationBoxMouseLeave = (annotationId: string) => {
  if (hoveredLabelId.value === annotationId) {
    hoveredLabelId.value = null
  }
}

// 获取选框样式
const getSelectionRectStyle = (side: 'left' | 'right') => {
  if (!currentAnnotationRect.value) return {}
  // 选框会自动跟随父元素 image-item 的缩放
  // 所以直接使用原始坐标即可
  return {
    left: `${currentAnnotationRect.value.x}px`,
    top: `${currentAnnotationRect.value.y}px`,
    width: `${currentAnnotationRect.value.width}px`,
    height: `${currentAnnotationRect.value.height}px`
  }
}

// 加载电子书列表
const loadPdfList = async () => {
  try {
    const res = await getPdfListApi({ projectId: props.projectId })
    if (res.data.code === 200 && res.data.data) {
      pdfList.value = res.data.data.filter(pdf => pdf.status === 1)
      await loadAllPages()
      // 页面数据加载完成后加载标注
      await loadAnnotations(true) // 立即加载
    }
  } catch (error) {
    console.error('加载电子书列表失败:', error)
    ElMessage.error('加载电子书列表失败')
  }
}

// 加载所有页面数据
const loadAllPages = async () => {
  try {
    const res = await getPdfPageListApi({ pdfOrProjectId: props.projectId })
    if (res.data.code === 200 && res.data.data) {
      allPages.value = res.data.data
      console.log('页面数据加载完成，共', allPages.value.length, '页')
    }
  } catch (error) {
    console.error('加载页面数据失败:', error)
  }
}

// 节流加载标注的定时器
let loadAnnotationsTimer: NodeJS.Timeout | null = null
const LOAD_ANNOTATIONS_DEBOUNCE_MS = 300 // 300ms 节流延迟

// 加载标注列表（带节流）
const loadAnnotations = async (immediate = false) => {
  if (!props.projectId) return

  // 如果不是立即加载，使用节流
  if (!immediate) {
    if (loadAnnotationsTimer) {
      clearTimeout(loadAnnotationsTimer)
    }
    loadAnnotationsTimer = setTimeout(() => {
      loadAnnotationsInternal()
    }, LOAD_ANNOTATIONS_DEBOUNCE_MS)
    return
  }

  // 立即加载
  await loadAnnotationsInternal()
}

// 内部加载标注列表方法
const loadAnnotationsInternal = async () => {
  if (!props.projectId) return
  try {
    console.log('加载标注列表，左侧页码:', leftPage.value?.realPage || leftPageIndex.value, '右侧页码:', rightPage.value?.realPage || rightPageIndex.value)

    // 加载左侧页的标注
    const leftPageNum = leftPage.value?.realPage || leftPageIndex.value
    const leftRes = await getAnnotationListByProjectAndPageApi({ projectId: props.projectId, page: leftPageNum })
    console.log('左侧标注响应:', leftRes.data)
    if (leftRes.data.code === 200) {
      const leftData = leftRes.data.data || []
      // 加载右侧页的标注
      const rightPageNum = rightPage.value?.realPage || rightPageIndex.value
      const rightRes = await getAnnotationListByProjectAndPageApi({ projectId: props.projectId, page: rightPageNum })
      console.log('右侧标注响应:', rightRes.data)
      if (rightRes.data.code === 200) {
        const rightData = rightRes.data.data || []
        annotations.value = [...leftData, ...rightData]
        console.log('所有标注:', annotations.value)
      }
    }
  } catch (error) {
    console.error('加载标注列表失败:', error)
  }
}

// 切换到上一本电子书
const handlePreviousPdf = () => {
  if (currentPdfIndex.value > 0) {
    currentPdfIndex.value--
    leftPageIndex.value = 1
    rightPageIndex.value = 2
    loadAnnotations(true) // 立即加载
  }
}

// 切换到下一本电子书
const handleNextPdf = () => {
  if (currentPdfIndex.value < pdfList.value.length - 1) {
    currentPdfIndex.value++
    leftPageIndex.value = 1
    rightPageIndex.value = 2
    loadAnnotations(true) // 立即加载
  }
}

// 右侧切换到上一本电子书
const handlePreviousRightPdf = () => {
  if (rightPdfIndex.value > 0) {
    const newIndex = rightPdfIndex.value - 1
    if (newIndex === currentPdfIndex.value) {
      currentPdfIndex.value = newIndex
      leftPageIndex.value = 1
    }
    rightPageIndex.value = 1
    loadAnnotations(true) // 立即加载
  }
}

// 右侧切换到下一本电子书
const handleNextRightPdf = () => {
  if (rightPdfIndex.value < pdfList.value.length - 1) {
    const newIndex = rightPdfIndex.value + 1
    if (newIndex === currentPdfIndex.value + 1) {
      currentPdfIndex.value = newIndex - 1
      leftPageIndex.value = 1
    }
    rightPageIndex.value = 1
    loadAnnotations(true) // 立即加载
  }
}

// 左侧页码跳转
const handleLeftPageJump = (value: string) => {
  const numValue = Number(value)
  if (numValue < 1) leftPageIndex.value = 1
  if (leftPdf.value && numValue > leftPdf.value.size) {
    leftPageIndex.value = leftPdf.value.size
  }
  // 不再直接调用 loadAnnotations，由 watch 监听器触发
}

// 右侧页码跳转
const handleRightPageJump = (value: string) => {
  const numValue = Number(value)
  if (numValue < 1) rightPageIndex.value = 1
  if (rightPdf.value && numValue > rightPdf.value.size) {
    rightPageIndex.value = rightPdf.value.size
  }
  // 不再直接调用 loadAnnotations，由 watch 监听器触发
}

// 左侧图片上一页
const handlePreviousLeftPage = () => {
  if (leftPageIndex.value > 1) {
    leftPageIndex.value--
    // 不再直接调用 loadAnnotations，由 watch 监听器触发
  }
}

// 左侧图片下一页
const handleNextLeftPage = () => {
  if (leftPdf.value && leftPageIndex.value < leftPdf.value.size) {
    leftPageIndex.value++
    // 不再直接调用 loadAnnotations，由 watch 监听器触发
  }
}

// 右侧图片上一页
const handlePreviousRightPage = () => {
  if (rightPageIndex.value > 1) {
    rightPageIndex.value--
    // 不再直接调用 loadAnnotations，由 watch 监听器触发
  }
}

// 右侧图片下一页
const handleNextRightPage = () => {
  if (rightPdf.value && rightPageIndex.value < rightPdf.value.size) {
    rightPageIndex.value++
    // 不再直接调用 loadAnnotations，由 watch 监听器触发
  }
}

// 左侧图片容器样式
const leftWrapperStyle = computed(() => ({
  left: `${leftImagePosition.x}px`,
  top: `${leftImagePosition.y}px`,
  userSelect: (isDragging.left ? 'none' : 'auto') as 'none' | 'auto'
}))

// 右侧图片容器样式
const rightWrapperStyle = computed(() => ({
  left: `${rightImagePosition.x}px`,
  top: `${rightImagePosition.y}px`,
  userSelect: (isDragging.right ? 'none' : 'auto') as 'none' | 'auto'
}))

// 左侧图片样式（包含缩放）
const leftImageStyle = computed(() => ({
  transform: `scale(${leftZoom.value})`,
  transformOrigin: 'top left'
}))

// 右侧图片样式（包含缩放）
const rightImageStyle = computed(() => ({
  transform: `scale(${rightZoom.value})`,
  transformOrigin: 'top left'
}))

// 图片区域鼠标按下
const handleMouseDown = (side: 'left' | 'right') => (e: MouseEvent) => {
  const wrapperRef = side === 'left' ? leftImageWrapperRef.value : rightImageWrapperRef.value
  const position = side === 'left' ? leftImagePosition : rightImagePosition
  if (!wrapperRef?.contains(e.target as Node)) {
    position.x = 0
    position.y = 0
  }
}

// 图片区域鼠标按下开始拖动
const handleImageMouseDown = (e: MouseEvent, side: 'left' | 'right') => {
  if (e.button !== 0 || isAnnotating.value) return

  // 阻止事件冒泡，避免触发父容器的点击事件
  e.stopPropagation()
  e.preventDefault() // 阻止默认行为，包括图片拖动

  const position = side === 'left' ? leftImagePosition : rightImagePosition
  const dragStartPos = side === 'left' ? dragStart.left : dragStart.right

  // 设置长按计时器
  isLongPress[side] = false
  mouseDownTimers[side] = setTimeout(() => {
    isLongPress[side] = true
    isDragging[side] = true
    dragStartPos.x = e.clientX - position.x
    dragStartPos.y = e.clientY - position.y
  }, 200) // 200ms 后判定为长按

  document.addEventListener('mousemove', (e) => handleMouseMove(e, side), { passive: false })
  document.addEventListener('mouseup', (e) => handleImageMouseUp(e, side), { passive: false })
}

// 图片区域鼠标抬起
const handleImageMouseUp = (e: MouseEvent, side: 'left' | 'right') => {
  // 清除长按计时器
  if (mouseDownTimers[side]) {
    clearTimeout(mouseDownTimers[side])
    mouseDownTimers[side] = null
  }

  isDragging[side] = false
  isLongPress[side] = false
  document.removeEventListener('mousemove', (e) => handleMouseMove(e, side))
  document.removeEventListener('mouseup', (e) => handleImageMouseUp(e, side))
}

// 放大
const handleZoomIn = (side: 'left' | 'right') => {
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value
  if (zoom < 3) {
    const newZoom = Math.min(3, zoom + 0.25)
    if (side === 'left') {
      leftZoom.value = newZoom
    } else {
      rightZoom.value = newZoom
    }
  }
}

// 缩小
const handleZoomOut = (side: 'left' | 'right') => {
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value
  if (zoom > 0.5) {
    const newZoom = Math.max(0.5, zoom - 0.25)
    if (side === 'left') {
      leftZoom.value = newZoom
    } else {
      rightZoom.value = newZoom
    }
  }
}

// 重置缩放
const handleResetZoom = (side: 'left' | 'right') => {
  if (side === 'left') {
    leftZoom.value = 1
  } else {
    rightZoom.value = 1
  }
  // 重置位置到左上角
  const position = side === 'left' ? leftImagePosition : rightImagePosition
  position.x = 16  // padding-left
  position.y = 16  // padding-top
}

// 滚轮缩放
const handleWheel = (e: WheelEvent, side: 'left' | 'right') => {
  // 如果正在标注或拖动，不处理缩放
  if (isAnnotating.value || isDragging[side]) return

  // 根据滚轮方向调整缩放
  if (e.deltaY < 0) {
    handleZoomIn(side)
  } else {
    handleZoomOut(side)
  }
}

// 鼠标移动 - 使用节流优化性能
const animationFrameIds = reactive({ left: null as number | null, right: null as number | null })
const handleMouseMove = (e: MouseEvent, side: 'left' | 'right') => {
  if (!isDragging[side]) return

  const position = side === 'left' ? leftImagePosition : rightImagePosition
  const dragStartPos = side === 'left' ? dragStart.left : dragStart.right

  // 使用 requestAnimationFrame 节流，避免频繁更新
  if (animationFrameIds[side] !== null) {
    cancelAnimationFrame(animationFrameIds[side]!)
  }

  animationFrameIds[side] = requestAnimationFrame(() => {
    position.x = e.clientX - dragStartPos.x
    position.y = e.clientY - dragStartPos.y
    animationFrameIds[side] = null
  })
}

// 右键菜单（阻止默认行为）
const handleRightClick = (e: MouseEvent) => {
  e.preventDefault()
}

// 图片右键点击开始标注
const handleImageRightClick = (e: MouseEvent, side: 'left' | 'right') => {
  if (!selectedQuestionId.value) {
    ElMessage.warning('请先选择一个题目')
    return
  }

  e.preventDefault()

  const img = side === 'left' ? leftImageRef.value : rightImageRef.value
  if (!img) return

  const imageItem = img.parentElement
  if (!imageItem) return

  const imageItemRect = imageItem.getBoundingClientRect()
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value

  // 计算相对于 image-item 的位置
  // 由于 image-item 本身被缩放了，需要将鼠标坐标转换到未缩放的坐标系
  const x = (e.clientX - imageItemRect.left) / zoom
  const y = (e.clientY - imageItemRect.top) / zoom

  // 获取当前页面的标注列表
  const annotationsList = side === 'left' ? leftAnnotations.value : rightAnnotations.value

  // 检查鼠标是否在某个标注框内
  let clickedAnnotation: AnnotationVO | null = null
  for (const annotation of annotationsList) {
    if (
      x >= annotation.topLeftX &&
      x <= annotation.bottomRightX &&
      y >= annotation.topLeftY &&
      y <= annotation.bottomRightY
    ) {
      clickedAnnotation = annotation
      break
    }
  }

  if (!isAnnotating.value) {
    // 第一次右键：开始标注
    // 如果在标注框内，且正在标注过程中，忽略标注框的右键事件
    if (clickedAnnotation) {
      // 在标注框内，但这是第一次右键（开始标注），直接开始标注
    }

    // 检测是否按下了快捷键
    const pressedKey = getPressedShortcutKey()
    currentShortcutKey.value = pressedKey

    isAnnotating.value = true
    annotationStart.value = { x, y }
    currentMousePos.value = { x, y }
    currentAnnotationImage.value = side
    // 添加鼠标移动监听器来实时更新选框
    document.addEventListener('mousemove', handleAnnotationMouseMove)
    document.addEventListener('keydown', handleAnnotationKeyDown)

    if (pressedKey && shortcutKeyNames[pressedKey]) {
      ElMessage.info(`${shortcutKeyNames[pressedKey]}标注 - 请拖动选择区域后右键确定`)
    } else {
      ElMessage.info('请再次右键点击确定标注区域，按 ESC 取消')
    }
  } else {
    // 第二次右键：结束标注，显示右键面板
    // 即使在标注框内，也要优先完成标注操作
    annotationEnd.value = { x, y }
    currentMousePos.value = null
    // 移除监听器
    document.removeEventListener('mousemove', handleAnnotationMouseMove)
    document.removeEventListener('keydown', handleAnnotationKeyDown)

    // 如果在标注框内，给出提示
    if (clickedAnnotation) {
      ElMessage.info('正在完成标注，如需修改标注类型请取消后右键点击标注框')
    }

    // 显示右键弹出面板（根据快捷键自动过滤显示对应的类型）
    contextMenuVisible.value = true
    contextMenuPosition.value = { x: e.clientX, y: e.clientY }
  }
}

// 切换OCR类型子菜单显示（创建标注时）
const toggleOcrTypeSubMenu = (typeValue: number) => {
  if (expandedOcrTypeMenu.value === typeValue) {
    expandedOcrTypeMenu.value = null
  } else {
    expandedOcrTypeMenu.value = typeValue
  }
}

// 切换OCR类型子菜单显示（修改标注类型时）
const toggleUpdateOcrTypeSubMenu = (typeValue: number) => {
  if (expandedUpdateOcrTypeMenu.value === typeValue) {
    expandedUpdateOcrTypeMenu.value = null
  } else {
    expandedUpdateOcrTypeMenu.value = typeValue
  }
}

// ========== 鼠标悬停展开子菜单相关方法 ==========

// 创建标注菜单：鼠标进入菜单项
const handleMenuItemMouseEnter = (typeValue: number, event: MouseEvent) => {
  // 只有文本类型（1,3,5,7）才有子菜单
  if (!textTypeWithOcrOption.includes(typeValue)) {
    expandedOcrTypeMenu.value = null
    return
  }

  // 清除之前的关闭定时器
  if (subMenuCloseTimer) {
    clearTimeout(subMenuCloseTimer)
    subMenuCloseTimer = null
  }

  // 展开当前类型的子菜单
  expandedOcrTypeMenu.value = typeValue
}

// 创建标注菜单：鼠标离开菜单项
const handleMenuItemMouseLeave = (typeValue: number) => {
  // 延迟关闭子菜单，提升用户体验
  if (subMenuCloseTimer) {
    clearTimeout(subMenuCloseTimer)
  }
  subMenuCloseTimer = setTimeout(() => {
    // 只有当离开的菜单项是当前展开的子菜单时，才关闭
    if (expandedOcrTypeMenu.value === typeValue) {
      expandedOcrTypeMenu.value = null
    }
  }, 200)
}

// 创建标注菜单：鼠标进入子菜单
const handleSubMenuMouseEnter = () => {
  // 清除关闭定时器，保持子菜单显示
  if (subMenuCloseTimer) {
    clearTimeout(subMenuCloseTimer)
    subMenuCloseTimer = null
  }
}

// 创建标注菜单：鼠标离开子菜单
const handleSubMenuMouseLeave = () => {
  // 延迟关闭子菜单，提升用户体验
  if (subMenuCloseTimer) {
    clearTimeout(subMenuCloseTimer)
  }
  subMenuCloseTimer = setTimeout(() => {
    expandedOcrTypeMenu.value = null
  }, 200)
}

// 创建标注菜单：鼠标离开整个菜单
const handleContextMenuMouseLeave = () => {
  // 延迟关闭子菜单
  if (subMenuCloseTimer) {
    clearTimeout(subMenuCloseTimer)
  }
  subMenuCloseTimer = setTimeout(() => {
    expandedOcrTypeMenu.value = null
  }, 300)
}

// 修改标注类型菜单：鼠标进入菜单项
const handleUpdateMenuItemMouseEnter = (typeValue: number, event: MouseEvent) => {
  // 只有文本类型（1,3,5,7）才有子菜单，且不能正在解析
  if (!textTypeWithOcrOption.includes(typeValue) || isParsingAnnotation.value === selectedAnnotationId.value) {
    expandedUpdateOcrTypeMenu.value = null
    return
  }

  // 清除之前的关闭定时器
  if (updateSubMenuCloseTimer) {
    clearTimeout(updateSubMenuCloseTimer)
    updateSubMenuCloseTimer = null
  }

  // 展开当前类型的子菜单
  expandedUpdateOcrTypeMenu.value = typeValue
}

// 修改标注类型菜单：鼠标离开菜单项
const handleUpdateMenuItemMouseLeave = (typeValue: number) => {
  // 延迟关闭子菜单，提升用户体验
  if (updateSubMenuCloseTimer) {
    clearTimeout(updateSubMenuCloseTimer)
  }
  updateSubMenuCloseTimer = setTimeout(() => {
    // 只有当离开的菜单项是当前展开的子菜单时，才关闭
    if (expandedUpdateOcrTypeMenu.value === typeValue) {
      expandedUpdateOcrTypeMenu.value = null
    }
  }, 200)
}

// 修改标注类型菜单：鼠标进入子菜单
const handleUpdateSubMenuMouseEnter = () => {
  // 清除关闭定时器，保持子菜单显示
  if (updateSubMenuCloseTimer) {
    clearTimeout(updateSubMenuCloseTimer)
    updateSubMenuCloseTimer = null
  }
}

// 修改标注类型菜单：鼠标离开子菜单
const handleUpdateSubMenuMouseLeave = () => {
  // 延迟关闭子菜单，提升用户体验
  if (updateSubMenuCloseTimer) {
    clearTimeout(updateSubMenuCloseTimer)
  }
  updateSubMenuCloseTimer = setTimeout(() => {
    expandedUpdateOcrTypeMenu.value = null
  }, 200)
}

// 修改标注类型菜单：鼠标离开整个菜单
const handleUpdateTypeMenuMouseLeave = () => {
  // 延迟关闭子菜单
  if (updateSubMenuCloseTimer) {
    clearTimeout(updateSubMenuCloseTimer)
  }
  updateSubMenuCloseTimer = setTimeout(() => {
    expandedUpdateOcrTypeMenu.value = null
  }, 300)
}

// 选择标注类型
const handleSelectAnnotationType = (type: number, ocrType: 'text' | 'table' = 'text') => {
  selectedAnnotationType.value = type
  selectedOcrType.value = ocrType
  expandedOcrTypeMenu.value = null
  contextMenuVisible.value = false
  // 创建标注
  handleCreateAnnotation()
}

// 点击其他区域关闭右键菜单并取消标注
const handleClickOutside = () => {
  if (contextMenuVisible.value) {
    // 如果右键菜单显示中，关闭菜单并取消标注
    contextMenuVisible.value = false
    cancelAnnotation()
  }
  if (updateTypeMenuVisible.value) {
    // 如果修改类型菜单显示中，关闭菜单
    updateTypeMenuVisible.value = false
  }
}

// 标注时鼠标移动
const handleAnnotationMouseMove = (e: MouseEvent) => {
  if (!isAnnotating.value || !currentAnnotationImage.value) return

  const side = currentAnnotationImage.value
  const img = side === 'left' ? leftImageRef.value : rightImageRef.value
  if (!img) return

  const imageItem = img.parentElement
  if (!imageItem) return

  const imageItemRect = imageItem.getBoundingClientRect()
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value

  // 计算相对于 image-item 的位置
  // 由于 image-item 本身被缩放了，需要将鼠标坐标转换到未缩放的坐标系
  const x = (e.clientX - imageItemRect.left) / zoom
  const y = (e.clientY - imageItemRect.top) / zoom

  currentMousePos.value = { x, y }
}

// 标注时按键
const handleAnnotationKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isAnnotating.value) {
    // 取消标注
    cancelAnnotation()
  }
}

// 取消标注
const cancelAnnotation = () => {
  isAnnotating.value = false
  annotationStart.value = null
  annotationEnd.value = null
  currentMousePos.value = null
  currentAnnotationImage.value = null
  currentShortcutKey.value = null
  document.removeEventListener('mousemove', handleAnnotationMouseMove)
  document.removeEventListener('keydown', handleAnnotationKeyDown)
  // 同时也取消调整大小
  if (isResizing.value) {
    isResizing.value = false
    document.removeEventListener('mousemove', handleResizeMouseMove)
    document.removeEventListener('mouseup', handleResizeMouseUp)
    resizingAnnotation.value = null
    resizingDirection.value = null
    resizingSide.value = null
    resizeStart.value = null
  }
  // 同时也取消拖拽标注框
  if (isDraggingAnnotation.value) {
    isDraggingAnnotation.value = false
    document.removeEventListener('mousemove', handleAnnotationDragMouseMove)
    document.removeEventListener('mouseup', handleAnnotationDragMouseUp)
    draggingAnnotation.value = null
    dragAnnotationSide.value = null
    dragAnnotationStart.value = null
    dragAnnotationTempPosition.value = null
  }
  // 清除 animationFrame
  if (dragAnnotationAnimationFrameId.value !== null) {
    cancelAnimationFrame(dragAnnotationAnimationFrameId.value)
    dragAnnotationAnimationFrameId.value = null
  }
  // 清除待确认状态
  pendingConfirmAnnotation.value = null
}

// 取消选择标注类型
const handleCancelAnnotationType = () => {
  annotationTypeDialogVisible.value = false
  // 清除标注选框和状态
  cancelAnnotation()
}

// 创建标注
const handleCreateAnnotation = async () => {
  if (!selectedQuestionId.value || !annotationStart.value || !annotationEnd.value || !currentAnnotationImage.value) {
    ElMessage.error('请先选择题目并标注区域')
    return
  }

  creating.value = true
  try {
    const pageNum = currentAnnotationImage.value === 'left'
      ? (leftPage.value?.realPage || leftPageIndex.value)
      : (rightPage.value?.realPage || rightPageIndex.value)

    const response = await postAnnotationCreateApi({
      projectId: props.projectId,
      questionId: selectedQuestionId.value,
      page: pageNum,
      type: selectedAnnotationType.value,
      topLeftX: Math.min(annotationStart.value.x, annotationEnd.value.x),
      topLeftY: Math.min(annotationStart.value.y, annotationEnd.value.y),
      bottomRightX: Math.max(annotationStart.value.x, annotationEnd.value.x),
      bottomRightY: Math.max(annotationStart.value.y, annotationEnd.value.y)
    })

    if (response.data.code === 200) {
      const annotationId = response.data.data

      // 构造标注数据对象
      const newAnnotation = {
        id: String(annotationId),
        projectId: props.projectId,
        questionId: selectedQuestionId.value,
        page: pageNum,
        type: selectedAnnotationType.value
      }

      // 在清空之前保存坐标和图片位置
      const savedAnnotationStart = annotationStart.value
      const savedAnnotationEnd = annotationEnd.value
      const savedImageSide = currentAnnotationImage.value

      annotationTypeDialogVisible.value = false
      isAnnotating.value = false
      annotationStart.value = null
      annotationEnd.value = null
      currentMousePos.value = null
      currentAnnotationImage.value = null

      // 立即刷新标注列表
      loadAnnotations(true) // 立即加载
      ElMessage.success('创建标注成功')
      // 触发刷新标注列表并选中新建的标注
      emit('annotationCreated', newAnnotation)

      // 异步执行解析，不等待
      console.log('创建标注成功，开始异步解析，标注类型:', selectedAnnotationType.value, 'OCR类型:', selectedOcrType.value)
        ; (async () => {
          try {
            console.log('开始解析标注，标注ID:', annotationId)
            await parseAnnotation(
              String(annotationId),
              {
                id: String(annotationId),
                page: pageNum || 0,
                type: selectedAnnotationType.value,
                topLeftX: Math.min(savedAnnotationStart.x, savedAnnotationEnd.x),
                topLeftY: Math.min(savedAnnotationStart.y, savedAnnotationEnd.y),
                bottomRightX: Math.max(savedAnnotationStart.x, savedAnnotationEnd.x),
                bottomRightY: Math.max(savedAnnotationStart.y, savedAnnotationEnd.y)
              },
              savedImageSide,
              selectedQuestionId.value || undefined,
              selectedOcrType.value // 传递OCR类型
            )
            console.log('解析标注完成')
          } catch (parseError) {
            console.error('解析标注失败:', parseError)
            // 解析失败不影响标注创建成功
          }
        })()
      emit('refreshAnnotations')
    } else {
      ElMessage.error(response.data.msg || '创建标注失败')
    }
  } catch (error) {
    ElMessage.error('创建标注失败')
    console.error(error)
  } finally {
    creating.value = false
  }
}

// 从 Canvas 安全地获取 Blob
const getCanvasBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/png')
    } catch (error) {
      console.error('Canvas toBlob 失败:', error)
      resolve(null)
    }
  })
}

// 解析标注
const parseAnnotation = async (
  annotationId: string,
  annotationData: {
    id: string
    page: number
    topLeftX: number
    topLeftY: number
    bottomRightX: number
    bottomRightY: number
    type: number
  },
  imageSide: 'left' | 'right',
  questionId?: string,
  ocrType?: 'text' | 'table' // OCR类型：文本或表格
) => {
  // 通知父组件开始解析，启动轮询
  emit('annotationParseStart', { annotationId, questionId })

  // 获取图片
  const img = imageSide === 'left' ? leftImageRef.value : rightImageRef.value
  if (!img) throw new Error('图片未加载')

  const imageItem = img.parentElement
  if (!imageItem) throw new Error('图片容器未找到')

  // 获取 page-info 的高度
  const pageInfo = imageItem.querySelector('.page-info')
  const pageInfoHeight = pageInfo ? pageInfo.getBoundingClientRect().height : 0

  // 获取图片在 image-item 中的偏移量
  const imgRect = img.getBoundingClientRect()
  const imageItemRect = imageItem.getBoundingClientRect()

  // 获取当前缩放比例
  const zoom = imageSide === 'left' ? leftZoom.value : rightZoom.value

  // 计算偏移量时需要除以缩放比例，因为标注坐标是相对于未缩放的 image-item 的
  const imgOffsetX = (imgRect.left - imageItemRect.left) / zoom
  const imgOffsetY = (imgRect.top - imageItemRect.top) / zoom
  const imgDisplayWidth = imgRect.width / zoom
  const imgDisplayHeight = imgRect.height / zoom

  console.log('切图坐标信息:', {
    pageInfoHeight,
    imgOffsetX,
    imgOffsetY,
    annotationTopLeftX: annotationData.topLeftX,
    annotationTopLeftY: annotationData.topLeftY,
    annotationBottomRightX: annotationData.bottomRightX,
    annotationBottomRightY: annotationData.bottomRightY,
    imgNaturalWidth: img.naturalWidth,
    imgNaturalHeight: img.naturalHeight,
    imgDisplayWidth,
    imgDisplayHeight
  })

  // 计算相对于图片的坐标（减去图片偏移量）
  const relativeTopLeftX = annotationData.topLeftX - imgOffsetX
  const relativeTopLeftY = annotationData.topLeftY - imgOffsetY
  const relativeBottomRightX = annotationData.bottomRightX - imgOffsetX
  const relativeBottomRightY = annotationData.bottomRightY - imgOffsetY

  console.log('相对于图片的坐标:', {
    relativeTopLeftX,
    relativeTopLeftY,
    relativeBottomRightX,
    relativeBottomRightY
  })

  // 创建临时 canvas 用于裁剪图片
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建 Canvas')

  // 如果图片没有缩放,直接使用原始坐标
  if (img.naturalWidth === imgDisplayWidth && img.naturalHeight === imgDisplayHeight) {
    console.log('图片未缩放,使用原始坐标')
    const width = relativeBottomRightX - relativeTopLeftX
    const height = relativeBottomRightY - relativeTopLeftY
    canvas.width = Math.round(width)
    canvas.height = Math.round(height)

    ctx.drawImage(
      img,
      relativeTopLeftX,
      relativeTopLeftY,
      width,
      height,
      0,
      0,
      width,
      height
    )
  } else {
    // 计算缩放比例
    const scaleX = img.naturalWidth / imgDisplayWidth
    const scaleY = img.naturalHeight / imgDisplayHeight

    console.log('图片已缩放,计算缩放比例:', { scaleX, scaleY })

    // 转换为原始图片尺寸的坐标
    const originalX = relativeTopLeftX * scaleX
    const originalY = relativeTopLeftY * scaleY
    const originalWidth = (relativeBottomRightX - relativeTopLeftX) * scaleX
    const originalHeight = (relativeBottomRightY - relativeTopLeftY) * scaleY

    console.log('原始图片坐标:', {
      originalX,
      originalY,
      originalWidth,
      originalHeight
    })

    // 设置画布大小
    canvas.width = Math.round(originalWidth)
    canvas.height = Math.round(originalHeight)

    // 裁剪图片
    ctx.drawImage(
      img,
      Math.round(originalX),
      Math.round(originalY),
      Math.round(originalWidth),
      Math.round(originalHeight),
      0,
      0,
      Math.round(originalWidth),
      Math.round(originalHeight)
    )
  }

  console.log('Canvas 尺寸:', {
    width: canvas.width,
    height: canvas.height
  })

  // 转换为 PNG 格式
  const blob = await getCanvasBlob(canvas)
  if (!blob) {
    throw new Error('图片裁剪失败')
  }

  const file = new File([blob], `annotation_${annotationId}.png`, { type: 'image/png' })

  // 转换为 base64
  const reader = new FileReader()
  const base64Promise = new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string
      // 去掉 data:image/png;base64, 前缀
      const base64Data = result.split(',')[1]
      if (base64Data) {
        resolve(base64Data)
      } else {
        reject(new Error('Base64数据为空'))
      }
    }
    reader.onerror = reject
  })
  reader.readAsDataURL(blob)
  const imageBase64 = await base64Promise

  console.log('截图转base64完成, base64长度:', imageBase64.length)

  // 判断 inputType：图片类型为1，文本类型为2，表格类型为3
  const imageTypes = [2, 4, 6, 8] // 题干图、选项图、解析图、答案图
  let inputType = 2 // 默认为文本类型
  if (imageTypes.includes(annotationData.type)) {
    inputType = 1 // 图片类型
  } else if (ocrType === 'table') {
    // 如果指定了表格OCR，则 inputType 设为 3
    inputType = 3
  }

  // 打印日志，排查 inputType 问题
  console.log('[parseAnnotation] inputType 判断:', {
    annotationId: annotationId,
    annotationType: annotationData.type,
    ocrType: ocrType,
    inputType: inputType
  })

  // 调用解析 API - 根据标注类型选择不同逻辑
  try {
    // 如果是图片类型(inputType=1),使用原来的postAnnotationParseApi
    if (inputType === 1) {
      console.log('图片类型,使用原解析API')
      await postAnnotationParseApi({
        annotationId: annotationId,
        inputType: 1,
        model: ocrStore.getOcrModel(),
        file: file
      }, { timeout: 60000 })
    } else {
      // 文本类型(inputType=2)或表格类型(inputType=3),使用豆包API

      // 1. 先更新为进行中状态
      await postAnnotationProcessAnnotationApi({
        annotationId: annotationId,
        result: 0 // 0-进行中
      })

      // 2. 调用豆包API
      if (!currentModel.value) {
        throw new Error('未选择模型')
      }
      let response
      if (inputType === 3) {
        response = await callDouBaoTable(currentModel.value, `data:image/png;base64,${imageBase64}`, props.subject)
      } else {
        response = await callDouBaoText(currentModel.value, `data:image/png;base64,${imageBase64}`, props.subject)
      }

      // 4. 成功,提取识别结果
      const recognitionResult = response.data.choices?.[0]?.message?.content
      if (!recognitionResult) {
        throw new Error('返回数据格式错误')
      }

      // 5. 调用putAnnotationUpdateTypeToTextApi传入识别结果和token统计
      await putAnnotationUpdateTypeToTextApi({
        annotationId: annotationId,
        analysisContent: recognitionResult,
        type: annotationData.type,
        inputType: inputType,
        inputToken: response.data.usage?.prompt_tokens,
        outputToken: response.data.usage?.completion_tokens
      })
    }
  } catch (error) {
    // 1. 先更新为失败状态
    await postAnnotationProcessAnnotationApi({
      annotationId: annotationId,
      result: 2 // 0-进行中
    })

    console.error('解析失败:', error)
    throw error
  }
  emit('annotationParsed', annotationId)

}

// 重试解析标注
const retryParseAnnotation = async (annotation: AnnotationVO | AnnotationSimpleVO) => {
  if (!annotation) return

  console.log('重试解析标注:', annotation)

  // 从 annotations.value 中查找完整的标注信息(包含坐标)
  const targetAnnotation = annotations.value.find(a => a.id === annotation.id)
  if (!targetAnnotation) {
    console.error('未找到标注信息,当前页面的标注列表:', annotations.value)
    throw new Error(`标注不在当前显示的页面上（页码：${annotation.page}），请先切换到该页面后再重试`)
  }

  // 判断标注在哪张图片上
  const pageNum = targetAnnotation.page
  const leftPageNum = leftPage.value?.realPage || leftPageIndex.value
  const rightPageNum = rightPage.value?.realPage || rightPageIndex.value

  console.log('页面信息:', { pageNum, leftPageNum, rightPageNum })

  const side = leftPageNum === pageNum ? 'left' : rightPageNum === pageNum ? 'right' : null
  if (!side) {
    throw new Error('标注不在当前显示的页面上')
  }

  const img = side === 'left' ? leftImageRef.value : rightImageRef.value
  if (!img) {
    throw new Error('图片未加载')
  }

  const imageItem = img.parentElement
  if (!imageItem) {
    throw new Error('图片容器未找到')
  }

  // 获取图片在 image-item 中的偏移量
  const imgRect = img.getBoundingClientRect()
  const imageItemRect = imageItem.getBoundingClientRect()

  // 获取当前缩放比例
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value

  // 计算偏移量时需要除以缩放比例，因为标注坐标是相对于未缩放的 image-item 的
  const imgOffsetX = (imgRect.left - imageItemRect.left) / zoom
  const imgOffsetY = (imgRect.top - imageItemRect.top) / zoom
  const imgDisplayWidth = imgRect.width / zoom
  const imgDisplayHeight = imgRect.height / zoom


  // 计算相对于图片的坐标（减去图片偏移量）
  const relativeTopLeftX = targetAnnotation.topLeftX - imgOffsetX
  const relativeTopLeftY = targetAnnotation.topLeftY - imgOffsetY
  const relativeBottomRightX = targetAnnotation.bottomRightX - imgOffsetX
  const relativeBottomRightY = targetAnnotation.bottomRightY - imgOffsetY


  // 创建临时 canvas 用于裁剪图片
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建 Canvas')
  }

  // 计算缩放比例
  const scaleX = img.naturalWidth / imgDisplayWidth
  const scaleY = img.naturalHeight / imgDisplayHeight

  console.log('重试解析 - 缩放比例:', { scaleX, scaleY })

  // 转换为原始图片尺寸的坐标
  const originalX = relativeTopLeftX * scaleX
  const originalY = relativeTopLeftY * scaleY
  const originalWidth = (relativeBottomRightX - relativeTopLeftX) * scaleX
  const originalHeight = (relativeBottomRightY - relativeTopLeftY) * scaleY

  console.log('重试解析 - 原始图片坐标:', {
    originalX,
    originalY,
    originalWidth,
    originalHeight
  })

  // 设置画布大小
  canvas.width = Math.round(originalWidth)
  canvas.height = Math.round(originalHeight)

  console.log('重试解析 - Canvas 尺寸:', {
    width: canvas.width,
    height: canvas.height
  })

  // 裁剪图片
  ctx.drawImage(
    img,
    Math.round(originalX),
    Math.round(originalY),
    Math.round(originalWidth),
    Math.round(originalHeight),
    0,
    0,
    Math.round(originalWidth),
    Math.round(originalHeight)
  )

  // 转换为 PNG 格式
  const blob = await getCanvasBlob(canvas)
  if (!blob) {
    throw new Error('图片裁剪失败')
  }

  const file = new File([blob], `annotation_${targetAnnotation.id}.png`, { type: 'image/png' })

  // 打印 targetAnnotation 完整信息，排查 inputType 问题
  console.log('[retryParseAnnotation] targetAnnotation 完整信息:', JSON.stringify(targetAnnotation, null, 2))
  console.log('[retryParseAnnotation] inputType 字段值:', targetAnnotation.inputType)

  // 判断 inputType：图片类型为1，文本类型为2，表格类型为3
  const imageTypes = [2, 4, 6, 8] // 题干图、选项图、解析图、答案图
  let inputType = 2 // 默认为文本类型
  if (imageTypes.includes(targetAnnotation.type)) {
    inputType = 1 // 图片类型
  } else if (targetAnnotation.inputType === 3 || targetAnnotation.type === 9) {
    // 如果标注的 inputType 是 3，或 type 是 9（兼容旧数据），则使用表格OCR
    inputType = 3 // 表格类型
  }

  try {
    // 如果是图片类型，使用原有的解析API
    if (inputType === 1) {
      console.log("重试图片", {
        annotationId: targetAnnotation.id,
        inputType: inputType, // 1-图片类型返回URL，2-文本类型返回OCR识别结果
        model: ocrStore.getOcrModel(),
        file: file
      });

      await postAnnotationParseApi({
        annotationId: targetAnnotation.id,
        inputType: inputType, // 1-图片类型返回URL，2-文本类型返回OCR识别结果
        model: ocrStore.getOcrModel(),
        file: file
      }, { timeout: 60000 })
    } else {
      // 如果是文本或表格类型，使用豆包API
      const annotationId = targetAnnotation.id
      const imageBase64 = canvas.toDataURL('image/png')

      // 1. 先设置为进行中状态
      await postAnnotationProcessAnnotationApi({ annotationId, result: 0 })

      try {
        if (!currentModel.value) {
          throw new Error('未选择模型')
        }

        // 3. 调用豆包API
        let response
        if (inputType === 2) {
          response = await callDouBaoText(currentModel.value, imageBase64, props.subject)
        } else {
          response = await callDouBaoTable(currentModel.value, imageBase64, props.subject)
        }

        // 5. 提取识别结果
        const result = (response.data as DouBaoResponse).choices?.[0]?.message.content || ''

        // 6. 更新标注类型为文本/表格并上传token统计
        await putAnnotationUpdateTypeToTextApi({
          annotationId,
          analysisContent: result,
          type: targetAnnotation.type,
          inputType: inputType,
          inputToken: response.data.usage?.prompt_tokens,
          outputToken: response.data.usage?.completion_tokens
        })
      } catch (error) {
        // 失败时更新状态为失败
        await postAnnotationProcessAnnotationApi({ annotationId, result: 2 })
        throw error
      }
    }
    // 重试成功后刷新标注状态
    emit('annotationParseStart', { annotationId: targetAnnotation.id, questionId: targetAnnotation.questionId })
  } catch (error) {
    throw error
  }
}

// 点击标注框
const handleAnnotationClick = (annotation: AnnotationVO) => {
  // 如果刚刚完成了拖动或调整大小，不处理点击事件
  if (justFinishedDragOrResize.value) {
    justFinishedDragOrResize.value = false
    return
  }

  // 如果标注正在解析，禁止选择
  if (isParsingAnnotation.value === annotation.id) {
    return
  }

  selectedAnnotationId.value = annotation.id
  // 切换拖动标志的显示状态
  if (annotationShowingDragHandle.value === annotation.id) {
    annotationShowingDragHandle.value = null
  } else {
    annotationShowingDragHandle.value = annotation.id
  }
  // 触发事件，通知父组件选中标注（包含目录ID和题目ID）
  emit('selectAnnotation', {
    annotationId: annotation.id,
    questionId: annotation.questionId,
    catalogueId: annotation.catalogueId
  })
}

// 标注框右键点击 - 处理事件冒泡和菜单显示
const handleAnnotationBoxRightClick = (e: MouseEvent, annotation: AnnotationVO, side: 'left' | 'right') => {
  // 如果正在标注中，阻止默认行为，但不阻止冒泡，让 handleImageRightClick 处理
  if (isAnnotating.value) {
    e.preventDefault()
    return
  }

  // 非标注状态，阻止默认行为和冒泡，处理修改标注类型
  e.preventDefault()
  e.stopPropagation()

  // 如果标注正在解析，禁止右键菜单
  if (isParsingAnnotation.value === annotation.id) {
    ElMessage.warning('该标注正在解析中，请稍后再试')
    return
  }

  // 选中标注
  selectedAnnotationId.value = annotation.id
  // 触发事件，通知父组件选中标注（包含目录ID和题目ID）
  emit('selectAnnotation', {
    annotationId: annotation.id,
    questionId: annotation.questionId,
    catalogueId: annotation.catalogueId
  })

  // 设置当前标注的类型
  updatingAnnotationType.value = annotation.type

  // 打开修改类型菜单
  updateTypeMenuVisible.value = true
  updateTypeMenuPosition.value = { x: e.clientX, y: e.clientY }

  // 关闭其他菜单
  contextMenuVisible.value = false
}

// 修改标注类型 - 选择类型后的处理
const handleUpdateAnnotationType = (type: number, ocrType: 'text' | 'table' = 'text') => {
  if (!selectedAnnotationId.value) {
    ElMessage.error('请先选择标注')
    return
  }

  const annotation = annotations.value.find(a => a.id === selectedAnnotationId.value)
  if (!annotation) {
    ElMessage.error('未找到标注信息')
    return
  }

  // 如果类型没有变化，且OCR类型也没有变化，直接关闭菜单
  if (annotation.type === type && (annotation.inputType || 2) === (ocrType === 'table' ? 3 : 2)) {
    updateTypeMenuVisible.value = false
    return
  }

  // 如果正在解析，不允许修改
  if (isParsingAnnotation.value === annotation.id) {
    ElMessage.warning('该标注正在解析中，请稍后再试')
    updateTypeMenuVisible.value = false
    return
  }

  // 记录要修改的类型和OCR类型
  updatingAnnotationType.value = type
  updatingOcrType.value = ocrType
  expandedUpdateOcrTypeMenu.value = null

  // 关闭修改类型菜单
  updateTypeMenuVisible.value = false

  // 设置待确认状态，用于显示确认和取消按钮
  // 如果已经有待确认的移动/调整，保留原来的pendingConfirmAnnotation
  // 否则创建一个新的pendingConfirmAnnotation用于类型修改
  if (!pendingConfirmAnnotation.value || pendingConfirmAnnotation.value.id !== annotation.id) {
    pendingConfirmAnnotation.value = {
      id: annotation.id,
      side: annotation.page === (leftPage.value?.realPage || leftPageIndex.value) ? 'left' : 'right',
      topLeftX: annotation.topLeftX,
      topLeftY: annotation.topLeftY,
      bottomRightX: annotation.bottomRightX,
      bottomRightY: annotation.bottomRightY,
      type: annotation.type,
      page: annotation.page
    }
  }
}

// 确认修改标注类型
const handleConfirmUpdateType = async (annotation: AnnotationVO) => {
  if (!selectedAnnotationId.value || !pendingConfirmAnnotation.value) {
    return
  }

  // 如果正在解析，不允许修改
  if (isParsingAnnotation.value === annotation.id) {
    ElMessage.warning('该标注正在解析中，请稍后再试')
    return
  }

  const newType = updatingAnnotationType.value

  // 1. 立即清除待确认状态，隐藏确认/取消按钮
  pendingConfirmAnnotation.value = null

  // 2. 立即设置解析状态，标注框变为不可选择状态
  isParsingAnnotation.value = annotation.id

  // 3. 通知父组件开始处理，更新左侧题目列表状态
  console.log('[AnnotationArea] 修改标注类型，发送 annotationParseStart 事件', {
    annotationId: annotation.id,
    questionId: annotation.questionId
  })

  try {
    creating.value = true

    // 判断标注在哪张图片上
    const pageNum = annotation.page
    const leftPageNum = leftPage.value?.realPage || leftPageIndex.value
    const rightPageNum = rightPage.value?.realPage || rightPageIndex.value

    const side = leftPageNum === pageNum ? 'left' : rightPageNum === pageNum ? 'right' : null
    if (!side) {
      throw new Error('标注不在当前显示的页面上')
    }

    // 裁剪图片
    const img = side === 'left' ? leftImageRef.value : rightImageRef.value
    if (!img) throw new Error('图片未加载')

    const imageItem = img.parentElement
    if (!imageItem) throw new Error('图片容器未找到')

    // 获取 page-info 的高度
    const pageInfo = imageItem.querySelector('.page-info')
    const pageInfoHeight = pageInfo ? pageInfo.getBoundingClientRect().height : 0

    // 获取图片在 image-item 中的偏移量
    const imgRect = img.getBoundingClientRect()
    const imageItemRect = imageItem.getBoundingClientRect()

    // 获取当前缩放比例
    const zoom = side === 'left' ? leftZoom.value : rightZoom.value

    // 计算偏移量时需要除以缩放比例，因为标注坐标是相对于未缩放的 image-item 的
    const imgOffsetX = (imgRect.left - imageItemRect.left) / zoom
    const imgOffsetY = (imgRect.top - imageItemRect.top) / zoom
    const imgDisplayWidth = imgRect.width / zoom
    const imgDisplayHeight = imgRect.height / zoom

    // 计算相对于图片的坐标
    const relativeTopLeftX = annotation.topLeftX - imgOffsetX
    const relativeTopLeftY = annotation.topLeftY - imgOffsetY
    const relativeBottomRightX = annotation.bottomRightX - imgOffsetX
    const relativeBottomRightY = annotation.bottomRightY - imgOffsetY

    // 创建临时 canvas 用于裁剪图片
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法创建 Canvas')

    // 如果图片没有缩放，直接使用原始坐标
    if (img.naturalWidth === imgDisplayWidth && img.naturalHeight === imgDisplayHeight) {
      const width = relativeBottomRightX - relativeTopLeftX
      const height = relativeBottomRightY - relativeTopLeftY
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)

      ctx.drawImage(
        img,
        relativeTopLeftX,
        relativeTopLeftY,
        width,
        height,
        0,
        0,
        width,
        height
      )
    } else {
      // 计算缩放比例
      const scaleX = img.naturalWidth / imgDisplayWidth
      const scaleY = img.naturalHeight / imgDisplayHeight

      // 转换为原始图片尺寸的坐标
      const originalX = relativeTopLeftX * scaleX
      const originalY = relativeTopLeftY * scaleY
      const originalWidth = (relativeBottomRightX - relativeTopLeftX) * scaleX
      const originalHeight = (relativeBottomRightY - relativeTopLeftY) * scaleY

      // 设置画布大小
      canvas.width = Math.round(originalWidth)
      canvas.height = Math.round(originalHeight)

      // 裁剪图片
      ctx.drawImage(
        img,
        Math.round(originalX),
        Math.round(originalY),
        Math.round(originalWidth),
        Math.round(originalHeight),
        0,
        0,
        Math.round(originalWidth),
        Math.round(originalHeight)
      )
    }

    // 转换为 PNG 格式
    const blob = await getCanvasBlob(canvas)
    if (!blob) {
      throw new Error('图片裁剪失败')
    }

    const file = new File([blob], `annotation_${selectedAnnotationId.value}.png`, { type: 'image/png' })

    // 判断 inputType：图片类型为1，文本类型为2，表格类型为3
    const imageTypes = [2, 4, 6, 8] // 题干图、选项图、解析图、答案图
    let inputType = 2 // 默认为文本类型
    if (imageTypes.includes(newType)) {
      inputType = 1 // 图片类型
    } else if (updatingOcrType.value === 'table') {
      // 如果用户选择了表格OCR，则 inputType 设为 3
      inputType = 3 // 表格类型
    }

    // 判断新的类型
    const imageNewTypes = [2, 4, 6, 8] // 题干图、选项图、解析图、答案图

    if (imageNewTypes.includes(newType)) {
      // 如果是变成图片类型,使用原来的putAnnotationUpdateTypeApi
      console.log('修改为图片类型,使用原API')
      await putAnnotationUpdateTypeApi({
        annotationId: selectedAnnotationId.value,
        type: newType,
        file: file,
        inputType: 1,
        model: ocrStore.getOcrModel()
      }, { timeout: 60000 })
    } else {
      // 如果是变成文本或表格类型,使用豆包API
      console.log('修改为文本或表格类型,使用豆包API, newType:', newType)

      // 1. 先更新为进行中状态
      await postAnnotationProcessAnnotationApi({
        annotationId: selectedAnnotationId.value,
        result: 0 // 0-进行中
      })

      // 2. 转换为base64
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          if (base64Data) {
            resolve(base64Data)
          } else {
            reject(new Error('Base64数据为空'))
          }
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(blob)
      const imageBase64 = await base64Promise

      // 3. 调用豆包API
      if (!currentModel.value) {
        throw new Error('未选择模型')
      }

      let response
      if (inputType === 3) {
        // 表格OCR
        console.log('调用豆包表格识别API...')
        response = await callDouBaoTable(currentModel.value, `data:image/png;base64,${imageBase64}`, props.subject)
      } else {
        // 文本OCR
        console.log('调用豆包文本识别API...')
        response = await callDouBaoText(currentModel.value, `data:image/png;base64,${imageBase64}`, props.subject)
      }

      // 6. 成功,提取识别结果
      const recognitionResult = response.data.choices?.[0]?.message?.content
      if (!recognitionResult) {
        throw new Error('豆包API返回数据格式错误')
      }
      // 7. 调用putAnnotationUpdateTypeToTextApi传入识别结果和token统计
      await putAnnotationUpdateTypeToTextApi({
        annotationId: selectedAnnotationId.value,
        analysisContent: recognitionResult,
        type: newType,
        inputType: inputType,
        inputToken: response.data.usage?.prompt_tokens,
        outputToken: response.data.usage?.completion_tokens
      })
    }

    // 4. 更新本地标注数据
    annotation.type = newType

    // 5. 显示成功消息
    ElMessage.success('标注类型修改成功，开始解析...')
    emit('annotationParseStart', { annotationId: annotation.id, questionId: annotation.questionId })

    console.log('修改类型成功，标注ID:', annotation.id, '标注类型:', newType)
  } catch (error) {
    console.error('修改标注类型失败:', error)
    ElMessage.error('修改标注类型失败')

    // 失败时也要移除解析状态
    isParsingAnnotation.value = null
  } finally {
    creating.value = false
    isParsingAnnotation.value = null
  }
}

// 取消修改标注类型
const handleCancelUpdateType = (annotation: AnnotationVO) => {
  // 清除待确认状态
  pendingConfirmAnnotation.value = null

  // 关闭修改类型菜单（如果还打开的话）
  updateTypeMenuVisible.value = false
}

// 处理标注框的鼠标按下事件（仅处理调整大小）
const handleAnnotationMouseDown = (e: MouseEvent, annotation: AnnotationVO, side: 'left' | 'right') => {
  // 如果标注正在解析，禁止调整大小
  if (isParsingAnnotation.value === annotation.id) {
    return
  }

  const target = e.target as HTMLElement
  const handle = target.closest('.resize-handle')

  // 如果点击的是调整大小的手柄，进入调整大小模式
  if (handle) {
    e.preventDefault()
    e.stopPropagation()

    const direction = handle.getAttribute('data-dir') as 'nw' | 'ne' | 'sw' | 'se'
    const img = side === 'left' ? leftImageRef.value : rightImageRef.value
    if (!img) return

    const zoom = side === 'left' ? leftZoom.value : rightZoom.value

    isResizing.value = true
    resizingAnnotation.value = annotation
    resizingDirection.value = direction
    resizingSide.value = side
    resizeStart.value = {
      x: e.clientX,
      y: e.clientY,
      rect: {
        topLeftX: annotation.topLeftX,
        topLeftY: annotation.topLeftY,
        bottomRightX: annotation.bottomRightX,
        bottomRightY: annotation.bottomRightY
      }
    }

    document.addEventListener('mousemove', handleResizeMouseMove)
    document.addEventListener('mouseup', handleResizeMouseUp)
  }
  // 移除了长按检测逻辑，现在只通过拖动标志来拖拽标注框
}

// 处理拖动标志的鼠标按下事件
const handleDragHandleMouseDown = (e: MouseEvent, annotation: AnnotationVO, side: 'left' | 'right') => {
  // 如果标注正在解析，禁止拖动
  if (isParsingAnnotation.value === annotation.id) {
    return
  }

  e.preventDefault()
  e.stopPropagation()

  const img = side === 'left' ? leftImageRef.value : rightImageRef.value
  if (!img) return

  isDraggingAnnotation.value = true
  draggingAnnotation.value = annotation
  dragAnnotationSide.value = side
  dragAnnotationStart.value = {
    x: e.clientX,
    y: e.clientY,
    rect: {
      topLeftX: annotation.topLeftX,
      topLeftY: annotation.topLeftY,
      bottomRightX: annotation.bottomRightX,
      bottomRightY: annotation.bottomRightY
    }
  }

  // 初始化临时位置
  dragAnnotationTempPosition.value = {
    topLeftX: annotation.topLeftX,
    topLeftY: annotation.topLeftY,
    bottomRightX: annotation.bottomRightX,
    bottomRightY: annotation.bottomRightY
  }

  document.addEventListener('mousemove', handleAnnotationDragMouseMove)
  document.addEventListener('mouseup', handleAnnotationDragMouseUp)
}

// 处理调整大小的鼠标移动事件
const handleResizeMouseMove = (e: MouseEvent) => {
  if (!isResizing.value || !resizingAnnotation.value || !resizeStart.value) return

  const side = resizingSide.value
  const zoom = side === 'left' ? leftZoom.value : rightZoom.value
  const dx = (e.clientX - resizeStart.value.x) / zoom
  const dy = (e.clientY - resizeStart.value.y) / zoom

  const annotation = resizingAnnotation.value
  const rect = resizeStart.value.rect
  const direction = resizingDirection.value

  let newTopLeftX = rect.topLeftX
  let newTopLeftY = rect.topLeftY
  let newBottomRightX = rect.bottomRightX
  let newBottomRightY = rect.bottomRightY

  // 根据方向调整坐标
  if (direction && direction.includes('w')) {
    newTopLeftX = rect.topLeftX + dx
    // 确保不会变成负宽度
    if (newTopLeftX >= rect.bottomRightX - 10) {
      newTopLeftX = rect.bottomRightX - 10
    }
  }
  if (direction && direction.includes('e')) {
    newBottomRightX = rect.bottomRightX + dx
    // 确保不会变成负宽度
    if (newBottomRightX <= rect.topLeftX + 10) {
      newBottomRightX = rect.topLeftX + 10
    }
  }
  if (direction && direction.includes('n')) {
    newTopLeftY = rect.topLeftY + dy
    // 确保不会变成负高度
    if (newTopLeftY >= rect.bottomRightY - 10) {
      newTopLeftY = rect.bottomRightY - 10
    }
  }
  if (direction && direction.includes('s')) {
    newBottomRightY = rect.bottomRightY + dy
    // 确保不会变成负高度
    if (newBottomRightY <= rect.topLeftY + 10) {
      newBottomRightY = rect.topLeftY + 10
    }
  }

  // 更新标注的坐标
  annotation.topLeftX = newTopLeftX
  annotation.topLeftY = newTopLeftY
  annotation.bottomRightX = newBottomRightX
  annotation.bottomRightY = newBottomRightY
}

// 处理调整大小的鼠标松开事件
const handleResizeMouseUp = async () => {
  if (!isResizing.value || !resizingAnnotation.value) return

  isResizing.value = false
  document.removeEventListener('mousemove', handleResizeMouseMove)
  document.removeEventListener('mouseup', handleResizeMouseUp)

  const annotation = resizingAnnotation.value

  // 设置待确认的标注框
  pendingConfirmAnnotation.value = {
    id: annotation.id,
    side: resizingSide.value || 'left',
    topLeftX: annotation.topLeftX,
    topLeftY: annotation.topLeftY,
    bottomRightX: annotation.bottomRightX,
    bottomRightY: annotation.bottomRightY,
    type: annotation.type,
    page: annotation.page,
    questionId: annotation.questionId
  }

  // 标记刚刚完成了调整大小，防止触发点击事件
  justFinishedDragOrResize.value = true
  setTimeout(() => {
    justFinishedDragOrResize.value = false
  }, 100)

  resizingAnnotation.value = null
  resizingDirection.value = null
  resizingSide.value = null
  resizeStart.value = null
}

// 取消调整大小（按 ESC 键）
const handleResizeKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isResizing.value) {
    // 取消调整大小
    isResizing.value = false
    document.removeEventListener('mousemove', handleResizeMouseMove)
    document.removeEventListener('mouseup', handleResizeMouseUp)
    // 重新加载恢复原始数据
    loadAnnotations(true) // 立即加载
    resizingAnnotation.value = null
    resizingDirection.value = null
    resizingSide.value = null
    resizeStart.value = null
  }
}

// 处理删除标注快捷键 (D键)
const handleDeleteAnnotationKeyDown = (e: KeyboardEvent) => {
  // 只在按下 D 键且不处于输入状态时处理
  if (e.key === 'd' || e.key === 'D') {
    // 检查是否有选中的标注
    if (!selectedAnnotationId.value) {
      return
    }

    // 检查是否正在输入（避免在输入框中按 D 键误删标注）
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable
    )) {
      return
    }

    // 通知父组件删除标注
    emit('deleteAnnotation', selectedAnnotationId.value)
  }
}

// 处理拖拽标注框的鼠标移动事件
const handleAnnotationDragMouseMove = (e: MouseEvent) => {
  if (!isDraggingAnnotation.value || !draggingAnnotation.value || !dragAnnotationStart.value) return

  // 使用 requestAnimationFrame 节流，避免频繁更新
  if (dragAnnotationAnimationFrameId.value !== null) {
    cancelAnimationFrame(dragAnnotationAnimationFrameId.value!)
  }

  dragAnnotationAnimationFrameId.value = requestAnimationFrame(() => {
    const side = dragAnnotationSide.value!
    const zoom = side === 'left' ? leftZoom.value : rightZoom.value
    const dx = (e.clientX - dragAnnotationStart.value!.x) / zoom
    const dy = (e.clientY - dragAnnotationStart.value!.y) / zoom

    const rect = dragAnnotationStart.value!.rect

    // 更新临时位置（非响应式，避免触发 Vue 更新）
    dragAnnotationTempPosition.value = {
      topLeftX: rect.topLeftX + dx,
      topLeftY: rect.topLeftY + dy,
      bottomRightX: rect.bottomRightX + dx,
      bottomRightY: rect.bottomRightY + dy
    }

    // 直接更新标注对象的坐标（这是响应式的，会触发 DOM 更新）
    const annotation = draggingAnnotation.value!
    annotation.topLeftX = dragAnnotationTempPosition.value.topLeftX
    annotation.topLeftY = dragAnnotationTempPosition.value.topLeftY
    annotation.bottomRightX = dragAnnotationTempPosition.value.bottomRightX
    annotation.bottomRightY = dragAnnotationTempPosition.value.bottomRightY

    dragAnnotationAnimationFrameId.value = null
  })
}

// 处理拖拽标注框的鼠标松开事件
const handleAnnotationDragMouseUp = async () => {
  // 清除 animationFrame
  if (dragAnnotationAnimationFrameId.value !== null) {
    cancelAnimationFrame(dragAnnotationAnimationFrameId.value)
    dragAnnotationAnimationFrameId.value = null
  }

  if (!isDraggingAnnotation.value || !draggingAnnotation.value) return

  isDraggingAnnotation.value = false
  document.removeEventListener('mousemove', handleAnnotationDragMouseMove)
  document.removeEventListener('mouseup', handleAnnotationDragMouseUp)

  const annotation = draggingAnnotation.value

  // 设置待确认的标注框
  pendingConfirmAnnotation.value = {
    id: annotation.id,
    side: dragAnnotationSide.value || 'left',
    topLeftX: annotation.topLeftX,
    topLeftY: annotation.topLeftY,
    bottomRightX: annotation.bottomRightX,
    bottomRightY: annotation.bottomRightY,
    type: annotation.type,
    page: annotation.page,
    questionId: annotation.questionId
  }

  // 标记刚刚完成了拖动，防止触发点击事件
  justFinishedDragOrResize.value = true
  setTimeout(() => {
    justFinishedDragOrResize.value = false
  }, 100)

  draggingAnnotation.value = null
  dragAnnotationSide.value = null
  dragAnnotationStart.value = null
  dragAnnotationTempPosition.value = null
}

// 设置选中的题目
const setSelectedQuestion = (questionId: string | null) => {
  selectedQuestionId.value = questionId
  // 无论 questionId 是否为空，都取消当前正在进行的标注
  cancelAnnotation()
}

// 根据标注类型确定显示位置（左侧或右侧）
// 左侧：题干(1)、题干图(2)、选项(3)、选项图(4)、表格(9)
// 右侧：解析(5)、解析图(6)、答案(7)、答案图(8)
const getDisplaySideByAnnotationType = (annotationType: number): 'left' | 'right' => {
  const leftSideTypes = [1, 2, 3, 4, 9] // 题干、题干图、选项、选项图、表格
  return leftSideTypes.includes(annotationType) ? 'left' : 'right'
}

// 定位标注
const locateAnnotation = async (annotation: AnnotationVO) => {
  // 查找标注所在的页码属于哪个电子书
  const targetPage = allPages.value.find(p => p.realPage === annotation.page)
  if (!targetPage) {
    ElMessage.warning('未找到标注所在的页面')
    return
  }

  // 查找对应的电子书
  const pdfIndex = pdfList.value.findIndex(pdf => pdf.id === targetPage.pdfId)
  if (pdfIndex === -1) {
    ElMessage.warning('未找到标注所在的电子书')
    return
  }

  // 获取当前左右两侧的页码
  const leftPageNum = leftPage.value?.realPage || leftPageIndex.value
  const rightPageNum = rightPage.value?.realPage || rightPageIndex.value

  // 检查标注页面是否已在当前显示的页面中
  const isPageAlreadyVisible = leftPageNum === annotation.page || rightPageNum === annotation.page

  if (isPageAlreadyVisible) {
    // 标注页面已在当前显示中，直接高亮标注
    highlightAnnotation(annotation.id)
    return
  }

  // 切换到对应的电子书
  if (pdfIndex !== currentPdfIndex.value) {
    currentPdfIndex.value = pdfIndex
  }

  // 获取页码在该电子书中的索引
  const pdf = pdfList.value[pdfIndex]
  if (!pdf) return
  const pdfPages = getPdfPages(pdf.id)
  const pageIndex = pdfPages.findIndex(p => p.realPage === annotation.page)

  // 根据标注类型决定显示在左侧还是右侧
  const displaySide = getDisplaySideByAnnotationType(annotation.type)

  if (pageIndex >= 0) {
    // 根据标注类型显示在对应的一侧
    if (displaySide === 'left') {
      // 显示在左侧
      if (leftPageIndex.value !== pageIndex + 1) {
        leftPageIndex.value = pageIndex + 1
        await loadAnnotations(true) // 立即加载
      }
    } else {
      // 显示在右侧
      if (rightPageIndex.value !== pageIndex + 1) {
        rightPageIndex.value = pageIndex + 1
        await loadAnnotations(true) // 立即加载
      }
    }
    // 设置高亮
    highlightAnnotation(annotation.id)
  } else {
    ElMessage.warning('未找到标注所在的页码')
  }
}

// 高亮标注（闪烁效果）
const highlightAnnotation = (annotationId: string) => {
  highlightedAnnotationId.value = annotationId
  // 闪烁 6 次（每次 150ms）
  let flashCount = 0
  const flashInterval = setInterval(() => {
    highlightedAnnotationId.value = flashCount % 2 === 0 ? annotationId : null
    flashCount++
    if (flashCount >= 12) {
      clearInterval(flashInterval)
      highlightedAnnotationId.value = null
    }
  }, 150)
}

// 刷新标注列表（指定页码）
const refreshAnnotations = (page?: number) => {
  // 如果传入了页码，判断是否是当前显示的页码
  if (page) {
    const leftPageNum = leftPage.value?.realPage || leftPageIndex.value
    const rightPageNum = rightPage.value?.realPage || rightPageIndex.value
    if (page === leftPageNum || page === rightPageNum) {
      loadAnnotations(true) // 立即加载
    }
  } else {
    // 没有传入页码，直接刷新
    loadAnnotations(true) // 立即加载
  }
}

// 清除选中状态
const clearSelection = () => {
  selectedAnnotationId.value = null
  highlightedAnnotationId.value = null
}

// 跳转到指定页码
const goToPage = (page: number) => {
  if (!allPages.value || allPages.value.length === 0) {
    ElMessage.warning('页面数据未加载，请稍后再试')
    return
  }

  // 根据 realPage 找到对应的页面索引
  const pageIndex = allPages.value.findIndex(p => p.realPage === page)
  if (pageIndex === -1) {
    ElMessage.warning(`未找到第 ${page} 页`)
    return
  }

  // 只在左侧显示指定的页码，右侧不加载
  leftPageIndex.value = pageIndex + 1

  // 加载标注
  loadAnnotations(true) // 立即加载
}

// 刷新模型列表
const refreshModels = async () => {
    modelList.value = []
    await loadModelList()
}

// 暴露方法
defineExpose({
  setSelectedQuestion,
  locateAnnotation,
  refreshAnnotations,
  clearSelection,
  setQuestionsList,
  retryParseAnnotation,
  goToPage,
  refreshModels
})

// 监听页码变化，加载标注（使用节流）
watch([leftPageIndex, rightPageIndex], () => {
  loadAnnotations(false) // 使用节流模式
})

onMounted(() => {
  loadPdfList()
  loadModelList()
  // 添加键盘事件监听
  document.addEventListener('keydown', handleResizeKeyDown)
  document.addEventListener('keydown', handleDeleteAnnotationKeyDown)
  document.addEventListener('keydown', handleGlobalKeyDown)
  document.addEventListener('keyup', handleGlobalKeyUp)
  // 初始化图片位置左上角对齐
  setTimeout(() => {
    // 左侧图片左上角对齐
    const leftWrapper = leftImageWrapperRef.value
    if (leftWrapper) {
      leftImagePosition.x = 16  // padding-left
      leftImagePosition.y = 16  // padding-top
    }

    // 右侧图片左上角对齐
    const rightWrapper = rightImageWrapperRef.value
    if (rightWrapper) {
      rightImagePosition.x = 16  // padding-left
      rightImagePosition.y = 16  // padding-top
    }
  }, 100)
})

onUnmounted(() => {
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleResizeKeyDown)
  document.removeEventListener('keydown', handleDeleteAnnotationKeyDown)
  document.removeEventListener('keydown', handleGlobalKeyDown)
  document.removeEventListener('keyup', handleGlobalKeyUp)
  // 清理节流定时器
  if (loadAnnotationsTimer) {
    clearTimeout(loadAnnotationsTimer)
    loadAnnotationsTimer = null
  }
})
</script>

<style scoped>
.annotation-area-container {
  height: 100%;
}

.nav-bar {
  height: 48px;
}

.nav-section {
  display: flex;
  align-items: center;
}

.left-nav {
  justify-content: flex-start;
}

.right-nav {
  justify-content: flex-end;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background-color: #e5e7eb;
  flex-shrink: 0;
}

.layout-switcher {
  display: flex;
  align-items: center;
}

.image-area {
  flex: 1;
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.image-section {
  overflow: hidden;
  position: relative;
  border-radius: 8px;
  background-color: #f5f5f5;
}

.image-wrapper {
  display: inline-block;
  position: absolute;
  user-select: none;
  /* 防止选中文字 */
}

.image-content {
  display: flex;
  gap: 0;
}

.image-item {
  width: 600px;
  flex-shrink: 0;
  position: relative;
  transition: transform 0.2s ease-in-out;
}

.image-item.is-annotating {
  cursor: crosshair;
}

.page-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  white-space: nowrap;
}

.pdf-page {
  display: block;
  object-fit: contain;
}

/* 标注框样式 */
.annotation-box {
  position: absolute;
  border: 1px solid #ff6b6b;
  background-color: rgba(255, 107, 107, 0.05);
  cursor: pointer;
  transition: all 0.2s;
  /* 边框宽度需要反向缩放以保持视觉一致 */
}

.annotation-box:hover {
  background-color: rgba(255, 107, 107, 0.1);
  border-color: #ff5252;
}

.annotation-box.selected {
  border-color: #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
}

.annotation-box.resizing {
  border-color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}

/* 根据调整方向显示不同的光标 */
.annotation-box.resizing[data-resize-dir="nw"] {
  cursor: nw-resize;
}

.annotation-box.resizing[data-resize-dir="ne"] {
  cursor: ne-resize;
}

.annotation-box.resizing[data-resize-dir="sw"] {
  cursor: sw-resize;
}

.annotation-box.resizing[data-resize-dir="se"] {
  cursor: se-resize;
}

.annotation-box.dragging {
  border-color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.1);
  cursor: move;
}

/* 拖动标志（左上角对角） */
.annotation-box.show-drag-handle .drag-handle {
  position: absolute;
  top: -24px;
  left: -24px;
  width: 20px;
  height: 20px;
  background-color: #3b82f6;
  border: 2px solid white;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.annotation-box.show-drag-handle .drag-handle:hover {
  background-color: #2563eb;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.annotation-box.show-drag-handle .drag-handle .iconify {
  color: white;
}

/* 确认按钮（打勾） */
.annotation-box .confirm-button {
  position: absolute;
  top: -24px;
  right: -12px;
  width: 24px;
  height: 24px;
  background-color: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.annotation-box .confirm-button:hover {
  background-color: #059669;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.annotation-box .confirm-button .iconify {
  color: white;
}

/* 取消按钮（叉号） */
.annotation-box .cancel-button {
  position: absolute;
  top: -24px;
  right: 20px;
  width: 24px;
  height: 24px;
  background-color: #ef4444;
  border: 2px solid white;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 11;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.annotation-box .cancel-button:hover {
  background-color: #dc2626;
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.annotation-box .cancel-button .iconify {
  color: white;
}

/* 调整大小的手柄 */
.annotation-box.selected .resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #3b82f6;
  border: 2px solid white;
  border-radius: 2px;
  cursor: pointer;
  z-index: 10;
  /* 反向缩放手柄大小，使其不随页面缩放而变化 */
  transform: scale(calc(1 / var(--zoom-scale, 1)));
  /* 确保手柄始终可见 */
  min-width: 6px;
  min-height: 6px;
}

.resize-handle.nw {
  top: -5px;
  left: -5px;
  cursor: nw-resize;
  transform-origin: top left;
}

.resize-handle.ne {
  top: -5px;
  right: -5px;
  cursor: ne-resize;
  transform-origin: top right;
}

.resize-handle.sw {
  bottom: -5px;
  left: -5px;
  cursor: sw-resize;
  transform-origin: bottom left;
}

.resize-handle.se {
  bottom: -5px;
  right: -5px;
  cursor: se-resize;
  transform-origin: bottom right;
}

.resize-handle:hover {
  background-color: #2563eb;
  transform: scale(1.2);
}

.annotation-box.highlighted {
  border-color: #22c55e;
  background-color: rgba(34, 197, 94, 0.15);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
  animation: pulse 0.15s ease-in-out;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.02);
  }
}

/* 标注选框样式 */
.selection-rect {
  position: absolute;
  border: 2px dashed #3b82f6;
  background-color: rgba(59, 130, 246, 0.1);
  pointer-events: none;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

/* 页码输入框样式 */
.nav-bar :deep(.el-input) {
  width: 56px !important;
}

.nav-bar :deep(.el-input__wrapper) {
  padding: 1px 8px !important;
}

/* el-splitter 分割条样式 */
.image-area :deep(.el-splitter__resizer) {
  background-color: #e5e7eb;
  transition: background-color 0.2s;
  z-index: 10;
  position: relative;
}

.image-area :deep(.el-splitter__resizer:hover) {
  background-color: #3b82f6;
}

.image-area :deep(.el-splitter__resizer::before) {
  content: '';
  position: absolute;
  background-color: #6b7280;
  border-radius: 2px;
}

.image-area :deep(.el-splitter__resizer::after) {
  content: '';
  position: absolute;
  background-color: #6b7280;
  border-radius: 2px;
}

/* 水平布局时的分割条（垂直线） */
.image-area :deep(.el-splitter--horizontal > .el-splitter__resizer) {
  width: 8px !important;
}

.image-area :deep(.el-splitter--horizontal > .el-splitter__resizer::before) {
  width: 3px;
  height: 30px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.image-area :deep(.el-splitter--horizontal > .el-splitter__resizer::after) {
  width: 3px;
  height: 30px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, calc(-50% - 40px));
}

/* 垂直布局时的分割条（水平线） */
.image-area :deep(.el-splitter--vertical > .el-splitter__resizer) {
  height: 8px !important;
}

.image-area :deep(.el-splitter--vertical > .el-splitter__resizer::before) {
  width: 30px;
  height: 3px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.image-area :deep(.el-splitter--vertical > .el-splitter__resizer::after) {
  width: 30px;
  height: 3px;
  left: 50%;
  top: 50%;
  transform: translate(calc(-50% - 40px), -50%);
}

/* 标注标签样式 */
.annotation-label {
  position: absolute;
  font-size: 11px;
  white-space: nowrap;
  font-weight: 500;
  text-shadow: 0 0 2px white, 0 0 2px white;
  pointer-events: auto;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.2s ease-in-out;
}

/* 标签隐藏状态 */
.annotation-label.label-hidden {
  opacity: 0;
}

/* 当鼠标悬停在标注框上时，显示对应的标签 */
.annotation-box.show-label .annotation-label {
  opacity: 0.6 !important;
}

/* 右键弹出面板样式 */
.context-menu-panel {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 160px;
  padding: 8px;
}

.context-menu-title {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  padding: 4px 8px 8px 8px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 4px;
}

.context-menu-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 菜单项包装器，用于定位子菜单 */
.context-menu-item-wrapper {
  position: relative;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.context-menu-item:hover {
  background-color: #f3f4f6;
}

.context-menu-item.active {
  background-color: #dbeafe;
}

.context-menu-item.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.context-menu-item.disabled:hover {
  background-color: transparent;
}

.context-menu-item .iconify {
  font-size: 18px;
}

/* OCR类型子菜单样式 - 向右展开（级联菜单） */
.ocr-type-submenu {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 4px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 120px;
  padding: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 10000;
}

.ocr-type-submenu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 4px;
}

.ocr-type-submenu-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.ocr-type-submenu-item.active {
  background-color: #dbeafe;
  color: #2563eb;
}
</style>
