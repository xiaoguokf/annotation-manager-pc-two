<template>
  <div class="p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">主题设置</h2>
      <p class="text-gray-600 dark:text-gray-400">自定义您的界面主题和颜色方案</p>
    </div>

    <el-row :gutter="24">
      <!-- 主题模式选择 -->
      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <div class="flex items-center">
              <el-icon class="mr-2">
                <Icon icon="ep:brush" />
              </el-icon>
              主题模式
            </div>
          </template>
          
            <el-radio-group v-model="themeMode" @change="handleThemeModeChange" class="w-full">
            <div class="space-y-3">
              <div class="p-3 border rounded-lg hover:border-theme-primary transition-colors cursor-pointer"
                   @click="setThemeMode('light')" :class="{ 'border-theme-primary': themeMode === 'light' }">
                <el-radio label="light" class="w-full">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <el-icon class="mr-2 text-yellow-500">
                        <Icon icon="ep:sunny" />
                      </el-icon>
                      <span>浅色模式</span>
                    </div>
                    <div class="w-12 h-8 rounded border-2 border-gray-300 bg-white"></div>
                  </div>
                </el-radio>
              </div>
              
              <div class="p-3 border rounded-lg hover:border-theme-primary transition-colors cursor-pointer"
                   @click="setThemeMode('dark')" :class="{ 'border-theme-primary': themeMode === 'dark' }">
                <el-radio label="dark" class="w-full">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <el-icon class="mr-2 text-gray-500">
                        <Icon icon="ep:moon" />
                      </el-icon>
                      <span>深色模式</span>
                    </div>
                    <div class="w-12 h-8 rounded border-2 border-gray-300 bg-gray-800"></div>
                  </div>
                </el-radio>
              </div>
              
              <div class="p-3 border rounded-lg hover:border-theme-primary transition-colors cursor-pointer"
                   @click="setThemeMode('auto')" :class="{ 'border-theme-primary': themeMode === 'auto' }">
                <el-radio label="auto" class="w-full">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center">
                      <el-icon class="mr-2 text-gray-500">
                        <Icon icon="ep:monitor" />
                      </el-icon>
                      <span>跟随系统</span>
                    </div>
                    <div class="w-12 h-8 rounded border-2 border-gray-300 bg-gradient-to-r from-white to-gray-800"></div>
                  </div>
                </el-radio>
              </div>
            </div>
          </el-radio-group>
        </el-card>

        <!-- 组件尺寸 -->
        <el-card>
          <template #header>
            <div class="flex items-center">
              <el-icon class="mr-2">
                <Icon icon="ep:scale-to-original" />
              </el-icon>
              组件尺寸
            </div>
          </template>
          <div class="flex gap-2">
            <button
              v-for="size in sizeOptions"
              :key="size.value"
              class="flex-1 py-2 px-3 text-sm rounded-lg border transition-all duration-200"
              :class="themeSize === size.value
                ? 'bg-theme-primary text-white border-theme-primary shadow-sm'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-theme-primary hover:text-theme-primary'"
              @click="handleSizeChange(size.value)">
              <div class="font-medium">{{ size.label }}</div>
              <div class="text-xs opacity-75 mt-0.5">{{ size.description }}</div>
            </button>
          </div>
        </el-card>
      </el-col>

      <!-- 颜色自定义 -->
      <el-col :span="16">
        <el-card class="mb-4">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <el-icon class="mr-2">
                  <Icon icon="ep:palette" />
                </el-icon>
                颜色自定义
              </div>
              <el-button type="primary" @click="resetColors">重置为默认</el-button>
            </div>
          </template>
          
          <el-form :model="colorForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="主色调">
                  <el-color-picker v-model="colorForm.primary" @change="updateColor('primary')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.primary }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主色调浅">
                  <el-color-picker v-model="colorForm.primaryLight" @change="updateColor('primaryLight')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.primaryLight }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主色调深">
                  <el-color-picker v-model="colorForm.primaryDark" @change="updateColor('primaryDark')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.primaryDark }}</span>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider />
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="侧边栏背景">
                  <el-color-picker v-model="colorForm.sidebarBg" @change="updateColor('sidebarBg')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.sidebarBg }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="菜单激活色">
                  <el-color-picker v-model="colorForm.sidebarMenuActive" @change="updateColor('sidebarMenuActive')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.sidebarMenuActive }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="菜单文字色">
                  <el-color-picker v-model="colorForm.sidebarMenuText" @change="updateColor('sidebarMenuText')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.sidebarMenuText }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="菜单激活边框">
                  <el-color-picker v-model="colorForm.sidebarMenuActiveBorder" @change="updateColor('sidebarMenuActiveBorder')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.sidebarMenuActiveBorder }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="侧边栏底部">
                  <el-color-picker v-model="colorForm.sidebarFooterBg" @change="updateColor('sidebarFooterBg')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.sidebarFooterBg }}</span>
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-divider />
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="内容背景">
                  <el-color-picker v-model="colorForm.contentBg" @change="updateColor('contentBg')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.contentBg }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="顶部背景">
                  <el-color-picker v-model="colorForm.headerBg" @change="updateColor('headerBg')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.headerBg }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="边框颜色">
                  <el-color-picker v-model="colorForm.borderColor" @change="updateColor('borderColor')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.borderColor }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="二级菜单背景">
                  <el-color-picker v-model="colorForm.submenuBg" @change="updateColor('submenuBg')" />
                  <span class="ml-2 text-sm text-gray-500">{{ colorForm.submenuBg }}</span>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="二级菜单阴影">
                  <el-input v-model="colorForm.submenuItemShadow" @change="updateColor('submenuItemShadow')" placeholder="例如: 0 2px 8px rgba(251, 146, 60, 0.15)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="激活状态阴影">
                  <el-input v-model="colorForm.submenuItemActiveShadow" @change="updateColor('submenuItemActiveShadow')" placeholder="例如: 0 4px 16px rgba(251, 146, 60, 0.3)" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="激活悬停阴影">
                  <el-input v-model="colorForm.submenuItemActiveHoverShadow" @change="updateColor('submenuItemActiveHoverShadow')" placeholder="例如: 0 6px 20px rgba(251, 146, 60, 0.45)" />
                </el-form-item>
              </el-col>

            </el-row>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预设主题 -->
    <el-card>
      <template #header>
        <div class="flex items-center">
          <el-icon class="mr-2">
            <Icon icon="ep:magic-stick" />
          </el-icon>
          预设主题
        </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div v-for="preset in presetThemesWithDescription" :key="preset.name"
             class="p-4 border rounded-lg cursor-pointer hover:border-theme-primary transition-all hover:shadow-md"
             :class="{ 'border-theme-primary ring-2 ring-theme-primary ring-opacity-50': isCurrentPreset(preset) }"
             @click="applyPresetTheme(preset)">
          <div class="font-medium mb-2">
            {{ preset.name }}
          </div>
          <div class="flex gap-2 mb-2">
            <div class="w-8 h-8 rounded" :style="{ backgroundColor: preset.colors.primary }"></div>
            <div class="w-8 h-8 rounded" :style="{ backgroundColor: preset.colors.sidebarBg }"></div>
            <div class="w-8 h-8 rounded" :style="{ backgroundColor: preset.colors.sidebarMenuActive }"></div>
          </div>
          <div class="text-xs text-gray-500">{{ preset.description }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useThemeStore, type ThemeColors, type ThemeSize, presetThemes } from '@/stores/theme'

