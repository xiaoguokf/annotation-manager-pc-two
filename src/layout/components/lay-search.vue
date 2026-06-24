<template>
  <div class="relative w-[300px]">
    <el-input
      v-model="searchKeyword"
      placeholder="搜索菜单..."
      class="w-full"
      clearable
      @input="handleSearch"
      @focus="showSearchResult = true"
      @blur="handleBlur"
    >
      <template #prefix>
        <el-icon>
          <Icon icon="ep:search" />
        </el-icon>
      </template>
    </el-input>
    
    <!-- 搜索结果下拉框 -->
    <div v-show="showSearchResult && searchResults.length > 0" class="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-[320px] overflow-y-auto z-1000">
      <div
        v-for="item in searchResults"
        :key="item.path"
        class="flex items-center px-4 py-3 cursor-pointer transition-colors duration-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        @click="handleSelect(item)"
      >
        <el-icon class="mr-3 text-gray-400 dark:text-gray-500 text-base">
          <Icon :icon="item.icon" />
        </el-icon>
        <div class="flex-1">
          <div class="text-sm text-gray-800 dark:text-gray-200 font-medium mb-0.5">{{ item.title }}</div>
          <div class="text-xs text-gray-400">{{ item.path }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'

defineOptions({
  name: "ShortClipSearch"
})

interface MenuItem {
  title: string
  path: string
  icon: string
  keywords?: string[]
}

const router = useRouter()
const searchKeyword = ref('')
const showSearchResult = ref(false)

// 菜单数据
const menuItems: MenuItem[] = [
  { title: '首页', path: '/', icon: 'ep:house', keywords: ['home', 'index'] },
  { title: '用户管理', path: '/system/user', icon: 'ep:user', keywords: ['user', '用户'] },
  { title: '角色管理', path: '/system/role', icon: 'ep:user-filled', keywords: ['role', '角色'] },
  { title: '菜单管理', path: '/system/menu', icon: 'ep:menu', keywords: ['menu', '菜单'] }
]

// 搜索结果
const searchResults = computed(() => {
  if (!searchKeyword.value.trim()) {
    return []
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return menuItems.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(keyword)
    const pathMatch = item.path.toLowerCase().includes(keyword)
    const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(keyword))
    
    return titleMatch || pathMatch || keywordMatch
  }).slice(0, 8) // 最多显示8个结果
})

// 处理搜索
const handleSearch = () => {
  showSearchResult.value = searchKeyword.value.trim().length > 0
}

// 处理失焦
const handleBlur = () => {
  // 延迟隐藏，让点击事件先触发
  setTimeout(() => {
    showSearchResult.value = false
  }, 200)
}

// 选择搜索结果
const handleSelect = (item: MenuItem) => {
  router.push(item.path)
  searchKeyword.value = ''
  showSearchResult.value = false
}
</script>

<style scoped>
/* 输入框样式 */
:deep(.el-input__wrapper) {
  border-radius: 1rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid transparent;
  transition: all 0.3s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-color: var(--theme-primary);
}
</style>