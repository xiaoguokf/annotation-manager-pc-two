<template>
  <el-dropdown trigger="click" @command="handleCommand" placement="bottom-end" role="navigation">
    <div>
      <el-tooltip :content="getTooltipText()" placement="bottom">
        <div
          class="flex items-center justify-center rounded-md cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-theme-primary"
          :style="{ width: `var(--theme-panel-icon-size)`, height: `var(--theme-panel-icon-size)` }">
          <el-icon size="18">
            <Icon :icon="getThemeIcon()" />
          </el-icon>
        </div>
      </el-tooltip>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="theme-dropdown-menu">
        <!-- 主题模式选择 -->
        <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">主题模式</div>
          <div class="space-y-1">
            <el-dropdown-item command="light" :class="{ 'is-active': themeMode === 'light' }" class="theme-mode-item">
              <div class="flex items-center">
                <el-icon class="mr-2">
                  <Icon icon="ep:sunny" />
                </el-icon>
                <span>浅色模式</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="dark" :class="{ 'is-active': themeMode === 'dark' }" class="theme-mode-item">
              <div class="flex items-center">
                <el-icon class="mr-2">
                  <Icon icon="ep:moon" />
                </el-icon>
                <span>深色模式</span>
              </div>
            </el-dropdown-item>
            <el-dropdown-item command="auto" :class="{ 'is-active': themeMode === 'auto' }" class="theme-mode-item">
              <div class="flex items-center">
                <el-icon class="mr-2">
                  <Icon icon="ep:monitor" />
                </el-icon>
                <span>跟随系统</span>
              </div>
            </el-dropdown-item>
          </div>
        </div>

        <!-- 组件尺寸 -->
        <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">组件尺寸</div>
          <div class="flex gap-2">
            <button
              v-for="size in sizeOptions"
              :key="size.value"
              class="flex-1 py-1.5 px-3 text-xs rounded border transition-all duration-200"
              :class="themeSize === size.value
                ? 'bg-theme-primary text-white border-theme-primary'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-theme-primary hover:text-theme-primary'"
              @click.stop="handleSizeChange(size.value)">
              {{ size.label }}
            </button>
          </div>
        </div>

        <!-- 预设主题 -->
        <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">预设主题</div>
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div v-for="preset in presetThemes" :key="preset.name"
                 class="cursor-pointer p-2 rounded border hover:border-theme-primary transition-colors"
                 :class="{ 'border-theme-primary ring-2 ring-theme-primary ring-opacity-50': isCurrentPreset(preset) }"
                 @click.stop="applyPresetTheme(preset)">
              <el-tooltip :content="preset.name" placement="top">
                <div class="w-6 h-6 rounded" :style="{ backgroundColor: preset.primaryColor }"></div>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- 快速颜色设置 -->
        <div class="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">快速设置</div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">主色调</span>
              <el-color-picker v-model="quickPrimaryColor" size="small" @change="updateQuickPrimaryColor" />
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="px-4 py-2">
          <el-dropdown-item command="custom" divided>
            <el-icon class="mr-2">
              <Icon icon="ep:brush" />
            </el-icon>
            详细设置
          </el-dropdown-item>
          <el-dropdown-item command="reset">
            <el-icon class="mr-2">
              <Icon icon="ep:refresh-left" />
            </el-icon>
            重置主题
          </el-dropdown-item>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>


</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useRouter } from 'vue-router'
import { useThemeStore, type ThemeColors, type ThemeMode, type ThemeSize, presetThemes } from '@/stores/theme'

defineOptions({
  name: "ThemeToggle"
})

const router = useRouter()
const themeStore = useThemeStore()

// 主题模式
const themeMode = computed(() => themeStore.themeMode)

// 主题尺寸
const themeSize = computed(() => themeStore.themeSize)

// 尺寸选项
const sizeOptions: { label: string; value: ThemeSize }[] = [
  { label: '紧凑', value: 'small' },
  { label: '默认', value: 'default' },
  { label: '宽松', value: 'large' },
]

// 快速主色调
const quickPrimaryColor = ref(themeStore.currentColors.primary)

// 当前选中的预设主题
const currentPreset = ref('蓝色商务')

// 使用共享的预设主题配置

// 监听主题变化，更新快速颜色选择器（添加防抖）
let primaryColorUpdateTimer: number | null = null
watch(() => themeStore.currentColors.primary, (newPrimary) => {
  if (primaryColorUpdateTimer) {
    clearTimeout(primaryColorUpdateTimer)
  }
  primaryColorUpdateTimer = setTimeout(() => {
    quickPrimaryColor.value = newPrimary
  }, 50)
})



// 获取主题图标
const getThemeIcon = () => {
  switch (themeMode.value) {
    case 'light':
      return 'ep:sunny'
    case 'dark':
      return 'ep:moon'
    case 'auto':
      return 'ep:monitor'
    default:
      return 'ep:sunny'
  }
}

// 获取提示文本
const getTooltipText = () => {
  return '主题设置'
}

// 更新快速主色调
const updateQuickPrimaryColor = (color: string | null) => {
  if (color) {
    const newColors: Partial<ThemeColors> = {
      primary: color,
      primaryLight: color + '20',
      primaryDark: color + 'cc',
      sidebarMenuActive: color,
      sidebarLogoBg: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      submenuItemActive: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      submenuBorder: color + '40'
    }
    themeStore.updateColors(newColors)
    ElMessage.success('主色调已更新')
  }
}

// 应用预设主题
const applyPresetTheme = (preset: typeof presetThemes[0]) => {
  themeStore.applyPresetTheme(preset.colors, preset.darkColors)
  currentPreset.value = preset.name
  ElMessage.success(`已应用${preset.name}主题`)
}

// 设置组件尺寸
const handleSizeChange = (size: ThemeSize) => {
  themeStore.setThemeSize(size)
  const sizeLabel = sizeOptions.find(o => o.value === size)?.label || size
  ElMessage.success(`组件尺寸已设置为${sizeLabel}`)
}

// 检查是否为当前选中的预设主题
const isCurrentPreset = (preset: typeof presetThemes[0]) => {
  const current = themeStore.currentColors
  const presetColors = preset.colors
  
  // 比较关键颜色来确定是否为当前预设
  return (
    current.primary === presetColors.primary &&
    current.sidebarBg === presetColors.sidebarBg &&
    current.sidebarMenuActive === presetColors.sidebarMenuActive &&
    current.contentBg === presetColors.contentBg
  )
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'light':
    case 'dark':
    case 'auto':
      themeStore.setThemeMode(command as ThemeMode)
      break
    case 'custom':
      router.push('/system/theme')
      break
    case 'reset':
      themeStore.resetColors()
      currentPreset.value = '蓝色商务'
      ElMessage.success('主题已重置')
      break
  }
}


</script>

<style scoped>
:deep(.el-dropdown-menu__item.is-active) {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

/* 自定义下拉菜单样式 */
:deep(.theme-dropdown-menu) {
  width: 320px;
  max-height: 500px;
  overflow-y: auto;
}

:deep(.theme-mode-item) {
  padding: 8px 12px;
  margin: 0;
}

:deep(.theme-mode-item .el-dropdown-menu__item) {
  padding: 0;
}

/* 预设主题网格 */
.grid {
  display: grid;
  gap: 8px;
}

.grid-cols-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

/* 边框样式 */
.border-gray-100 {
  border-color: var(--theme-border-color-light, #f3f4f6);
}

/* 响应式调整 */
@media (max-width: 640px) {
  :deep(.theme-dropdown-menu) {
    width: 280px;
  }
}
</style>