<template>
  <el-aside class="bg-theme-sidebar-bg no-scrollbar relative flex flex-col custom-sidebar"
    :class="{ 'custom-sidebar-collapsed': isCollapse }"
    :style="{ width: isCollapse ? `var(--theme-sidebar-collapsed-width)` : `var(--theme-sidebar-width)` }">
    <!-- Logo区域 - 主题色 -->
    <div
      class="flex items-center px-4 transition-all duration-300 shadow-lg"
      :style="{ height: `var(--theme-sidebar-logo-height)`, background: 'var(--theme-sidebar-logo-bg)' }"
      :class="{ 'justify-center px-0': isCollapse }">
      <div class="flex items-center justify-center" :style="{ width: `var(--theme-sidebar-logo-icon-size)`, height: `var(--theme-sidebar-logo-icon-size)` }">
        <img src="/logo-shortclip.svg" alt="logo" class="w-full h-full" />
      </div>
      <span v-show="!isCollapse" class="ml-3 text-lg font-semibold whitespace-nowrap" style="color: var(--theme-sidebar-logo-text);">{{ appName }}</span>
    </div>

    <!-- 菜单区域 - 淡橙色背景，单选按钮实现 -->
    <div class="flex-1" :style="{ padding: `var(--theme-sidebar-menu-padding)` }">
      <el-radio-group v-model="activeMenu" class="w-full" @change="handleMenuChange">
        <div class="w-full" :style="{ display: 'flex', flexDirection: 'column', gap: `var(--theme-sidebar-menu-gap)` }">
          <!-- 动态生成菜单项 -->
          <div v-for="route in menuRoutes" :key="route.path" class="menu-item-wrapper">
            <el-radio-button :value="route.path" class="w-full custom-radio-button">
              <div class="flex items-center w-full rounded-lg transition-colors duration-200"
                :class="{ 'justify-center': isCollapse, 'justify-start': !isCollapse }"
                :style="{
                  height: `var(--theme-sidebar-menu-item-height)`,
                  paddingLeft: `var(--theme-sidebar-menu-item-px)`,
                  paddingRight: `var(--theme-sidebar-menu-item-px)`,
                  borderRadius: `var(--theme-border-radius)`
                }">
                <el-icon class="flex-shrink-0" style="color: var(--theme-sidebar-menu-text);" :class="{ 'sidebar-menu-active-icon': activeMenu === route.path }">
                  <Icon v-if="route.icon" :icon="route.icon" />
                </el-icon>
                <span v-show="!isCollapse" class="ml-3 font-medium whitespace-nowrap"
                  style="color: var(--theme-sidebar-menu-text);"
                  :class="{ 'sidebar-menu-active-text': activeMenu === route.path }">{{
                    route.title }}</span>
              </div>
            </el-radio-button>
          </div>
        </div>
      </el-radio-group>
    </div>

    <!-- 折叠按钮 - 主题色 -->
    <div
      class="flex items-center justify-center cursor-pointer transition-all duration-300"
      :style="{ height: `var(--theme-sidebar-toggle-height)`, backgroundColor: 'var(--theme-sidebar-footer-bg)', color: 'var(--theme-sidebar-logo-text)' }"
      @click="toggleCollapse">
      <el-icon>
        <Icon icon="ep:expand" v-if="isCollapse" />
        <Icon icon="ep:fold" v-else />
      </el-icon>
    </div>
  </el-aside>
</template>