defineOptions({
  name: "ThemeSettings"
})

const themeStore = useThemeStore()

// 主题模式
const themeMode = ref(themeStore.themeMode)

// 主题尺寸
const themeSize = ref(themeStore.themeSize)

// 尺寸选项
const sizeOptions: { label: string; value: ThemeSize; description: string }[] = [
  { label: '紧凑', value: 'small', description: '更小的间距和文字' },
  { label: '默认', value: 'default', description: '标准尺寸' },
  { label: '宽松', value: 'large', description: '更大的间距和文字' },
]

// 颜色表单
const colorForm = reactive<ThemeColors>({ ...themeStore.currentColors })

// 添加描述到预设主题
const presetThemesWithDescription = presetThemes.map(preset => ({
  ...preset,
  description: preset.name === '橙色经典' ? '默认的橙色主题' :
               preset.name === '蓝色商务' ? '专业的蓝色主题' :
               preset.name === '绿色自然' ? '清新的绿色主题' :
               '高贵的紫色主题'
}))

// 设置主题模式
const setThemeMode = (mode: 'light' | 'dark' | 'auto') => {
  themeMode.value = mode
  themeStore.setThemeMode(mode)
}

// 设置组件尺寸
const handleSizeChange = (size: ThemeSize) => {
  themeSize.value = size
  themeStore.setThemeSize(size)
  const sizeLabel = sizeOptions.find(o => o.value === size)?.label || size
  ElMessage.success(`组件尺寸已设置为${sizeLabel}`)
}

// 处理主题模式变化
const handleThemeModeChange = () => {
  themeStore.setThemeMode(themeMode.value)
}

// 更新颜色
const updateColor = (key: keyof ThemeColors) => {
  themeStore.updateColors({ [key]: colorForm[key] })
}

// 重置颜色
const resetColors = () => {
  themeStore.resetColors()
  Object.assign(colorForm, themeStore.currentColors)
  ElMessage.success('主题已重置为默认')
}

// 应用预设主题
const applyPresetTheme = (preset: typeof presetThemesWithDescription[0]) => {
  themeStore.applyPresetTheme(preset.colors, preset.darkColors)
  Object.assign(colorForm, themeStore.currentColors)
  ElMessage.success(`已应用${preset.name}主题`)
}

// 检查是否为当前选中的预设主题
const isCurrentPreset = (preset: typeof presetThemesWithDescription[0]) => {
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

// 监听主题变化
watch(() => themeStore.currentColors, (newColors) => {
  Object.assign(colorForm, newColors)
}, { deep: true })

onMounted(() => {
  Object.assign(colorForm, themeStore.currentColors)
})
</script>

<style scoped>
:deep(.el-radio) {
  width: 100%;
  margin-right: 0;
}

:deep(.el-radio__label) {
  width: 100%;
}
</style>