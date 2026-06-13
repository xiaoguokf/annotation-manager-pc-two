<template>
  <!-- 水平菜单区域 - 与内容区域背景一致 -->
  <div v-if="showSubSidebar" class="flex-shrink-0" :style="{ height: `var(--theme-subheader-height)` }">
    <div class="flex items-center justify-center pl-5 pr-5 pt-5 h-full">
      <el-radio-group v-model="activeMenu" class="flex-1" @change="handleMenuChange">
        <div class="flex items-center space-x-3">
          <!-- 动态生成二级菜单项 -->
          <div v-for="route in subMenuRoutes" :key="route.path" class="submenu-item-wrapper" :style="{ width: `var(--theme-submenu-item-width)`, minWidth: `var(--theme-submenu-item-width)` }">
            <el-radio-button :value="route.path" class="custom-radio-button">
              <div
                class="flex items-center justify-center rounded-lg transition-colors duration-200"
                :style="{ paddingLeft: `var(--theme-submenu-item-padding-x)`, paddingRight: `var(--theme-submenu-item-padding-x)`, paddingTop: `var(--theme-submenu-item-padding-y)`, paddingBottom: `var(--theme-submenu-item-padding-y)`, borderRadius: `var(--theme-border-radius)` }">
                <el-icon class="flex-shrink-0 mr-2" style="color: var(--theme-submenu-item-text);"
                  :class="{ 'submenu-item-active-icon': activeMenu === route.path }">
                  <Icon v-if="route.icon" :icon="route.icon" />
                </el-icon>
                <span class="font-medium whitespace-nowrap text-sm" style="color: var(--theme-submenu-item-text);"
                  :class="{ 'submenu-item-active-text': activeMenu === route.path }">{{
                    route.title.length > 6 ? route.title.substring(0, 6) : route.title }}</span>
              </div>
            </el-radio-button>
          </div>
        </div>
      </el-radio-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { hasAnyRole } from '@/utils/auth'

defineOptions({
  name: "ShortClipSubSidebar"
})

const route = useRoute()
const router = useRouter()
const activeMenu = ref(route.path)

// 缓存所有路由，避免重复计算
const allRoutes = router.getRoutes()

// 定义菜单项类型
interface MenuItem {
  path: string
  title: string
  icon?: string
  roles?: string[]
}

// 获取当前一级菜单的子路由
const subMenuRoutes: ComputedRef<MenuItem[]> = computed(() => {
  const routes = allRoutes
  const currentPath = route.path
  if (route.meta.showMenu === false) {
    return []
  }

  // 找到当前路径对应的父路由
  let parentRoute = null
  for (const r of routes) {
    if (r.children && r.children.length > 0 &&
      r.meta?.showMenu && r.meta?.title &&
      r.path !== '/' && !r.path.includes(':')) {
      // 检查当前路径是否属于这个父路由
      if (currentPath === r.path || currentPath.startsWith(r.path + '/')) {
        parentRoute = r
        break
      }
    }
  }

  if (!parentRoute) return []

  const menuItems: MenuItem[] = []

  // 处理子路由
  parentRoute.children?.forEach(childRoute => {
    if (childRoute.meta?.title &&
      (childRoute.meta?.showMenu !== false) &&
      !childRoute.path.includes(':')) {

      // 构建完整路径
      const fullPath = parentRoute.path + (childRoute.path ? '/' + childRoute.path : '')

      // 检查权限
      if (childRoute.meta?.roles) {
        if (hasAnyRole(childRoute.meta.roles as string[])) {
          menuItems.push({
            path: fullPath,
            title: childRoute.meta.title as string,
            icon: childRoute.meta.icon as string,
            roles: childRoute.meta.roles as string[]
          })
        }
      } else {
        menuItems.push({
          path: fullPath,
          title: childRoute.meta.title as string,
          icon: childRoute.meta.icon as string
        })
      }
    }
  })

  return menuItems
})

// 是否显示二级侧边栏
const showSubSidebar = computed(() => {
  return subMenuRoutes.value.length > 0
})



// 根据当前路径获取对应的菜单路径
const getCurrentMenuPath = (currentPath: string): string => {
  for (const menuItem of subMenuRoutes.value) {
    if (currentPath === menuItem.path) {
      return menuItem.path
    }
  }
  return currentPath
}

// 监听路由变化，更新选中状态
watch(() => route.path, (newPath) => {
  activeMenu.value = getCurrentMenuPath(newPath)
})

// 初始化选中状态
watch(subMenuRoutes, () => {
  if (subMenuRoutes.value.length > 0) {
    activeMenu.value = getCurrentMenuPath(route.path)
  }
}, { immediate: true })

// 处理菜单选择
const handleMenuChange = (path: string | number | boolean | undefined) => {
  if (typeof path === 'string') {
    router.push(path)
  }
}


</script>

<style scoped>
/* 自定义单选按钮样式 - 水平布局 */
:deep(.custom-radio-button) {
  display: inline-flex;
}

:deep(.custom-radio-button .el-radio-button__inner) {
  background: var(--theme-submenu-bg);
  border: 1px solid var(--theme-submenu-border);
  border-radius: var(--theme-border-radius);
  padding: 0;
  margin: 0;
  backdrop-filter: blur(8px);
  box-shadow: var(--theme-submenu-item-shadow);
  transition: all 0.3s ease;
}

:deep(.custom-radio-button .el-radio-button__inner:hover) {
  background: var(--theme-submenu-item-hover);
  border-color: var(--theme-primary);
  box-shadow: var(--theme-submenu-item-active-shadow);
  transform: translateY(-1px);
}

:deep(.custom-radio-button.is-active .el-radio-button__inner) {
  background: var(--theme-submenu-item-active) !important;
  border-color: var(--theme-primary) !important;
  color: var(--theme-submenu-item-active-text) !important;
  box-shadow: var(--theme-submenu-item-active-shadow) !important;
  transform: translateY(-1px);
}

:deep(.custom-radio-button.is-active .el-radio-button__inner:hover) {
  background: var(--theme-submenu-item-active) !important;
  box-shadow: var(--theme-submenu-item-active-hover-shadow) !important;
  transform: translateY(-2px);
}

/* 激活状态的图标和文字颜色 */
.submenu-item-active-icon {
  color: var(--theme-submenu-item-active-text) !important;
}

.submenu-item-active-text {
  color: var(--theme-submenu-item-active-text) !important;
}



/* 隐藏默认的单选按钮样式 */
:deep(.el-radio-button__orig-radio) {
  display: none;
}

.submenu-item-wrapper {
  display: inline-flex;
}

/* 确保所有菜单项统一样式 */
:deep(.custom-radio-button .el-radio-button__inner) {
  display: flex;
  align-items: center;
  white-space: nowrap;
  width: var(--theme-submenu-item-width);
  min-width: var(--theme-submenu-item-width);
  justify-content: center;
}

.submenu-item-wrapper {
  display: inline-flex;
  width: var(--theme-submenu-item-width);
  min-width: var(--theme-submenu-item-width);
}

/* 水平滚动容器 */
/* .custom-subheader {
  overflow-x: auto;
  overflow-y: hidden;
  height: 480px;
  width: 100%;
}

.custom-subheader::-webkit-scrollbar {
  height: 4px;
}

.custom-subheader::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.custom-subheader::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
} */
</style>