<script setup lang="ts">
import { ref, watch, computed, type ComputedRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { hasAnyRole } from '@/utils/auth'
import { APP_NAME } from '@/config/app'

defineOptions({
  name: "SshineAdminSidebar"
})

const appName = APP_NAME

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const activeMenu = ref(route?.path || '')

// 定义菜单项类型
interface MenuItem {
  path: string
  title: string
  icon?: string
  roles?: string[]
}

// 从路由配置生成一级菜单项
const menuRoutes: ComputedRef<MenuItem[]> = computed(() => {
  const routes = router.getRoutes()
  const menuItems: MenuItem[] = []

  routes.forEach(route => {
    // 只取标记为顶级菜单且需要在菜单中显示的路由
    if (route.meta?.isTop &&
      route.meta?.showMenu) {

      // 检查权限
      if (route.meta?.roles) {
        if (hasAnyRole(route.meta.roles as string[])) {
          menuItems.push({
            path: route.path,
            title: route.meta.title as string,
            icon: route.meta.icon as string,
            roles: route.meta.roles as string[]
          })
        }
      } else {
        // 没有权限要求的路由
        menuItems.push({
          path: route.path,
          title: route.meta.title as string,
          icon: route.meta.icon as string
        })
      }
    }
  })

  // 按路径排序
  return menuItems
})

// 根据当前路径获取对应的菜单路径
const getCurrentMenuPath = (currentPath: string): string => {
  if (route?.meta?.showMenu === false) {
    return '';
  }
  for (const menuItem of menuRoutes.value) {
    if (currentPath === menuItem.path) {
      return menuItem.path
    }
    // 检查是否是子路由
    if (currentPath.startsWith(menuItem.path + '/')) {
      return menuItem.path
    }
  }
  return currentPath
}

// 监听路由变化，更新选中状态
watch(() => route?.path, (newPath) => {
  if (newPath) {
    activeMenu.value = getCurrentMenuPath(newPath)
  }
})

// 初始化选中状态
watch(menuRoutes, () => {
  if (menuRoutes.value.length > 0 && route?.path) {
    activeMenu.value = getCurrentMenuPath(route.path)
  }
}, { immediate: true })

// 处理菜单选择
const handleMenuChange = (path: string | number | boolean | undefined) => {
  if (typeof path === 'string') {
    router.push(path)
  }
}

// 切换折叠状态
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}
</script>

<style scoped>
/* 自定义单选按钮样式 */
:deep(.custom-radio-button) {
  display: flex;
  width: 100%;
}

:deep(.custom-radio-button .el-radio-button__inner) {
  width: 100%;
  background: transparent;
  border: none;
  border-radius: var(--theme-border-radius);
  padding: 0;
}

:deep(.custom-radio-button .el-radio-button__inner:hover) {
  background-color: var(--theme-sidebar-menu-hover);
}

:deep(.custom-radio-button.is-active .el-radio-button__inner) {
  background-color: var(--theme-sidebar-menu-active) !important;
  color: var(--theme-sidebar-menu-active-text) !important;
  box-shadow: none !important;
}

:deep(.custom-radio-button.is-active .el-radio-button__inner:hover) {
  background-color: var(--theme-primary-dark) !important;
}

/* 激活状态的图标和文字颜色 */
.sidebar-menu-active-icon {
  color: var(--theme-sidebar-menu-active-text) !important;
}

.sidebar-menu-active-text {
  color: var(--theme-sidebar-menu-active-text) !important;
}

/* 默认添加左边框 */
:deep(.custom-radio-button.is-active .el-radio-button__inner) {
  border-left: 3px solid var(--theme-sidebar-menu-active-border) !important;
}

/* 折叠状态下移除左边框 */
.custom-sidebar.custom-sidebar-collapsed :deep(.custom-radio-button.is-active .el-radio-button__inner) {
  border-left: none !important;
}

/* 隐藏默认的单选按钮样式 */
:deep(.el-radio-button__orig-radio) {
  display: none;
}

.menu-item-wrapper {
  width: 100%;
}

/* 确保所有菜单项统一高度 */
:deep(.custom-radio-button .el-radio-button__inner) {
  min-height: var(--theme-sidebar-menu-item-height);
  height: var(--theme-sidebar-menu-item-height);
  display: flex;
  align-items: center;
}

/* 确保侧边栏宽度正确应用 */
.custom-sidebar {
  transition: width 0.3s ease;
}

.custom-sidebar-collapsed {
  width: var(--theme-sidebar-collapsed-width) !important;
}
</style>
