<template>
  <div class="h-full overflow-y-scroll no-scrollbar" :style="{ padding: `var(--theme-content-padding)`, backgroundColor: 'var(--theme-content-bg)' }">
    <router-view v-slot="{ Component, route }">
      <div class="h-full relative">
        <transition name="page-fade">
          <keep-alive :include="cachedViews">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </div>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: "ShortClipContent"
})

// 需要缓存的路由组件名称
const cachedViews = computed(() => {
  // 可以根据需要配置需要缓存的页面
  return ['ShortClipHome', 'ShortClipStatisticsOverview', 'ShortClipSystemUser', 'ShortClipSystemRole']
})
</script>

<style scoped>
/* 页面切换淡入淡出，不使用 mode="out-in"，避免快速切换时状态机卡死 */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.2s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
