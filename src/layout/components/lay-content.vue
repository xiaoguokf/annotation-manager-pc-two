<template>
  <div class="h-full relative overflow-y-scroll no-scrollbar" :style="{ padding: `var(--theme-content-padding)`, backgroundColor: 'var(--theme-content-bg)' }">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
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
/* 页面切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
