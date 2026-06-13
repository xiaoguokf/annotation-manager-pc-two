<template>
  <div class="px-6 py-4 border-b dark:border-gray-700" :style="{ backgroundColor: 'var(--theme-header-bg)', borderBottomColor: 'var(--theme-border-color)' }">
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="mb-2">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item v-for="item in breadcrumbList" :key="item.path" :to="{ path: item.path }">
        {{ item.title }}
      </el-breadcrumb-item>
    </el-breadcrumb>
    
    <!-- 当前页面标题 -->
    <div class="mb-2">
      <h2 class="m-0 text-xl font-semibold text-gray-800 dark:text-gray-200">{{ currentPageTitle }}</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineOptions({
  name: "ShortClipNavbar"
})

const route = useRoute()

// 面包屑导航列表
const breadcrumbList = computed(() => {
  const pathArray = route.path.split('/').filter(item => item)
  const breadcrumbs: Array<{ path: string; title: string }> = []
  
  let currentPath = ''
  pathArray.forEach((item, index) => {
    currentPath += `/${item}`
    
    // 根据路径生成标题
    let title = item
    switch (item) {
      case 'system':
        title = '系统管理'
        break
      case 'user':
        title = '用户管理'
        break
      case 'role':
        title = '角色管理'
        break
      case 'menu':
        title = '菜单管理'
        break
      case 'statistics':
        title = '数据统计'
        break
      case 'overview':
        title = '数据概览'
        break
      case 'report':
        title = '报表管理'
        break
      default:
        title = item
    }
    
    // 只添加非首页的面包屑
    if (index > 0) {
      breadcrumbs.push({
        path: currentPath,
        title
      })
    }
  })
  
  return breadcrumbs
})

// 当前页面标题
const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/') return '首页'
  
  const pathArray = path.split('/').filter(item => item)
  const lastItem = pathArray[pathArray.length - 1]
  
  switch (lastItem) {
    case 'system':
      return '系统管理'
    case 'user':
      return '用户管理'
    case 'role':
      return '角色管理'
    case 'menu':
      return '菜单管理'
    case 'statistics':
      return '数据统计'
    case 'overview':
      return '数据概览'
    case 'report':
      return '报表管理'
    default:
      return lastItem || '首页'
  }
})
</script>

